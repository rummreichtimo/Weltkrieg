/* ============================================================
   KATEGORIEN & FARBSYSTEM
   ------------------------------------------------------------
   Jede Kategorie besitzt eine zurückhaltende Farbe, ein Label
   für die Filterleiste und eine Beschreibung für die Legende.
   Neue Kategorien lassen sich hier ergänzen – Sternenkarte,
   Filter und Legende lesen automatisch aus dieser Datei.
   ============================================================ */
(function (global) {
  'use strict';

  var CATEGORIES = {
    political: {
      id: 'political',
      label: 'Politik & Kriegseintritte',
      short: 'Politik',
      color: '#5B8FD6',
      description: 'Regierungsentscheidungen, Kriegserklärungen, Bündniswechsel.'
    },
    battle: {
      id: 'battle',
      label: 'Schlachten & Offensiven',
      short: 'Schlachten',
      color: '#C1544A',
      description: 'Militärische Operationen an den Fronten.'
    },
    revolution: {
      id: 'revolution',
      label: 'Revolutionen & Umsturz',
      short: 'Revolutionen',
      color: '#9A72C8',
      description: 'Aufstände, Revolutionen, Sturz von Monarchien.'
    },
    technology: {
      id: 'technology',
      label: 'Technik & Kriegführung',
      short: 'Technik',
      color: '#4FB3A7',
      description: 'Neue Waffen und Verfahren, die den Krieg veränderten.'
    },
    diplomacy: {
      id: 'diplomacy',
      label: 'Diplomatie & Verträge',
      short: 'Diplomatie',
      color: '#D9A441',
      description: 'Noten, Ultimaten, Geheimverträge, Friedensinitiativen.'
    },
    end: {
      id: 'end',
      label: 'Kriegsende & Waffenstillstand',
      short: 'Kriegsende',
      color: '#5FA872',
      description: 'Waffenstillstände, Friedensschlüsse, Ende des Krieges.'
    },
    society: {
      id: 'society',
      label: 'Heimatfront & Zivilbevölkerung',
      short: 'Gesellschaft',
      color: '#C08E6E',
      description: 'Hunger, Streiks, Seuchen, Alltag und Leid der Zivilbevölkerung.'
    }
  };

  var CATEGORY_ORDER = ['political', 'battle', 'revolution', 'technology', 'diplomacy', 'end', 'society'];

  /* Vertikale Bahn je Kategorie auf der Sternenkarte.
     Negative Werte liegen oberhalb der Zeitachse, positive darunter. */
  var CATEGORY_LANE = {
    diplomacy: -2.10,
    technology: -1.45,
    battle: -0.80,
    end: 0.20,
    political: 0.95,
    society: 1.60,
    revolution: 2.15
  };

  global.WW1 = global.WW1 || {};
  global.WW1.CATEGORIES = CATEGORIES;
  global.WW1.CATEGORY_ORDER = CATEGORY_ORDER;
  global.WW1.CATEGORY_LANE = CATEGORY_LANE;
})(window);
