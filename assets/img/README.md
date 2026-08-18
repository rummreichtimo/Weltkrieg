# Historische Abbildungen

Dieser Ordner ist für gemeinfreie historische Fotografien vorgesehen
(z. B. von Wikimedia Commons).

Ein Bild wird angezeigt, sobald im Ereignisdatensatz
(`assets/js/data/events.js`) das Feld `image` gefüllt ist:

```js
image: {
  src:     'assets/img/sarajevo-1914.jpg',
  caption: 'Verhaftung Gavrilo Princips, 28. Juni 1914',
  credit:  'Wikimedia Commons, gemeinfrei',
  url:     'https://commons.wikimedia.org/wiki/File:...'
}
```

Solange kein Bild hinterlegt ist, erzeugt die Anwendung eine stilisierte
Grafik aus dem Verknüpfungsnetz des Ereignisses. Jedes Ereignis enthält im
Feld `imageHint` einen Vorschlag, welche Abbildung inhaltlich passen würde.

Bitte nur Bilder verwenden, deren Lizenz die Nutzung erlaubt, und die
Quelle im Feld `credit` angeben.
