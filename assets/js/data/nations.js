/* ============================================================
   KRIEGSPARTEIEN
   ------------------------------------------------------------
   side: 'central' = Mittelmächte, 'entente' = Entente/Alliierte
   lat/lon = Hauptstadt (echte Koordinaten für die Europakarte)
   entry/exit = Kriegseintritt bzw. Ausscheiden aus dem Krieg
   ============================================================ */
(function (global) {
  'use strict';

  var NATIONS = {
    'de': { id: 'de', name: 'Deutsches Reich', side: 'central', capital: 'Berlin', lat: 52.52, lon: 13.40,
            entry: '1914-08-01', exit: '1918-11-11',
            note: 'Führende Militärmacht der Mittelmächte; Kriegsende mit dem Waffenstillstand von Compiègne.' },
    'at': { id: 'at', name: 'Österreich-Ungarn', side: 'central', capital: 'Wien', lat: 48.21, lon: 16.37,
            entry: '1914-07-28', exit: '1918-11-03',
            note: 'Vielvölkerstaat; zerfiel im Herbst 1918 (Waffenstillstand von Villa Giusti).' },
    'tr': { id: 'tr', name: 'Osmanisches Reich', side: 'central', capital: 'Konstantinopel', lat: 41.01, lon: 28.98,
            entry: '1914-10-29', exit: '1918-10-30',
            note: 'Kriegseintritt Ende Oktober 1914; Waffenstillstand von Mudros am 30. Oktober 1918.' },
    'bg': { id: 'bg', name: 'Bulgarien', side: 'central', capital: 'Sofia', lat: 42.70, lon: 23.32,
            entry: '1915-10-14', exit: '1918-09-29',
            note: 'Trat 1915 den Mittelmächten bei; schloss als erste Mittelmacht einen Waffenstillstand.' },

    'fr': { id: 'fr', name: 'Frankreich', side: 'entente', capital: 'Paris', lat: 48.86, lon: 2.35,
            entry: '1914-08-03', exit: null,
            note: 'Hauptschauplatz der Westfront; im Verhältnis zur Bevölkerung die höchsten Verluste der Großmächte.' },
    'gb': { id: 'gb', name: 'Vereinigtes Königreich', side: 'entente', capital: 'London', lat: 51.51, lon: -0.13,
            entry: '1914-08-04', exit: null,
            note: 'Kriegseintritt wegen der Verletzung der belgischen Neutralität; Seeblockade der Mittelmächte.' },
    'ru': { id: 'ru', name: 'Russisches Reich', side: 'entente', capital: 'Petrograd', lat: 59.94, lon: 30.31,
            entry: '1914-08-01', exit: '1918-03-03',
            note: 'Schied nach den Revolutionen von 1917 mit dem Frieden von Brest-Litowsk aus dem Krieg aus.' },
    'it': { id: 'it', name: 'Italien', side: 'entente', capital: 'Rom', lat: 41.90, lon: 12.50,
            entry: '1915-05-23', exit: null,
            note: 'Trotz Dreibund zunächst neutral; Kriegseintritt 1915 nach dem geheimen Londoner Vertrag.' },
    'us': { id: 'us', name: 'Vereinigte Staaten', side: 'entente', capital: 'Washington, D. C.', lat: 38.90, lon: -77.04,
            entry: '1917-04-06', exit: null,
            note: 'Assoziierte Macht ohne formellen Bündnisbeitritt; ab 1918 entscheidend für Material und Reserven.' },
    'rs': { id: 'rs', name: 'Serbien', side: 'entente', capital: 'Belgrad', lat: 44.80, lon: 20.47,
            entry: '1914-07-28', exit: null,
            note: 'Ausgangspunkt der Julikrise; 1915 besetzt, die Armee wich über Albanien nach Korfu aus.' },
    'be': { id: 'be', name: 'Belgien', side: 'entente', capital: 'Brüssel', lat: 50.85, lon: 4.35,
            entry: '1914-08-04', exit: null,
            note: 'Neutraler Staat, dessen Besetzung den britischen Kriegseintritt auslöste.' },
    'ro': { id: 'ro', name: 'Rumänien', side: 'entente', capital: 'Bukarest', lat: 44.43, lon: 26.10,
            entry: '1916-08-27', exit: '1918-05-07',
            note: 'Kriegseintritt 1916; nach der Besetzung Frieden von Bukarest 1918, im November erneuter Eintritt.' },
    'jp': { id: 'jp', name: 'Japan', side: 'entente', capital: 'Tokio', lat: 35.68, lon: 139.69,
            entry: '1914-08-23', exit: null,
            note: 'Besetzte deutsche Stützpunkte in Ostasien und im Pazifik (u. a. Tsingtau).' },
    'gr': { id: 'gr', name: 'Griechenland', side: 'entente', capital: 'Athen', lat: 37.98, lon: 23.73,
            entry: '1917-06-29', exit: null,
            note: 'Nach der innenpolitischen Spaltung („Nationale Schisma“) 1917 auf Seiten der Entente.' },
    'pt': { id: 'pt', name: 'Portugal', side: 'entente', capital: 'Lissabon', lat: 38.72, lon: -9.14,
            entry: '1916-03-09', exit: null,
            note: 'Deutsche Kriegserklärung im März 1916; portugiesische Truppen ab 1917 an der Westfront.' }
  };

  var SIDES = {
    central: { id: 'central', label: 'Mittelmächte', color: '#C98A5B',
               description: 'Deutsches Reich, Österreich-Ungarn, Osmanisches Reich, Bulgarien.' },
    entente: { id: 'entente', label: 'Entente / Alliierte', color: '#5E93C4',
               description: 'Frankreich, Vereinigtes Königreich, Russland, Italien, USA und weitere Staaten.' }
  };

  global.WW1 = global.WW1 || {};
  global.WW1.NATIONS = NATIONS;
  global.WW1.SIDES = SIDES;
})(window);
