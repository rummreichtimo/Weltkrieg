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

    svgEl.setAttribute('viewBox', '0 0 ' + this.width.toFixed(1) + ' ' + this.height.toFixed(1));
    this.build();
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
      self.capitalNodes[code] = { dot: dot, label: label };
    });

    /* Markierung des ausgewählten Ereignisses */
    var marker = util.svg('g', { class: 'geo-marker-group', opacity: '0' }, svg);
    this.connector = util.svg('path', { class: 'geo-connector', d: '' }, marker);
    this.markerRing = util.svg('circle', { class: 'geo-marker-ring', r: 3, 'stroke-width': .6 }, marker);
    this.markerDot = util.svg('circle', { class: 'geo-marker', r: 1.7 }, marker);
    this.callout = util.svg('text', { class: 'geo-callout' }, marker);
    this.markerGroup = marker;
  };

  EuropeMap.prototype.show = function (ev) {
    var self = this;

    /* Hauptstädte der beteiligten Staaten hervorheben */
    var participants = {};
    if (ev) (ev.participants || []).forEach(function (code) { participants[code] = true; });
    Object.keys(this.capitalNodes).forEach(function (code) {
      var node = self.capitalNodes[code];
      var on = !!participants[code];
      node.dot.classList.toggle('is-active', on);
      node.dot.setAttribute('r', on ? 2.1 : 1.3);
      node.label.classList.toggle('is-active', on);
    });

    /* Front hervorheben */
    Object.keys(this.frontNodes).forEach(function (key) {
      var entry = self.frontNodes[key];
      var on = !!(ev && ev.front === key);
      entry.main.classList.toggle('is-active', on);
      if (entry.extra) entry.extra.classList.toggle('is-active', on);
    });

    if (!ev || ev.lat == null || !this.inBounds(ev.lon, ev.lat)) {
      this.markerGroup.setAttribute('opacity', '0');
      this.markerRing.classList.remove('is-active');
      if (this.note) {
        this.note.textContent = !ev ? this.defaultNote
          : 'Schauplatz außerhalb des Kartenausschnitts: ' + (ev.location || '—') + '.';
      }
      return;
    }

    var xy = this.project(ev.lon, ev.lat);
    var toRight = xy[0] < this.width * 0.62;
    var labelX = xy[0] + (toRight ? 6 : -6);

    this.markerDot.setAttribute('cx', xy[0].toFixed(2));
    this.markerDot.setAttribute('cy', xy[1].toFixed(2));
    this.markerRing.setAttribute('cx', xy[0].toFixed(2));
    this.markerRing.setAttribute('cy', xy[1].toFixed(2));
    this.connector.setAttribute('d', 'M' + xy[0].toFixed(2) + ' ' + xy[1].toFixed(2) + 'L' + labelX.toFixed(2) + ' ' + xy[1].toFixed(2));
    this.callout.setAttribute('x', (labelX + (toRight ? 1.5 : -1.5)).toFixed(2));
    this.callout.setAttribute('y', (xy[1] + 2).toFixed(2));
    this.callout.setAttribute('text-anchor', toRight ? 'start' : 'end');
    this.callout.textContent = (ev.location || ev.title).split(',')[0];

    this.markerGroup.setAttribute('opacity', '1');
    this.markerRing.classList.remove('is-active');
    void this.markerRing.getBoundingClientRect();
    this.markerRing.classList.add('is-active');

    if (this.note) {
      var front = ev.front && WW1.GEO.FRONTS[ev.front];
      this.note.innerHTML = front
        ? '<span class="map-front-name">' + front.label + ' (' + front.period + ')</span> – ' + front.note
        : this.defaultNote;
    }
  };

  WW1.EuropeMap = EuropeMap;
})(window);
