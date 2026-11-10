/**
 * grafics.js — registre-pressio
 *
 * Els gràfics es descriuen amb primitives i es dibuixen en SVG o vectorials al PDF.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./logica.js'));
  else arrel.Grafics = fabrica(arrel.Logica);
})(typeof self !== 'undefined' ? self : this, function (Logica) {
  'use strict';

  var COLOR = {
    sistolica: '#1d5fc2', diastolica: '#b54708', mati: '#008a7a', vespre: '#7c2d92',
    objectiu: '#3a4149', eix: '#5b6570', graella: '#d4dbe4', tinta: '#111418', fons: '#ffffff'
  };

  function ampladaText(text, mida) { return String(text).length * mida * 0.56; }

  function diaMes(data) {
    var p = Logica.parts(/T/.test(data) ? data : data + 'T00:00:00+00:00');
    return (p.dia < 10 ? '0' : '') + p.dia + '/' + (p.mes < 10 ? '0' : '') + p.mes;
  }

  function marca(prims, forma, x, y, r, color) {
    if (forma === 'quadrat') {
      prims.push({ t: 'quadrat', x: x - r - 1, y: y - r - 1, c: 2 * r + 2, fons: COLOR.fons });
      prims.push({ t: 'quadrat', x: x - r, y: y - r, c: 2 * r, fons: color });
    } else {
      prims.push({ t: 'cercle', x: x, y: y, r: r + 1, fons: COLOR.fons });
      prims.push({ t: 'cercle', x: x, y: y, r: r, fons: color });
    }
  }

  /** Dibuixa la llegenda i retorna l'alçada ocupada. */
  function llegenda(prims, elements, amplada, mida, y0) {
    var x = 0, y = y0 + mida, alt = mida * 1.5;
    elements.forEach(function (e) {
      var ample = 34 + ampladaText(e.text, mida) + 12;
      if (x > 0 && x + ample > amplada) { x = 0; y += alt; }
      var cy = y - mida * 0.32;
      if (e.linia) {
        prims.push({ t: 'linia', x1: x, y1: cy, x2: x + 26, y2: cy, color: e.linia, gruix: 2, puntejat: e.puntejat });
      }
      if (e.forma) marca(prims, e.forma, x + 13, cy, 5, e.color || COLOR.eix);
      prims.push({ t: 'text', x: x + 32, y: y, text: e.text, mida: mida, color: COLOR.tinta });
      x += ample;
    });
    return y - y0 + mida * 0.6;
  }

  /** Eix Y de pas rodó, inclòs l'objectiu perquè la línia de referència sempre sigui visible. */
  function domini(valors) {
    var min = Math.min.apply(null, valors), max = Math.max.apply(null, valors);
    var baix = Math.floor((min - 5) / 10) * 10, alt = Math.ceil((max + 5) / 10) * 10;
    var pas = [10, 20, 40, 50].filter(function (p) { return (alt - baix) / p <= 6; })[0] || 100;
    baix = Math.floor(baix / pas) * pas;
    alt = Math.ceil(alt / pas) * pas;
    var marques = [];
    for (var v = baix; v <= alt; v += pas) marques.push(v);
    return { baix: baix, alt: alt, marques: marques };
  }

  function eixY(prims, caixa, d, mida) {
    d.marques.forEach(function (v) {
      var y = caixa.escalaY(v);
      prims.push({ t: 'linia', x1: caixa.x, y1: y, x2: caixa.x + caixa.w, y2: y, color: COLOR.graella, gruix: 1 });
      prims.push({ t: 'text', x: caixa.x - 6, y: y + mida * 0.34, text: String(v), mida: mida, color: COLOR.tinta, ancora: 'end' });
    });
  }

  function caixaPlot(x, y, w, h, d) {
    return {
      x: x, y: y, w: w, h: h,
      escalaY: function (v) { return y + h - (v - d.baix) / (d.alt - d.baix) * h; }
    };
  }

  function etiquetesX(prims, caixa, etiquetes, mida) {
    var vistes = {};
    etiquetes.forEach(function (e, i) {
      if (vistes[e.text]) return;
      vistes[e.text] = true;
      var ancora = i === 0 && etiquetes.length > 1 ? 'start' : i === etiquetes.length - 1 && etiquetes.length > 1 ? 'end' : 'middle';
      prims.push({ t: 'text', x: e.x, y: caixa.y + caixa.h + mida * 1.3, text: e.text, mida: mida, color: COLOR.tinta, ancora: ancora });
    });
  }

  /** Separa uns punts en trams consecutius sense buits. */
  function trams(punts) {
    var sortida = [], actual = [];
    punts.forEach(function (p) {
      if (p) actual.push(p);
      else if (actual.length) { sortida.push(actual); actual = []; }
    });
    if (actual.length) sortida.push(actual);
    return sortida;
  }

  /** Gràfic d'evolució de la sistòlica i la diastòlica. */
  function evolucio(mesures, opts) {
    var t = opts.t, mida = opts.mida, amplada = opts.amplada, obj = opts.objectius;
    var ordenades = mesures.slice().sort(function (a, b) { return Date.parse(a.mesura_el) - Date.parse(b.mesura_el); });
    var prims = [];
    var altLlegenda = llegenda(prims, [
      { linia: COLOR.sistolica, text: t('sistolica') }, { linia: COLOR.diastolica, text: t('diastolica') },
      { forma: 'cercle', text: t('mati') }, { forma: 'quadrat', text: t('vespre') },
      { linia: COLOR.objectiu, puntejat: true, text: t('objectiu') + ' ' + obj.sistolica + '/' + obj.diastolica }
    ], amplada, mida, 0);

    var valors = [obj.sistolica, obj.diastolica];
    ordenades.forEach(function (m) { valors.push(Number(m.sistolica), Number(m.diastolica)); });
    var d = domini(valors);
    var esquerra = mida * 2.3, dreta = mida * 3;
    var y0 = altLlegenda + 6, h = opts.alcada;
    var caixa = caixaPlot(esquerra, y0, amplada - esquerra - dreta, h, d);
    eixY(prims, caixa, d, mida);
    [obj.sistolica, obj.diastolica].forEach(function (v) {
      var y = caixa.escalaY(v);
      prims.push({ t: 'linia', x1: caixa.x, y1: y, x2: caixa.x + caixa.w, y2: y, color: COLOR.objectiu, gruix: 1.5, puntejat: true });
    });

    var temps = ordenades.map(function (m) { return Date.parse(m.mesura_el); });
    var inici = temps[0], fi = temps[temps.length - 1];
    var escalaX = function (v) { return fi === inici ? caixa.x + caixa.w / 2 : caixa.x + (v - inici) / (fi - inici) * caixa.w; };
    var r = caixa.w / Math.max(1, ordenades.length) >= 12 ? 5 : 3.5;

    [['sistolica', COLOR.sistolica], ['diastolica', COLOR.diastolica]].forEach(function (s) {
      prims.push({
        t: 'polilinia', color: s[1], gruix: 2,
        punts: ordenades.map(function (m, i) { return [escalaX(temps[i]), caixa.escalaY(Number(m[s[0]]))]; })
      });
    });
    ordenades.forEach(function (m, i) {
      var forma = Logica.franja(m.mesura_el, opts.franges) === 'mati' ? 'cercle' : 'quadrat';
      marca(prims, forma, escalaX(temps[i]), caixa.escalaY(Number(m.sistolica)), r, COLOR.sistolica);
      marca(prims, forma, escalaX(temps[i]), caixa.escalaY(Number(m.diastolica)), r, COLOR.diastolica);
    });

    var ultima = ordenades[ordenades.length - 1];
    var yMax = caixa.escalaY(Number(ultima.sistolica)) + mida * 0.34;
    var yMin = caixa.escalaY(Number(ultima.diastolica)) + mida * 0.34;
    if (yMin - yMax < mida * 1.1) yMin = yMax + mida * 1.1;
    var xFinal = amplada - dreta + 8;
    prims.push({ t: 'text', x: xFinal, y: yMax, text: t('maxCurt'), mida: mida, color: COLOR.tinta, pes: 'fort' });
    prims.push({ t: 'text', x: xFinal, y: yMin, text: t('minCurt'), mida: mida, color: COLOR.tinta, pes: 'fort' });

    var nEtiquetes = Math.max(1, Math.min(5, Math.floor(caixa.w / (mida * 4))));
    var etiquetes = [];
    for (var i = 0; i < (fi === inici ? 1 : nEtiquetes); i++) {
      var v = fi === inici ? inici : inici + (fi - inici) * (nEtiquetes === 1 ? 0 : i / (nEtiquetes - 1));
      etiquetes.push({ x: escalaX(v), text: diaMes(Logica.isoLocal(new Date(v))) });
    }
    if (fi !== inici) {
      etiquetes[0].text = diaMes(ordenades[0].mesura_el);
      etiquetes[etiquetes.length - 1].text = diaMes(ultima.mesura_el);
    }
    etiquetesX(prims, caixa, etiquetes, mida);

    return {
      w: amplada, h: y0 + h + mida * 1.9, prims: prims, guia: { y1: y0, y2: y0 + h },
      lectures: ordenades.map(function (m, k) {
        return {
          x: escalaX(temps[k]),
          text: Logica.dataCurta(m.mesura_el) + ' ' + Logica.horaCurta(m.mesura_el) + ' · ' + Math.round(m.sistolica) + ' / ' + Math.round(m.diastolica) +
            (m.preses ? ' · ' + t('mitjanaDe').replace('{n}', m.preses) : '')
        };
      })
    };
  }

  /** Mitjanes de matí i vespre, amb un panell per a la sistòlica i un altre per a la diastòlica. */
  function franges(grups, opts) {
    var t = opts.t, mida = opts.mida, amplada = opts.amplada, obj = opts.objectius;
    var prims = [];
    var altLlegenda = llegenda(prims, [
      { forma: 'cercle', color: COLOR.mati, linia: COLOR.mati, text: t('mati') },
      { forma: 'quadrat', color: COLOR.vespre, linia: COLOR.vespre, text: t('vespre') },
      { linia: COLOR.objectiu, puntejat: true, text: t('objectiu') }
    ], amplada, mida, 0);
    var punts = grups.punts;
    var esquerra = mida * 2.3, dreta = mida * 0.8;
    var w = amplada - esquerra - dreta;
    var pasX = punts.length > 1 ? w / (punts.length - 1) : 0;
    var escalaX = function (i) { return punts.length > 1 ? esquerra + i * pasX : esquerra + w / 2; };
    var y = altLlegenda + 4;
    var alcadaPanell = opts.alcada, primerY = y, darrerY = y;

    [['sistolica', obj.sistolica], ['diastolica', obj.diastolica]].forEach(function (panell, indexPanell) {
      prims.push({ t: 'text', x: 0, y: y + mida, text: t(panell[0]), mida: mida, color: COLOR.tinta, pes: 'fort' });
      var yPlot = y + mida * 2.1;
      if (indexPanell === 0) primerY = yPlot;
      var valors = [panell[1]];
      punts.forEach(function (p) {
        if (p.mati) valors.push(p.mati[panell[0]]);
        if (p.vespre) valors.push(p.vespre[panell[0]]);
      });
      var d = domini(valors);
      var caixa = caixaPlot(esquerra, yPlot, w, alcadaPanell, d);
      eixY(prims, caixa, d, mida);
      var yObj = caixa.escalaY(panell[1]);
      prims.push({ t: 'linia', x1: caixa.x, y1: yObj, x2: caixa.x + w, y2: yObj, color: COLOR.objectiu, gruix: 1.5, puntejat: true });
      [['mati', COLOR.mati, 'cercle'], ['vespre', COLOR.vespre, 'quadrat']].forEach(function (serie) {
        var coordenades = punts.map(function (p, i) {
          return p[serie[0]] ? [escalaX(i), caixa.escalaY(p[serie[0]][panell[0]])] : null;
        });
        trams(coordenades).forEach(function (tram) {
          if (tram.length > 1) prims.push({ t: 'polilinia', color: serie[1], gruix: 2, punts: tram });
        });
        coordenades.forEach(function (c) {
          if (c) marca(prims, serie[2], c[0], c[1], w / Math.max(1, punts.length) >= 12 ? 5 : 3.5, serie[1]);
        });
      });
      y = yPlot + alcadaPanell + mida * 0.8;
      darrerY = yPlot + alcadaPanell;
      if (indexPanell === 1) {
        var n = Math.max(2, Math.min(5, Math.floor(w / (mida * 4))));
        var etiquetes = [];
        if (punts.length === 1) etiquetes.push({ x: escalaX(0), text: diaMes(punts[0].data) });
        else {
          for (var k = 0; k < n; k++) {
            var ind = Math.round(k * (punts.length - 1) / (n - 1));
            etiquetes.push({ x: escalaX(ind), text: diaMes(punts[ind].data) });
          }
        }
        etiquetesX(prims, caixa, etiquetes, mida);
      }
    });

    function parella(v) { return v ? v.sistolica + ' / ' + v.diastolica : '–'; }
    return {
      w: amplada, h: darrerY + mida * 1.9, prims: prims, guia: { y1: primerY, y2: darrerY },
      lectures: punts.map(function (p, i) {
        return { x: escalaX(i), text: diaMes(p.data) + ' · ' + t('mati') + ' ' + parella(p.mati) + ' · ' + t('vespre') + ' ' + parella(p.vespre) };
      })
    };
  }

  /** Dibuixa un model en un element SVG. */
  function aSvg(model, descripcio) {
    var NS = 'http://www.w3.org/2000/svg';
    function node(nom, attrs) {
      var n = document.createElementNS(NS, nom);
      Object.keys(attrs).forEach(function (k) { if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]); });
      return n;
    }
    var svg = node('svg', { viewBox: '0 0 ' + model.w + ' ' + model.h, role: 'img', 'aria-label': descripcio });
    model.prims.forEach(function (p) {
      if (p.t === 'linia') svg.appendChild(node('line', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, stroke: p.color, 'stroke-width': p.gruix, 'stroke-dasharray': p.puntejat ? '6 5' : undefined }));
      else if (p.t === 'polilinia') svg.appendChild(node('polyline', { points: p.punts.map(function (q) { return q.join(','); }).join(' '), fill: 'none', stroke: p.color, 'stroke-width': p.gruix, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      else if (p.t === 'cercle') svg.appendChild(node('circle', { cx: p.x, cy: p.y, r: p.r, fill: p.fons }));
      else if (p.t === 'quadrat') svg.appendChild(node('rect', { x: p.x, y: p.y, width: p.c, height: p.c, rx: 1, fill: p.fons }));
      else if (p.t === 'text') {
        var text = node('text', { x: p.x, y: p.y, fill: p.color, 'font-size': p.mida, 'font-weight': p.pes === 'fort' ? 700 : 400, 'text-anchor': p.ancora || 'start', 'font-family': 'inherit' });
        text.textContent = p.text;
        svg.appendChild(text);
      }
    });
    var guia = node('line', { x1: -10, x2: -10, y1: model.guia.y1, y2: model.guia.y2, stroke: COLOR.tinta, 'stroke-width': 1.5 });
    svg.appendChild(guia);
    svg.seleccionaX = function (xPantalla) {
      var millor = model.lectures.reduce(function (a, b) { return Math.abs(b.x - xPantalla) < Math.abs(a.x - xPantalla) ? b : a; });
      guia.setAttribute('x1', millor.x);
      guia.setAttribute('x2', millor.x);
      return millor.text;
    };
    return svg;
  }

  /** Dibuixa un model com a vectors en un document jsPDF. */
  function aPdf(doc, model, x0, y0, ampladaMm) {
    var k = ampladaMm / model.w;
    function px(x) { return x0 + x * k; }
    function py(y) { return y0 + y * k; }
    model.prims.forEach(function (p) {
      if (p.t === 'linia') {
        doc.setDrawColor(p.color);
        doc.setLineWidth(p.gruix * k);
        doc.setLineDashPattern(p.puntejat ? [1.8, 1.4] : [], 0);
        doc.line(px(p.x1), py(p.y1), px(p.x2), py(p.y2));
        doc.setLineDashPattern([], 0);
      } else if (p.t === 'polilinia') {
        doc.setDrawColor(p.color);
        doc.setLineWidth(p.gruix * k);
        for (var i = 1; i < p.punts.length; i++) {
          doc.line(px(p.punts[i - 1][0]), py(p.punts[i - 1][1]), px(p.punts[i][0]), py(p.punts[i][1]));
        }
      } else if (p.t === 'cercle') {
        doc.setFillColor(p.fons);
        doc.circle(px(p.x), py(p.y), p.r * k, 'F');
      } else if (p.t === 'quadrat') {
        doc.setFillColor(p.fons);
        doc.rect(px(p.x), py(p.y), p.c * k, p.c * k, 'F');
      } else if (p.t === 'text') {
        doc.setFont('helvetica', p.pes === 'fort' ? 'bold' : 'normal');
        doc.setFontSize(p.mida * k * 2.835);
        doc.setTextColor(p.color);
        var ancora = { end: 'right', middle: 'center' }[p.ancora] || 'left';
        doc.text(String(p.text), px(p.x), py(p.y), { align: ancora });
      }
    });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    doc.setDrawColor('#000000');
    doc.setLineWidth(0.2);
  }

  return { evolucio: evolucio, franges: franges, aSvg: aSvg, aPdf: aPdf };
});
