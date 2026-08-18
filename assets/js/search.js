/* ============================================================
   SUCHFUNKTION
   ------------------------------------------------------------
   Durchsucht Titel, Ort, Jahr, Kategorie, beteiligte Staaten und
   die Beschreibungstexte. Beispiele: „Verdun“, „USA“, „1917“,
   „Russland“, „U-Boot“.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  function Search(inputEl, resultsEl, events) {
    this.input = inputEl;
    this.results = resultsEl;
    this.events = events;
    this.active = -1;
    this.items = [];

    /* Suchindex vorbereiten (einmalig) */
    this.index = events.map(function (ev) {
      var nations = (ev.participants || []).map(function (code) {
        return WW1.NATIONS[code] ? WW1.NATIONS[code].name : '';
      }).join(' ');
      var cat = WW1.CATEGORIES[ev.category];
      return {
        ev: ev,
        title: util.normalize(ev.title),
        strong: util.normalize([ev.title, ev.location, ev.dateLabel, nations, cat.label, cat.short].join(' ')),
        full: util.normalize([ev.title, ev.location, ev.dateLabel, nations, cat.label,
                              ev.summary, ev.significance, ev.casualties || ''].join(' ')),
        year: String(util.year(ev.date))
      };
    });

    this.bind();
  }

  Search.prototype.bind = function () {
    var self = this;

    this.input.addEventListener('input', function () { self.run(self.input.value); });
    this.input.addEventListener('focus', function () { if (self.input.value.trim()) self.run(self.input.value); });

    this.input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        self.move(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var pick = self.items[self.active >= 0 ? self.active : 0];
        if (pick) self.choose(pick);
      } else if (e.key === 'Escape') {
        self.input.value = '';
        self.hide();
        self.input.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (!self.results.contains(e.target) && e.target !== self.input) self.hide();
    });
  };

  Search.prototype.run = function (query) {
    var q = util.normalize(query);
    if (q.length < 2) return this.hide();

    var terms = q.split(' ');
    var scored = [];

    this.index.forEach(function (entry) {
      var score = 0;
      terms.forEach(function (term) {
        if (!term) return;
        if (entry.title.indexOf(term) === 0) score += 60;
        else if (entry.title.indexOf(term) !== -1) score += 40;
        if (entry.year.indexOf(term) === 0) score += 30;
        if (entry.strong.indexOf(term) !== -1) score += 18;
        if (entry.full.indexOf(term) !== -1) score += 6;
      });
      if (score > 0) scored.push({ ev: entry.ev, score: score + entry.ev.importance });
    });

    scored.sort(function (a, b) {
      return b.score - a.score || (a.ev.date < b.ev.date ? -1 : 1);
    });

    this.show(scored.slice(0, 9));
  };

  Search.prototype.show = function (list) {
    var self = this;
    util.clear(this.results);
    this.items = list;
    this.active = -1;

    if (!list.length) {
      this.results.appendChild(util.el('p', 'search__empty', 'Keine Treffer. Versuchen Sie z. B. „Verdun“, „Revolution“ oder „1917“.'));
      this.results.classList.add('is-open');
      return;
    }

    list.forEach(function (item, i) {
      var cat = WW1.CATEGORIES[item.ev.category];
      var btn = util.el('button', 'search__item');
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      var title = util.el('b', null, item.ev.title);
      title.style.borderLeft = '2px solid ' + cat.color;
      title.style.paddingLeft = '8px';
      btn.appendChild(title);
      var meta = util.el('span', null, item.ev.dateLabel + ' · ' + cat.short);
      meta.style.paddingLeft = '10px';
      btn.appendChild(meta);
      btn.addEventListener('click', function () { self.choose(item); });
      btn.addEventListener('mouseenter', function () { self.setActive(i); });
      self.results.appendChild(btn);
    });

    this.results.classList.add('is-open');
  };

  Search.prototype.setActive = function (i) {
    var nodes = util.qsa('.search__item', this.results);
    nodes.forEach(function (n, idx) { n.classList.toggle('is-active', idx === i); });
    this.active = i;
  };

  Search.prototype.move = function (dir) {
    if (!this.items.length) return;
    var next = (this.active + dir + this.items.length) % this.items.length;
    this.setActive(next);
    var node = util.qsa('.search__item', this.results)[next];
    if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
  };

  Search.prototype.choose = function (item) {
    this.hide();
    this.input.blur();
    WW1.bus.emit('select', { id: item.ev.id, source: 'search' });
  };

  Search.prototype.hide = function () {
    this.results.classList.remove('is-open');
    this.active = -1;
  };

  WW1.Search = Search;
})(window);
