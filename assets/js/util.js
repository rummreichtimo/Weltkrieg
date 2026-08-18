/* ============================================================
   HILFSFUNKTIONEN UND ZUSTAND
   ------------------------------------------------------------
   Kleiner gemeinsamer Werkzeugkasten: DOM-Kürzel, Datums- und
   Mathefunktionen sowie ein schlanker Event-Bus, über den die
   Module (Sternenkarte, Detailansicht, Europakarte, Suche,
   Präsentationsmodus) miteinander kommunizieren.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1 = global.WW1 || {};

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var util = {
    SVG_NS: SVG_NS,

    qs: function (sel, root) { return (root || document).querySelector(sel); },
    qsa: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },

    /** SVG-Element mit Attributen erzeugen */
    svg: function (tag, attrs, parent) {
      var node = document.createElementNS(SVG_NS, tag);
      if (attrs) {
        for (var key in attrs) {
          if (Object.prototype.hasOwnProperty.call(attrs, key) && attrs[key] != null) {
            node.setAttribute(key, attrs[key]);
          }
        }
      }
      if (parent) parent.appendChild(node);
      return node;
    },

    /** HTML-Element mit Klassen und Textinhalt erzeugen */
    el: function (tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    },

    clear: function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); },

    /** "JJJJ-MM-TT" → Zeitstempel (UTC, damit Zeitzonen keine Rolle spielen) */
    time: function (iso) {
      var p = String(iso).split('-');
      return Date.UTC(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
    },

    year: function (iso) { return parseInt(String(iso).slice(0, 4), 10); },

    clamp: function (v, min, max) { return v < min ? min : (v > max ? max : v); },
    lerp: function (a, b, t) { return a + (b - a) * t; },

    /** Deterministische Pseudozufallszahl aus einer Zeichenkette (0…1).
        Sorgt dafür, dass die Sternenkarte bei jedem Laden gleich aussieht. */
    hash: function (str) {
      var h = 2166136261, i;
      for (i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return ((h >>> 0) % 100000) / 100000;
    },

    /** Zufallsgenerator mit festem Startwert */
    rng: function (seed) {
      var s = seed >>> 0 || 1;
      return function () {
        s ^= s << 13; s >>>= 0;
        s ^= s >> 17;
        s ^= s << 5;  s >>>= 0;
        return s / 4294967296;
      };
    },

    easeInOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },

    debounce: function (fn, wait) {
      var timer;
      return function () {
        var args = arguments, self = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(self, args); }, wait);
      };
    },

    /** Text ohne diakritische Zeichen und in Kleinschreibung (für die Suche) */
    normalize: function (str) {
      return String(str).toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõ]/g, 'o').replace(/[ùúû]/g, 'u').replace(/ç/g, 'c')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ').trim();
    },

    categoryColor: function (id) {
      var cat = WW1.CATEGORIES[id];
      return cat ? cat.color : '#93A1B8';
    }
  };

  /* Minimaler Event-Bus */
  var listeners = {};
  var bus = {
    on: function (name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return function () { bus.off(name, fn); };
    },
    off: function (name, fn) {
      if (!listeners[name]) return;
      listeners[name] = listeners[name].filter(function (f) { return f !== fn; });
    },
    emit: function (name, payload) {
      (listeners[name] || []).forEach(function (fn) {
        try { fn(payload); } catch (err) { console.error('[' + name + ']', err); }
      });
    }
  };

  WW1.util = util;
  WW1.bus = bus;
})(window);
