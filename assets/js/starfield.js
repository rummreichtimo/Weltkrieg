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

  function Starfield(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.parallax = { x: 0, y: 0, tx: 0, ty: 0 };
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
      var x = s.x + p.x * s.depth;
      var y = s.y + p.y * s.depth;

      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.tint + ',' + alpha.toFixed(3) + ')';
      ctx.fill();

      /* Die hellsten Sterne erhalten einen sehr weichen Hof */
      if (s.r > 1.25) {
        ctx.beginPath();
        ctx.arc(x, y, s.r * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.tint + ',' + (alpha * 0.06).toFixed(3) + ')';
        ctx.fill();
      }
    }
  };

  WW1.Starfield = Starfield;
})(window);
