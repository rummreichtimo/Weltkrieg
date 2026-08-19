/* ============================================================
   HINTERGRUND-STERNENFELD
   ------------------------------------------------------------
   Ein Canvas mit langsam driftenden Sternen in drei Tiefenebenen.
   Bewusst zurückhaltend: kleine Punkte, geringe Helligkeit, sehr
   langsame Bewegung – die Anmutung einer historischen Nachtkarte,
   nicht eines Weltraumspiels.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  /* Position innerhalb des Bildschirms halten: So bleibt das Sternenfeld
     auch bei weiten Fahrten gleichmäßig gefüllt. */
  function wrap(value, size) {
    var margin = 40;
    var span = size + margin * 2;
    return ((value + margin) % span + span) % span - margin;
  }

  function Starfield(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.parallax = { x: 0, y: 0, tx: 0, ty: 0 };
    /* Kameraversatz der Sternenkarte. Der Hintergrund folgt ihm nur zu
       einem Bruchteil – dieses Tiefenversetzen lässt die Bewegung wie
       eine Kamerafahrt wirken statt wie ein verschobenes Bild. */
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.camBase = null;
    this.running = false;
    this.reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    this.bind();
  }

  Starfield.prototype.bind = function () {
    var self = this;
    global.addEventListener('resize', util.debounce(function () { self.resize(); }, 180));
    /* Sehr dezenter Parallax-Effekt bei Mausbewegung */
    global.addEventListener('pointermove', function (e) {
      if (self.reduced || e.pointerType === 'touch') return;
      self.parallax.tx = (e.clientX / global.innerWidth - 0.5) * 14;
      self.parallax.ty = (e.clientY / global.innerHeight - 0.5) * 10;
    }, { passive: true });
  };

  /** Kamerastand der Sternenkarte übernehmen (Verschiebung und
      relative Zoomstufe). Der erste Aufruf legt den Nullpunkt fest. */
  Starfield.prototype.setCamera = function (tx, ty, zoomRel) {
    if (!this.camBase) this.camBase = { x: tx, y: ty };
    this.cam.x = tx - this.camBase.x;
    this.cam.y = ty - this.camBase.y;
    this.cam.zoom = zoomRel || 1;
  };

  Starfield.prototype.resize = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = global.innerWidth, h = global.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.build();
  };

  Starfield.prototype.build = function () {
    var area = this.w * this.h;
    var count = Math.round(util.clamp(area / 5200, 130, 520));
    var rand = util.rng(20140628);
    var stars = [];
    /* Farbtöne einer alten Sternenkarte: warmes Weiß, Blaugrau, blasses Gold */
    var tints = ['239,232,220', '176,196,224', '214,190,150', '200,210,230'];
    for (var i = 0; i < count; i++) {
      var depth = rand();
      stars.push({
        x: rand() * this.w,
        y: rand() * this.h,
        r: 0.35 + depth * 1.15,
        depth: 0.25 + depth * 0.75,
        base: 0.12 + rand() * 0.42,
        tint: tints[Math.floor(rand() * tints.length)],
        phase: rand() * Math.PI * 2,
        speed: 0.14 + rand() * 0.5,
        drift: (rand() - 0.5) * 0.02
      });
    }
    this.stars = stars;
  };

  Starfield.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    var self = this, last = performance.now();
    (function frame(now) {
      if (!self.running) return;
      var dt = Math.min(now - last, 50); last = now;
      self.draw(now, dt);
      requestAnimationFrame(frame);
    })(last);
  };

  Starfield.prototype.draw = function (now, dt) {
    var ctx = this.ctx, p = this.parallax;
    p.x += (p.tx - p.x) * 0.03;
    p.y += (p.ty - p.y) * 0.03;
    ctx.clearRect(0, 0, this.w, this.h);

    /* Zoom wirkt sehr dezent: Der Hintergrund dehnt sich beim
       Hineinzoomen minimal aus dem Bildmittelpunkt heraus. */
    var zoomF = 1 + (util.clamp(this.cam.zoom, 0.4, 4) - 1) * 0.09;
    var midX = this.w / 2, midY = this.h / 2;

    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];
      if (!this.reduced) {
        /* minimale Eigenbewegung – über Minuten kaum wahrnehmbar */
        s.x += s.drift * s.depth * dt * 0.06;
        if (s.x < -4) s.x = this.w + 4;
        if (s.x > this.w + 4) s.x = -4;
      }
      var twinkle = this.reduced ? 1 : 0.72 + 0.28 * Math.sin(now * 0.00035 * s.speed + s.phase);
      var alpha = s.base * twinkle;

      /* Je näher ein Stern (größere Tiefe), desto stärker folgt er der
         Kamera – zwischen 3 % und 14 % der Kartenbewegung. */
      var follow = 0.03 + s.depth * 0.11;
      var x = wrap(s.x + p.x * s.depth + this.cam.x * follow, this.w);
      var y = wrap(s.y + p.y * s.depth + this.cam.y * follow, this.h);
      x = midX + (x - midX) * zoomF;
      y = midY + (y - midY) * zoomF;

      ctx.beginPath();
      ctx.arc(x, y, s.r * zoomF, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.tint + ',' + alpha.toFixed(3) + ')';
      ctx.fill();

      /* Die hellsten Sterne erhalten einen sehr weichen Hof */
      if (s.r > 1.25) {
        ctx.beginPath();
        ctx.arc(x, y, s.r * 3.4 * zoomF, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.tint + ',' + (alpha * 0.06).toFixed(3) + ')';
        ctx.fill();
      }
    }
  };

  WW1.Starfield = Starfield;
})(window);
