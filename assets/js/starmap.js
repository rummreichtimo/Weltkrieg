/* ============================================================
   DIE STERNENKARTE
   ------------------------------------------------------------
   Aufbau in zwei Ebenen:
   · Weltebene  (#world)   – wird mitskaliert: Jahresbänder,
     Verbindungslinien, Zeitachse, Sternenstaub.
   · Überlagerung (#overlay) – wird NICHT skaliert: die Sterne
     selbst und ihre Beschriftungen. Ihre Bildschirmposition
     berechnet sich aus Weltkoordinate × Zoom + Verschiebung.
   So bleiben Beschriftungen immer lesbar und Sterne behalten
   auch bei starkem Zoom eine angenehme Größe.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  /* Größe des virtuellen Kartenraums */
  var WORLD_W = 5200, WORLD_H = 1500, PAD = 240;

  /* Die Zeitachse ist abschnittsweise gestaucht: Die Vorgeschichte
     (Jahrzehnte) nimmt links wenig Platz ein, die Kriegsjahre den
     größten Teil. Dadurch entsteht der „Urknall“-Effekt: Vor dem
     28. Juni 1914 stehen nur wenige Sterne, danach explodiert die
     Dichte der Ereignisse und Verbindungen. */
  var SEGMENTS = [
    { from: '1880-01-01', to: '1914-06-01', x0: 0.000, x1: 0.115 },
    { from: '1914-06-01', to: '1918-11-11', x0: 0.115, x1: 0.905 },
    { from: '1918-11-11', to: '1920-01-01', x0: 0.905, x1: 1.000 }
  ];
  SEGMENTS.forEach(function (s) { s.t0 = util.time(s.from); s.t1 = util.time(s.to); });

  var YEARS = [1914, 1915, 1916, 1917, 1918];
  var BIGBANG = util.time('1914-06-28');

  /* ---------- Geometrie ---------- */

  function xFromTime(t) {
    var seg = SEGMENTS[0], i;
    for (i = 0; i < SEGMENTS.length; i++) {
      if (t <= SEGMENTS[i].t1 || i === SEGMENTS.length - 1) { seg = SEGMENTS[i]; break; }
    }
    var f = util.clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1);
    var norm = seg.x0 + f * (seg.x1 - seg.x0);
    return PAD + norm * (WORLD_W - 2 * PAD);
  }

  function xFromDate(iso) { return xFromTime(util.time(iso)); }

  /* Sanft geschwungene Zeitachse („Rückgrat“ der Karte) */
  function spineY(x) {
    var u = (x - PAD) / (WORLD_W - 2 * PAD);
    return WORLD_H / 2 + Math.sin(u * Math.PI * 2.15 + 0.55) * 78 + Math.sin(u * Math.PI * 5.3) * 16;
  }

  /* ---------- Konstruktor ---------- */

  function StarMap(svgEl, events) {
    this.svg = svgEl;
    this.events = events;
    this.byId = {};
    this.nodes = {};
    this.links = [];
    this.k = 1; this.tx = 0; this.ty = 0;
    this.kFit = 1;
    this.lastSizeFactor = 0;
    this.selectedId = null;
    this.activeCategories = null;   // null = alle
    this.anim = null;
    /* Von geöffneten Panels belegte Ränder; wird von app.js gesetzt,
       damit die Kamera keine Sterne hinter Bedienflächen schiebt. */
    this.insets = { left: 0, right: 0 };
    this.pointers = new Map();
    this.dragged = false;

    this.layout();
    this.build();
    this.bind();
  }

  /* ---------- 1 · Positionen berechnen ---------- */

  StarMap.prototype.layout = function () {
    var self = this;
    var lanes = WW1.CATEGORY_LANE;

    this.events.forEach(function (ev) {
      self.byId[ev.id] = ev;
      var x = xFromDate(ev.date);
      var lane = (lanes[ev.category] || 0) * 186;
      var jitter = (util.hash(ev.id) - 0.5) * 132;
      /* Sehr wichtige Ereignisse rücken näher an die Zeitachse */
      var pull = (ev.importance - 3) * 0.08;
      ev._pos = { x: x, y: spineY(x) + lane * (1 - pull) + jitter };
    });

    /* Überlappungen auflösen: benachbarte Sterne vertikal auseinanderschieben */
    var sorted = this.events.slice().sort(function (a, b) { return a._pos.x - b._pos.x; });
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 1; i < sorted.length; i++) {
        for (var j = Math.max(0, i - 6); j < i; j++) {
          var a = sorted[j]._pos, b = sorted[i]._pos;
          var dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
          if (dx < 96 && dy < 74) {
            var push = (74 - dy) / 2 + 1;
            var dir = (b.y >= a.y) ? 1 : -1;
            b.y += push * dir;
            a.y -= push * dir;
          }
        }
      }
    }

    /* Innerhalb der Kartenhöhe halten */
    this.events.forEach(function (ev) {
      ev._pos.y = util.clamp(ev._pos.y, 90, WORLD_H - 90);
    });

    /* Ausdehnung aller Sterne merken */
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.events.forEach(function (ev) {
      minX = Math.min(minX, ev._pos.x); maxX = Math.max(maxX, ev._pos.x);
      minY = Math.min(minY, ev._pos.y); maxY = Math.max(maxY, ev._pos.y);
    });
    this.bbox = { minX: minX, maxX: maxX, minY: minY, maxY: maxY };

    /* Verbindungen (gerichtete Ursache-Wirkungs-Kette) */
    this.links = [];
    this.related = {};
    this.events.forEach(function (ev) {
      (ev.links || []).forEach(function (targetId) {
        var target = self.byId[targetId];
        if (!target) return;
        self.links.push({ from: ev, to: target });
        (self.related[ev.id] = self.related[ev.id] || []).push(targetId);
        (self.related[targetId] = self.related[targetId] || []).push(ev.id);
      });
    });
  };

  /* ---------- 2 · SVG aufbauen ---------- */

  StarMap.prototype.build = function () {
    var svg = this.svg, self = this;
    util.clear(svg);

    var defs = util.svg('defs', null, svg);

    /* Farbverlauf für die Jahresbänder */
    var bg = util.svg('linearGradient', { id: 'bandGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    util.svg('stop', { offset: '0', 'stop-color': '#1B2540', 'stop-opacity': '0' }, bg);
    util.svg('stop', { offset: '0.5', 'stop-color': '#1B2540', 'stop-opacity': '.42' }, bg);
    util.svg('stop', { offset: '1', 'stop-color': '#1B2540', 'stop-opacity': '0' }, bg);

    /* Ein weicher Lichthof je Kategorie */
    Object.keys(WW1.CATEGORIES).forEach(function (key) {
      var grad = util.svg('radialGradient', { id: 'glow-' + key }, defs);
      util.svg('stop', { offset: '0', 'stop-color': WW1.CATEGORIES[key].color, 'stop-opacity': '.55' }, grad);
      util.svg('stop', { offset: '0.45', 'stop-color': WW1.CATEGORIES[key].color, 'stop-opacity': '.16' }, grad);
      util.svg('stop', { offset: '1', 'stop-color': WW1.CATEGORIES[key].color, 'stop-opacity': '0' }, grad);
    });

    this.world = util.svg('g', { id: 'world' }, svg);
    this.overlay = util.svg('g', { id: 'overlay' }, svg);

    this.buildBands();
    this.buildDust();
    this.buildSpine();
    this.buildLinks();
    this.buildStars();

    /* Schockwelle für den „Urknall“ am 28. Juni 1914 */
    var sarajevo = this.byId['sarajevo'];
    if (sarajevo) {
      this.shock = util.svg('circle', {
        class: 'shockwave', cx: sarajevo._pos.x, cy: sarajevo._pos.y, r: 4
      }, this.world);
    }

    void svg.getBoundingClientRect();
  };

  StarMap.prototype.buildBands = function () {
    var g = util.svg('g', { class: 'bands' }, this.world);
    this.yearBands = {};
    var self = this;

    YEARS.forEach(function (year) {
      var x0 = xFromDate(year + '-01-01');
      var x1 = xFromDate((year + 1) + '-01-01');
      util.svg('rect', { class: 'band-rect', x: x0, y: 60, width: x1 - x0, height: WORLD_H - 120 }, g);
      util.svg('line', { class: 'band-line', x1: x0, y1: 60, x2: x0, y2: WORLD_H - 60, opacity: '.5' }, g);
      self.yearBands[year] = { x0: x0, x1: x1 };
    });

    /* Vor- und Nachgeschichte als eigene Abschnitte kennzeichnen */
    this.eraBands = [
      { label: 'Vorgeschichte', x0: PAD - 60, x1: xFromDate('1914-01-01') },
      { label: 'Folgen', x0: xFromDate('1919-01-01'), x1: WORLD_W - PAD + 60 }
    ];
    this.eraBands.forEach(function (era) {
      util.svg('line', { class: 'band-line', x1: era.x1, y1: 60, x2: era.x1, y2: WORLD_H - 60, opacity: '.35' }, g);
    });
  };

  /* Sternenstaub: Die Dichte steigt mit dem Kriegsausbruch stark an
     und macht die Eskalation von 1914 unmittelbar sichtbar. */
  StarMap.prototype.buildDust = function () {
    var g = util.svg('g', { class: 'dust' }, this.world);
    var rand = util.rng(19140628);
    var placed = 0, guard = 0;

    while (placed < 900 && guard < 12000) {
      guard++;
      var x = PAD - 80 + rand() * (WORLD_W - 2 * PAD + 160);
      var t = timeFromX(x);
      var density = t < BIGBANG ? 0.10
        : util.clamp(0.10 + (t - BIGBANG) / (util.time('1914-10-01') - BIGBANG) * 0.9, 0.1, 1);
      if (rand() > density) continue;

      var spread = 120 + density * 470;
      var y = spineY(x) + (rand() + rand() + rand() - 1.5) * spread;
      if (y < 40 || y > WORLD_H - 40) continue;

      util.svg('circle', {
        cx: x.toFixed(1), cy: y.toFixed(1),
        r: (0.5 + rand() * 1.5).toFixed(2),
        opacity: (0.06 + rand() * 0.26).toFixed(2)
      }, g);
      placed++;
    }
  };

  StarMap.prototype.buildSpine = function () {
    var d = '', x;
    for (x = PAD - 80; x <= WORLD_W - PAD + 80; x += 24) {
      d += (d ? ' L' : 'M') + x.toFixed(1) + ' ' + spineY(x).toFixed(1);
    }
    util.svg('path', { class: 'spine', d: d }, this.world);
  };

  StarMap.prototype.buildLinks = function () {
    var g = util.svg('g', { class: 'links' }, this.world);
    var self = this;
    this.links.forEach(function (link) {
      var a = link.from._pos, b = link.to._pos;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.hypot(dx, dy) || 1;
      var bend = util.clamp(len * 0.16, 12, 120);
      /* Kontrollpunkt senkrecht zur Verbindung – ergibt weiche Bögen */
      var cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
      var weight = (link.from.importance + link.to.importance) / 2;

      link.node = util.svg('path', {
        class: 'link',
        d: 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
           ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1),
        'stroke-width': (0.5 + weight * 0.32).toFixed(2),
        opacity: (0.14 + weight * 0.07).toFixed(2)
      }, g);
      link.node.dataset.from = link.from.id;
      link.node.dataset.to = link.to.id;
    });
  };

  StarMap.prototype.buildStars = function () {
    var self = this;

    /* Jahreszahlen als große Orientierungspunkte (Überlagerung) */
    this.yearLabels = {};
    YEARS.forEach(function (year) {
      var label = util.svg('text', { class: 'year-label', 'font-size': 64 }, self.overlay);
      label.textContent = year;
      self.yearLabels[year] = label;
    });
    this.eraLabels = this.eraBands.map(function (era) {
      var label = util.svg('text', { class: 'year-label', 'font-size': 18 }, self.overlay);
      label.textContent = era.label.toUpperCase();
      return { node: label, era: era };
    });

    this.events.forEach(function (ev) {
      var color = util.categoryColor(ev.category);
      var g = util.svg('g', { class: 'star', tabindex: '0', role: 'button' }, self.overlay);
      g.dataset.id = ev.id;
      g.setAttribute('aria-label', ev.dateLabel + ': ' + ev.title);

      var glow = util.svg('circle', { class: 'star__glow star__pulse', r: 20, fill: 'url(#glow-' + ev.category + ')' }, g);
      glow.style.animationDelay = (util.hash(ev.id) * 5).toFixed(2) + 's';
      var ring = util.svg('circle', { class: 'star__ring', r: 12, stroke: color }, g);
      var core = util.svg('circle', { class: 'star__core', r: 4, fill: color }, g);
      /* Zusätzliche helle Mitte bei Schlüsselereignissen */
      if (ev.importance >= 5) util.svg('circle', { class: 'star__spark', r: 1.6, fill: '#FFF6E4', opacity: '.9' }, g);
      var hit = util.svg('circle', { class: 'star__hit', r: 14, fill: 'transparent' }, g);

      var label = util.svg('text', { class: 'star-label', 'text-anchor': 'middle', y: 22 }, g);
      label.textContent = ev.title;

      self.nodes[ev.id] = { group: g, glow: glow, ring: ring, core: core, hit: hit, label: label, ev: ev };
    });
  };

  function timeFromX(x) {
    var norm = (x - PAD) / (WORLD_W - 2 * PAD);
    var seg = SEGMENTS[0], i;
    for (i = 0; i < SEGMENTS.length; i++) {
      if (norm <= SEGMENTS[i].x1 || i === SEGMENTS.length - 1) { seg = SEGMENTS[i]; break; }
    }
    var f = (norm - seg.x0) / (seg.x1 - seg.x0);
    return seg.t0 + f * (seg.t1 - seg.t0);
  }

  /* ---------- 3 · Kamera ---------- */

  StarMap.prototype.size = function () {
    var rect = this.svg.getBoundingClientRect();
    return { w: rect.width || global.innerWidth, h: rect.height || global.innerHeight };
  };

  StarMap.prototype.applyTransform = function () {
    var k = this.k, tx = this.tx, ty = this.ty;
    this.world.setAttribute('transform', 'translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ') scale(' + k.toFixed(5) + ')');

    var rel = k / this.kFit;
    /* Auf schmalen Bildschirmen kleinere Sterne, damit die Karte nicht
       zu einem einzigen Lichtfleck verschwimmt. */
    var viewportF = util.clamp((this.size().w) / 1250, 0.5, 1);
    var sizeF = util.clamp(Math.pow(rel, 0.42), 0.82, 2.3) * viewportF;
    var resize = Math.abs(sizeF - this.lastSizeFactor) > 0.015;
    if (resize) this.lastSizeFactor = sizeF;

    var size = this.size();
    var id, node, ev, r;

    for (id in this.nodes) {
      node = this.nodes[id];
      ev = node.ev;
      var sx = ev._pos.x * k + tx;
      var sy = ev._pos.y * k + ty;
      node.group.setAttribute('transform', 'translate(' + sx.toFixed(1) + ',' + sy.toFixed(1) + ')');

      /* außerhalb des Sichtfelds nicht zeichnen */
      var off = (sx < -160 || sx > size.w + 160 || sy < -120 || sy > size.h + 120);
      if (off !== node.off) {
        node.group.style.display = off ? 'none' : '';
        node.off = off;
      }

      if (resize) {
        r = (1.9 + ev.importance * 1.55) * sizeF;
        node.core.setAttribute('r', r.toFixed(2));
        node.glow.setAttribute('r', (r * 3.3).toFixed(2));
        node.ring.setAttribute('r', (r * 2.15).toFixed(2));
        node.hit.setAttribute('r', Math.max(r * 2.0, 11).toFixed(2));
        node.label.setAttribute('y', (r * 2.15 + 15).toFixed(1));
      }
    }

    this.updateLabels(rel);
    this.updateYearLabels(rel, k, tx, ty);
    this.forceLabels = false;
  };

  /* Beschriftungen erscheinen gestaffelt: erst die Schlüsselereignisse,
     beim Hineinzoomen immer mehr Details. Zusätzlich werden Überlappungen
     aufgelöst – eine Beschriftung, die keinen Platz findet, bleibt aus. */
  StarMap.prototype.updateLabels = function (rel) {
    var threshold;
    if (rel < 1.05) threshold = 5;
    else if (rel < 1.45) threshold = 4;
    else if (rel < 2.1) threshold = 3;
    else if (rel < 3.0) threshold = 2;
    else threshold = 1;

    var order = this.labelOrder || (this.labelOrder = this.events.slice().sort(function (a, b) {
      return b.importance - a.importance || (a.date < b.date ? -1 : 1);
    }));

    var placed = [];
    var self = this;

    order.forEach(function (ev) {
      var node = self.nodes[ev.id];
      var selected = ev.id === self.selectedId;
      var candidate = !node.off && (selected || ev.importance >= threshold);

      if (!candidate) { node.label.classList.remove('is-visible'); return; }

      var w = node.labelWidth || (node.labelWidth = node.label.getComputedTextLength() || ev.title.length * 5.8);
      var x = ev._pos.x * self.k + self.tx;
      var y = ev._pos.y * self.k + self.ty + parseFloat(node.label.getAttribute('y') || 20);
      var box = { x0: x - w / 2 - 5, x1: x + w / 2 + 5, y0: y - 12, y1: y + 5 };

      var free = true;
      for (var i = 0; i < placed.length; i++) {
        var other = placed[i];
        if (box.x0 < other.x1 && box.x1 > other.x0 && box.y0 < other.y1 && box.y1 > other.y0) { free = false; break; }
      }

      if (free || selected) {
        placed.push(box);
        node.label.classList.add('is-visible');
      } else {
        node.label.classList.remove('is-visible');
      }
    });
  };

  StarMap.prototype.updateYearLabels = function (rel, k, tx, ty) {
    var fade = util.clamp(1 - (rel - 1.0) / 1.4, 0, 1);
    var self = this;
    YEARS.forEach(function (year) {
      var band = self.yearBands[year];
      var node = self.yearLabels[year];
      var cx = (band.x0 + band.x1) / 2 * k + tx;
      node.setAttribute('x', cx.toFixed(1));
      node.setAttribute('y', ((self.bbox.minY - 120) * k + ty).toFixed(1));
      /* Schriftgröße an die Bandbreite koppeln, damit sich benachbarte
         Jahreszahlen niemals überlagern; sehr schmale Bänder bleiben leer. */
      var bandPx = (band.x1 - band.x0) * k;
      var fontSize = Math.min(34 + 34 * fade, bandPx * 0.32);
      node.setAttribute('font-size', Math.max(fontSize, 1).toFixed(1));
      node.style.opacity = bandPx < 42 ? '0' : (0.12 + fade * 0.62).toFixed(2);
    });
    this.eraLabels.forEach(function (item) {
      var cx = (item.era.x0 + item.era.x1) / 2 * k + tx;
      item.node.setAttribute('x', cx.toFixed(1));
      item.node.setAttribute('y', ((self.bbox.minY - 168) * k + ty).toFixed(1));
      var eraPx = (item.era.x1 - item.era.x0) * k;
      item.node.setAttribute('font-size', util.clamp(eraPx * 0.10, 7, 16).toFixed(1));
      item.node.style.opacity = eraPx < 155 ? '0' : (0.22 * fade + 0.06).toFixed(2);
    });
  };

  StarMap.prototype.setTransform = function (k, tx, ty) {
    var size = this.size();
    this.k = util.clamp(k, this.kMin || 0.05, 3.2);
    /* Verschiebung begrenzen, damit die Karte nicht aus dem Bild wandert */
    var marginX = size.w * 0.55, marginY = size.h * 0.55;
    this.tx = util.clamp(tx, -(WORLD_W * this.k) + marginX, size.w - marginX);
    this.ty = util.clamp(ty, -(WORLD_H * this.k) + marginY, size.h - marginY);
    this.applyTransform();
  };

  StarMap.prototype.animateTo = function (k, tx, ty, duration) {
    var self = this;
    var from = { k: this.k, tx: this.tx, ty: this.ty };
    var start = performance.now();
    var dur = duration == null ? 950 : duration;
    if (this.anim) cancelAnimationFrame(this.anim);
    if (dur <= 0) { this.setTransform(k, tx, ty); return; }

    (function frame(now) {
      var t = util.clamp((now - start) / dur, 0, 1);
      var e = util.easeInOut(t);
      self.setTransform(
        util.lerp(from.k, k, e),
        util.lerp(from.tx, tx, e),
        util.lerp(from.ty, ty, e)
      );
      if (t < 1) self.anim = requestAnimationFrame(frame);
      else self.anim = null;
    })(start);
  };

  StarMap.prototype.fitAll = function (animate) {
    var size = this.size();
    var area = this.safeArea(0);
    var k = Math.min((area.w - 40) / WORLD_W, (area.h - 20) / WORLD_H);
    this.kFit = k;
    this.kMin = k * 0.75;
    var tx = area.cx - (WORLD_W / 2) * k;
    var ty = area.cy - (WORLD_H / 2) * k;
    this.forceLabels = true;
    if (animate) this.animateTo(k, tx, ty, 1100); else this.setTransform(k, tx, ty);
  };

  /* Sichtbare Fläche ohne Kopfleiste, Jahrnavigation und Dock –
     verhindert, dass ein Stern hinter einem Bedienelement landet. */
  StarMap.prototype.safeArea = function (offsetX) {
    var size = this.size();
    var narrow = size.w <= 900;
    var top = narrow ? 96 : 118;
    var bottom = narrow ? 150 : 92;
    var left = narrow ? 0 : this.insets.left;
    var right = narrow ? 0 : this.insets.right;
    return {
      cx: left + (size.w - left - right) / 2 + (offsetX || 0),
      cy: top + (size.h - top - bottom) / 2,
      w: Math.max(size.w - left - right, 240),
      h: Math.max(size.h - top - bottom, 160)
    };
  };

  StarMap.prototype.focusYear = function (year, animate) {
    var band = this.yearBands[year];
    if (!band) return;
    var area = this.safeArea(0);

    /* Zoom so wählen, dass alle Ereignisse des Jahres hineinpassen */
    var list = this.events.filter(function (ev) { return util.year(ev.date) === year; });
    var minY = Infinity, maxY = -Infinity;
    list.forEach(function (ev) { minY = Math.min(minY, ev._pos.y); maxY = Math.max(maxY, ev._pos.y); });
    if (!list.length) { minY = 300; maxY = WORLD_H - 300; }

    var boxW = (band.x1 - band.x0) * 1.16;
    var boxH = (maxY - minY) + 220;
    var k = util.clamp(Math.min(area.w / boxW, area.h / boxH), this.kFit, 1.25);

    var cx = (band.x0 + band.x1) / 2;
    var cy = (minY + maxY) / 2;
    this.forceLabels = true;
    this.animateTo(k, area.cx - cx * k, area.cy - cy * k, animate === false ? 0 : 1000);
  };

  StarMap.prototype.focusEvent = function (ev, options) {
    options = options || {};
    var area = this.safeArea(options.offsetX);
    var k = options.zoom != null ? options.zoom : Math.max(this.k, this.kFit * 1.55);
    k = util.clamp(k, this.kFit, 2.4);
    this.forceLabels = true;
    this.animateTo(k, area.cx - ev._pos.x * k, area.cy - ev._pos.y * k,
                   options.duration == null ? 900 : options.duration);
  };

  /** Randabstände aktualisieren und Ansicht nachführen */
  StarMap.prototype.setInsets = function (left, right, refit) {
    this.insets.left = left;
    this.insets.right = right;
    if (refit) this.fitAll(true);
  };

  StarMap.prototype.zoomBy = function (factor) {
    var area = this.safeArea(0);
    var cx = area.cx, cy = area.cy;
    var k2 = util.clamp(this.k * factor, this.kMin, 3.2);
    var ratio = k2 / this.k;
    this.forceLabels = true;
    this.animateTo(k2, cx - (cx - this.tx) * ratio, cy - (cy - this.ty) * ratio, 320);
  };

  /* ---------- 4 · Auswahl, Hervorhebung, Filter ---------- */

  StarMap.prototype.setSelected = function (id) {
    this.selectedId = id;
    var relatedList = (id && this.related[id]) || [];
    var relatedSet = {};
    relatedList.forEach(function (rid) { relatedSet[rid] = true; });

    for (var key in this.nodes) {
      var node = this.nodes[key];
      var isSel = key === id;
      var isRel = !!relatedSet[key];
      node.group.classList.toggle('is-selected', isSel);
      node.group.classList.toggle('is-related', isRel);
      node.label.classList.toggle('is-selected', isSel);
      if (isSel || isRel) node.label.classList.add('is-visible');
    }

    this.links.forEach(function (link) {
      var involved = id && (link.from.id === id || link.to.id === id);
      link.node.classList.toggle('is-related', !!involved);
      link.node.classList.toggle('is-muted', !!id && !involved);
    });

    this.applyDimming();
  };

  StarMap.prototype.setCategories = function (set) {
    this.activeCategories = set;
    this.applyDimming();
  };

  /** Hebt die Ereignisse eines Jahres hervor (null = alle) */
  StarMap.prototype.setYear = function (year) {
    this.year = year;
    this.applyDimming();
  };

  StarMap.prototype.applyDimming = function () {
    var active = this.activeCategories;
    var id = this.selectedId;
    var relatedSet = {};
    ((id && this.related[id]) || []).forEach(function (rid) { relatedSet[rid] = true; });

    for (var key in this.nodes) {
      var node = this.nodes[key];
      var passesFilter = !active || active.has(node.ev.category);
      var passesYear = !this.year || util.year(node.ev.date) === this.year;
      var dimBySelection = !!id && key !== id && !relatedSet[key];
      var dim = !passesFilter || !passesYear || dimBySelection;
      node.group.classList.toggle('is-dim', dim);
      node.label.classList.toggle('is-dim', dim);
    }

    this.links.forEach(function (link) {
      if (id) return; /* Bei Auswahl steuert setSelected die Linien */
      var visible = !active || (active.has(link.from.category) && active.has(link.to.category));
      link.node.classList.toggle('is-muted', !visible);
    });
  };

  /** Schockwelle am Ort des Attentats – der „Urknall“ des Krieges */
  StarMap.prototype.playShockwave = function () {
    if (!this.shock) return;
    var node = this.shock;
    node.classList.remove('is-active');
    void node.getBoundingClientRect();
    node.classList.add('is-active');
  };

  /* ---------- 5 · Interaktion: Zoom, Pan, Touch ---------- */

  StarMap.prototype.bind = function () {
    var self = this, svg = this.svg;

    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var delta = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY;
      var factor = Math.exp(-delta * 0.0016);
      var k2 = util.clamp(self.k * factor, self.kMin, 3.2);
      var ratio = k2 / self.k;
      if (self.anim) { cancelAnimationFrame(self.anim); self.anim = null; }
      self.setTransform(k2, mx - (mx - self.tx) * ratio, my - (my - self.ty) * ratio);
    }, { passive: false });

    svg.addEventListener('pointerdown', function (e) {
      svg.setPointerCapture(e.pointerId);
      self.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      self.dragged = false;
      self.dragStart = { x: e.clientX, y: e.clientY, tx: self.tx, ty: self.ty };
      self.downTarget = e.target.closest ? e.target.closest('.star') : null;
      if (self.pointers.size === 2) self.pinchStart = self.pinchState();
      if (self.anim) { cancelAnimationFrame(self.anim); self.anim = null; }
      svg.classList.add('is-panning');
    });

    svg.addEventListener('pointermove', function (e) {
      if (!self.pointers.has(e.pointerId)) return;
      self.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (self.pointers.size >= 2 && self.pinchStart) {
        var now = self.pinchState();
        var scale = now.dist / self.pinchStart.dist;
        var k2 = util.clamp(self.pinchStart.k * scale, self.kMin, 3.2);
        var ratio = k2 / self.pinchStart.k;
        self.setTransform(
          k2,
          now.cx - (self.pinchStart.cx - self.pinchStart.tx) * ratio,
          now.cy - (self.pinchStart.cy - self.pinchStart.ty) * ratio
        );
        self.dragged = true;
        return;
      }

      if (!self.dragStart) return;
      var dx = e.clientX - self.dragStart.x, dy = e.clientY - self.dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) self.dragged = true;
      self.setTransform(self.k, self.dragStart.tx + dx, self.dragStart.ty + dy);
    });

    function endPointer(e) {
      /* Auswahl beim Loslassen auswerten: Wegen setPointerCapture erreicht
         das anschließende click-Ereignis nicht mehr den Stern selbst. */
      if (e.type === 'pointerup' && !self.dragged && self.pointers.size === 1) {
        if (self.downTarget && self.downTarget.dataset.id) {
          WW1.bus.emit('select', { id: self.downTarget.dataset.id, source: 'map' });
        } else if (!self.downTarget && self.selectedId) {
          WW1.bus.emit('select', { id: null, source: 'map' });
        }
      }
      self.downTarget = null;
      self.pointers.delete(e.pointerId);
      if (self.pointers.size < 2) self.pinchStart = null;
      if (self.pointers.size === 0) {
        self.dragStart = null;
        svg.classList.remove('is-panning');
      }
    }
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);
    svg.addEventListener('lostpointercapture', endPointer);

    svg.addEventListener('keydown', function (e) {
      var group = e.target.closest ? e.target.closest('.star') : null;
      if (group && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        WW1.bus.emit('select', { id: group.dataset.id, source: 'keyboard' });
      }
    });

    global.addEventListener('resize', util.debounce(function () {
      var oldFit = self.kFit;
      var size = self.size();
      var area = self.safeArea(0);
      self.kFit = Math.min((area.w - 40) / WORLD_W, (area.h - 20) / WORLD_H);
      self.kMin = self.kFit * 0.75;
      /* relatives Zoomniveau beibehalten */
      var rel = self.k / (oldFit || self.kFit);
      self.forceLabels = true;
      self.setTransform(self.kFit * rel, self.tx, self.ty);
    }, 200));
  };

  StarMap.prototype.pinchState = function () {
    var pts = Array.from(this.pointers.values());
    var rect = this.svg.getBoundingClientRect();
    var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    return {
      dist: Math.hypot(dx, dy) || 1,
      cx: (pts[0].x + pts[1].x) / 2 - rect.left,
      cy: (pts[0].y + pts[1].y) / 2 - rect.top,
      k: this.k, tx: this.tx, ty: this.ty
    };
  };

  StarMap.WORLD_W = WORLD_W;
  StarMap.WORLD_H = WORLD_H;
  StarMap.xFromDate = xFromDate;
  WW1.StarMap = StarMap;
})(window);
