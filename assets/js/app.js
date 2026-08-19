/* ============================================================
   ANWENDUNG – VERDRAHTUNG ALLER MODULE
   ------------------------------------------------------------
   Hält den Zustand (ausgewähltes Ereignis, aktive Kategorien,
   ausgewähltes Jahr) und verbindet Sternenkarte, Detailansicht,
   Europakarte, Suche, Filter, Kriegsparteien, Präsentationsmodus
   und die Abschlussansicht über den Event-Bus.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util, bus = WW1.bus;
  var YEARS = [1914, 1915, 1916, 1917, 1918];

  var app = {
    events: WW1.EVENTS,
    byId: {},
    selected: null,
    year: null,
    activeCategories: null
  };

  app.events.forEach(function (ev) { app.byId[ev.id] = ev; });

  /* ---------- Aufbau ---------- */

  function init() {
    app.starfield = new WW1.Starfield(util.qs('#starfield'));
    app.starfield.start();

    util.qs('#introCount').textContent = app.events.length;

    app.starmap = new WW1.StarMap(util.qs('#starmap'), app.events);
    app.starmap.fitAll(false);

    app.detail = new WW1.Detail(util.qs('#detail'), app.events);
    app.europeMap = new WW1.EuropeMap(util.qs('#europeMap'), util.qs('#mapNote'));
    app.search = new WW1.Search(util.qs('#searchInput'), util.qs('#searchResults'), app.events);
    app.aftermath = new WW1.Aftermath(util.qs('#aftermath'));
    app.playback = new WW1.Playback(app.events, {
      button: util.qs('#playBtn'),
      icon: util.qs('#playIcon'),
      label: util.qs('#playLabel'),
      progress: util.qs('#progress'),
      bar: util.qs('#progressBar')
    });

    buildYearNav();
    buildFilters();
    buildParties();
    bindUI();
    bindKeyboard();

    bus.on('select', onSelect);
    bus.on('playback:finished', function () { openFinale(); });

    /* Panels je nach Bildschirmgröße vorbereiten: Die Europakarte
       bleibt zunächst geschlossen und öffnet sich, sobald ein
       Ereignis gewählt wird – so bleibt die Übersicht frei. */
    var wide = global.matchMedia('(min-width: 901px)').matches;
    setPanel('filters', wide);
    setPanel('map', false);
    setPanel('parties', false);
    updateInsets();
    app.starmap.fitAll(false);
  }

  /* ---------- Jahrnavigation ---------- */

  function buildYearNav() {
    var nav = util.qs('#yearnav');
    util.clear(nav);

    var all = util.el('button', 'year-btn year-btn--all is-active', 'Gesamter Krieg');
    all.type = 'button';
    all.dataset.year = 'all';
    all.addEventListener('click', function () { showYear(null); });
    nav.appendChild(all);

    YEARS.forEach(function (year) {
      var btn = util.el('button', 'year-btn', String(year));
      btn.type = 'button';
      btn.dataset.year = year;
      btn.addEventListener('click', function () { showYear(year); });
      nav.appendChild(btn);
    });
  }

  function showYear(year) {
    app.year = year;
    markYear(year);

    /* Eine bestehende Auswahl aufheben – sonst bliebe die übrige
       Karte abgedunkelt und die Detailansicht zeigte ein Ereignis
       aus einem anderen Jahr. */
    if (app.selected) {
      app.selected = null;
      app.starmap.setSelected(null);
      app.detail.close();
      app.europeMap.show(null);
      highlightNations(null);
    }

    app.starmap.setYear(year);
    if (year == null) {
      app.starmap.fitAll(true);
      setCurrent(null);
    } else {
      app.starmap.focusYear(year);
      setCurrent(null, year + ' · ' + countYear(year) + ' Ereignisse');
    }
  }

  function countYear(year) {
    return app.events.filter(function (ev) { return util.year(ev.date) === year; }).length;
  }

  function markYear(year) {
    util.qsa('.year-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.year === (year == null ? 'all' : String(year)));
    });
  }

  /* ---------- Kategorienfilter ---------- */

  function buildFilters() {
    var list = util.qs('#filterList');
    util.clear(list);
    app.categorySet = new Set(WW1.CATEGORY_ORDER);

    WW1.CATEGORY_ORDER.forEach(function (key) {
      var cat = WW1.CATEGORIES[key];
      var count = app.events.filter(function (ev) { return ev.category === key; }).length;

      var btn = util.el('button', 'filter is-on');
      btn.type = 'button';
      btn.dataset.category = key;
      btn.setAttribute('aria-pressed', 'true');
      btn.title = cat.description;

      var box = util.el('span', 'filter__box');
      box.style.color = cat.color;
      btn.appendChild(box);
      btn.appendChild(util.el('span', 'filter__name', cat.label));
      btn.appendChild(util.el('span', 'filter__count', String(count)));

      btn.addEventListener('click', function () {
        if (app.categorySet.has(key)) app.categorySet.delete(key);
        else app.categorySet.add(key);
        applyFilters();
      });

      list.appendChild(btn);
    });

    util.qs('#filterAll').addEventListener('click', function () {
      app.categorySet = new Set(WW1.CATEGORY_ORDER);
      applyFilters();
    });
    util.qs('#filterNone').addEventListener('click', function () {
      app.categorySet = new Set();
      applyFilters();
    });
  }

  function applyFilters() {
    var all = app.categorySet.size === WW1.CATEGORY_ORDER.length;
    util.qsa('.filter').forEach(function (btn) {
      var on = app.categorySet.has(btn.dataset.category);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    app.activeCategories = all ? null : app.categorySet;
    app.starmap.setCategories(app.activeCategories);
  }

  /* ---------- Kriegsparteien ---------- */

  function buildParties() {
    var body = util.qs('#partiesBody');
    util.clear(body);
    app.nationNodes = {};

    ['central', 'entente'].forEach(function (sideKey) {
      var side = WW1.SIDES[sideKey];
      var block = util.el('div', 'side');
      var head = util.el('div', 'side__head');
      var dot = util.el('span', 'side__dot');
      dot.style.background = side.color;
      head.appendChild(dot);
      head.appendChild(util.el('span', 'side__name', side.label));
      block.appendChild(head);

      var list = util.el('div', 'nation-list');
      Object.keys(WW1.NATIONS).forEach(function (code) {
        var nation = WW1.NATIONS[code];
        if (nation.side !== sideKey) return;
        var chip = util.el('button', 'nation', nation.name);
        chip.type = 'button';
        chip.dataset.side = sideKey;
        chip.title = nation.note + (nation.entry ? '\nKriegseintritt: ' + formatDate(nation.entry) : '')
          + (nation.exit ? '\nAusscheiden: ' + formatDate(nation.exit) : '');
        chip.addEventListener('click', function () {
          var input = util.qs('#searchInput');
          input.value = nation.name;
          input.focus();
          app.search.run(nation.name);
        });
        list.appendChild(chip);
        app.nationNodes[code] = chip;
      });
      block.appendChild(list);
      body.appendChild(block);
    });
  }

  function formatDate(iso) {
    var p = iso.split('-');
    return p[2].replace(/^0/, '') + '.' + p[1].replace(/^0/, '') + '.' + p[0];
  }

  function highlightNations(ev) {
    var active = {};
    if (ev) (ev.participants || []).forEach(function (code) { active[code] = true; });
    Object.keys(app.nationNodes).forEach(function (code) {
      app.nationNodes[code].classList.toggle('is-active', !!active[code]);
    });
  }

  /* ---------- Auswahl eines Ereignisses ---------- */

  function onSelect(payload) {
    var id = payload && payload.id;
    var source = (payload && payload.source) || 'unknown';
    var ev = id ? app.byId[id] : null;

    app.selected = id || null;
    app.starmap.setSelected(app.selected);
    app.europeMap.show(ev);
    highlightNations(ev);
    setCurrent(ev);

    if (ev) {
      app.detail.show(ev);
      /* Beim ersten gewählten Ereignis die Europakarte einblenden */
      if (!app.mapShown && global.matchMedia('(min-width: 901px)').matches) {
        app.mapShown = true;
        setPanel('map', true);
      }
      shiftMapPanel(true);
      focusOn(ev, source);
      /* Jahrmarkierung folgt dem Ereignis, ohne die Jahresansicht zu erzwingen */
      markYear(app.year);
      if (ev.id === 'sarajevo') app.starmap.playShockwave();
    } else {
      app.detail.close();
      shiftMapPanel(false);
    }

    if (source !== 'playback') app.playback.interrupt(id);
  }

  /* Europakarte, Dock und Jahrnavigation weichen der geöffneten
     Detailansicht seitlich aus, statt von ihr verdeckt zu werden. */
  function shiftMapPanel(shift) {
    var wide = global.matchMedia('(min-width: 901px)').matches;
    var on = shift && wide;
    ['#panelMap', '#dock', '#yearnav'].forEach(function (sel) {
      util.qs(sel).classList.toggle('is-shifted', on);
    });
  }

  function focusOn(ev, source) {
    var wide = global.matchMedia('(min-width: 901px)').matches;
    var offsetX = wide ? -Math.min(430, global.innerWidth * 0.4) / 2 : 0;
    app.starmap.focusEvent(ev, {
      offsetX: offsetX,
      zoom: source === 'playback' ? app.starmap.kFit * 1.75 : undefined,
      duration: source === 'playback' ? 1400 : 900
    });
  }

  function setCurrent(ev, fallbackLabel) {
    var wrap = util.qs('#current');
    var dateNode = util.qs('#currentDate');
    var titleNode = util.qs('#currentTitle');

    if (ev) {
      dateNode.textContent = ev.dateLabel;
      titleNode.textContent = ev.title;
    } else {
      dateNode.textContent = fallbackLabel || 'Gesamtansicht';
      titleNode.textContent = fallbackLabel ? 'Ausgewählter Zeitraum' : 'Wählen Sie einen Stern auf der Zeitlinie';
    }
    wrap.classList.remove('is-changing');
    void wrap.offsetWidth;
    wrap.classList.add('is-changing');
  }

  /* ---------- Panels & Bedienelemente ---------- */

  function setPanel(name, open) {
    var panel = util.qs('#panel' + name.charAt(0).toUpperCase() + name.slice(1));
    if (!panel) return;
    panel.classList.toggle('is-closed', !open);
    util.qsa('[data-toggle-panel="' + name + '"]').forEach(function (btn) {
      btn.classList.toggle('is-on', open);
    });
    updateInsets();
  }

  /* Die Kamera erfährt, wie viel Platz die geöffneten Panels belegen */
  function updateInsets() {
    if (!app.starmap) return;
    var wide = global.matchMedia('(min-width: 901px)').matches;
    var leftOpen = wide && (!util.qs('#panelFilters').classList.contains('is-closed')
                         || !util.qs('#panelParties').classList.contains('is-closed'));
    var rightOpen = wide && !util.qs('#panelMap').classList.contains('is-closed')
                         && !util.qs('#detail').classList.contains('is-open');
    app.starmap.setInsets(leftOpen ? 286 : 0, rightOpen ? 372 : 0, false);
  }

  function togglePanel(name) {
    var panel = util.qs('#panel' + name.charAt(0).toUpperCase() + name.slice(1));
    if (!panel) return;
    setPanel(name, panel.classList.contains('is-closed'));
  }

  function bindUI() {
    util.qsa('[data-toggle-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () { togglePanel(btn.dataset.togglePanel); });
    });
    util.qsa('[data-close-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () { setPanel(btn.dataset.closePanel, false); });
    });

    util.qs('#mapReset').addEventListener('click', function () { app.europeMap.resetView(); });
    util.qs('#mapZoomIn').addEventListener('click', function () { app.europeMap.zoomBy(1 / 1.5); });
    util.qs('#mapZoomOut').addEventListener('click', function () { app.europeMap.zoomBy(1.5); });

    util.qs('#zoomIn').addEventListener('click', function () { app.starmap.zoomBy(1.45); });
    util.qs('#zoomOut').addEventListener('click', function () { app.starmap.zoomBy(1 / 1.45); });
    util.qs('#resetView').addEventListener('click', function () { showYear(null); });

    util.qs('#startBtn').addEventListener('click', startJourney);

    util.qs('#openAftermath').addEventListener('click', function () {
      closeFinale();
      app.aftermath.open();
    });
    util.qs('#closeAftermath').addEventListener('click', function () { app.aftermath.close(); });
    util.qs('#closeFinale').addEventListener('click', closeFinale);
    util.qs('#openBilanz').addEventListener('click', function () { app.aftermath.open(); });

    util.qs('#helpBtn').addEventListener('click', function () { toggleOverlay('#help', true); });
    util.qs('#closeHelp').addEventListener('click', function () { toggleOverlay('#help', false); });

    util.qsa('.overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }

  function toggleOverlay(selector, open) {
    var node = util.qs(selector);
    node.classList.toggle('is-open', open);
    node.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function openFinale() { toggleOverlay('#finale', true); }
  function closeFinale() { toggleOverlay('#finale', false); }

  /* ---------- Start der „Zeitreise“ ---------- */

  function startJourney() {
    var intro = util.qs('#intro');
    var stage = util.qs('#stage');
    intro.classList.add('is-hidden');
    stage.classList.add('is-live');
    stage.setAttribute('aria-hidden', 'false');

    /* Vom weit herausgezoomten Bild langsam in die Karte hineinfahren */
    var map = app.starmap;
    map.setTransform(map.kFit * 0.45, map.tx, map.ty);
    setTimeout(function () {
      map.fitAll(true);
      setTimeout(function () { map.playShockwave(); }, 900);
    }, 220);

    setTimeout(function () { intro.style.display = 'none'; }, 1600);
  }

  /* ---------- Tastatur ---------- */

  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea';

      if (e.key === 'Escape') {
        if (app.aftermath.isOpen()) return app.aftermath.close();
        if (util.qs('#finale').classList.contains('is-open')) return closeFinale();
        if (util.qs('#help').classList.contains('is-open')) return toggleOverlay('#help', false);
        if (app.selected) return bus.emit('select', { id: null, source: 'keyboard' });
        return;
      }

      if (typing) return;

      if (e.key === '/') { e.preventDefault(); util.qs('#searchInput').focus(); return; }
      if (e.key === ' ') { e.preventDefault(); app.playback.toggle(); return; }
      if (e.key === '0') { showYear(null); return; }
      if (e.key >= '1' && e.key <= '5') { showYear(1913 + parseInt(e.key, 10)); return; }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var dir = e.key === 'ArrowRight' ? 1 : -1;
        var idx = app.selected ? app.events.findIndex(function (ev) { return ev.id === app.selected; }) : -1;
        var next = app.events[idx + dir];
        if (idx === -1) next = app.events[dir === 1 ? 0 : app.events.length - 1];
        if (next) bus.emit('select', { id: next.id, source: 'keyboard' });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  WW1.app = app;
})(window);
