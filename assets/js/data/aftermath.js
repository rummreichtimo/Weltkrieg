/* ============================================================
   „WAS BLIEB?“ – BILANZ UND FOLGEN DES KRIEGES
   ------------------------------------------------------------
   Alle Zahlen sind Schätzungen. Die Forschung nennt teils stark
   abweichende Werte, weil Statistiken fehlen, unterschiedlich
   definiert wird (Gefallene / Vermisste / Krankheitstote) und
   die Nachfolgestaaten anders zählten als die Kriegsstaaten.
   ============================================================ */
(function (global) {
  'use strict';

  /* Gefallene Soldaten (gerundete Schätzwerte, in Millionen) */
  var LOSSES = [
    { id: 'de', label: 'Deutsches Reich',        value: 2.00, side: 'central', note: 'ca. 2 Millionen gefallene Soldaten' },
    { id: 'ru', label: 'Russisches Reich',       value: 1.80, side: 'entente', note: 'ca. 1,8 Millionen; Angaben schwanken stark' },
    { id: 'fr', label: 'Frankreich',             value: 1.40, side: 'entente', note: 'ca. 1,4 Millionen – rund 4 % der Gesamtbevölkerung' },
    { id: 'at', label: 'Österreich-Ungarn',      value: 1.20, side: 'central', note: 'Schätzungen von 1,1 bis 1,5 Millionen' },
    { id: 'gb', label: 'Britisches Empire',      value: 0.95, side: 'entente', note: 'davon rund 750 000 aus Großbritannien und Irland' },
    { id: 'tr', label: 'Osmanisches Reich',      value: 0.77, side: 'central', note: 'ein großer Teil starb an Krankheiten und Erschöpfung' },
    { id: 'it', label: 'Italien',                value: 0.65, side: 'entente', note: 'überwiegend an der Isonzo- und Alpenfront' },
    { id: 'ro', label: 'Rumänien',               value: 0.25, side: 'entente', note: 'zusätzlich sehr hohe zivile Verluste' },
    { id: 'rs', label: 'Serbien',                value: 0.30, side: 'entente', note: 'Serbien verlor anteilig die meisten Menschen überhaupt' },
    { id: 'us', label: 'Vereinigte Staaten',     value: 0.117, side: 'entente', note: 'etwa die Hälfte starb an Krankheiten, vor allem an der Grippe' },
    { id: 'bg', label: 'Bulgarien',              value: 0.088, side: 'central', note: 'rund 88 000 gefallene Soldaten' }
  ];

  var SECTIONS = [
    {
      id: 'menschen',
      title: 'Menschliche Verluste',
      lead: 'Der erste industrielle Massenkrieg der Geschichte',
      points: [
        'Rund 9 bis 10 Millionen Soldaten fielen, etwa 20 Millionen wurden verwundet – viele lebenslang versehrt.',
        'Hinzu kommen 6 bis 7 Millionen zivile Todesopfer durch Hunger, Vertreibung, Besatzung und Massaker.',
        'Die Spanische Grippe forderte 1918/19 weltweit noch einmal 25 bis 50 Millionen Tote.',
        'Eine ganze Generation junger Männer fehlte; Millionen Kriegsversehrte und Kriegerwitwen prägten das Bild der Nachkriegsgesellschaften.',
        'Neu war das massenhafte psychische Trauma („Kriegszitterer“, shell shock), das lange nicht als Krankheit anerkannt wurde.'
      ]
    },
    {
      id: 'monarchien',
      title: 'Das Ende der Monarchien',
      lead: 'Vier Imperien verschwanden binnen weniger Jahre',
      points: [
        'Russisches Reich: Sturz der Romanows 1917, Bürgerkrieg, Entstehung der Sowjetunion.',
        'Deutsches Reich: Abdankung Wilhelms II. am 9. November 1918, Ausrufung der Republik.',
        'Österreich-Ungarn: Zerfall der Habsburgermonarchie im Herbst 1918 in mehrere Nationalstaaten.',
        'Osmanisches Reich: Auflösung und Neuordnung des Nahen Ostens; 1923 Gründung der Republik Türkei.'
      ]
    },
    {
      id: 'politik',
      title: 'Politische Veränderungen',
      lead: 'Eine neue Landkarte und neue Ideologien',
      points: [
        'Neue Staaten entstanden: Polen, Tschechoslowakei, Jugoslawien, Finnland, Estland, Lettland, Litauen, Österreich, Ungarn.',
        'Das Selbstbestimmungsrecht der Völker wurde zum Leitprinzip – ließ sich in gemischten Regionen aber nicht sauber umsetzen; überall entstanden neue Minderheiten.',
        'Der Völkerbund wurde als erste Organisation kollektiver Sicherheit gegründet; ohne die USA blieb er schwach.',
        'In vielen Ländern erhielten Frauen das Wahlrecht – in Deutschland 1918, weil Kriegsarbeit ihre gesellschaftliche Rolle verändert hatte.',
        'Kommunismus und Faschismus gewannen als Massenbewegungen an Kraft; die Gewaltbereitschaft der Kriegsjahre wirkte in Bürgerkriegen und Freikorps fort.'
      ]
    },
    {
      id: 'wirtschaft',
      title: 'Wirtschaftliche Folgen',
      lead: 'Verschuldung, Inflation, verlorene Jahrzehnte',
      points: [
        'Europa verlor seine Stellung als wirtschaftliches Zentrum der Welt; die USA wurden vom Schuldner zum größten Gläubiger.',
        'Kriegsanleihen und Notenpresse führten in mehreren Ländern zu Inflation – in Deutschland 1923 zur Hyperinflation.',
        'Reparationen, interalliierte Schulden und Handelsschranken belasteten die Weltwirtschaft und verstärkten die Weltwirtschaftskrise ab 1929.',
        'Ganze Landstriche in Nordfrankreich und Belgien waren zerstört; die „Zone rouge“ bei Verdun ist bis heute teilweise gesperrt.'
      ]
    },
    {
      id: 'versailles',
      title: 'Der Versailler Vertrag',
      lead: '28. Juni 1919 – Friedensschluss und Dauerkonflikt',
      points: [
        'Deutschland verlor rund 13 % seines Staatsgebiets und alle Kolonien; Elsass-Lothringen fiel an Frankreich.',
        'Das Heer wurde auf 100 000 Mann begrenzt, das Rheinland entmilitarisiert und besetzt.',
        'Artikel 231 wies Deutschland und seinen Verbündeten die Verantwortung für die Kriegsschäden zu – die Grundlage der Reparationsforderungen.',
        'Deutschland durfte nicht mitverhandeln; das prägte die Wahrnehmung als „Diktatfrieden“ über alle Parteigrenzen hinweg.',
        'Ob der Vertrag zu hart oder zu halbherzig war, ist bis heute umstritten. Unstrittig ist, dass er politisch hochwirksam gegen die Demokratie instrumentalisiert wurde.'
      ]
    },
    {
      id: 'langfristig',
      title: 'Langfristige Folgen für Europa',
      lead: 'Die „Urkatastrophe des 20. Jahrhunderts“',
      points: [
        'Der Historiker George F. Kennan nannte den Krieg die „Urkatastrophe des 20. Jahrhunderts“ – aus ihm folgten Revolution, Diktaturen und der Zweite Weltkrieg.',
        'Der Nahe Osten erhielt Grenzen, die nach europäischen Interessen gezogen wurden; viele Konflikte dort wurzeln in dieser Neuordnung.',
        'Kolonialsoldaten kämpften in Europa und stellten danach die Selbstverständlichkeit der Kolonialherrschaft in Frage.',
        'Die Erfahrung der Materialschlacht veränderte Kunst, Literatur und das Selbstbild der Moderne dauerhaft.',
        'In Westeuropa ist der 11. November bis heute Gedenktag; die Aussöhnung ehemaliger Kriegsgegner wurde zur Grundlage der europäischen Einigung.'
      ]
    }
  ];

  global.WW1 = global.WW1 || {};
  global.WW1.AFTERMATH = { LOSSES: LOSSES, SECTIONS: SECTIONS };
})(window);
