/* ============================================================
   „WAS BLIEB?“ – BILANZ NACH DEM 11. NOVEMBER 1918
   ------------------------------------------------------------
   Baut die Themenkarten sowie das Verlustdiagramm auf.
   Das Diagramm ist ein sortiertes Balkendiagramm mit direkter
   Wertbeschriftung, Legende und alternativer Tabellenansicht –
   die Identität der Bündnisse wird also nie allein über Farbe
   vermittelt.
   ============================================================ */
(function (global) {
  'use strict';

  var WW1 = global.WW1, util = WW1.util;

  var SIDE_COLOR = { central: '#C4863F', entente: '#5A8ACF' };

  function Aftermath(sheetEl) {
    this.sheet = sheetEl;
    this.built = false;
  }

  Aftermath.prototype.build = function () {
    if (this.built) return;
    this.built = true;

    var data = WW1.AFTERMATH;
    var grid = util.qs('#aftermathGrid', this.sheet);

    data.SECTIONS.forEach(function (section) {
      var card = util.el('article', 'card');
      card.appendChild(util.el('h3', null, section.title));
      card.appendChild(util.el('p', 'card__lead', section.lead));
      var list = util.el('ul');
      section.points.forEach(function (point) {
        list.appendChild(util.el('li', null, point));
      });
      card.appendChild(list);
      grid.appendChild(card);
    });

    this.buildChart();
  };

  Aftermath.prototype.buildChart = function () {
    var losses = WW1.AFTERMATH.LOSSES.slice().sort(function (a, b) { return b.value - a.value; });
    var max = losses[0].value;
    var bars = util.qs('#lossBars', this.sheet);
    var tbody = util.qs('#lossTable tbody', this.sheet);
    var self = this;
    this.bars = [];

    losses.forEach(function (item) {
      var row = util.el('div', 'bar-row');
      row.tabIndex = 0;

      row.appendChild(util.el('span', 'bar-row__name', item.label));

      var track = util.el('div', 'bar-row__track');
      var fill = util.el('div', 'bar-row__fill');
      fill.style.background = SIDE_COLOR[item.side];
      fill.dataset.target = (item.value / max * 100).toFixed(1) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      self.bars.push(fill);

      row.appendChild(util.el('span', 'bar-row__val', format(item.value)));
      row.appendChild(util.el('span', 'bar-row__note', item.note));
      bars.appendChild(row);

      var tr = document.createElement('tr');
      [item.label, format(item.value), WW1.SIDES[item.side].label, item.note].forEach(function (text, i) {
        var cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = text;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    var toggle = util.qs('#tableToggle', this.sheet);
    var table = util.qs('#lossTable', this.sheet);
    toggle.addEventListener('click', function () {
      var open = table.classList.toggle('is-open');
      toggle.textContent = open ? 'Tabelle ausblenden' : 'Als Tabelle anzeigen';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  };

  function format(value) {
    return value.toFixed(value < 0.2 ? 3 : 2).replace('.', ',') + ' Mio.';
  }

  Aftermath.prototype.open = function () {
    this.build();
    this.sheet.classList.add('is-open');
    this.sheet.setAttribute('aria-hidden', 'false');
    var self = this;
    /* Balken erst beim Öffnen aufbauen lassen */
    requestAnimationFrame(function () {
      setTimeout(function () {
        self.bars.forEach(function (fill, i) {
          setTimeout(function () { fill.style.width = fill.dataset.target; }, i * 55);
        });
      }, 120);
    });
  };

  Aftermath.prototype.close = function () {
    this.sheet.classList.remove('is-open');
    this.sheet.setAttribute('aria-hidden', 'true');
    var self = this;
    setTimeout(function () {
      if (self.bars) self.bars.forEach(function (fill) { fill.style.width = '0'; });
    }, 600);
  };

  Aftermath.prototype.isOpen = function () { return this.sheet.classList.contains('is-open'); };

  WW1.Aftermath = Aftermath;
})(window);
