/* ============================================================
   EREIGNISDATENBANK  ·  DER ERSTE WELTKRIEG
   ------------------------------------------------------------
   Struktur eines Ereignisses:
   {
     id:          eindeutiger Schlüssel (für Verknüpfungen)
     date:        "JJJJ-MM-TT"  – Beginn (maßgeblich für die Position)
     endDate:     optional, Ende eines längeren Ereignisses
     dateLabel:   Anzeigeform des Datums
     title:       Titel des Ereignisses
     category:    Schlüssel aus categories.js
     importance:  1 (Randnotiz) … 5 (Schlüsselereignis) – steuert
                  Sterngröße, Glow und Stärke der Verbindungslinien
     location:    Ortsangabe als Text
     lat / lon:   echte Koordinaten für die Europakarte (optional)
     front:       'west' | 'east' | 'italy' | 'balkan' | 'sea' |
                  'middleeast' | null
     participants: Länderschlüssel aus nations.js
     summary:     „Was geschah?“
     significance:„Warum ist das wichtig?“
     casualties:  optionale Angabe zu Verlusten (mit Einordnung)
     links:       IDs der unmittelbar folgenden Ereignisse
                  (gerichtete Ursache-Wirkungs-Kette)
     imageHint:   Vorschlag für ein gemeinfreies Bild (Wikimedia)
     image:       { src, caption, credit, url } – optional; ist kein
                  Bild hinterlegt, wird eine stilisierte Grafik erzeugt
   }

   Hinweis zur Datierung: Russische Ereignisse sind nach dem
   gregorianischen Kalender datiert; das in Russland bis 1918
   gültige julianische Datum steht jeweils in Klammern.
   ============================================================ */
(function (global) {
  'use strict';

  var EVENTS = [

    /* ---------- VORGESCHICHTE: DAS BÜNDNISSYSTEM ---------- */
    {
      id: 'dreibund', date: '1882-05-20', dateLabel: '20. Mai 1882',
      title: 'Dreibund', category: 'diplomacy', importance: 3,
      location: 'Wien', lat: 48.21, lon: 16.37, front: null,
      participants: ['de', 'at', 'it'],
      summary: 'Das Deutsche Reich, Österreich-Ungarn und Italien schließen ein Verteidigungsbündnis. Es wird bis 1915 mehrfach verlängert.',
      significance: 'Der Dreibund war der erste Baustein des europäischen Bündnissystems, das 1914 aus einem regionalen Konflikt einen Weltkrieg machte. Italien trat 1915 dennoch auf der Gegenseite in den Krieg ein, weil das Bündnis nur im Verteidigungsfall galt.',
      links: ['franz-russ-allianz', 'julikrise-blankoscheck'],
      imageHint: 'Vertragsdokument oder Karikatur zum Dreibund (Wikimedia Commons)'
    },
    {
      id: 'franz-russ-allianz', date: '1894-01-04', dateLabel: 'Januar 1894',
      title: 'Französisch-russisches Bündnis', category: 'diplomacy', importance: 3,
      location: 'Paris / Sankt Petersburg', lat: 48.86, lon: 2.35, front: null,
      participants: ['fr', 'ru'],
      summary: 'Nach dem Ende des deutsch-russischen Rückversicherungsvertrags verbünden sich Frankreich und Russland militärisch.',
      significance: 'Damit entstand die von Bismarck stets gefürchtete Zweifrontenlage für Deutschland. Die deutsche Militärplanung reagierte darauf mit dem Schlieffenplan – einem Aufmarschplan, der 1914 politische Handlungsspielräume massiv einengte.',
      links: ['entente-cordiale', 'schlieffenplan-info']
    },
    {
      id: 'dreadnought', date: '1906-02-10', dateLabel: '10. Februar 1906',
      title: 'Stapellauf der HMS Dreadnought', category: 'technology', importance: 3,
      location: 'Portsmouth', lat: 50.80, lon: -1.09, front: 'sea',
      participants: ['gb', 'de'],
      summary: 'Großbritannien lässt ein Schlachtschiff vom Stapel, das alle bisherigen Typen entwertet. Deutschland antwortet mit einem eigenen Bauprogramm.',
      significance: 'Das deutsch-britische Flottenwettrüsten belastete das Verhältnis beider Mächte dauerhaft und trieb Großbritannien enger an Frankreich und Russland heran. Es zeigt, wie Rüstung selbst zur Ursache von Misstrauen wurde.',
      links: ['entente-triple'],
      imageHint: 'HMS Dreadnought (1906), Fotografie, gemeinfrei'
    },
    {
      id: 'entente-cordiale', date: '1904-04-08', dateLabel: '8. April 1904',
      title: 'Entente cordiale', category: 'diplomacy', importance: 3,
      location: 'London', lat: 51.51, lon: -0.13, front: null,
      participants: ['gb', 'fr'],
      summary: 'Großbritannien und Frankreich legen ihre Kolonialkonflikte bei und nähern sich politisch an.',
      significance: 'Die „herzliche Verständigung“ beendete die jahrhundertelange britisch-französische Rivalität und war die Vorstufe zur Triple Entente.',
      links: ['entente-triple']
    },
    {
      id: 'entente-triple', date: '1907-08-31', dateLabel: '31. August 1907',
      title: 'Britisch-russische Konvention – die Triple Entente', category: 'diplomacy', importance: 3,
      location: 'Sankt Petersburg', lat: 59.94, lon: 30.31, front: null,
      participants: ['gb', 'ru', 'fr'],
      summary: 'Großbritannien und Russland einigen sich über ihre Interessen in Persien, Afghanistan und Tibet. Zusammen mit den bestehenden Abkommen entsteht die Triple Entente.',
      significance: 'Europa war nun in zwei Blöcke geteilt. Jede Krise zwischen zwei Staaten konnte über die Bündnisverpflichtungen alle Großmächte hineinziehen.',
      links: ['bosnische-krise', 'julikrise-blankoscheck']
    },
    {
      id: 'bosnische-krise', date: '1908-10-06', dateLabel: '6. Oktober 1908',
      title: 'Bosnische Annexionskrise', category: 'political', importance: 3,
      location: 'Sarajevo / Wien', lat: 43.86, lon: 18.41, front: 'balkan',
      participants: ['at', 'rs', 'ru', 'tr'],
      summary: 'Österreich-Ungarn annektiert das seit 1878 verwaltete Bosnien und Herzegowina. Serbien und Russland protestieren, geben aber unter deutschem Druck nach.',
      significance: 'Die Krise vergiftete das Verhältnis zwischen Wien und Belgrad nachhaltig und stärkte in Serbien nationalistische Bewegungen wie „Vereinigung oder Tod“ (Schwarze Hand). Russland war entschlossen, ein zweites Nachgeben zu vermeiden – ein Grund für seine harte Haltung 1914.',
      links: ['balkankriege', 'sarajevo']
    },
    {
      id: 'balkankriege', date: '1912-10-08', dateLabel: 'Oktober 1912 – August 1913',
      endDate: '1913-08-10',
      title: 'Die Balkankriege', category: 'battle', importance: 3,
      location: 'Balkanhalbinsel', lat: 41.60, lon: 22.20, front: 'balkan',
      participants: ['rs', 'bg', 'gr', 'tr', 'at'],
      summary: 'Im Ersten Balkankrieg verdrängt der Balkanbund das Osmanische Reich fast vollständig aus Europa. Im Zweiten Balkankrieg 1913 kämpfen die Sieger gegeneinander; Bulgarien verliert.',
      significance: 'Serbien verdoppelte sein Staatsgebiet und galt Wien als Bedrohung für den Bestand der Donaumonarchie. Bulgarien suchte Revanche – deshalb trat es 1915 den Mittelmächten bei. Der Balkan war zum „Pulverfass Europas“ geworden.',
      links: ['sarajevo', 'bulgarien-eintritt']
    },
    {
      id: 'schlieffenplan-info', date: '1913-12-01', dateLabel: 'Vorkriegszeit',
      title: 'Der deutsche Aufmarschplan („Schlieffenplan“)', category: 'technology', importance: 3,
      location: 'Berlin, Großer Generalstab', lat: 52.52, lon: 13.40, front: null,
      participants: ['de', 'fr', 'ru', 'be'],
      summary: 'Der deutsche Generalstab plant für den Zweifrontenkrieg einen schnellen Schlag gegen Frankreich über das neutrale Belgien, bevor sich Russland vollständig mobilisieren kann.',
      significance: 'Der Plan machte aus jeder russischen Mobilmachung automatisch einen Angriff im Westen – und aus einer Balkankrise einen europäischen Krieg. Militärische Zeitpläne verdrängten 1914 die Diplomatie.',
      links: ['dt-kriegserklaerung-russland', 'einmarsch-belgien'],
      imageHint: 'Schematische Karte des Aufmarschplans (Wikimedia Commons)'
    },

    /* ---------- 1914 · DIE JULIKRISE ---------- */
    {
      id: 'sarajevo', date: '1914-06-28', dateLabel: '28. Juni 1914',
      title: 'Attentat von Sarajevo', category: 'political', importance: 5,
      location: 'Sarajevo, Bosnien-Herzegowina', lat: 43.86, lon: 18.41, front: 'balkan',
      participants: ['at', 'rs'],
      summary: 'Der österreichisch-ungarische Thronfolger Erzherzog Franz Ferdinand und seine Ehefrau Sophie werden in Sarajevo von dem bosnisch-serbischen Nationalisten Gavrilo Princip erschossen. Princip gehörte zur Gruppe „Junges Bosnien“, die von Mitgliedern des serbischen Geheimbunds „Schwarze Hand“ unterstützt wurde.',
      significance: 'Das Attentat löste eine diplomatische Krise aus, die sich durch das Bündnissystem und die militärischen Mobilmachungspläne innerhalb von fünf Wochen zum europäischen Krieg ausweitete. Es war der Auslöser, nicht die Ursache: Imperialismus, Rüstungswettlauf, Nationalismus und die Bündnisblöcke hatten Europa längst hochexplosiv gemacht.',
      casualties: '2 Todesopfer',
      links: ['julikrise-blankoscheck', 'ultimatum-serbien'],
      imageHint: 'Verhaftung Gavrilo Princips bzw. Franz Ferdinand in Sarajevo (Wikimedia Commons, gemeinfrei)'
    },
    {
      id: 'julikrise-blankoscheck', date: '1914-07-05', dateLabel: '5./6. Juli 1914',
      title: 'Der deutsche „Blankoscheck“', category: 'diplomacy', importance: 4,
      location: 'Potsdam / Berlin', lat: 52.40, lon: 13.06, front: null,
      participants: ['de', 'at'],
      summary: 'Kaiser Wilhelm II. und Reichskanzler Bethmann Hollweg sichern Österreich-Ungarn bedingungslose Unterstützung gegen Serbien zu – ohne die österreichischen Absichten zu begrenzen.',
      significance: 'Die uneingeschränkte Rückendeckung ermutigte Wien zu einem harten Kurs und ist bis heute ein zentraler Punkt der Debatte um die deutsche Kriegsschuld (Fritz Fischer). Ohne den „Blankoscheck“ hätte Österreich-Ungarn kaum das Risiko eines Krieges mit Russland auf sich genommen.',
      links: ['ultimatum-serbien']
    },
    {
      id: 'ultimatum-serbien', date: '1914-07-23', dateLabel: '23. Juli 1914',
      title: 'Österreichisches Ultimatum an Serbien', category: 'diplomacy', importance: 4,
      location: 'Belgrad', lat: 44.80, lon: 20.47, front: 'balkan',
      participants: ['at', 'rs'],
      summary: 'Österreich-Ungarn stellt Serbien ein auf 48 Stunden befristetes Ultimatum mit zehn Forderungen, darunter die Beteiligung österreichischer Beamter an den Ermittlungen auf serbischem Boden.',
      significance: 'Die Forderungen waren bewusst so formuliert, dass eine vollständige Annahme die serbische Souveränität verletzt hätte. Wien wollte einen Krieg, nicht eine Lösung – das Ultimatum war der Übergang von der Krise zum Krieg.',
      links: ['serbische-antwort']
    },
    {
      id: 'serbische-antwort', date: '1914-07-25', dateLabel: '25. Juli 1914',
      title: 'Serbische Antwortnote und Abbruch der Beziehungen', category: 'diplomacy', importance: 3,
      location: 'Belgrad / Wien', lat: 44.80, lon: 20.47, front: 'balkan',
      participants: ['at', 'rs', 'ru'],
      summary: 'Serbien nimmt fast alle Forderungen an, lehnt aber die Mitwirkung österreichischer Behörden an den Ermittlungen ab. Österreich-Ungarn erklärt die Antwort für ungenügend und bricht die diplomatischen Beziehungen ab; beide Staaten beginnen zu mobilisieren.',
      significance: 'Selbst Kaiser Wilhelm II. hielt die serbische Antwort für ausreichend („ein großer moralischer Erfolg für Wien … damit fällt jeder Kriegsgrund fort“). Dass der Krieg dennoch kam, zeigt, wie sehr die Entscheidungsträger ihn in Kauf nahmen.',
      links: ['kriegserklaerung-serbien']
    },
    {
      id: 'kriegserklaerung-serbien', date: '1914-07-28', dateLabel: '28. Juli 1914',
      title: 'Österreich-Ungarn erklärt Serbien den Krieg', category: 'political', importance: 5,
      location: 'Wien', lat: 48.21, lon: 16.37, front: 'balkan',
      participants: ['at', 'rs'],
      summary: 'Österreich-Ungarn erklärt Serbien den Krieg; am folgenden Tag wird Belgrad beschossen. Aus der Julikrise wird ein Schießkrieg.',
      significance: 'Der lokale Krieg auf dem Balkan setzte die Bündnisautomatik in Gang: Russland fühlte sich als Schutzmacht Serbiens verpflichtet, Deutschland stand an der Seite Wiens.',
      links: ['russische-mobilmachung']
    },
    {
      id: 'russische-mobilmachung', date: '1914-07-30', dateLabel: '30. Juli 1914',
      title: 'Russische Generalmobilmachung', category: 'political', importance: 4,
      location: 'Sankt Petersburg', lat: 59.94, lon: 30.31, front: 'east',
      participants: ['ru', 'de', 'at'],
      summary: 'Zar Nikolaus II. ordnet nach kurzem Zögern die allgemeine Mobilmachung an. Deutschland stellt daraufhin ein Ultimatum, das ergebnislos verstreicht.',
      significance: 'Weil die deutsche Kriegsplanung auf Geschwindigkeit beruhte, galt die russische Mobilmachung in Berlin als Kriegsbeginn. Militärische Fahrpläne bestimmten nun das Tempo der Politik.',
      links: ['dt-kriegserklaerung-russland']
    },
    {
      id: 'dt-kriegserklaerung-russland', date: '1914-08-01', dateLabel: '1. August 1914',
      title: 'Deutschland erklärt Russland den Krieg', category: 'political', importance: 5,
      location: 'Berlin / Sankt Petersburg', lat: 52.52, lon: 13.40, front: 'east',
      participants: ['de', 'ru'],
      summary: 'Das Deutsche Reich erklärt Russland den Krieg und ordnet die eigene Mobilmachung an. Frankreich mobilisiert am selben Tag.',
      significance: 'Mit der ersten Kriegserklärung zwischen Großmächten war der europäische Krieg da. Der Schlieffenplan sah vor, sofort im Westen anzugreifen – auch ohne französische Kriegshandlung.',
      links: ['dt-kriegserklaerung-frankreich', 'burgfrieden']
    },
    {
      id: 'dt-kriegserklaerung-frankreich', date: '1914-08-03', dateLabel: '3. August 1914',
      title: 'Deutschland erklärt Frankreich den Krieg', category: 'political', importance: 5,
      location: 'Paris / Berlin', lat: 48.86, lon: 2.35, front: 'west',
      participants: ['de', 'fr'],
      summary: 'Nach konstruierten Grenzzwischenfällen erklärt Deutschland auch Frankreich den Krieg. Der Aufmarsch im Westen läuft bereits.',
      significance: 'Die Westfront entstand aus einem Konflikt, der auf dem Balkan begonnen hatte. Deutschland führte nun tatsächlich den Zweifrontenkrieg, den seine Politik hatte vermeiden wollen.',
      links: ['einmarsch-belgien']
    },
    {
      id: 'einmarsch-belgien', date: '1914-08-04', dateLabel: '4. August 1914',
      title: 'Einmarsch in Belgien – Großbritannien tritt in den Krieg ein', category: 'political', importance: 5,
      location: 'Lüttich, Belgien', lat: 50.63, lon: 5.57, front: 'west',
      participants: ['de', 'be', 'gb', 'fr'],
      summary: 'Deutsche Truppen überschreiten die Grenze zum neutralen Belgien, um Frankreich im Norden zu umfassen. Großbritannien, Garantiemacht der belgischen Neutralität, erklärt Deutschland noch am selben Tag den Krieg. Reichskanzler Bethmann Hollweg nennt den Neutralitätsvertrag einen „Fetzen Papier“.',
      significance: 'Der Bruch der belgischen Neutralität machte aus dem Kontinentalkrieg einen Weltkrieg: Mit Großbritannien traten das Empire, seine Flotte und seine wirtschaftlichen Ressourcen ein. Zugleich kostete er Deutschland international massiv an Ansehen.',
      links: ['bewegungskrieg', 'japan-eintritt', 'seeblockade']
    },
    {
      id: 'burgfrieden', date: '1914-08-04', dateLabel: '4. August 1914',
      title: 'Burgfrieden und Kriegsbegeisterung', category: 'society', importance: 3,
      location: 'Berlin, Reichstag', lat: 52.52, lon: 13.38, front: null,
      participants: ['de'],
      summary: 'Der Reichstag bewilligt einstimmig – auch mit den Stimmen der SPD – die Kriegskredite. Wilhelm II.: „Ich kenne keine Parteien mehr, ich kenne nur noch Deutsche.“ In allen kriegführenden Ländern zeigen sich ähnliche Erscheinungen.',
      significance: 'Der innere Frieden sicherte die Kriegführung, zerbrach aber unter Hunger und Massensterben: 1917 spaltete sich die USPD ab, 1918 stand die Revolution. Die verbreitete „Kriegsbegeisterung“ war zudem vor allem ein städtisches Phänomen – die Forschung spricht heute eher von einer Mischung aus Aufbruch, Pflichtgefühl und Angst.',
      links: ['steckrueben-winter', 'januarstreik']
    },
    {
      id: 'japan-eintritt', date: '1914-08-23', dateLabel: '23. August 1914',
      title: 'Japan tritt in den Krieg ein', category: 'political', importance: 2,
      location: 'Tokio / Tsingtau', lat: 35.68, lon: 139.69, front: null,
      participants: ['jp', 'de', 'gb'],
      summary: 'Japan erklärt dem Deutschen Reich auf Grundlage des Bündnisses mit Großbritannien den Krieg und erobert bis November die deutsche Pachtkolonie Tsingtau sowie deutsche Inselbesitzungen im Pazifik.',
      significance: 'Der Krieg griff über Europa hinaus – er wurde zum Weltkrieg. Japans Gewinne in Ostasien verschoben das Machtgefüge im Pazifik dauerhaft.',
      links: []
    },

    /* ---------- 1914 · BEWEGUNGSKRIEG ---------- */
    {
      id: 'bewegungskrieg', date: '1914-08-12', dateLabel: 'August 1914',
      title: 'Beginn des Bewegungskrieges im Westen', category: 'battle', importance: 4,
      location: 'Belgien und Nordfrankreich', lat: 50.45, lon: 4.20, front: 'west',
      participants: ['de', 'fr', 'be', 'gb'],
      summary: 'Deutsche Armeen stoßen durch Belgien nach Nordfrankreich vor. In den „Grenzschlachten“ (20.–25. August) erleidet Frankreich schwerste Verluste; die deutschen Truppen rücken bis auf etwa 50 Kilometer an Paris heran.',
      significance: 'Beide Seiten erwarteten einen kurzen, entscheidenden Feldzug – „Weihnachten sind wir wieder zu Hause“. Der August 1914 war die letzte Phase des Krieges, die diesen Erwartungen ähnelte.',
      casualties: 'Allein im August 1914 rund 200 000 französische Verluste',
      links: ['marne-1', 'tannenberg']
    },
    {
      id: 'tannenberg', date: '1914-08-26', dateLabel: '26.–30. August 1914',
      endDate: '1914-08-30',
      title: 'Schlacht bei Tannenberg', category: 'battle', importance: 4,
      location: 'Ostpreußen (heute Stębark, Polen)', lat: 53.50, lon: 20.14, front: 'east',
      participants: ['de', 'ru'],
      summary: 'Die 8. deutsche Armee unter Hindenburg und Ludendorff (Operationsplanung: Max Hoffmann) schlägt die in Ostpreußen eingedrungene russische Njemen-Armee vernichtend. Vorgefechte begannen bereits am 23. August; Anfang September folgte der Sieg an den Masurischen Seen.',
      significance: 'Der Sieg beseitigte die russische Bedrohung Ostpreußens und machte Hindenburg und Ludendorff zu Nationalhelden – die Grundlage ihrer späteren, faktisch diktatorischen Macht in der 3. OHL. Der Name „Tannenberg“ wurde propagandistisch gewählt, als Revanche für die Niederlage des Deutschen Ordens 1410.',
      casualties: 'Russland: rund 50 000 Tote und Verwundete, etwa 92 000 Gefangene',
      links: ['ohl-dritte', 'gorlice-tarnow'],
      imageHint: 'Russische Kriegsgefangene nach Tannenberg (Bundesarchiv / Wikimedia Commons)'
    },
    {
      id: 'marne-1', date: '1914-09-05', dateLabel: '5.–12. September 1914',
      endDate: '1914-09-12',
      title: 'Erste Marneschlacht', category: 'battle', importance: 5,
      location: 'Marne, nordöstlich von Paris', lat: 48.90, lon: 3.40, front: 'west',
      participants: ['fr', 'gb', 'de'],
      summary: 'Französische und britische Truppen stoppen den deutschen Vormarsch an der Marne. Eine Lücke zwischen der 1. und 2. deutschen Armee zwingt die Oberste Heeresleitung zum Rückzug hinter die Aisne. Pariser Taxis bringen Reserven an die Front – das „Wunder an der Marne“.',
      significance: 'Der Schlieffenplan war gescheitert. Damit stand fest, was Deutschland unbedingt hatte vermeiden wollen: ein langer Zweifrontenkrieg gegen eine wirtschaftlich überlegene Koalition. Die Marneschlacht gilt als eine der folgenreichsten Schlachten der Geschichte.',
      casualties: 'Etwa 500 000 Verluste auf beiden Seiten zusammen',
      links: ['wettlauf-meer'],
      imageHint: 'Französische Truppen an der Marne 1914 (Wikimedia Commons)'
    },
    {
      id: 'wettlauf-meer', date: '1914-09-17', dateLabel: 'September – November 1914',
      endDate: '1914-11-18',
      title: 'Wettlauf zum Meer und Erste Flandernschlacht', category: 'battle', importance: 3,
      location: 'Nordfrankreich und Flandern', lat: 50.85, lon: 2.89, front: 'west',
      participants: ['de', 'fr', 'gb', 'be'],
      summary: 'Beide Seiten versuchen, die offene Nordflanke des Gegners zu umgehen. Der Wettlauf endet an der Nordsee; bei Ypern kommt es zu verlustreichen Kämpfen. In Deutschland entsteht daraus der „Mythos von Langemarck“, der die hohen Verluste junger Kriegsfreiwilliger heroisierend verklärte.',
      significance: 'Am Ende stand eine durchgehende Front von der Schweizer Grenze bis zur Nordsee – rund 700 Kilometer. Bewegung war nicht mehr möglich; der Stellungskrieg begann.',
      links: ['stellungskrieg']
    },
    {
      id: 'seeblockade', date: '1914-11-03', dateLabel: 'ab November 1914',
      title: 'Britische Seeblockade der Mittelmächte', category: 'technology', importance: 4,
      location: 'Nordsee', lat: 56.00, lon: 3.00, front: 'sea',
      participants: ['gb', 'de', 'at'],
      summary: 'Die Royal Navy erklärt die Nordsee zum Kriegsgebiet und riegelt die Seewege zu den Mittelmächten ab. Auch Lebensmittel und Düngemittel werden als Konterbande behandelt.',
      significance: 'Die Blockade war eine der wirksamsten Waffen des Krieges: Sie traf die Zivilbevölkerung und trug wesentlich zur Mangelernährung in Deutschland und Österreich-Ungarn bei. Sie war zugleich der Anlass für den deutschen U-Boot-Krieg – und damit indirekt für den Kriegseintritt der USA.',
      casualties: 'Schätzungen: mehrere hunderttausend zusätzliche Todesfälle in Deutschland durch Mangelernährung (Zahlen in der Forschung umstritten)',
      links: ['uboot-krieg-1915', 'steckrueben-winter']
    },
    {
      id: 'stellungskrieg', date: '1914-11-24', dateLabel: 'Ende 1914',
      title: 'Übergang zum Stellungskrieg', category: 'technology', importance: 5,
      location: 'Westfront, Schweizer Grenze bis Nordsee', lat: 49.80, lon: 3.60, front: 'west',
      participants: ['de', 'fr', 'gb', 'be'],
      summary: 'Die Fronten erstarren in Grabensystemen aus Schützengräben, Stacheldraht und Unterständen. Maschinengewehre und Schnellfeuerartillerie machen jeden Angriff im offenen Gelände zum Selbstmord.',
      significance: 'Der Krieg wurde zum Materialkrieg: Nicht mehr Feldherrnkunst, sondern industrielle Kapazität entschied. Für die Soldaten bedeutete das jahrelanges Ausharren in Dreck, Nässe und Dauerbeschuss – der prägende Erfahrungsraum des Ersten Weltkriegs.',
      links: ['weihnachtsfrieden', 'giftgas-ypern', 'verdun'],
      imageHint: 'Schützengraben an der Somme 1916 (Imperial War Museum / Wikimedia Commons)'
    },
    {
      id: 'weihnachtsfrieden', date: '1914-12-24', dateLabel: '24./25. Dezember 1914',
      title: 'Weihnachtsfrieden', category: 'society', importance: 3,
      location: 'Flandern, Abschnitte der Westfront', lat: 50.75, lon: 2.88, front: 'west',
      participants: ['de', 'gb', 'fr', 'be'],
      summary: 'An mehreren Frontabschnitten – vor allem zwischen deutschen und britischen Einheiten – ruhen die Waffen. Soldaten verlassen die Gräben, tauschen Zigaretten und Konserven, bergen Gefallene, mancherorts wird Fußball gespielt.',
      significance: 'Der Weihnachtsfrieden zeigt, dass der Hass zwischen den Soldaten geringer war, als die Propaganda behauptete. Beide Oberkommandos untersagten Wiederholungen streng – in späteren Kriegsjahren blieben solche Verbrüderungen Einzelfälle.',
      links: ['giftgas-ypern'],
      imageHint: 'Britische und deutsche Soldaten im Niemandsland, Dezember 1914 (Wikimedia Commons)'
    },

    /* ---------- 1915 ---------- */
    {
      id: 'uboot-krieg-1915', date: '1915-02-18', dateLabel: 'Februar 1915',
      title: 'Beginn des U-Boot-Handelskrieges', category: 'technology', importance: 4,
      location: 'Gewässer um Großbritannien', lat: 52.50, lon: -6.00, front: 'sea',
      participants: ['de', 'gb', 'us'],
      summary: 'Am 4. Februar erklärt Deutschland die Gewässer um Großbritannien und Irland zum Kriegsgebiet; ab dem 18. Februar werden Handelsschiffe ohne Vorwarnung versenkt. Als Reaktion auf den amerikanischen Protest wird der uneingeschränkte U-Boot-Krieg im September 1915 zunächst wieder eingeschränkt.',
      significance: 'Das U-Boot war die deutsche Antwort auf die britische Seeblockade. Der Verzicht auf die bis dahin geltenden Prisenregeln (Warnung und Rettung der Besatzung) galt international als Bruch des Seekriegsrechts und belastete das Verhältnis zu den neutralen USA schwer.',
      links: ['lusitania', 'uboot-uneingeschraenkt']
    },
    {
      id: 'giftgas-ypern', date: '1915-04-22', dateLabel: '22. April 1915',
      title: 'Zweite Flandernschlacht – erster Großeinsatz von Giftgas', category: 'technology', importance: 4,
      location: 'Ypern, Belgien', lat: 50.85, lon: 2.89, front: 'west',
      participants: ['de', 'fr', 'gb', 'be'],
      summary: 'Deutsche Truppen blasen bei Ypern rund 150 Tonnen Chlorgas aus 6 000 Stahlflaschen gegen französische und algerische Stellungen. Die Front bricht auf sechs Kilometern ein, doch der Durchbruch wird nicht ausgenutzt. Die Alliierten setzen ab September 1915 (Loos) ebenfalls Gas ein.',
      significance: 'Der Krieg erreichte eine neue Stufe der Entgrenzung: Chemische Waffen wurden zum festen Bestandteil der Kriegführung, obwohl die Haager Landkriegsordnung Giftwaffen verbot. Militärisch blieb Gas meist wirkungslos – die Gasmaske folgte binnen Monaten –, sein Schrecken prägte jedoch das Bild des Krieges dauerhaft.',
      casualties: 'Bis Kriegsende rund 90 000 Gastote und über eine Million Gasverletzte',
      links: ['verdun', 'somme'],
      imageHint: 'Britische Gasverwundete („Gassed“, John Singer Sargent) oder Gasangriff-Fotografie'
    },
    {
      id: 'armenien', date: '1915-04-24', dateLabel: 'ab 24. April 1915',
      title: 'Völkermord an den Armeniern', category: 'political', importance: 4,
      location: 'Osmanisches Reich, Anatolien', lat: 38.49, lon: 43.38, front: 'middleeast',
      participants: ['tr'],
      summary: 'Die jungtürkische Regierung lässt am 24. April in Konstantinopel Hunderte armenische Intellektuelle verhaften. Es folgen systematische Deportationen der armenischen Bevölkerung in die syrische Wüste, begleitet von Massakern, Hunger und Zwangsmärschen.',
      significance: 'Der Völkermord an den Armeniern gilt als erster Genozid des 20. Jahrhunderts. Das mit dem Osmanischen Reich verbündete Deutsche Reich war informiert und griff nicht ein. Die Aufarbeitung ist bis heute politisch umstritten; die Türkei bestreitet die Einordnung als Völkermord.',
      casualties: 'Schätzungen: 600 000 bis über 1,5 Millionen Todesopfer',
      links: []
    },
    {
      id: 'gallipoli', date: '1915-04-25', dateLabel: '25. April 1915',
      title: 'Landung bei Gallipoli', category: 'battle', importance: 4,
      location: 'Halbinsel Gallipoli, Dardanellen', lat: 40.22, lon: 26.40, front: 'middleeast',
      participants: ['gb', 'fr', 'tr'],
      summary: 'Nach dem Scheitern eines rein seegestützten Durchbruchsversuchs am 18. März landen britische, französische, australische und neuseeländische (ANZAC) Truppen auf der Halbinsel Gallipoli. Die osmanische Verteidigung unter Mustafa Kemal hält; die Front erstarrt wie im Westen.',
      significance: 'Die Operation sollte die Dardanellen öffnen, Konstantinopel bedrohen und Russland versorgen. Ihr Scheitern kostete Winston Churchill vorerst das Amt des Marineministers, stärkte Mustafa Kemal (Atatürk) – und der ANZAC Day ist bis heute Nationalfeiertag in Australien und Neuseeland.',
      casualties: 'Rund 500 000 Verluste auf beiden Seiten, etwa 100 000 Tote',
      links: ['gallipoli-ende']
    },
    {
      id: 'lusitania', date: '1915-05-07', dateLabel: '7. Mai 1915',
      title: 'Versenkung der Lusitania', category: 'technology', importance: 4,
      location: 'Vor der Südküste Irlands', lat: 51.42, lon: -8.53, front: 'sea',
      participants: ['de', 'gb', 'us'],
      summary: 'Das britische Passagierschiff „Lusitania“ wird von U 20 torpediert und sinkt innerhalb von 18 Minuten. Von 1 198 Toten sind 128 US-Amerikaner. Das Schiff hatte auch Munition geladen – ein bis heute diskutierter Punkt.',
      significance: 'Die Empörung in den USA war gewaltig. Präsident Wilson protestierte scharf; Deutschland schränkte den U-Boot-Krieg daraufhin ein. Der Vorfall verschob die amerikanische Öffentlichkeit dauerhaft gegen Deutschland und bereitete den Boden für den Kriegseintritt 1917.',
      casualties: '1 198 Tote, darunter 128 US-Bürger',
      links: ['usa-kriegseintritt', 'uboot-uneingeschraenkt'],
      imageHint: 'RMS Lusitania, Fotografie vor 1915 (gemeinfrei)'
    },
    {
      id: 'gorlice-tarnow', date: '1915-05-02', dateLabel: 'Mai – September 1915',
      endDate: '1915-09-30',
      title: 'Durchbruch bei Gorlice-Tarnów', category: 'battle', importance: 3,
      location: 'Galizien (heute Südpolen)', lat: 49.66, lon: 21.16, front: 'east',
      participants: ['de', 'at', 'ru'],
      summary: 'Eine deutsch-österreichische Offensive durchbricht die russische Front in Galizien. Bis zum Herbst räumt Russland Polen, Litauen und Kurland – der „Große Rückzug“.',
      significance: 'Der einzige echte Durchbruch des Jahres 1915 zeigte, dass Bewegungskrieg im Osten noch möglich war. Die Niederlagen und über eine Million Verluste erschütterten das Vertrauen in das Zarenregime – ein wichtiger Schritt zur Revolution von 1917.',
      casualties: 'Russland: über eine Million Tote, Verwundete und Gefangene',
      links: ['februarrevolution', 'brussilow']
    },
    {
      id: 'londoner-vertrag', date: '1915-04-26', dateLabel: '26. April 1915',
      title: 'Geheimer Londoner Vertrag', category: 'diplomacy', importance: 3,
      location: 'London', lat: 51.51, lon: -0.13, front: null,
      participants: ['it', 'gb', 'fr', 'ru'],
      summary: 'Italien sagt der Entente den Kriegseintritt zu und erhält dafür Gebietsversprechen: Südtirol, Triest, Istrien, Teile Dalmatiens und Einfluss in Albanien.',
      significance: 'Ein Musterbeispiel für die Geheimdiplomatie, gegen die sich später Wilsons 14 Punkte richteten. Weil nicht alle Zusagen eingelöst wurden, sprach man in Italien nach 1919 von der „verstümmelten Siegesbeute“ – ein Nährboden für den Faschismus.',
      links: ['italien-eintritt']
    },
    {
      id: 'italien-eintritt', date: '1915-05-23', dateLabel: '23. Mai 1915',
      title: 'Italien tritt auf Seiten der Entente in den Krieg ein', category: 'political', importance: 4,
      location: 'Rom', lat: 41.90, lon: 12.50, front: 'italy',
      participants: ['it', 'at', 'de'],
      summary: 'Italien erklärt Österreich-Ungarn den Krieg – trotz seiner Mitgliedschaft im Dreibund. Dem Deutschen Reich erklärt Italien erst im August 1916 den Krieg. An der Isonzo-Front folgen bis 1917 zwölf Schlachten.',
      significance: 'Für Österreich-Ungarn entstand eine dritte Front im Hochgebirge. Italiens Seitenwechsel zeigt, dass Bündnisse 1914/15 nicht Automatismen waren, sondern Interessenkalkül – der Dreibund verpflichtete nur im Verteidigungsfall.',
      casualties: 'Isonzo-Schlachten 1915–1917: über eine Million Verluste beider Seiten',
      links: ['isonzo', 'caporetto']
    },
    {
      id: 'isonzo', date: '1915-06-23', dateLabel: 'ab Juni 1915',
      title: 'Die Isonzoschlachten', category: 'battle', importance: 3,
      location: 'Isonzo-Tal (heute Soča, Slowenien/Italien)', lat: 45.94, lon: 13.62, front: 'italy',
      participants: ['it', 'at'],
      summary: 'Zwischen Juni 1915 und September 1917 greift Italien elfmal am Isonzo an, um nach Triest durchzubrechen. Die Gewinne betragen wenige Kilometer, gekämpft wird in Karst und Hochgebirge.',
      significance: 'Die Gebirgsfront zeigt den Stellungskrieg unter extremsten Bedingungen: Kälte, Lawinen und Felssplitter forderten zusätzlich zehntausende Opfer. Die Erschöpfung Italiens machte 1917 den Zusammenbruch bei Karfreit möglich.',
      links: ['caporetto']
    },
    {
      id: 'bulgarien-eintritt', date: '1915-10-14', dateLabel: '14. Oktober 1915',
      title: 'Bulgarien tritt den Mittelmächten bei', category: 'political', importance: 3,
      location: 'Sofia', lat: 42.70, lon: 23.32, front: 'balkan',
      participants: ['bg', 'de', 'at', 'rs'],
      summary: 'Nach einem Bündnisvertrag vom 6. September greift Bulgarien Serbien an. Serbien wird von drei Seiten überrannt; die Armee weicht im Winter unter schweren Verlusten über die albanischen Berge nach Korfu aus.',
      significance: 'Der Beitritt Bulgariens – motiviert durch die Niederlage im Zweiten Balkankrieg – öffnete die Landverbindung Berlin–Konstantinopel. Für die Entente entstand als Gegengewicht die Salonikifront, die 1918 zum Ausgangspunkt des Zusammenbruchs wurde.',
      links: ['salonikifront', 'bulgarien-waffenstillstand']
    },
    {
      id: 'salonikifront', date: '1915-10-05', dateLabel: 'ab Oktober 1915',
      title: 'Errichtung der Salonikifront', category: 'battle', importance: 2,
      location: 'Thessaloniki, Griechenland', lat: 40.64, lon: 22.94, front: 'balkan',
      participants: ['fr', 'gb', 'rs', 'gr', 'bg'],
      summary: 'Entente-Truppen landen im neutralen Griechenland bei Saloniki, um Serbien zu helfen. Es entsteht eine weitgehend statische Front, die deutsche Spötter den „größten Interniertenlager Europas“ nennen.',
      significance: 'Was jahrelang wirkungslos schien, wurde im September 1918 kriegsentscheidend: Der Durchbruch bei Dobro Pole zwang Bulgarien zum Waffenstillstand und ließ die Südflanke der Mittelmächte einstürzen.',
      links: ['bulgarien-waffenstillstand']
    },
    {
      id: 'gallipoli-ende', date: '1915-12-20', dateLabel: 'Dezember 1915 – Januar 1916',
      endDate: '1916-01-09',
      title: 'Scheitern der Gallipoli-Operation', category: 'battle', importance: 3,
      location: 'Halbinsel Gallipoli', lat: 40.22, lon: 26.40, front: 'middleeast',
      participants: ['gb', 'fr', 'tr'],
      summary: 'Die Entente räumt die Halbinsel. Die Evakuierung – der am besten gelungene Teil des ganzen Unternehmens – verläuft fast ohne Verluste.',
      significance: 'Russland blieb von seinen Verbündeten abgeschnitten; Versorgungsmangel und Rückschläge verschärften die innere Krise, die 1917 zur Revolution führte.',
      links: ['februarrevolution']
    }
  ];

  /* ---------- 1916 · DIE MATERIALSCHLACHTEN ---------- */
  EVENTS = EVENTS.concat([
    {
      id: 'verdun', date: '1916-02-21', dateLabel: '21. Februar – 18. Dezember 1916',
      endDate: '1916-12-18',
      title: 'Die Schlacht um Verdun', category: 'battle', importance: 5,
      location: 'Verdun, Lothringen', lat: 49.16, lon: 5.38, front: 'west',
      participants: ['de', 'fr'],
      summary: 'Der deutsche Generalstabschef Erich von Falkenhayn lässt die Festung Verdun angreifen, um die französische Armee „auszubluten“. Zehn Monate lang wird um Forts wie Douaumont und Vaux gekämpft, bei ständigem Trommelfeuer. Am Jahresende steht die Front fast wieder dort, wo sie im Februar begann. Für Frankreich wird Verdun unter Pétain zum Symbol des Durchhaltens („Ils ne passeront pas“).',
      significance: 'Verdun steht wie kein zweites Ereignis für die Sinnlosigkeit des Materialkriegs: enorme Verluste ohne strategischen Gewinn. Der Begriff „Blutmühle“ prägte das kollektive Gedächtnis in Deutschland und Frankreich – Verdun wurde später zum zentralen Ort der deutsch-französischen Aussöhnung (Mitterrand und Kohl 1984).',
      casualties: 'Rund 305 000 Tote und etwa 400 000 Verwundete auf beiden Seiten',
      links: ['somme', 'ohl-dritte', 'verdun-bilanz'],
      imageHint: 'Fort Douaumont oder die Trichterlandschaft von Verdun 1916 (Wikimedia Commons)'
    },
    {
      id: 'skagerrak', date: '1916-05-31', dateLabel: '31. Mai – 1. Juni 1916',
      endDate: '1916-06-01',
      title: 'Skagerrakschlacht (Battle of Jutland)', category: 'battle', importance: 4,
      location: 'Nordsee vor Jütland', lat: 56.90, lon: 5.90, front: 'sea',
      participants: ['de', 'gb'],
      summary: 'Die deutsche Hochseeflotte und die britische Grand Fleet liefern sich die größte Seeschlacht des Krieges. Die Briten verlieren mehr Schiffe und Menschen, behalten aber das Feld; die deutsche Flotte entkommt nachts in ihre Häfen.',
      significance: 'Taktisch ein deutscher Erfolg, strategisch ein britischer: Die Seeblockade blieb unangetastet, die Hochseeflotte lief bis 1918 kaum wieder aus. Genau deshalb setzte Deutschland ab 1917 alles auf die U-Boote – mit fatalen politischen Folgen.',
      casualties: 'Großbritannien: 14 Schiffe, rund 6 100 Tote · Deutschland: 11 Schiffe, rund 2 550 Tote',
      links: ['uboot-uneingeschraenkt'],
      imageHint: 'SMS Seydlitz nach der Skagerrakschlacht (Wikimedia Commons)'
    },
    {
      id: 'brussilow', date: '1916-06-04', dateLabel: 'Juni – September 1916',
      endDate: '1916-09-20',
      title: 'Brussilow-Offensive', category: 'battle', importance: 4,
      location: 'Galizien und Wolhynien', lat: 50.75, lon: 25.34, front: 'east',
      participants: ['ru', 'at', 'de'],
      summary: 'General Alexei Brussilow greift auf breiter Front überraschend und ohne langes Vorbereitungsfeuer an. Die österreichisch-ungarische Front bricht auf hunderten Kilometern zusammen; deutsche Verbände müssen sie stützen.',
      significance: 'Der größte russische Erfolg des Krieges: Er entlastete Verdun und Italien und bewog Rumänien zum Kriegseintritt. Zugleich war er die letzte Kraftanstrengung der Zarenarmee – die eigenen Verluste beschleunigten deren inneren Zerfall. Österreich-Ungarn war ab 1916 militärisch von Deutschland abhängig.',
      casualties: 'Österreich-Ungarn: rund 750 000 Verluste (davon etwa 380 000 Gefangene) · Russland: bis zu einer Million',
      links: ['rumaenien-eintritt', 'februarrevolution']
    },
    {
      id: 'somme', date: '1916-07-01', dateLabel: '1. Juli – 18. November 1916',
      endDate: '1916-11-18',
      title: 'Die Schlacht an der Somme', category: 'battle', importance: 5,
      location: 'Somme, Picardie', lat: 50.00, lon: 2.70, front: 'west',
      participants: ['gb', 'fr', 'de'],
      summary: 'Nach siebentägigem Dauerbeschuss stürmen britische und französische Truppen die deutschen Stellungen. Allein am ersten Tag verliert die britische Armee 57 470 Mann, darunter 19 240 Tote – der verlustreichste Tag ihrer Geschichte. Bis November wird der Frontverlauf um höchstens zehn Kilometer verschoben.',
      significance: 'Die Somme steht für die industrialisierte Massenvernichtung: Artillerie, Maschinengewehre und Nachschub entschieden, nicht Tapferkeit. Hier erlebte auch der erste Panzer seinen Einsatz. Für Großbritannien bedeutete die Schlacht das Ende der Freiwilligenarmee und den Übergang zur Wehrpflicht.',
      casualties: 'Rund 1 000 000 Verluste insgesamt (Briten ca. 420 000, Franzosen ca. 200 000, Deutsche ca. 400 000)',
      links: ['panzer-flers', 'verdun-bilanz'],
      imageHint: 'Britische Soldaten im Graben an der Somme, Juli 1916 (Imperial War Museum)'
    },
    {
      id: 'ohl-dritte', date: '1916-08-29', dateLabel: '29. August 1916',
      title: 'Hindenburg und Ludendorff übernehmen die Oberste Heeresleitung', category: 'political', importance: 3,
      location: 'Pleß, Oberschlesien', lat: 49.98, lon: 18.94, front: null,
      participants: ['de'],
      summary: 'Falkenhayn wird nach dem Scheitern von Verdun abgelöst. Hindenburg wird Chef des Generalstabs, Ludendorff Erster Generalquartiermeister. Es folgen das „Hindenburg-Programm“ zur Rüstungssteigerung und das Gesetz über den „vaterländischen Hilfsdienst“.',
      significance: 'Die 3. OHL regierte faktisch wie eine Militärdiktatur: Sie bestimmte Wirtschaft, Kriegsziele und ab 1917 auch die Reichskanzler. Kaiser und Reichstag wurden entmachtet – und 1918 lieferte dieselbe OHL mit der Dolchstoßlegende der jungen Republik eine tödliche Hypothek.',
      links: ['uboot-uneingeschraenkt', 'fruehjahrsoffensive', 'dolchstoss-hinweis']
    },
    {
      id: 'rumaenien-eintritt', date: '1916-08-27', dateLabel: '27. August 1916',
      title: 'Rumänien tritt in den Krieg ein', category: 'political', importance: 3,
      location: 'Bukarest', lat: 44.43, lon: 26.10, front: 'balkan',
      participants: ['ro', 'at', 'de', 'bg', 'tr'],
      summary: 'Rumänien erklärt Österreich-Ungarn den Krieg, um Siebenbürgen zu gewinnen. Innerhalb weniger Monate wird das Land von deutschen, österreichisch-ungarischen, bulgarischen und osmanischen Truppen überrannt; Bukarest fällt am 6. Dezember 1916.',
      significance: 'Für die Mittelmächte ein Gewinn: Rumäniens Getreide und Erdöl milderten die Folgen der Blockade und verlängerten ihre Durchhaltefähigkeit erheblich.',
      links: ['steckrueben-winter']
    },
    {
      id: 'panzer-flers', date: '1916-09-15', dateLabel: '15. September 1916',
      title: 'Erster Panzereinsatz bei Flers-Courcelette', category: 'technology', importance: 4,
      location: 'Flers, Somme', lat: 50.05, lon: 2.83, front: 'west',
      participants: ['gb', 'de'],
      summary: 'Großbritannien setzt an der Somme erstmals Panzer ein: Von 49 bereitgestellten Mark I erreichen nur etwa 32 die Ausgangsstellung, viele bleiben liegen. Der Schock beim Gegner ist dennoch groß.',
      significance: 'Der Panzer war die technische Antwort auf den Stellungskrieg – die Kombination aus Panzerung, Kette und Kanone konnte Drahtverhaue und Grabensysteme überwinden. Ausgereift wirkte er erst 1917/18; er wurde zur Grundlage der Kriegführung des 20. Jahrhunderts.',
      links: ['cambrai', 'amiens'],
      imageHint: 'Mark-I-Panzer an der Somme, September 1916 (Imperial War Museum)'
    },
    {
      id: 'steckrueben-winter', date: '1916-12-01', dateLabel: 'Winter 1916/17',
      title: 'Der „Steckrübenwinter“', category: 'society', importance: 3,
      location: 'Deutsches Reich', lat: 52.52, lon: 13.40, front: null,
      participants: ['de', 'at'],
      summary: 'Missernte, Arbeitskräftemangel und die britische Seeblockade führen zur Hungerkrise. Kartoffeln werden knapp, die Steckrübe zum Hauptnahrungsmittel. Die tägliche Ration sinkt zeitweise unter 1 000 Kalorien.',
      significance: 'Der Hunger an der Heimatfront zerstörte den „Burgfrieden“ von 1914. Streiks und Proteste nahmen zu, die Kriegsmüdigkeit wuchs – eine wesentliche Voraussetzung für die Revolution von 1918.',
      casualties: 'Schätzungen: einige hunderttausend zusätzliche zivile Todesfälle in Deutschland (Zahlen umstritten)',
      links: ['januarstreik', 'novemberrevolution']
    },
    {
      id: 'verdun-bilanz', date: '1916-12-18', dateLabel: 'Ende 1916',
      title: 'Bilanz eines Jahres der Materialschlachten', category: 'battle', importance: 4,
      location: 'Westfront', lat: 49.60, lon: 3.90, front: 'west',
      participants: ['de', 'fr', 'gb'],
      summary: 'Verdun und die Somme enden fast ohne Geländegewinn. Zusammen kosten sie über zwei Millionen Menschen Tod, Verwundung oder Gefangenschaft. Die deutsche Führung zieht sich Anfang 1917 in die ausgebaute „Siegfriedstellung“ zurück.',
      significance: '1916 machte deutlich, dass an der Westfront mit den vorhandenen Mitteln keine Entscheidung zu erzwingen war. Beide Seiten suchten die Lösung nun außerhalb des Schlachtfelds – Deutschland im U-Boot-Krieg, die Entente in der wirtschaftlichen Erschöpfung des Gegners und der Hoffnung auf die USA.',
      casualties: 'Verdun und Somme zusammen: über zwei Millionen Verluste',
      links: ['uboot-uneingeschraenkt', 'friedensfuehler']
    },
    {
      id: 'friedensfuehler', date: '1916-12-12', dateLabel: 'Dezember 1916',
      title: 'Erfolglose Friedensfühler', category: 'diplomacy', importance: 2,
      location: 'Berlin / Washington', lat: 52.52, lon: 13.40, front: null,
      participants: ['de', 'us', 'gb', 'fr'],
      summary: 'Die Mittelmächte bieten am 12. Dezember Verhandlungen an, ohne Bedingungen zu nennen. Kurz darauf fordert US-Präsident Wilson beide Seiten auf, ihre Kriegsziele zu benennen. Die Entente lehnt ab, da sie das Angebot als Propaganda einer Seite in militärisch günstiger Lage wertet.',
      significance: 'Alle Verständigungsversuche scheiterten an den weitgesteckten Kriegszielen beider Seiten. Nach dem Massensterben von 1916 schien ein Frieden ohne Sieg politisch nicht mehr vermittelbar – der Krieg musste bis zur Erschöpfung geführt werden.',
      links: ['vierzehn-punkte', 'friedensresolution']
    },

    /* ---------- 1917 · DAS JAHR DER WENDE ---------- */
    {
      id: 'zimmermann', date: '1917-01-16', dateLabel: '16. Januar 1917 (veröffentlicht 1. März)',
      title: 'Die Zimmermann-Depesche', category: 'diplomacy', importance: 4,
      location: 'Berlin – Mexiko-Stadt', lat: 19.43, lon: -99.13, front: null,
      participants: ['de', 'us'],
      summary: 'Staatssekretär Arthur Zimmermann bietet Mexiko im Falle eines amerikanischen Kriegseintritts ein Bündnis an – mit der Aussicht auf die Rückgewinnung von Texas, New Mexico und Arizona. Der britische Geheimdienst entschlüsselt das Telegramm und spielt es den USA zu; am 1. März wird es veröffentlicht.',
      significance: 'Die Depesche war ein diplomatisches Desaster. Sie machte aus einer abstrakten Bedrohung eine unmittelbare Gefahr für amerikanisches Territorium und kippte die Stimmung in der bis dahin gespaltenen US-Öffentlichkeit endgültig gegen Deutschland.',
      links: ['usa-kriegseintritt'],
      imageHint: 'Faksimile der entschlüsselten Zimmermann-Depesche (US National Archives, gemeinfrei)'
    },
    {
      id: 'uboot-uneingeschraenkt', date: '1917-02-01', dateLabel: '1. Februar 1917',
      title: 'Uneingeschränkter U-Boot-Krieg', category: 'technology', importance: 5,
      location: 'Atlantik und Nordsee', lat: 50.50, lon: -8.00, front: 'sea',
      participants: ['de', 'gb', 'us'],
      summary: 'Auf Drängen der OHL und der Marineführung nimmt Deutschland am 1. Februar den uneingeschränkten U-Boot-Krieg wieder auf: Jedes Schiff im Sperrgebiet wird ohne Warnung angegriffen. Die Rechnung lautet, Großbritannien binnen fünf Monaten zum Frieden zu zwingen. Die USA brechen am 3. Februar die diplomatischen Beziehungen ab.',
      significance: 'Die riskanteste Entscheidung des Krieges. Die Tonnage-Verluste waren tatsächlich dramatisch – bis die Alliierten ab Mai 1917 das Geleitzugsystem einführten. Militärisch scheiterte das Kalkül, politisch führte es direkt zum Kriegseintritt der USA und damit zur Niederlage.',
      casualties: '1917 versenkte Handelsschiffe: über 6 Millionen Bruttoregistertonnen',
      links: ['usa-kriegseintritt']
    },
    {
      id: 'februarrevolution', date: '1917-03-08', dateLabel: '8.–15. März 1917 (jul. 23. Februar – 2. März)',
      endDate: '1917-03-15',
      title: 'Russische Februarrevolution', category: 'revolution', importance: 5,
      location: 'Petrograd', lat: 59.94, lon: 30.31, front: 'east',
      participants: ['ru'],
      summary: 'Brotproteste und Streiks in Petrograd weiten sich aus, die Soldaten der Garnison verweigern das Schießen und schließen sich an. Am 15. März dankt Zar Nikolaus II. ab. Es entsteht eine Doppelherrschaft aus Provisorischer Regierung und Arbeiter- und Soldatenräten (Sowjets).',
      significance: 'Der Krieg stürzte die erste der großen Monarchien. Die Provisorische Regierung setzte den Krieg fort – ein Fehler, der die Bolschewiki mit der Losung „Frieden, Land, Brot“ stark machte. Die deutsche Führung ließ Lenin im April in einem plombierten Waggon nach Russland reisen, um den Gegner weiter zu destabilisieren.',
      links: ['oktoberrevolution'],
      imageHint: 'Demonstration in Petrograd, März 1917 (Wikimedia Commons)'
    },
    {
      id: 'usa-kriegseintritt', date: '1917-04-06', dateLabel: '6. April 1917',
      title: 'Die USA treten in den Krieg ein', category: 'political', importance: 5,
      location: 'Washington, D. C.', lat: 38.90, lon: -77.04, front: null,
      participants: ['us', 'de'],
      summary: 'Der Kongress folgt dem Antrag Präsident Woodrow Wilsons und erklärt dem Deutschen Reich den Krieg – begründet mit dem uneingeschränkten U-Boot-Krieg und der Zimmermann-Depesche. Wilson erklärt, die Welt müsse „sicher für die Demokratie“ gemacht werden. Ab Sommer 1918 landen monatlich rund 250 000 US-Soldaten in Frankreich.',
      significance: 'Der Kriegseintritt der wirtschaftlich stärksten Macht der Welt entschied den Krieg langfristig: Menschen, Material und Kredite standen nun unbegrenzt auf Seiten der Entente. Zugleich rückten mit Wilsons Programm neue Ordnungsvorstellungen – Selbstbestimmung, Völkerbund – in den Vordergrund.',
      links: ['vierzehn-punkte', 'fruehjahrsoffensive', 'marne-2']
    },
    {
      id: 'nivelle', date: '1917-04-16', dateLabel: 'April – Mai 1917',
      endDate: '1917-05-09',
      title: 'Nivelle-Offensive und Meutereien der französischen Armee', category: 'battle', importance: 3,
      location: 'Chemin des Dames, Aisne', lat: 49.44, lon: 3.62, front: 'west',
      participants: ['fr', 'de'],
      summary: 'General Robert Nivelle verspricht den Durchbruch binnen 48 Stunden. Die Offensive am Chemin des Dames scheitert unter enormen Verlusten. In der Folge verweigern in rund zwei Dritteln der französischen Divisionen Einheiten den Gehorsam; Pétain löst Nivelle ab, verbessert die Versorgung – und lässt zugleich Todesurteile vollstrecken.',
      significance: 'Die Meutereien zeigen, dass auch Armeen an eine Grenze der Belastbarkeit stoßen. Frankreich ging bis 1918 in die Defensive – umso wichtiger wurden die britischen Offensiven und die amerikanische Verstärkung.',
      casualties: 'Frankreich: rund 187 000 Verluste in wenigen Wochen',
      links: ['passchendaele']
    },
    {
      id: 'friedensresolution', date: '1917-07-19', dateLabel: '19. Juli 1917',
      title: 'Friedensresolution des Reichstags', category: 'diplomacy', importance: 2,
      location: 'Berlin, Reichstag', lat: 52.52, lon: 13.38, front: null,
      participants: ['de'],
      summary: 'Eine Mehrheit aus SPD, Zentrum und Fortschrittspartei fordert einen „Frieden der Verständigung und der dauernden Völkerversöhnung“ ohne Annexionen. Die OHL ignoriert die Resolution; der Reichstag hat keine Mittel, sie durchzusetzen.',
      significance: 'Der Bruch mit dem Burgfrieden von 1914 wurde sichtbar – aber auch die Machtlosigkeit des Parlaments gegenüber der Militärführung. Dieselbe Mehrheit trug 1919 die Weimarer Republik.',
      links: ['max-von-baden']
    },
    {
      id: 'passchendaele', date: '1917-07-31', dateLabel: '31. Juli – 10. November 1917',
      endDate: '1917-11-10',
      title: 'Dritte Flandernschlacht (Passchendaele)', category: 'battle', importance: 3,
      location: 'Passendale bei Ypern', lat: 50.90, lon: 3.02, front: 'west',
      participants: ['gb', 'de', 'fr'],
      summary: 'Die britische Offensive in Flandern versinkt buchstäblich: Dauerregen und zerstörte Entwässerung verwandeln das Gelände in eine Schlammwüste, in der Verwundete und Pferde ertrinken. Der Geländegewinn beträgt rund acht Kilometer.',
      significance: 'Passchendaele wurde zum Sinnbild für Durchhaltebefehle ohne erkennbares Ziel und prägte in Großbritannien nachhaltig das Bild des Ersten Weltkriegs als sinnlosen Schlachtens.',
      casualties: 'Etwa 500 000 Verluste auf beiden Seiten zusammen',
      links: ['cambrai']
    },
    {
      id: 'caporetto', date: '1917-10-24', dateLabel: '24. Oktober – 19. November 1917',
      endDate: '1917-11-19',
      title: 'Schlacht von Karfreit (Caporetto)', category: 'battle', importance: 3,
      location: 'Kobarid, heute Slowenien', lat: 46.25, lon: 13.55, front: 'italy',
      participants: ['at', 'de', 'it'],
      summary: 'Deutsche und österreichisch-ungarische Truppen durchbrechen mit neuer Sturmtruppentaktik und Gaseinsatz die italienische Front. Die italienische Armee weicht rund 100 Kilometer bis an den Piave zurück, wo sie sich mit alliierter Hilfe hält.',
      significance: 'Die erfolgreichste Anwendung der neuen Infiltrationstaktik vor 1918 – sie zeigte, dass der Stellungskrieg operativ überwindbar war. Für Italien war „Caporetto“ ein nationales Trauma; die Niederlage einte das Land jedoch zur Verteidigung am Piave.',
      casualties: 'Italien: rund 300 000 Verluste, davon etwa 265 000 Gefangene',
      links: ['fruehjahrsoffensive']
    },
    {
      id: 'oktoberrevolution', date: '1917-11-07', dateLabel: '7. November 1917 (jul. 25. Oktober)',
      title: 'Russische Oktoberrevolution', category: 'revolution', importance: 5,
      location: 'Petrograd', lat: 59.94, lon: 30.31, front: 'east',
      participants: ['ru', 'de'],
      summary: 'Die Bolschewiki unter Lenin und Trotzki stürzen die Provisorische Regierung Kerenskis und übernehmen die Macht. Eines ihrer ersten Dekrete ist das „Dekret über den Frieden“, das sofortige Waffenstillstandsverhandlungen fordert.',
      significance: 'Die Oktoberrevolution nahm Russland aus dem Krieg und schuf den ersten kommunistischen Staat – eine Weichenstellung, die das gesamte 20. Jahrhundert prägte. Für Deutschland bedeutete sie kurzfristig die Befreiung von der Zweifrontenlage.',
      links: ['waffenstillstand-ost', 'brest-litowsk'],
      imageHint: 'Rotgardisten in Petrograd 1917 (Wikimedia Commons)'
    },
    {
      id: 'cambrai', date: '1917-11-20', dateLabel: '20. November – 7. Dezember 1917',
      endDate: '1917-12-07',
      title: 'Schlacht von Cambrai – Panzer im Massen­einsatz', category: 'technology', importance: 3,
      location: 'Cambrai, Nordfrankreich', lat: 50.18, lon: 3.24, front: 'west',
      participants: ['gb', 'de'],
      summary: 'Großbritannien setzt 476 Panzer ohne vorheriges Artilleriefeuer geschlossen ein und durchbricht die Siegfriedstellung auf mehreren Kilometern. Fehlende Reserven und ein deutscher Gegenangriff mit Sturmtruppen machen den Erfolg weitgehend zunichte.',
      significance: 'Cambrai bewies, dass die Verbindung von Panzern, Artillerie und Flugzeugen den Stellungskrieg aufbrechen konnte. Diese Kombination entschied 1918 die letzte Kriegsphase und wurde zum Vorbild moderner Operationsführung.',
      links: ['amiens']
    },
    {
      id: 'waffenstillstand-ost', date: '1917-12-15', dateLabel: '15. Dezember 1917',
      title: 'Waffenstillstand zwischen Russland und den Mittelmächten', category: 'end', importance: 4,
      location: 'Brest-Litowsk', lat: 52.10, lon: 23.68, front: 'east',
      participants: ['ru', 'de', 'at', 'tr', 'bg'],
      summary: 'In Brest-Litowsk schweigen die Waffen an der Ostfront. Es beginnen Friedensverhandlungen, die sich wegen der weitreichenden deutschen Forderungen bis März 1918 hinziehen.',
      significance: 'Zum ersten Mal seit 1914 stand Deutschland nicht mehr im Zweifrontenkrieg. Rund eine Million Soldaten konnten nach Westen verlegt werden – die Voraussetzung für die Frühjahrsoffensive 1918.',
      links: ['brest-litowsk']
    },

    /* ---------- 1918 · ENTSCHEIDUNG UND ZUSAMMENBRUCH ---------- */
    {
      id: 'vierzehn-punkte', date: '1918-01-08', dateLabel: '8. Januar 1918',
      title: 'Wilsons 14 Punkte', category: 'diplomacy', importance: 4,
      location: 'Washington, D. C.', lat: 38.90, lon: -77.04, front: null,
      participants: ['us', 'de', 'gb', 'fr'],
      summary: 'Präsident Wilson legt dem Kongress ein Friedensprogramm vor: offene Diplomatie statt Geheimverträge, Freiheit der Meere, Abrüstung, Selbstbestimmungsrecht der Völker, Wiederherstellung Belgiens, Rückgabe Elsass-Lothringens und ein Völkerbund.',
      significance: 'Die 14 Punkte gaben dem Krieg ein politisches Ziel und wirkten als Angebot an die Gegner. Deutschland ersuchte im Oktober 1918 auf ihrer Grundlage um Waffenstillstand. Dass der Versailler Vertrag hinter ihnen zurückblieb, empfanden viele Deutsche als Betrug – ein zentrales Motiv der Nachkriegspolitik.',
      links: ['waffenstillstands-ersuchen', 'versailles']
    },
    {
      id: 'januarstreik', date: '1918-01-28', dateLabel: '28. Januar – 3. Februar 1918',
      endDate: '1918-02-03',
      title: 'Januarstreik in Deutschland', category: 'society', importance: 2,
      location: 'Berlin und andere Industriestädte', lat: 52.52, lon: 13.40, front: null,
      participants: ['de'],
      summary: 'Über eine Million Rüstungsarbeiterinnen und -arbeiter treten in den Ausstand und fordern Frieden ohne Annexionen, mehr Lebensmittel und Wahlrechtsreformen. Der Streik wird mit Militärrecht und Einberufungen gebrochen.',
      significance: 'Der Januarstreik machte sichtbar, wie tief die Kriegsmüdigkeit reichte. Zugleich lieferte er später den Stoff für die Dolchstoßlegende, obwohl die militärische Niederlage an der Front entschieden wurde.',
      links: ['novemberrevolution']
    },
    {
      id: 'brest-litowsk', date: '1918-03-03', dateLabel: '3. März 1918',
      title: 'Frieden von Brest-Litowsk', category: 'diplomacy', importance: 5,
      location: 'Brest-Litowsk', lat: 52.10, lon: 23.68, front: 'east',
      participants: ['ru', 'de', 'at', 'tr', 'bg'],
      summary: 'Sowjetrussland unterzeichnet unter militärischem Druck einen Diktatfrieden: Es verliert Polen, das Baltikum, Finnland und die Ukraine – rund ein Viertel seiner Bevölkerung, ein Viertel der Industrie und drei Viertel der Kohle- und Eisenförderung.',
      significance: 'Brest-Litowsk zeigt, wie ein deutscher Siegfrieden ausgesehen hätte – ein wichtiges Gegenargument zur späteren Behauptung, Versailles sei beispiellos hart gewesen. Der Vertrag wurde mit dem Waffenstillstand vom November 1918 hinfällig.',
      links: ['fruehjahrsoffensive']
    },
    {
      id: 'fruehjahrsoffensive', date: '1918-03-21', dateLabel: '21. März – 18. Juli 1918',
      endDate: '1918-07-18',
      title: 'Deutsche Frühjahrsoffensive („Michael“)', category: 'battle', importance: 5,
      location: 'Somme / Picardie', lat: 49.95, lon: 2.95, front: 'west',
      participants: ['de', 'gb', 'fr', 'us'],
      summary: 'Ludendorff setzt alles auf eine Karte: Mit den vom Osten verlegten Divisionen und neuer Sturmtruppentaktik durchbrechen deutsche Truppen die britische Front. In fünf Offensiven wird bis an die Marne vorgestoßen – der größte Geländegewinn im Westen seit 1914. Doch die Front wird länger, der Nachschub bleibt zurück, die Verluste sind bei den besten Verbänden am höchsten.',
      significance: 'Die letzte deutsche Chance auf einen Sieg, bevor die amerikanischen Truppen voll wirksam wurden. Ihr Scheitern kostete die deutsche Armee ihre besten Einheiten und ihre Angriffskraft – danach war sie nur noch zur Verteidigung fähig.',
      casualties: 'Deutschland: rund 680 000 Verluste · Alliierte: etwa 850 000',
      links: ['marne-2']
    },
    {
      id: 'marne-2', date: '1918-07-15', dateLabel: '15. Juli – 6. August 1918',
      endDate: '1918-08-06',
      title: 'Zweite Marneschlacht', category: 'battle', importance: 4,
      location: 'Marne, Champagne', lat: 49.05, lon: 3.75, front: 'west',
      participants: ['fr', 'us', 'gb', 'de'],
      summary: 'Der letzte deutsche Angriff bleibt in einer tief gestaffelten Verteidigung stecken. Am 18. Juli führen Franzosen und Amerikaner mit Panzern einen Gegenangriff, der die deutsche Front zurückwirft. Erstmals kämpfen US-Divisionen in großer Zahl.',
      significance: 'Der Wendepunkt an der Westfront: Die Initiative ging endgültig an die Alliierten über und blieb bis zum Kriegsende bei ihnen.',
      links: ['amiens']
    },
    {
      id: 'amiens', date: '1918-08-08', dateLabel: '8. August 1918',
      title: 'Schlacht bei Amiens – Beginn der Hunderttageoffensive', category: 'battle', importance: 5,
      location: 'Amiens, Picardie', lat: 49.89, lon: 2.30, front: 'west',
      participants: ['gb', 'fr', 'us', 'de'],
      summary: 'Über 500 Panzer, präzise Artillerie ohne Vorbereitungsfeuer und Luftunterstützung durchbrechen die deutsche Front; ganze Verbände ergeben sich. Ludendorff nennt den Tag den „schwarzen Tag des deutschen Heeres“. Es folgt die Hunderttageoffensive, die bis zum 11. November alle deutschen Stellungen aufrollt.',
      significance: 'Amiens zeigte, dass die deutsche Armee nicht nur geschlagen, sondern moralisch erschöpft war. Die Alliierten hatten mit dem Zusammenwirken aller Waffengattungen die Antwort auf den Stellungskrieg gefunden.',
      casualties: 'Deutschland: rund 30 000 Gefangene allein am 8. August',
      links: ['waffenstillstands-ersuchen', 'bulgarien-waffenstillstand']
    },
    {
      id: 'bulgarien-waffenstillstand', date: '1918-09-29', dateLabel: '29. September 1918',
      title: 'Zusammenbruch der Südfront – Bulgarien kapituliert', category: 'end', importance: 4,
      location: 'Saloniki / Dobro Pole', lat: 41.20, lon: 21.90, front: 'balkan',
      participants: ['bg', 'fr', 'gb', 'rs', 'gr'],
      summary: 'Nach dem alliierten Durchbruch bei Dobro Pole schließt Bulgarien als erste Mittelmacht einen Waffenstillstand. Die Verbindung nach Konstantinopel ist unterbrochen, Österreich-Ungarn im Süden offen.',
      significance: 'Der Einsturz der Südflanke war der unmittelbare Auslöser dafür, dass die OHL noch am selben Tag den sofortigen Waffenstillstand forderte. Der Zusammenbruch der Mittelmächte begann nicht in Frankreich, sondern auf dem Balkan.',
      links: ['waffenstillstands-ersuchen', 'mudros']
    },
    {
      id: 'waffenstillstands-ersuchen', date: '1918-09-29', dateLabel: '29. September 1918',
      title: 'Die OHL fordert den sofortigen Waffenstillstand', category: 'political', importance: 4,
      location: 'Spa, Belgien', lat: 50.49, lon: 5.87, front: null,
      participants: ['de', 'us'],
      summary: 'Ludendorff und Hindenburg erklären der Reichsleitung, die Front sei nicht mehr zu halten, und verlangen ein sofortiges Waffenstillstandsangebot an Wilson. Zugleich fordern sie die Bildung einer parlamentarischen Regierung – die „Revolution von oben“.',
      significance: 'Die militärische Führung schob die Verantwortung für die Niederlage bewusst den zivilen Parteien zu. Genau daraus entstand die Dolchstoßlegende, die die Weimarer Republik von Beginn an belastete.',
      links: ['max-von-baden', 'dolchstoss-hinweis']
    },
    {
      id: 'max-von-baden', date: '1918-10-03', dateLabel: '3. Oktober 1918',
      title: 'Regierung Max von Baden und Oktoberreformen', category: 'political', importance: 3,
      location: 'Berlin', lat: 52.52, lon: 13.40, front: null,
      participants: ['de', 'us'],
      summary: 'Prinz Max von Baden wird Reichskanzler und bittet Wilson um Waffenstillstand auf Grundlage der 14 Punkte. Die Oktoberreformen machen das Deutsche Reich am 28. Oktober zur parlamentarischen Monarchie: Der Kanzler ist nun dem Reichstag verantwortlich.',
      significance: 'Die Reform kam zu spät, um die Monarchie zu retten. Wilson forderte in seinen Noten unmissverständlich das Ende der militärischen Willkürherrschaft – die Abdankung des Kaisers wurde zur Bedingung für den Frieden.',
      links: ['matrosenaufstand', 'novemberrevolution']
    },
    {
      id: 'spanische-grippe', date: '1918-10-01', dateLabel: '1918/19',
      title: 'Die Spanische Grippe', category: 'society', importance: 3,
      location: 'Weltweit', lat: 46.00, lon: 8.00, front: null,
      participants: [],
      summary: 'Eine Influenza-Pandemie erfasst in mehreren Wellen die Welt; die tödlichste trifft im Herbst 1918 auf erschöpfte Armeen und unterernährte Bevölkerungen. Die Kriegszensur verschweigt die Ausbreitung – nur im neutralen Spanien wird offen berichtet, daher der irreführende Name.',
      significance: 'Die Pandemie forderte weltweit mehr Todesopfer als die Kampfhandlungen des Krieges. Truppentransporte und Massenunterkünfte beschleunigten die Verbreitung; sie schwächte alle Armeen im entscheidenden Kriegsjahr.',
      casualties: 'Schätzungen: 25 bis 50 Millionen Tote weltweit (Spannbreite in der Forschung sehr groß)',
      links: []
    },
    {
      id: 'mudros', date: '1918-10-30', dateLabel: '30. Oktober 1918',
      title: 'Waffenstillstand von Mudros', category: 'end', importance: 3,
      location: 'Hafen von Mudros, Lemnos', lat: 39.88, lon: 25.25, front: 'middleeast',
      participants: ['tr', 'gb', 'fr'],
      summary: 'Das Osmanische Reich schließt einen Waffenstillstand und öffnet die Meerengen. Britische und französische Truppen besetzen kurz darauf Konstantinopel.',
      significance: 'Das Ende des osmanischen Vielvölkerreichs. Aus seiner Aufteilung entstand die staatliche Ordnung des Nahen Ostens – mit Grenzen und Konflikten, die bis heute nachwirken.',
      links: ['compiegne']
    },
    {
      id: 'matrosenaufstand', date: '1918-11-03', dateLabel: '29. Oktober – 4. November 1918',
      title: 'Matrosenaufstand in Wilhelmshaven und Kiel', category: 'revolution', importance: 4,
      location: 'Kiel und Wilhelmshaven', lat: 54.32, lon: 10.14, front: null,
      participants: ['de'],
      summary: 'Die Seekriegsleitung plant Ende Oktober eine letzte Ausfahrt der Hochseeflotte gegen die Royal Navy. Die Matrosen verweigern den Befehl zur aussichtslosen „Ehrenschlacht“; Verhaftungen lösen in Kiel einen Aufstand aus. Am 4. November kontrollieren Arbeiter- und Soldatenräte die Stadt, die Bewegung erfasst binnen Tagen das ganze Reich.',
      significance: 'Der Funke der Novemberrevolution. Der Aufstand richtete sich nicht gegen den Frieden, sondern gegen einen sinnlosen Opfergang – und er beendete faktisch die Monarchie in Deutschland.',
      links: ['novemberrevolution'],
      imageHint: 'Revolutionäre Matrosen in Kiel, November 1918 (Wikimedia Commons)'
    },
    {
      id: 'villa-giusti', date: '1918-11-03', dateLabel: '3. November 1918',
      title: 'Waffenstillstand von Villa Giusti – Zerfall Österreich-Ungarns', category: 'end', importance: 3,
      location: 'Padua, Italien', lat: 45.39, lon: 11.85, front: 'italy',
      participants: ['at', 'it'],
      summary: 'Nach der Niederlage bei Vittorio Veneto unterzeichnet Österreich-Ungarn einen Waffenstillstand (wirksam am 4. November). Zu diesem Zeitpunkt haben sich Tschechen, Südslawen, Polen und Ungarn bereits für unabhängig erklärt – der Vielvölkerstaat existiert nicht mehr.',
      significance: 'Aus der Habsburgermonarchie entstanden eine Reihe neuer Nationalstaaten. Die Grenzziehungen ließen jedoch überall Minderheiten zurück und schufen Konfliktstoff für die Zwischenkriegszeit.',
      links: ['compiegne']
    },
    {
      id: 'novemberrevolution', date: '1918-11-09', dateLabel: '9. November 1918',
      title: 'Abdankung Wilhelms II. – Ausrufung der Republik', category: 'revolution', importance: 5,
      location: 'Berlin', lat: 52.52, lon: 13.38, front: null,
      participants: ['de'],
      summary: 'Reichskanzler Max von Baden verkündet eigenmächtig die Abdankung des Kaisers und übergibt das Amt an Friedrich Ebert (SPD). Philipp Scheidemann ruft vom Reichstag die deutsche Republik aus, wenige Stunden später Karl Liebknecht vom Berliner Schloss eine „freie sozialistische Republik“. Wilhelm II. geht in die Niederlande ins Exil; seine förmliche Abdankungsurkunde unterzeichnet er erst am 28. November.',
      significance: 'Das Ende der Monarchie in Deutschland und der Beginn der ersten deutschen Demokratie. Die konkurrierenden Ausrufungen zeigen die Spaltung der Arbeiterbewegung, die die Weimarer Republik von Anfang an schwächte.',
      links: ['compiegne', 'dolchstoss-hinweis'],
      imageHint: 'Scheidemann bei der Ausrufung der Republik, 9. November 1918 (Wikimedia Commons)'
    },
    {
      id: 'compiegne', date: '1918-11-11', dateLabel: '11. November 1918',
      title: 'Waffenstillstand von Compiègne', category: 'end', importance: 5,
      location: 'Wald von Compiègne, Rethondes', lat: 49.42, lon: 2.90, front: 'west',
      participants: ['de', 'fr', 'gb', 'us'],
      summary: 'In einem Eisenbahnwaggon im Wald von Compiègne unterzeichnet die deutsche Delegation unter Matthias Erzberger um 5:12 Uhr den Waffenstillstand. Um 11 Uhr schweigen an der Westfront die Waffen. Bedingungen sind unter anderem die Räumung aller besetzten Gebiete und des linken Rheinufers, die Auslieferung schwerer Waffen und der Flotte sowie die Aufhebung von Brest-Litowsk.',
      significance: 'Nach 1 568 Tagen – gerechnet von der österreichisch-ungarischen Kriegserklärung am 28. Juli 1914 an – endete der Krieg. Weil deutsche Truppen noch auf fremdem Boden standen und das Reich nie besetzt wurde, konnte die Legende entstehen, das Heer sei „im Felde unbesiegt“ geblieben. Der Waffenstillstand war kein Frieden – der folgte erst mit den Pariser Vorortverträgen.',
      casualties: 'Bilanz des Krieges: rund 9 bis 10 Millionen gefallene Soldaten und etwa 6 bis 7 Millionen zivile Opfer',
      links: ['versailles'],
      imageHint: 'Der Waggon von Compiègne, November 1918 (Wikimedia Commons)'
    },

    /* ---------- NACHGESCHICHTE ---------- */
    {
      id: 'dolchstoss-hinweis', date: '1918-11-18', dateLabel: 'ab November 1918',
      title: 'Die Dolchstoßlegende entsteht', category: 'political', importance: 3,
      location: 'Deutsches Reich', lat: 52.52, lon: 13.40, front: null,
      participants: ['de'],
      summary: 'Führende Militärs, allen voran Hindenburg und Ludendorff, verbreiten die Behauptung, das „im Felde unbesiegte“ Heer sei von Revolutionären, Sozialdemokraten und Juden „von hinten erdolcht“ worden. Historisch ist das falsch: Die OHL selbst hatte am 29. September 1918 den Waffenstillstand gefordert.',
      significance: 'Die Legende entlastete die militärischen und politischen Eliten und diskreditierte die Demokratie als Werk von „Novemberverbrechern“. Sie wurde zu einem der wirksamsten Propagandainstrumente der extremen Rechten und der NSDAP.',
      links: ['versailles']
    },
    {
      id: 'versailles', date: '1919-06-28', dateLabel: '28. Juni 1919',
      title: 'Der Versailler Vertrag', category: 'diplomacy', importance: 5,
      location: 'Schloss Versailles', lat: 48.80, lon: 2.12, front: null,
      participants: ['de', 'fr', 'gb', 'us', 'it'],
      summary: 'Fünf Jahre nach dem Attentat von Sarajevo unterzeichnet Deutschland den Friedensvertrag: Verlust von rund 13 Prozent des Staatsgebiets und aller Kolonien, Beschränkung des Heeres auf 100 000 Mann, Reparationen und in Artikel 231 die Zuweisung der Verantwortung für den Krieg. Deutschland war an den Verhandlungen nicht beteiligt.',
      significance: 'Der Vertrag beendete den Krieg völkerrechtlich und schuf mit dem Völkerbund erstmals eine Organisation kollektiver Sicherheit. Zugleich galt er in Deutschland parteiübergreifend als „Diktatfrieden“ und wurde – zusammen mit der Dolchstoßlegende – zum Dauerthema der Agitation gegen die Republik. In der Forschung ist umstritten, wie hart der Vertrag tatsächlich war; unbestritten ist, wie wirkungsvoll er politisch instrumentalisiert wurde.',
      links: ['pariser-vertraege'],
      imageHint: 'Unterzeichnung im Spiegelsaal von Versailles, 1919 (Wikimedia Commons)'
    },
    {
      id: 'pariser-vertraege', date: '1919-09-10', dateLabel: '1919/20',
      title: 'Die Pariser Vorortverträge und die neue Landkarte', category: 'diplomacy', importance: 3,
      location: 'Paris und Umgebung', lat: 48.86, lon: 2.35, front: null,
      participants: ['at', 'bg', 'tr', 'fr', 'gb', 'it'],
      summary: 'In den Verträgen von Saint-Germain (Österreich), Neuilly (Bulgarien), Trianon (Ungarn) und Sèvres bzw. Lausanne (Osmanisches Reich/Türkei) wird Europa neu geordnet. Es entstehen unter anderem Polen, die Tschechoslowakei, Jugoslawien, Finnland und die baltischen Staaten.',
      significance: 'Vier Imperien – das deutsche, das österreichisch-ungarische, das russische und das osmanische – waren verschwunden. Das Selbstbestimmungsrecht ließ sich in ethnisch gemischten Regionen jedoch nicht sauber umsetzen; die neuen Minderheitenfragen belasteten Europa bis in den Zweiten Weltkrieg.',
      links: []
    }
  ]);

  /* Chronologisch sortieren – die Reihenfolge steuert Sternenkarte,
     Vor/Zurück-Navigation und den Präsentationsmodus. */
  EVENTS.sort(function (a, b) {
    return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
  });

  global.WW1 = global.WW1 || {};
  global.WW1.EVENTS = EVENTS;
})(window);
