/* ============================================================
   DETAILANSICHT (Sidepanel)
   ------------------------------------------------------------
   Zeigt ein Ereignis mit Datum, Ort, Kategorie, beteiligten
   Staaten, Beschreibung, historischer Bedeutung, Verlusten und
   den Verknüpfungen zu Ursachen und Folgen.
   Ist im Datensatz ein Bild hinterlegt (Feld `image`), wird es
   angezeigt; andernfalls entsteht eine stilisierte Grafik aus
   dem Verknüpfungsnetz des Ereignisses.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  function Detail(root, events) {
    this.root = root;
    this.body = util.qs('#detailBody', root);
    this.catNode = util.qs('#detailCat', root);
    this.prevBtn = util.qs('#prevEvent', root);
    this.nextBtn = util.qs('#nextEvent', root);
    this.events = events;
    this.index = {};
    var self = this;
    events.forEach(function (ev, i) { self.index[ev.id] = i; });

    util.qs('#detailClose', root).addEventListener('click', function () {
      WW1.bus.emit('select', { id: null, source: 'detail' });
    });
    this.prevBtn.addEventListener('click', function () { self.step(-1); });
    this.nextBtn.addEventListener('click', function () { self.step(1); });
  }

  Detail.prototype.step = function (dir) {
    if (this.current == null) return;
    var i = this.index[this.current] + dir;
    if (i < 0 || i >= this.events.length) return;
    WW1.bus.emit('select', { id: this.events[i].id, source: 'detail-nav' });
  };

  Detail.prototype.close = function () {
    this.current = null;
    this.root.classList.remove('is-open');
    this.root.setAttribute('aria-hidden', 'true');
  };

  Detail.prototype.show = function (ev) {
    if (!ev) return this.close();
    this.current = ev.id;
    this.render(ev);
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    this.body.scrollTop = 0;
  };

  Detail.prototype.render = function (ev) {
    var cat = WW1.CATEGORIES[ev.category];
    var body = this.body;
    util.clear(body);

    /* Kopfzeile mit Kategorie */
    this.catNode.style.color = cat.color;
    this.catNode.querySelector('span').textContent = cat.short;

    var date = util.el('p', 'detail__date', ev.dateLabel);
    body.appendChild(date);

    var title = util.el('h2', 'detail__title', ev.title);
    body.appendChild(title);

    var meta = util.el('div', 'detail__meta');
    if (ev.location) meta.appendChild(metaItem('◎', ev.location));
    if (ev.front && WW1.GEO.FRONTS[ev.front]) meta.appendChild(metaItem('⤢', WW1.GEO.FRONTS[ev.front].label));
    meta.appendChild(metaItem('★', 'Bedeutung ' + ev.importance + '/5'));
    body.appendChild(meta);

    body.appendChild(this.buildFigure(ev));

    body.appendChild(section('Was geschah?', ev.summary));

    var callout = util.el('div', 'callout');
    callout.appendChild(util.el('h3', null, 'Warum ist das wichtig?'));
    callout.appendChild(util.el('p', null, ev.significance));
    body.appendChild(callout);

    if (ev.casualties) {
      var loss = util.el('div', 'callout callout--loss');
      loss.appendChild(util.el('h3', null, 'Verluste'));
      loss.appendChild(util.el('p', null, ev.casualties));
      body.appendChild(loss);
    }

    if (ev.participants && ev.participants.length) {
      body.appendChild(util.el('h3', null, 'Beteiligte Staaten'));
      var chips = util.el('div', 'chips');
      ev.participants.forEach(function (code) {
        var nation = WW1.NATIONS[code];
        if (!nation) return;
        var chip = util.el('span', 'chip', nation.name);
        chip.dataset.side = nation.side;
        chip.title = nation.note;
        chips.appendChild(chip);
      });
      body.appendChild(chips);
    }

    /* Ursache-Wirkungs-Kette */
    var causes = this.events.filter(function (other) {
      return (other.links || []).indexOf(ev.id) !== -1;
    });
    var effects = (ev.links || []).map(function (id) {
      return this.events[this.index[id]];
    }, this).filter(Boolean);

    if (causes.length) {
      body.appendChild(util.el('h3', null, 'Führte hierher'));
      body.appendChild(this.buildChain(causes, '↑'));
    }
    if (effects.length) {
      body.appendChild(util.el('h3', null, 'Führte zu'));
      body.appendChild(this.buildChain(effects, '↓'));
    }

    this.updateNav(ev);
  };

  function metaItem(icon, text) {
    var span = document.createElement('span');
    span.appendChild(util.el('em', null, icon)).style.fontStyle = 'normal';
    span.appendChild(document.createTextNode(' ' + text));
    return span;
  }

  function section(heading, text) {
    var frag = document.createDocumentFragment();
    frag.appendChild(util.el('h3', null, heading));
    frag.appendChild(util.el('p', null, text));
    return frag;
  }

  Detail.prototype.buildChain = function (list, arrow) {
    var wrap = util.el('div', 'chain');
    list.forEach(function (target) {
      var btn = util.el('button', 'chain__item');
      btn.type = 'button';
      btn.appendChild(util.el('span', 'chain__arrow', arrow));
      var text = util.el('span', 'chain__text');
      text.appendChild(util.el('b', null, target.title));
      text.appendChild(util.el('span', null, target.dateLabel));
      btn.appendChild(text);
      btn.addEventListener('click', function () {
        WW1.bus.emit('select', { id: target.id, source: 'chain' });
      });
      wrap.appendChild(btn);
    });
    return wrap;
  };

  /* Bild oder – falls keines hinterlegt ist – eine stilisierte
     Miniatur des Verknüpfungsnetzes rund um das Ereignis. */
  Detail.prototype.buildFigure = function (ev) {
    var figure = util.el('figure', 'figure');

    if (ev.image && ev.image.src) {
      var img = document.createElement('img');
      img.src = ev.image.src;
      img.alt = ev.image.caption || ev.title;
      img.loading = 'lazy';
      figure.appendChild(img);
      var cap = util.el('figcaption', 'figure__cap');
      cap.textContent = (ev.image.caption || ev.title) + (ev.image.credit ? ' · ' + ev.image.credit : '');
      figure.appendChild(cap);
      return figure;
    }

    figure.appendChild(this.buildConstellation(ev));
    var caption = util.el('figcaption', 'figure__cap');
    caption.textContent = 'Stilisierte Darstellung: das Ereignis und seine unmittelbaren Verknüpfungen.'
      + (ev.imageHint ? ' Bildvorschlag für eine historische Abbildung: ' + ev.imageHint + '.' : '');
    figure.appendChild(caption);
    return figure;
  };

  Detail.prototype.buildConstellation = function (ev) {
    var W = 380, H = 150;
    var svg = util.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    var color = util.categoryColor(ev.category);
    var rand = util.rng(Math.floor(util.hash(ev.id) * 100000) + 7);

    /* feiner Sternenstaub im Hintergrund */
    for (var i = 0; i < 70; i++) {
      util.svg('circle', {
        cx: (rand() * W).toFixed(1), cy: (rand() * H).toFixed(1),
        r: (0.3 + rand() * 0.9).toFixed(2),
        fill: '#C9D6EE', opacity: (0.05 + rand() * 0.25).toFixed(2)
      }, svg);
    }

    var neighbours = [];
    (ev.links || []).forEach(function (id) { neighbours.push({ id: id, dir: 1 }); });
    this.events.forEach(function (other) {
      if ((other.links || []).indexOf(ev.id) !== -1) neighbours.push({ id: other.id, dir: -1 });
    });
    neighbours = neighbours.slice(0, 6);

    var cx = W / 2, cy = H / 2;
    var self = this;

    neighbours.forEach(function (item, i) {
      var other = self.events[self.index[item.id]];
      if (!other) return;
      var angle = (i / Math.max(neighbours.length, 1)) * Math.PI * 2 + 0.5;
      var radius = 46 + rand() * 22;
      var x = cx + Math.cos(angle) * radius * 1.85;
      var y = cy + Math.sin(angle) * radius;
      var otherColor = util.categoryColor(other.category);

      util.svg('path', {
        d: 'M' + cx + ' ' + cy + ' Q' + ((cx + x) / 2 + Math.sin(angle) * 14).toFixed(1) + ' ' +
           ((cy + y) / 2 - Math.cos(angle) * 14).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1),
        fill: 'none',
        stroke: item.dir === 1 ? 'rgba(217,164,65,.45)' : 'rgba(147,161,184,.28)',
        'stroke-width': item.dir === 1 ? 1 : 0.7,
        'stroke-dasharray': item.dir === 1 ? '3 4' : null
      }, svg);

      util.svg('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 2 + other.importance * 0.7, fill: otherColor, opacity: '.75' }, svg);
    });

    /* Das Ereignis selbst in der Mitte */
    util.svg('circle', { cx: cx, cy: cy, r: 26, fill: 'url(#glow-' + ev.category + ')', opacity: '.5' }, svg);
    util.svg('circle', { cx: cx, cy: cy, r: 4 + ev.importance * 1.5, fill: color }, svg);
    util.svg('circle', { cx: cx, cy: cy, r: 9 + ev.importance * 2.4, fill: 'none', stroke: color, 'stroke-width': .8, opacity: '.6' }, svg);
    var year = util.svg('text', {
      x: 14, y: H - 12, fill: 'rgba(147,161,184,.35)', 'font-size': 26,
      'font-family': 'Georgia, serif', 'letter-spacing': '.12em'
    }, svg);
    year.textContent = util.year(ev.date);

    return svg;
  };

  Detail.prototype.updateNav = function (ev) {
    var i = this.index[ev.id];
    var prev = this.events[i - 1], next = this.events[i + 1];
    this.prevBtn.disabled = !prev;
    this.nextBtn.disabled = !next;
    this.prevBtn.querySelector('small').textContent = prev ? prev.title : '';
    this.nextBtn.querySelector('small').textContent = next ? next.title : '';
  };

  WW1.Detail = Detail;
})(window);
