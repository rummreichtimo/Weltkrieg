/* ============================================================
   PRÄSENTATIONSMODUS „KRIEGSVERLAUF“
   ------------------------------------------------------------
   Spielt die wichtigsten Ereignisse chronologisch ab: Die Karte
   fährt zum jeweiligen Stern, die Detailansicht folgt. Der Ablauf
   endet am 11. November 1918 mit der Abschlussansicht.
   Jeder Eingriff der Nutzerin oder des Nutzers pausiert sofort.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  var STEP_MS = 6200;   /* Anzeigedauer je Ereignis */

  function Playback(events, controls) {
    this.controls = controls;   /* { button, icon, label, progress, bar } */
    /* Erzählfaden: alle Schlüssel- und Hauptereignisse bis zum
       Waffenstillstand; die Nachgeschichte folgt in „Was blieb?“. */
    this.sequence = events.filter(function (ev) {
      return ev.importance >= 4 && ev.date <= '1918-11-11';
    });
    this.i = -1;
    this.playing = false;
    this.timer = null;

    var self = this;
    controls.button.addEventListener('click', function () { self.toggle(); });
  }

  Playback.prototype.toggle = function () {
    if (this.playing) this.pause(); else this.play();
  };

  Playback.prototype.play = function (fromStart) {
    if (fromStart || this.i >= this.sequence.length - 1) this.i = -1;
    this.playing = true;
    this.updateUI();
    this.next();
  };

  Playback.prototype.pause = function () {
    this.playing = false;
    clearTimeout(this.timer);
    this.timer = null;
    this.updateUI();
  };

  Playback.prototype.stop = function () {
    this.pause();
    this.i = -1;
    this.setProgress(0);
  };

  /** Wird aufgerufen, wenn die Nutzerin selbst ein Ereignis wählt */
  Playback.prototype.interrupt = function (id) {
    if (!this.playing) return;
    this.pause();
    var idx = this.sequence.findIndex(function (ev) { return ev.id === id; });
    if (idx >= 0) this.i = idx;
  };

  Playback.prototype.next = function () {
    if (!this.playing) return;
    this.i++;
    if (this.i >= this.sequence.length) {
      this.pause();
      WW1.bus.emit('playback:finished');
      return;
    }
    var ev = this.sequence[this.i];
    this.setProgress((this.i + 1) / this.sequence.length);
    WW1.bus.emit('select', { id: ev.id, source: 'playback' });

    var self = this;
    this.timer = setTimeout(function () { self.next(); }, STEP_MS);
  };

  Playback.prototype.setProgress = function (ratio) {
    this.controls.bar.style.width = (ratio * 100).toFixed(2) + '%';
  };

  Playback.prototype.updateUI = function () {
    var playing = this.playing;
    this.controls.button.classList.toggle('is-on', playing);
    this.controls.label.textContent = playing ? 'Pause' : 'Kriegsverlauf abspielen';
    this.controls.icon.innerHTML = playing
      ? '<rect x="0" y="0" width="3.4" height="11"/><rect x="6.4" y="0" width="3.4" height="11"/>'
      : '<path d="M0 0l10 5.5L0 11z"/>';
    this.controls.progress.classList.toggle('is-on', playing);
  };

  WW1.Playback = Playback;
})(window);
