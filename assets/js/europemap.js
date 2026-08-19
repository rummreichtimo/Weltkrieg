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
    this.bind();
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

    /* Korrekturflächen: Gebiete, die der Quelldatensatz dem falschen
       Staat zuordnet, werden aus dessen Fläche ausgestanzt. Die Daten
       selbst bleiben unverändert – ausgespart wird erst beim Zeichnen.
       Wichtig: Ein clipPath vereinigt mehrere Pfade. Die Umkehrung
       „alles außer dieser Fläche“ funktioniert nur, wenn Rechteck und
       Aussparung Teilpfade EINES Pfades mit clip-rule evenodd sind. */
    var defs = util.svg('defs', null, svg);
    var cutPaths = {};
    (WW1.GEO.CORRECTIONS || []).forEach(function (corr) {
      var frame = 'M-50 -50 H' + (self.width + 50) + ' V' + (self.height + 50) + ' H-50 Z';
      cutPaths[corr.from] = (cutPaths[corr.from] || frame) + ' ' + self.path(corr.ring, true);
    });
    Object.keys(cutPaths).forEach(function (code) {
      var clip = util.svg('clipPath', { id: 'geo-cut-' + code }, defs);
      util.svg('path', { d: cutPaths[code], 'clip-rule': 'evenodd' }, clip);
    });

    /* Staatsgebiete im Stand von 1914 (Fläche + Grenzlinie) */
    var land = util.svg('g', { class: 'geo-land-group' }, svg);
    var labelLayer = util.svg('g', { class: 'geo-country-labels' }, svg);
    this.countryNodes = {};

    var countryPaths = {};
    WW1.GEO.COUNTRIES.forEach(function (country) {
      if (country.nation) {
        countryPaths[country.nation] = country.rings.map(function (r) { return self.path(r, true); }).join(' ');
      }
    });

    /* Aussparungen vorbereiten:
       cut  – Fläche, die dem Staat fälschlich zugeschlagen ist
       hide – Bereich, in dem seine (falsche) Grenzlinie entfällt,
              weil dort die korrigierte Grenze gilt */
    var cuts = {}, hides = {};
    (WW1.GEO.CORRECTIONS || []).forEach(function (corr) {
      var d = self.path(corr.ring, true);
      cuts[corr.from] = (cuts[corr.from] || '') + ' ' + d;
      hides[corr.to] = (hides[corr.to] || '') + ' ' + d;
    });

    function inverseClip(id, shapes) {
      if (defs.querySelector('#' + id)) return 'url(#' + id + ')';
      var clip = util.svg('clipPath', { id: id }, defs);
      util.svg('path', {
        d: 'M-50 -50 H' + (self.width + 50) + ' V' + (self.height + 50) + ' H-50 Z' + shapes,
        'clip-rule': 'evenodd'
      }, clip);
      return 'url(#' + id + ')';
    }

    this.countryNodes = {};

    WW1.GEO.COUNTRIES.forEach(function (country) {
      var d = country.rings.map(function (ring) { return self.path(ring, true); }).join(' ');
      var nation = country.nation && WW1.NATIONS[country.nation];
      var name = nation ? nation.name : country.label;

      /* Fläche und Grenzlinie getrennt: Nur so lässt sich die falsche
         Grenzlinie im korrigierten Gebiet ausblenden, ohne die Fläche
         zu verlieren. */
      var fill = util.svg('path', { class: 'geo-country', d: d }, land);
      var line = util.svg('path', { class: 'geo-border geo-border--country', d: d }, land);

      if (name) {
        var title = util.svg('title', null, fill);
        title.textContent = name;
      }
      if (!country.nation) return;

      var code = country.nation;
      if (cuts[code]) {
        var cutRef = inverseClip('geo-cut-' + code, cuts[code]);
        fill.setAttribute('clip-path', cutRef);
        line.setAttribute('clip-path', cutRef);
      }
      if (hides[code]) {
        line.setAttribute('clip-path', inverseClip('geo-hide-' + code, hides[code]));
      }

      fill.dataset.nation = code;
      fill.dataset.side = nation.side;
      line.dataset.side = nation.side;

      var minX = Infinity, maxX = -Infinity;
      country.rings.forEach(function (ring) {
        ring.forEach(function (pt) {
          var px = self.project(pt[0], pt[1])[0];
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
        });
      });

      var xy = self.project(country.centroid[0], country.centroid[1]);
      var label = util.svg('text', { class: 'geo-country-label', 'text-anchor': 'middle' }, labelLayer);
      label.textContent = nation.name;
      self.countryNodes[code] = {
        paths: [fill], lines: [line], label: label, x: xy[0], y: xy[1], width: maxX - minX
      };
    });

    /* Korrigierte Gebiete dem richtigen Staat zuschlagen: Fläche ohne
       Kontur, dazu die echten Grenz- und Küstenabschnitte als Linie. */
    (WW1.GEO.CORRECTIONS || []).forEach(function (corr) {
      var target = self.countryNodes[corr.to];
      var nation = WW1.NATIONS[corr.to];
      var patch = util.svg('path', {
        class: 'geo-country geo-country--patch', d: self.path(corr.ring, true)
      }, land);
      if (nation) patch.dataset.side = nation.side;
      /* Nur den bislang fehlenden Teil füllen, damit sich zwei
         halbtransparente Flächen nicht überlagern. */
      if (countryPaths[corr.to]) {
        patch.setAttribute('clip-path', inverseClip('geo-add-' + corr.to, ' ' + countryPaths[corr.to]));
      }
      if (target) target.paths.push(patch);

      (corr.outline || []).forEach(function (segment) {
        util.svg('path', { class: 'geo-border', d: self.path(segment, false) }, land);
      });
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

      /* Beim näheren Hineinzoomen alle Hauptstädte benennen, damit man
         sich auch ohne ausgewähltes Ereignis orientieren kann. */
      node.label.classList.toggle('is-zoomed', f < 0.45);

      var toLeft = (node.x - left) / v.w > 0.70;
      node.label.setAttribute('font-size', (5 * f).toFixed(3));
      node.label.setAttribute('x', (node.x + (toLeft ? -2.2 : 2.2) * f).toFixed(3));
      node.label.setAttribute('y', (node.y + 1.6 * f).toFixed(3));
      node.label.setAttribute('text-anchor', toLeft ? 'end' : 'start');
    });

    Object.keys(this.countryNodes).forEach(function (code) {
      var node = self.countryNodes[code];
      var inside = node.x > left && node.x < right && node.y > top && node.y < bottom;
      node.label.style.display = inside ? '' : 'none';
      if (!inside) return;

      var fontSize = 6.5 * f;
      node.label.setAttribute('font-size', fontSize.toFixed(3));
      node.label.setAttribute('stroke-width', (fontSize * 0.16).toFixed(3));
      node.label.setAttribute('y', node.y.toFixed(2));

      /* Ländernamen im Ausschnitt halten, statt sie am Rand
         abzuschneiden – und ausblenden, wenn sie für den gezeigten
         Ausschnitt zu breit wären. */
      var tw = node.label.getComputedTextLength ? node.label.getComputedTextLength() : 0;
      /* Nicht anzeigen, wenn der Name breiter wäre als das Land selbst
         (etwa Belgien) oder als der gezeigte Ausschnitt. */
      if (tw > v.w * 0.62 || tw > node.width * 0.92) { node.label.style.display = 'none'; return; }
      var pad = tw / 2 + 2 * f;
      node.label.setAttribute('x', util.clamp(node.x, left + pad, right - pad).toFixed(2));
    });

    this.markerDot.setAttribute('r', (1.7 * f).toFixed(3));
    this.markerRing.setAttribute('r', (3 * f).toFixed(3));
    this.callout.setAttribute('font-size', (6 * f).toFixed(3));
    if (this.markerPos) this.placeCallout();

    this.layoutLabels();
  };

  /** Textbreite bei Schriftgröße 1 – einmal messen und merken */
  EuropeMap.prototype.unitWidth = function (node, text) {
    if (node._uwText !== text || !node._uw) {
      var fs = parseFloat(node.getAttribute('font-size')) || 6;
      var measured = node.getComputedTextLength ? node.getComputedTextLength() : 0;
      node._uw = (measured || text.length * 0.55 * fs) / fs;
      node._uwText = text;
    }
    return node._uw;
  };

  /** Überlappende Beschriftungen auflösen.
      Rangfolge: Ereignisort vor Hauptstadt vor Ländername – so bleibt
      immer die Angabe stehen, die zum gewählten Ereignis gehört. */
  EuropeMap.prototype.layoutLabels = function () {
    var self = this, items = [];

    function add(node, anchor) {
      if (!node || node.style.display === 'none' || !node.textContent) return;
      var fs = parseFloat(node.getAttribute('font-size')) || 6;
      var w = self.unitWidth(node, node.textContent) * fs;
      var x = parseFloat(node.getAttribute('x')) || 0;
      var y = parseFloat(node.getAttribute('y')) || 0;
      var x0 = anchor === 'end' ? x - w : (anchor === 'middle' ? x - w / 2 : x);
      items.push({
        node: node,
        box: { x0: x0 - fs * 0.2, x1: x0 + w + fs * 0.2, y0: y - fs * 0.9, y1: y + fs * 0.35 }
      });
    }

    if (this.markerPos) add(this.callout, this.callout.getAttribute('text-anchor'));
    Object.keys(this.capitalNodes).forEach(function (code) {
      var node = self.capitalNodes[code].label;
      if (node.classList.contains('is-active')) add(node, node.getAttribute('text-anchor') || 'start');
    });
    /* Erst danach die nur wegen des Zooms sichtbaren Namen – sie weichen
       den Angaben zum gewählten Ereignis aus. */
    Object.keys(this.capitalNodes).forEach(function (code) {
      var node = self.capitalNodes[code].label;
      if (!node.classList.contains('is-active') && node.classList.contains('is-zoomed')) {
        add(node, node.getAttribute('text-anchor') || 'start');
      }
    });
    Object.keys(this.countryNodes).forEach(function (code) {
      var node = self.countryNodes[code].label;
      if (node.classList.contains('is-active')) add(node, 'middle');
    });

    var placed = [];
    items.forEach(function (item) {
      var free = placed.every(function (other) {
        return item.box.x0 > other.x1 || item.box.x1 < other.x0 ||
               item.box.y0 > other.y1 || item.box.y1 < other.y0;
      });
      if (free) { placed.push(item.box); item.node.style.display = ''; }
      else item.node.style.display = 'none';
    });
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
      self.view = self.clampView({
        cx: util.lerp(from.cx, target.cx, e),
        cy: util.lerp(from.cy, target.cy, e),
        w: util.lerp(from.w, target.w, e)
      });
      self.applyView();
      if (t < 1) self.viewAnim = requestAnimationFrame(frame);
      else self.viewAnim = null;
    })(start);
  };

  /** Ausschnitt begrenzen: nie größer als die Karte und nie über den
      Rand hinaus – so bleibt beim eigenen Zoomen immer Land im Bild. */
  EuropeMap.prototype.clampView = function (view) {
    var w = util.clamp(view.w, this.width * 0.05, this.width);
    var h = w * (this.height / this.width);
    return {
      cx: util.clamp(view.cx, w / 2, this.width - w / 2),
      cy: util.clamp(view.cy, h / 2, this.height - h / 2),
      w: w
    };
  };

  EuropeMap.prototype.setView = function (view) {
    this.view = this.clampView(view);
    this.applyView();
  };

  /** Bildschirmpunkt in Kartenkoordinaten umrechnen (beachtet die
      Zentrierung des SVG-Inhalts bei abweichendem Seitenverhältnis) */
  EuropeMap.prototype.fromScreen = function (clientX, clientY) {
    var r = this.svg.getBoundingClientRect();
    var vw = this.view.w, vh = vw * (this.height / this.width);
    var scale = Math.min(r.width / vw, r.height / vh) || 1;
    var offX = (r.width - vw * scale) / 2, offY = (r.height - vh * scale) / 2;
    return {
      x: (clientX - r.left - offX) / scale + (this.view.cx - vw / 2),
      y: (clientY - r.top - offY) / scale + (this.view.cy - vh / 2),
      scale: scale
    };
  };

  /** Um einen festgehaltenen Punkt zoomen */
  EuropeMap.prototype.zoomAt = function (factor, clientX, clientY) {
    this.stopAnimation();
    var p = this.fromScreen(clientX, clientY);
    var w = util.clamp(this.view.w * factor, this.width * 0.05, this.width);
    var ratio = w / this.view.w;
    this.setView({
      cx: p.x - (p.x - this.view.cx) * ratio,
      cy: p.y - (p.y - this.view.cy) * ratio,
      w: w
    });
  };

  /** Zoomen über die Schaltflächen – Bezugspunkt ist die Kartenmitte */
  EuropeMap.prototype.zoomBy = function (factor) {
    this.stopAnimation();
    var w = util.clamp(this.view.w * factor, this.width * 0.05, this.width);
    this.animateView({ cx: this.view.cx, cy: this.view.cy, w: w }, 260);
  };

  EuropeMap.prototype.stopAnimation = function () {
    if (this.viewAnim) { cancelAnimationFrame(this.viewAnim); this.viewAnim = null; }
  };

  EuropeMap.prototype.resetView = function () {
    this.stopAnimation();
    this.animateView({ cx: this.fullView.cx, cy: this.fullView.cy, w: this.fullView.w }, 600);
  };

  /* ---------- Bedienung der Karte: Zoomen, Verschieben, Wischen ---------- */

  EuropeMap.prototype.bind = function () {
    var self = this, svg = this.svg;
    var pointers = new Map();
    var drag = null, pinch = null;

    function rebase() {
      var entries = Array.from(pointers.entries());
      if (entries.length === 1) {
        pinch = null;
        drag = { id: entries[0][0], x: entries[0][1].x, y: entries[0][1].y,
                 cx: self.view.cx, cy: self.view.cy };
      } else if (entries.length >= 2) {
        drag = null;
        var a = entries[0][1], b = entries[1][1];
        pinch = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
          view: { cx: self.view.cx, cy: self.view.cy, w: self.view.w }
        };
      } else { drag = null; pinch = null; }
    }

    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY;
      self.zoomAt(Math.exp(delta * 0.0016), e.clientX, e.clientY);
    }, { passive: false });

    svg.addEventListener('pointerdown', function (e) {
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* Zeiger beendet */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      self.stopAnimation();
      rebase();
      svg.classList.add('is-panning');
    });

    svg.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2 && pinch) {
        var pts = Array.from(pointers.values());
        var dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        var w = util.clamp(pinch.view.w * (pinch.dist / dist), self.width * 0.05, self.width);
        var ratio = w / pinch.view.w;
        var p = self.fromScreen(pinch.mx, pinch.my);
        self.setView({
          cx: p.x - (p.x - pinch.view.cx) * ratio,
          cy: p.y - (p.y - pinch.view.cy) * ratio,
          w: w
        });
        return;
      }

      if (!drag || e.pointerId !== drag.id) return;
      var scale = self.fromScreen(0, 0).scale;
      self.setView({
        cx: drag.cx - (e.clientX - drag.x) / scale,
        cy: drag.cy - (e.clientY - drag.y) / scale,
        w: self.view.w
      });
    });

    function endPointer(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size === 0) { drag = null; pinch = null; svg.classList.remove('is-panning'); }
      else rebase();
    }
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);
    svg.addEventListener('lostpointercapture', endPointer);

    svg.addEventListener('dblclick', function (e) {
      e.preventDefault();
      self.resetView();
    });
  };

  /** Zielausschnitt für einen Ort berechnen (innerhalb der Karte gehalten) */
  EuropeMap.prototype.viewFor = function (xy) {
    return this.clampView({ cx: xy[0], cy: xy[1], w: this.width * 0.30 });
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

    /* Beteiligte Staatsgebiete einfärben und benennen */
    Object.keys(this.countryNodes).forEach(function (code) {
      var node = self.countryNodes[code];
      var on = !!participants[code];
      node.paths.forEach(function (path) { path.classList.toggle('is-active', on); });
      node.lines.forEach(function (line) { line.classList.toggle('is-active', on); });
      node.label.classList.toggle('is-active', on);
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
