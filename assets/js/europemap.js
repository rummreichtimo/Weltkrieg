/* ============================================================
   EUROPAKARTE
   ------------------------------------------------------------
   Schematische Mercator-Karte als zweite visuelle Ebene:
   Sie verortet das ausgewählte Ereignis geografisch, hebt die
   beteiligten Hauptstädte hervor und zeigt den zugehörigen
   Frontverlauf. Bewusst reduziert – sie ergänzt die Sternen-
   karte, ersetzt sie nicht.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  function mercatorY(lat) {
    var phi = util.clamp(lat, -84, 84) * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + phi / 2));
  }

  function EuropeMap(svgEl, noteEl) {
    this.svg = svgEl;
    this.note = noteEl;
    this.defaultNote = noteEl ? noteEl.textContent : '';
    this.bounds = WW1.GEO.BOUNDS;
    this.width = 200;

    var b = this.bounds;
    this.y0 = mercatorY(b.north);
    this.y1 = mercatorY(b.south);
    this.height = this.width * (this.y0 - this.y1) / ((b.east - b.west) * Math.PI / 180);

    /* Kartenkamera: „view“ ist der aktuell gezeigte Ausschnitt.
       Beim Auswählen eines Ereignisses fährt sie auf den Ort hinein,
       ohne Auswahl wieder auf ganz Europa zurück. */
    this.fullView = { cx: this.width / 2, cy: this.height / 2, w: this.width };
    this.view = { cx: this.fullView.cx, cy: this.fullView.cy, w: this.fullView.w };
    this.scale = 1;
    this.viewAnim = null;

    this.build();
    this.applyView();
  }

  EuropeMap.prototype.project = function (lon, lat) {
    var b = this.bounds;
    var x = (lon - b.west) / (b.east - b.west) * this.width;
    var y = (this.y0 - mercatorY(lat)) / (this.y0 - this.y1) * this.height;
    return [x, y];
  };

  EuropeMap.prototype.inBounds = function (lon, lat) {
    var b = this.bounds;
    return lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
  };

  EuropeMap.prototype.path = function (points, close) {
    var self = this, d = '';
    points.forEach(function (p, i) {
      var xy = self.project(p[0], p[1]);
      d += (i === 0 ? 'M' : 'L') + xy[0].toFixed(2) + ' ' + xy[1].toFixed(2);
    });
    return d + (close ? 'Z' : '');
  };

  EuropeMap.prototype.build = function () {
    var svg = this.svg, self = this;
    util.clear(svg);

    /* Gradnetz */
    var grid = util.svg('g', { class: 'geo-graticule-group' }, svg);
    var lon, lat;
    for (lon = Math.ceil(this.bounds.west / 10) * 10; lon <= this.bounds.east; lon += 10) {
      util.svg('path', { class: 'geo-graticule', d: this.path([[lon, this.bounds.south], [lon, this.bounds.north]]) }, grid);
    }
    for (lat = Math.ceil(this.bounds.south / 10) * 10; lat <= this.bounds.north; lat += 10) {
      util.svg('path', { class: 'geo-graticule', d: this.path([[this.bounds.west, lat], [this.bounds.east, lat]]) }, grid);
    }

    /* Landmassen */
    var land = util.svg('g', { class: 'geo-land-group' }, svg);
    WW1.GEO.LANDMASSES.forEach(function (mass) {
      util.svg('path', { class: 'geo-land', d: self.path(mass.points, true) }, land);
    });

    /* Frontverläufe */
    this.frontNodes = {};
    var fronts = util.svg('g', { class: 'geo-front-group' }, svg);
    Object.keys(WW1.GEO.FRONTS).forEach(function (key) {
      var front = WW1.GEO.FRONTS[key];
      var node = util.svg('path', { class: 'geo-front', d: self.path(front.points) }, fronts);
      var extra = null;
      if (front.extraPoints) {
        extra = util.svg('path', { class: 'geo-front', d: self.path(front.extraPoints) }, fronts);
      }
      self.frontNodes[key] = { main: node, extra: extra, data: front };
    });

    /* Hauptstädte */
    this.capitalNodes = {};
    var caps = util.svg('g', { class: 'geo-capital-group' }, svg);
    Object.keys(WW1.NATIONS).forEach(function (code) {
      var nation = WW1.NATIONS[code];
      if (!self.inBounds(nation.lon, nation.lat)) return;
      var xy = self.project(nation.lon, nation.lat);
      var dot = util.svg('circle', { class: 'geo-capital', cx: xy[0].toFixed(2), cy: xy[1].toFixed(2), r: 1.3 }, caps);
      dot.dataset.side = nation.side;
      var label = util.svg('text', {
        class: 'geo-capital-label',
        x: (xy[0] + 2.2).toFixed(2), y: (xy[1] + 1.6).toFixed(2)
      }, caps);
      label.textContent = nation.capital;
      var title = util.svg('title', null, dot);
      title.textContent = nation.name + ' · ' + nation.capital;
      self.capitalNodes[code] = { dot: dot, label: label, x: xy[0], y: xy[1] };
    });

    /* Markierung des ausgewählten Ereignisses */
    var marker = util.svg('g', { class: 'geo-marker-group', opacity: '0' }, svg);
    this.connector = util.svg('path', { class: 'geo-connector', d: '' }, marker);
    this.markerRing = util.svg('circle', { class: 'geo-marker-ring', r: 3, 'stroke-width': .6 }, marker);
    this.markerDot = util.svg('circle', { class: 'geo-marker', r: 1.7 }, marker);
    this.callout = util.svg('text', { class: 'geo-callout' }, marker);
    this.markerGroup = marker;
  };

  /* ---------- Kamera ---------- */

  /** Ausschnitt anwenden und alle Punkte/Beschriftungen gegenskalieren,
      damit sie beim Hineinzoomen nicht mitwachsen. */
  EuropeMap.prototype.applyView = function () {
    var v = this.view;
    var h = v.w * (this.height / this.width);
    this.svg.setAttribute('viewBox',
      (v.cx - v.w / 2).toFixed(2) + ' ' + (v.cy - h / 2).toFixed(2) + ' ' +
      v.w.toFixed(2) + ' ' + h.toFixed(2));
    this.scale = v.w / this.width;
    this.rescale();
  };

  /** Punktgrößen und Schriftgrade an den Zoomfaktor anpassen */
  EuropeMap.prototype.rescale = function () {
    var f = this.scale, self = this;

    var v = this.view;
    var h = v.w * (this.height / this.width);
    var left = v.cx - v.w / 2, right = v.cx + v.w / 2;
    var top = v.cy - h / 2, bottom = v.cy + h / 2;

    Object.keys(this.capitalNodes).forEach(function (code) {
      var node = self.capitalNodes[code];
      var active = node.dot.classList.contains('is-active');
      node.dot.setAttribute('r', ((active ? 2.1 : 1.3) * f).toFixed(3));

      /* Beschriftungen außerhalb des Ausschnitts ausblenden und am
         rechten Rand nach links kippen – sonst werden sie angeschnitten. */
      var inside = node.x > left && node.x < right && node.y > top && node.y < bottom;
      node.label.style.display = inside ? '' : 'none';
      if (!inside) return;

      var toLeft = (node.x - left) / v.w > 0.70;
      node.label.setAttribute('font-size', (5 * f).toFixed(3));
      node.label.setAttribute('x', (node.x + (toLeft ? -2.2 : 2.2) * f).toFixed(3));
      node.label.setAttribute('y', (node.y + 1.6 * f).toFixed(3));
      node.label.setAttribute('text-anchor', toLeft ? 'end' : 'start');
    });

    this.markerDot.setAttribute('r', (1.7 * f).toFixed(3));
    this.markerRing.setAttribute('r', (3 * f).toFixed(3));
    this.callout.setAttribute('font-size', (6 * f).toFixed(3));
    if (this.markerPos) this.placeCallout();
  };

  /** Ortsangabe auf das Wesentliche kürzen: Klammerzusätze und
      nachgestellte Regionen entfallen („Ostpreußen (heute Stębark,
      Polen)“ wird zu „Ostpreußen“). */
  function shortPlace(text) {
    var t = String(text).replace(/\s*\([^)]*\)/g, '').split(',')[0].trim();
    return t.length > 26 ? t.slice(0, 25).trim() + '…' : t;
  }

  /** Beschriftung des Ereignisorts neben den Marker setzen.
      Die Seite richtet sich nach dem tatsächlich vorhandenen Platz,
      damit der Text nicht am Kartenrand abgeschnitten wird. */
  EuropeMap.prototype.placeCallout = function () {
    var xy = this.markerPos, f = this.scale, v = this.view;
    var left = v.cx - v.w / 2, right = v.cx + v.w / 2;
    var textWidth = this.callout.getComputedTextLength ? this.callout.getComputedTextLength() : 0;
    var gap = 6 * f;

    var fitsRight = xy[0] + gap + textWidth < right - 2 * f;
    var fitsLeft = xy[0] - gap - textWidth > left + 2 * f;
    var toRight = fitsRight || (!fitsLeft && (right - xy[0]) >= (xy[0] - left));
    var labelX = xy[0] + (toRight ? gap : -gap);

    this.connector.setAttribute('d',
      'M' + xy[0].toFixed(2) + ' ' + xy[1].toFixed(2) + 'L' + labelX.toFixed(2) + ' ' + xy[1].toFixed(2));
    this.callout.setAttribute('x', (labelX + (toRight ? 1.5 : -1.5) * f).toFixed(2));
    this.callout.setAttribute('y', (xy[1] + 2 * f).toFixed(2));
    this.callout.setAttribute('text-anchor', toRight ? 'start' : 'end');
  };

  /** Weich auf einen Zielausschnitt fahren */
  EuropeMap.prototype.animateView = function (target, duration) {
    var self = this;
    var from = { cx: this.view.cx, cy: this.view.cy, w: this.view.w };
    var dur = duration == null ? 780 : duration;

    if (this.viewAnim) cancelAnimationFrame(this.viewAnim);

    /* Ist der Unterschied verschwindend klein, direkt setzen */
    if (Math.abs(from.w - target.w) < 0.4 &&
        Math.abs(from.cx - target.cx) < 0.4 && Math.abs(from.cy - target.cy) < 0.4) {
      this.view = target;
      this.applyView();
      return;
    }

    var start = performance.now();
    (function frame(now) {
      var t = util.clamp((now - start) / dur, 0, 1);
      var e = util.easeInOut(t);
      self.view = {
        cx: util.lerp(from.cx, target.cx, e),
        cy: util.lerp(from.cy, target.cy, e),
        w: util.lerp(from.w, target.w, e)
      };
      self.applyView();
      if (t < 1) self.viewAnim = requestAnimationFrame(frame);
      else self.viewAnim = null;
    })(start);
  };

  /** Zielausschnitt für einen Ort berechnen (innerhalb der Karte gehalten) */
  EuropeMap.prototype.viewFor = function (xy) {
    var w = this.width * 0.30;
    var h = w * (this.height / this.width);
    return {
      cx: util.clamp(xy[0], w / 2, this.width - w / 2),
      cy: util.clamp(xy[1], h / 2, this.height - h / 2),
      w: w
    };
  };

  /* ---------- Anzeige eines Ereignisses ---------- */

  EuropeMap.prototype.show = function (ev) {
    var self = this;

    /* Hauptstädte der beteiligten Staaten hervorheben */
    var participants = {};
    if (ev) (ev.participants || []).forEach(function (code) { participants[code] = true; });
    Object.keys(this.capitalNodes).forEach(function (code) {
      var node = self.capitalNodes[code];
      node.dot.classList.toggle('is-active', !!participants[code]);
      node.label.classList.toggle('is-active', !!participants[code]);
    });

    /* Front hervorheben */
    Object.keys(this.frontNodes).forEach(function (key) {
      var entry = self.frontNodes[key];
      var on = !!(ev && ev.front === key);
      entry.main.classList.toggle('is-active', on);
      if (entry.extra) entry.extra.classList.toggle('is-active', on);
    });

    /* Kein Ereignis oder Schauplatz außerhalb der Karte: Gesamtansicht */
    if (!ev || ev.lat == null || !this.inBounds(ev.lon, ev.lat)) {
      this.markerPos = null;
      this.markerGroup.setAttribute('opacity', '0');
      this.markerRing.classList.remove('is-active');
      if (this.note) {
        this.note.textContent = !ev ? this.defaultNote
          : 'Schauplatz außerhalb des Kartenausschnitts: ' + (ev.location || '—') + '.';
      }
      this.animateView({ cx: this.fullView.cx, cy: this.fullView.cy, w: this.fullView.w });
      return;
    }

    var xy = this.project(ev.lon, ev.lat);
    this.markerPos = xy;
    this.markerDot.setAttribute('cx', xy[0].toFixed(2));
    this.markerDot.setAttribute('cy', xy[1].toFixed(2));
    this.markerRing.setAttribute('cx', xy[0].toFixed(2));
    this.markerRing.setAttribute('cy', xy[1].toFixed(2));
    this.callout.textContent = shortPlace(ev.location || ev.title);

    this.markerGroup.setAttribute('opacity', '1');
    this.markerRing.classList.remove('is-active');
    void this.markerRing.getBoundingClientRect();
    this.markerRing.classList.add('is-active');

    /* Auf den Ereignisort hineinfahren */
    this.animateView(this.viewFor(xy));

    if (this.note) {
      var front = ev.front && WW1.GEO.FRONTS[ev.front];
      this.note.innerHTML = front
        ? '<span class="map-front-name">' + front.label + ' (' + front.period + ')</span> – ' + front.note
        : this.defaultNote;
    }
  };

  WW1.EuropeMap = EuropeMap;
})(window);
