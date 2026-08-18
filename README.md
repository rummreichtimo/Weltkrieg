# Der Erste Weltkrieg – Eine interaktive Sternenkarte der Geschichte

Eine interaktive Webanwendung, die die Ereignisse des Ersten Weltkriegs (1914–1918)
als kosmische Zeitlinie darstellt: Jedes Ereignis ist ein Stern, Ursache-Wirkungs-Ketten
sind Verbindungslinien, und der Kriegsausbruch von 1914 lässt die Karte förmlich explodieren.

Gedacht als Lernwerkzeug für den Geschichtsunterricht – ohne Backend, ohne Build-Schritt,
ohne externe Abhängigkeiten.

---

## 1 · Schnellstart

**Variante A – einfach öffnen**

```
index.html im Browser öffnen (Doppelklick)
```

Die Anwendung nutzt bewusst klassische `<script>`-Einbindungen statt ES-Modulen und
funktioniert deshalb direkt über `file://` – ohne Server.

**Variante B – lokaler Server** (empfohlen für Präsentationen, aktiviert Caching korrekt)

```bash
cd Weltkrieg
python3 -m http.server 8000
# danach im Browser: http://localhost:8000
```

Getestet mit aktuellem Chromium/Chrome; funktioniert ebenso in Firefox und Safari.

---

## 2 · Dateien

```
index.html                      Grundgerüst: Intro, Kopfleiste, Panels, Overlays
README.md                       diese Datei

assets/css/style.css            gesamtes Design (Farbtoken, Layout, Animationen, Responsive)

assets/js/data/
  categories.js                 7 Kategorien mit Farben, Beschreibungen und Bahnen
  nations.js                    15 Kriegsparteien mit Bündnis, Hauptstadt, Ein-/Austritt
  events.js                     77 Ereignisse (Vorgeschichte 1882 bis Nachkriegsordnung 1919)
  geo.js                        Küstenlinien (Natural Earth, gemeinfrei) + Frontverläufe
  aftermath.js                  Bilanz „Was blieb?“ inkl. Verlustzahlen

assets/js/
  util.js                       Hilfsfunktionen, deterministischer Zufall, Event-Bus
  starfield.js                  Canvas-Hintergrund mit driftenden Sternen
  starmap.js                    die Sternenkarte: Layout, Zoom, Pan, Auswahl, Filter
  detail.js                     Detail-Sidepanel mit Ursache-Wirkungs-Ketten
  europemap.js                  schematische Europakarte mit Frontverläufen
  search.js                     Volltextsuche über Titel, Orte, Staaten, Jahre
  playback.js                   Präsentationsmodus „Kriegsverlauf abspielen“
  aftermath.js                  Abschlussansicht und Verlustdiagramm
  app.js                        verbindet alle Module (Zustand, Ereignisse, Bedienung)
```

Die Module kommunizieren über einen kleinen Event-Bus (`WW1.bus`). Alles hängt am
globalen Namensraum `window.WW1` – dadurch bleibt der Code ohne Bundler lesbar.

---

## 3 · Was bereits funktioniert

**Sternenkarte**
* 77 Ereignisse als Sterne; Größe, Leuchtkraft und Linienstärke folgen der Bedeutung (1–5)
* geschwungene Zeitachse, Jahresbänder 1914–1918 sowie Abschnitte „Vorgeschichte“ und „Folgen“
* gestauchte Zeitachse: Vor dem 28. Juni 1914 stehen wenige Sterne, danach explodieren
  Dichte und Verbindungen („Urknall“ inkl. Schockwelle am Attentatsort)
* Zoom per Mausrad, Verschieben per Ziehen, Pinch-Zoom und Wischen auf Touchgeräten
* Beschriftungen erscheinen gestaffelt beim Hineinzoomen und weichen einander aus

**Ereignisse**
* Detail-Sidepanel mit Datum, Ort, Kategorie, Front, beteiligten Staaten, „Was geschah?“,
  „Warum ist das wichtig?“, Verlustzahlen
* Ursache-Wirkungs-Ketten in beide Richtungen („Führte hierher“ / „Führte zu“) – anklickbar
* ausgewählte Ereignisse heben verknüpfte Sterne hervor und dunkeln den Rest ab
* Vor/Zurück-Navigation chronologisch, auch per Pfeiltasten

**Navigation und Werkzeuge**
* Jahrnavigation 1914–1918 plus „Gesamter Krieg“
* Filter für alle sieben Kategorien (mit Anzahl je Kategorie)
* Kriegsparteien-Panel: Mittelmächte und Entente; beteiligte Staaten leuchten auf
* Suche über Titel, Ort, Staat, Jahr und Beschreibungstexte („Verdun“, „USA“, „1917“, „U-Boot“)
* Europakarte mit echten Koordinaten, Hauptstädten und schematischen Frontverläufen
* Präsentationsmodus: spielt 41 Schlüsselereignisse chronologisch ab (rund 4 Minuten), pausierbar,
  jeder eigene Klick unterbricht sofort
* Abschlussansicht zum 11. November 1918 und Bilanz „Was blieb?“ mit Verlustdiagramm
  (sortierte Balken, Legende, direkte Werte, umschaltbare Tabellenansicht)
* Tastatur: `←` `→` Ereignisse, `0` Gesamtansicht, `1`–`5` Jahre, `Leertaste` abspielen,
  `/` Suche, `Esc` schließen
* Responsive von 320 px bis Großbildschirm; Panels werden auf kleinen Geräten zu Schubladen
* `prefers-reduced-motion` wird respektiert

---

## 4 · Was sich leicht erweitern lässt

**Historische Bilder.** Jedes Ereignis besitzt bereits ein Feld `imageHint` mit einem
Vorschlag für eine gemeinfreie Abbildung. Ein Bild wird angezeigt, sobald das Feld
`image` gefüllt ist – sonst erscheint eine stilisierte Grafik:

```js
image: {
  src:     'assets/img/sarajevo-1914.jpg',
  caption: 'Verhaftung Gavrilo Princips, 28. Juni 1914',
  credit:  'Wikimedia Commons, gemeinfrei',
  url:     'https://commons.wikimedia.org/wiki/File:...'
}
```

**Weitere Ereignisse.** Einfach ein Objekt in `assets/js/data/events.js` ergänzen –
Position, Verbindungen, Filter, Suche und Präsentationsmodus richten sich automatisch danach.

**Weitere Kategorien.** Ein Eintrag in `categories.js` (Farbe, Beschreibung) und eine
Bahn in `CATEGORY_LANE` genügen; Filterliste und Legende bauen sich selbst auf.

**Weitere Staaten und Fronten.** `nations.js` bzw. `GEO.FRONTS` erweitern;
Hauptstadtpunkte und Frontlinien erscheinen dann automatisch auf der Karte.

**Denkbare nächste Schritte:** Quiz- oder Arbeitsblattmodus, Zeitraffer der Frontverläufe
pro Jahr, Vergleichsansicht zweier Ereignisse, Druckansicht für den Unterricht,
mehrsprachige Texte (die Datenstruktur ist dafür bereits getrennt vom Code).

---

## 5 · Hinweise zu Inhalt und Daten

* **Datierung:** durchgehend gregorianischer Kalender; bei russischen Ereignissen steht das
  damals dort gültige julianische Datum in Klammern.
* **Opferzahlen** sind Schätzungen. Wo die Forschung deutlich abweichende Werte nennt,
  ist eine Spannbreite angegeben (z. B. Völkermord an den Armeniern, Spanische Grippe).
* **Umstrittene Deutungen** (Kriegsschuldfrage, Härte des Versailler Vertrags) werden als
  umstritten gekennzeichnet, statt eine Position als gesichert darzustellen.
* **Karte:** Sie zeigt bewusst keine Staatsgrenzen – die Grenzen von 1914 änderten sich im
  Krieg laufend, heutige Grenzen wären irreführend. Dargestellt sind Küstenlinien,
  Hauptstädte, Ereignisorte und schematische Frontverläufe.
* **Küstenlinien:** Natural Earth (`ne_50m_land`, gemeinfrei), zugeschnitten und vereinfacht.

Die Anwendung ersetzt keine Fachliteratur. Ihr Ziel ist, den *Zusammenhang* der Ereignisse
sichtbar zu machen: warum aus einem Attentat in Sarajevo binnen fünf Wochen ein
europäischer Krieg wurde – und warum er vier Jahre lang nicht endete.
