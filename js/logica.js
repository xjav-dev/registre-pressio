/**
 * logica.js — registre-pressio
 *
 * Regles sense interfície: salt de camp, validació, dates, resum i CSV.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else arrel.Logica = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AVIS = { sistolica: [70, 250], diastolica: [40, 150], pols: [40, 180] };
  var REBUIG = { sistolica: [40, 300], diastolica: [20, 200], pols: [20, 250] };

  /** Nombre de xifres que s'esperen segons el camp i el que ja s'ha escrit. */
  function xifresEsperades(camp, text) {
    var primera = String(text).charAt(0);
    if (camp === 'sistolica') return primera === '1' || primera === '2' ? 3 : 2;
    return primera === '1' ? 3 : 2;
  }

  /** Indica si el camp ja està complet i cal saltar al següent. */
  function campComplet(camp, text) {
    return String(text).length >= xifresEsperades(camp, text);
  }

  function dins(valor, rang) {
    return valor >= rang[0] && valor <= rang[1];
  }

  /**
   * Valida una mesura. `errors` bloqueja; `avisos` demana confirmació.
   * `valorMoltAlt` activa el missatge de valor molt alt.
   */
  function valida(m) {
    var errors = [], avisos = [];
    ['sistolica', 'diastolica', 'pols'].forEach(function (camp) {
      var buit = m[camp] === '' || m[camp] === null || m[camp] === undefined;
      if (buit) {
        if (camp !== 'pols') errors.push({ camp: camp, codi: 'FALTA' });
        return;
      }
      var valor = Number(m[camp]);
      if (!dins(valor, REBUIG[camp])) errors.push({ camp: camp, codi: 'FORA_DE_RANG' });
      else if (!dins(valor, AVIS[camp])) avisos.push({ camp: camp, codi: 'IMPROBABLE' });
    });
    if (!errors.length && Number(m.diastolica) >= Number(m.sistolica)) {
      avisos.push({ camp: 'diastolica', codi: 'MINIMA_SUPERIOR' });
    }
    return {
      errors: errors,
      avisos: avisos,
      valorMoltAlt: Number(m.sistolica) >= 180 || Number(m.diastolica) >= 120
    };
  }

  function dosXifres(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /** Data ISO amb el desplaçament horari local del moment indicat. */
  function isoLocal(data) {
    var minuts = -data.getTimezoneOffset();
    var absolut = Math.abs(minuts);
    return data.getFullYear() + '-' + dosXifres(data.getMonth() + 1) + '-' + dosXifres(data.getDate()) +
      'T' + dosXifres(data.getHours()) + ':' + dosXifres(data.getMinutes()) + ':' + dosXifres(data.getSeconds()) +
      (minuts < 0 ? '-' : '+') + dosXifres(Math.floor(absolut / 60)) + ':' + dosXifres(absolut % 60);
  }

  /**
   * Parts de la data tal com es va anotar, sense conversions de zona.
   * Una data acabada en Z es mostra en l'hora local del telèfon.
   */
  function parts(iso) {
    var text = /Z$/.test(iso) ? isoLocal(new Date(iso)) : iso;
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(text);
    var any = +m[1], mes = +m[2], dia = +m[3];
    return {
      any: any, mes: mes, dia: dia, hora: +m[4], minut: +m[5],
      data: m[1] + '-' + m[2] + '-' + m[3],
      diaSetmana: new Date(Date.UTC(any, mes - 1, dia)).getUTCDay()
    };
  }

  function minutsDia(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm));
    return m ? +m[1] * 60 + +m[2] : null;
  }

  /** Retorna «mati» o «vespre» segons l'hora local de la mesura. */
  function franja(iso, franges) {
    var inici = minutsDia(franges && franges.inici_mati);
    var fi = minutsDia(franges && franges.fi_mati);
    if (inici === null) inici = 240;
    if (fi === null) fi = 840;
    var p = parts(iso);
    var ara = p.hora * 60 + p.minut;
    return ara >= inici && ara < fi ? 'mati' : 'vespre';
  }

  function mitjana(llista) {
    if (!llista.length) return null;
    return Math.round(llista.reduce(function (a, b) { return a + b; }, 0) / llista.length);
  }

  function mitjanaPressio(mesures) {
    if (!mesures.length) return null;
    return {
      sistolica: mitjana(mesures.map(function (m) { return Number(m.sistolica); })),
      diastolica: mitjana(mesures.map(function (m) { return Number(m.diastolica); }))
    };
  }

  /** Tria les preses que compten, ordenades. Si se'n descartarien totes, les fa servir totes. */
  function presesComptades(preses, configuracio) {
    var ordenades = preses.slice().sort(function (a, b) { return Number(a.ordre_serie) - Number(b.ordre_serie); });
    var descartades = (configuracio && configuracio.preses_descartades) || 0;
    var comptades = ordenades.filter(function (m) { return Number(m.ordre_serie) > descartades; });
    return comptades.length ? comptades : ordenades;
  }

  function mitjanaExacta(llista) {
    return llista.reduce(function (a, b) { return a + b; }, 0) / llista.length;
  }

  /**
   * Converteix les mesures en unitats: una per mesura directa i una per sèrie guiada.
   * Els valors d'una sèrie no s'arrodoneixen per no acumular errors en les mitjanes.
   */
  function agrupaSeries(mesures, configuracio) {
    var series = {}, unitats = [];
    mesures.forEach(function (m) {
      if (m.esborrat_el) return;
      if (!m.id_serie) { unitats.push(m); return; }
      if (!series[m.id_serie]) {
        series[m.id_serie] = [];
        unitats.push({ serie: m.id_serie });
      }
      series[m.id_serie].push(m);
    });
    return unitats.map(function (u) {
      if (!u.serie) return u;
      var comptades = presesComptades(series[u.serie], configuracio);
      var polsos = comptades.filter(function (m) { return m.pols !== '' && m.pols !== null && m.pols !== undefined; })
        .map(function (m) { return Number(m.pols); });
      return {
        id_serie: u.serie, preses: comptades.length, mesura_el: comptades[0].mesura_el,
        sistolica: mitjanaExacta(comptades.map(function (m) { return Number(m.sistolica); })),
        diastolica: mitjanaExacta(comptades.map(function (m) { return Number(m.diastolica); })),
        pols: polsos.length ? mitjanaExacta(polsos) : ''
      };
    });
  }

  /**
   * Resum d'un conjunt de mesures no esborrades. Les mitjanes es calculen per unitat;
   * el mínim i el màxim, amb totes les preses, perquè no es perdin els extrems.
   */
  function resum(mesures, objectius, franges, configuracio) {
    var totes = mesures.filter(function (m) { return !m.esborrat_el; });
    var valides = agrupaSeries(totes, configuracio);
    var dies = {};
    valides.forEach(function (m) { dies[parts(m.mesura_el).data] = true; });
    var llistaDies = Object.keys(dies).sort();
    var mati = valides.filter(function (m) { return franja(m.mesura_el, franges) === 'mati'; });
    var vespre = valides.filter(function (m) { return franja(m.mesura_el, franges) === 'vespre'; });
    var mMati = mitjanaPressio(mati), mVespre = mitjanaPressio(vespre);
    var polsos = valides.filter(function (m) { return m.pols !== '' && m.pols !== null && m.pols !== undefined; })
      .map(function (m) { return Number(m.pols); });
    var sobre = valides.filter(function (m) {
      return Math.round(Number(m.sistolica)) >= objectius.sistolica || Math.round(Number(m.diastolica)) >= objectius.diastolica;
    }).length;
    var senseprimer = null;
    if (llistaDies.length >= 4 && llistaDies.length <= 14) {
      senseprimer = mitjanaPressio(valides.filter(function (m) {
        return parts(m.mesura_el).data !== llistaDies[0];
      }));
    }
    return {
      lectures: totes.length,
      unitats: valides.length,
      dies: llistaDies.length,
      suficient: llistaDies.length >= 3,
      global: mitjanaPressio(valides),
      mati: mMati,
      vespre: mVespre,
      diferencia: mMati && mVespre
        ? { sistolica: mMati.sistolica - mVespre.sistolica, diastolica: mMati.diastolica - mVespre.diastolica }
        : null,
      senseprimer: senseprimer,
      pols: mitjana(polsos),
      minim: totes.length ? {
        sistolica: Math.min.apply(null, totes.map(function (m) { return Number(m.sistolica); })),
        diastolica: Math.min.apply(null, totes.map(function (m) { return Number(m.diastolica); }))
      } : null,
      maxim: totes.length ? {
        sistolica: Math.max.apply(null, totes.map(function (m) { return Number(m.sistolica); })),
        diastolica: Math.max.apply(null, totes.map(function (m) { return Number(m.diastolica); }))
      } : null,
      percentatgeSobre: valides.length ? Math.round(sobre * 100 / valides.length) : 0
    };
  }

  /** Cel·la CSV amb separador «;», protegida contra fórmules. */
  function celaCsv(valor) {
    var text = valor === null || valor === undefined ? '' : String(valor);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return /[";\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  /** Suma dies a una data AAAA-MM-DD, sense dependre de la zona horària. */
  function sumaDies(data, dies) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + dies)).toISOString().slice(0, 10);
  }

  /** Data local d'avui en format AAAA-MM-DD. */
  function avui() {
    return isoLocal(new Date()).slice(0, 10);
  }

  /** Mesures no esborrades amb la data dins de l'interval, tots dos extrems inclosos. */
  function filtraInterval(mesures, desde, fins) {
    return mesures.filter(function (m) {
      var data = parts(m.mesura_el).data;
      return !m.esborrat_el && data >= desde && data <= fins;
    });
  }

  /** Composa una data ISO local a partir dels camps de data i hora. Retorna null si no és vàlida. */
  function composaIso(data, hora) {
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data || '');
    var h = /^(\d{2}):(\d{2})/.exec(hora || '');
    if (!d || !h) return null;
    var moment = new Date(+d[1], +d[2] - 1, +d[3], +h[1], +h[2], 0);
    return isNaN(moment.getTime()) || moment.getDate() !== +d[3] ? null : isoLocal(moment);
  }

  /** Data en format DD/MM/AAAA. */
  function dataCurta(iso) {
    var p = parts(iso);
    return dosXifres(p.dia) + '/' + dosXifres(p.mes) + '/' + p.any;
  }

  /** Hora en format HH:MM. */
  function horaCurta(iso) {
    var p = parts(iso);
    return dosXifres(p.hora) + ':' + dosXifres(p.minut);
  }

  /** Mitjanes de matí i vespre per dia, fins a 14 dies, o per setmana si l'interval és més llarg. */
  function mitjanesFranja(mesures, desde, fins, franges) {
    var perDia = sumaDies(desde, 13) >= fins;
    function clau(data) {
      if (perDia) return data;
      var diaSetmana = new Date(data + 'T00:00:00Z').getUTCDay();
      return sumaDies(data, -((diaSetmana + 6) % 7));
    }
    var grups = {}, ordre = [];
    for (var data = clau(desde); data <= fins; data = sumaDies(data, perDia ? 1 : 7)) {
      grups[data] = { mati: [], vespre: [] };
      ordre.push(data);
    }
    mesures.forEach(function (m) {
      if (m.esborrat_el) return;
      var grup = grups[clau(parts(m.mesura_el).data)];
      if (grup) grup[franja(m.mesura_el, franges)].push(m);
    });
    return {
      perDia: perDia,
      punts: ordre.map(function (c) {
        return { data: c, mati: mitjanaPressio(grups[c].mati), vespre: mitjanaPressio(grups[c].vespre) };
      })
    };
  }

  /** Genera el CSV d'un conjunt de mesures. `t` tradueix les claus de textos. */
  function generaCsv(mesures, t, franges) {
    var files = [[t('data'), t('dia'), t('hora'), t('presa'), t('franja'), t('sistolica'), t('diastolica'), t('pols'), t('nota'), t('corregida')]];
    mesures.forEach(function (m) {
      files.push([
        dataCurta(m.mesura_el), t('diesSetmana')[parts(m.mesura_el).diaSetmana], horaCurta(m.mesura_el), m.ordre_serie === undefined ? '' : m.ordre_serie,
        t(franja(m.mesura_el, franges)), m.sistolica, m.diastolica, m.pols, m.nota, m.corregida ? t('si') : t('no')
      ]);
    });
    return '\uFEFF' + files.map(function (fila) { return fila.map(celaCsv).join(';'); }).join('\r\n') + '\r\n';
  }

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    var o = crypto.getRandomValues(new Uint8Array(16));
    o[6] = (o[6] & 15) | 64;
    o[8] = (o[8] & 63) | 128;
    var h = Array.prototype.map.call(o, function (b) { return (b + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  var PATRO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var PATRO_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

  function errorCodi(codi) {
    var error = new Error(codi);
    error.codiApp = codi;
    return error;
  }

  /** Valida una data ISO amb zona horària. */
  function esIso(valor) {
    return typeof valor === 'string' && PATRO_ISO.test(valor) && !isNaN(Date.parse(valor));
  }

  /** Valida un enter de fins a tres xifres dins d'un rang [mínim, màxim]. */
  function enterEnRang(valor, rang) {
    var nombre = Number(valor);
    return /^\d{1,3}$/.test(String(valor)) && nombre >= rang[0] && nombre <= rang[1];
  }

  function idValid(id) {
    if (typeof id !== 'string' || !PATRO_UUID.test(id)) throw errorCodi('ID_INVALID');
    return id.toLowerCase();
  }

  /**
   * Valida els camps d'una mesura que pot escriure la persona i els retorna normalitzats.
   * `limitFutur` és l'instant màxim acceptat per a `mesura_el`; sense límit si no s'indica.
   */
  function normalitzaMesura(dades, limitFutur) {
    if (!dades || typeof dades !== 'object') throw errorCodi('ID_INVALID');
    var id = idValid(dades.id_mesura);
    if (!esIso(dades.mesura_el) || (limitFutur && Date.parse(dades.mesura_el) > limitFutur)) throw errorCodi('DATA_INVALIDA');
    if (!enterEnRang(dades.sistolica, REBUIG.sistolica) || !enterEnRang(dades.diastolica, REBUIG.diastolica)) {
      throw errorCodi('VALOR_FORA_DE_RANG');
    }
    var sensePols = dades.pols === '' || dades.pols === null || dades.pols === undefined;
    if (!sensePols && !enterEnRang(dades.pols, REBUIG.pols)) throw errorCodi('VALOR_FORA_DE_RANG');
    var nota = dades.nota === null || dades.nota === undefined ? '' : dades.nota;
    if (typeof nota !== 'string' || nota.length > 500) throw errorCodi('NOTA_INVALIDA');
    var serie = dades.id_serie ? idValid(dades.id_serie) : '';
    var ordre = dades.ordre_serie === undefined || dades.ordre_serie === null ? '' : dades.ordre_serie;
    if (serie ? !enterEnRang(ordre, [1, 9]) : ordre !== '') throw errorCodi('SERIE_INVALIDA');
    return {
      id_mesura: id, mesura_el: dades.mesura_el, sistolica: Number(dades.sistolica),
      diastolica: Number(dades.diastolica), pols: sensePols ? '' : Number(dades.pols), nota: nota,
      id_serie: serie, ordre_serie: serie ? Number(ordre) : ''
    };
  }

  return {
    errorCodi: errorCodi, esIso: esIso, enterEnRang: enterEnRang, normalitzaMesura: normalitzaMesura,
    xifresEsperades: xifresEsperades, campComplet: campComplet, valida: valida, isoLocal: isoLocal,
    parts: parts, franja: franja, resum: resum, celaCsv: celaCsv, uuid: uuid, sumaDies: sumaDies, avui: avui,
    filtraInterval: filtraInterval, composaIso: composaIso, dataCurta: dataCurta, horaCurta: horaCurta,
    mitjanesFranja: mitjanesFranja, generaCsv: generaCsv, agrupaSeries: agrupaSeries, presesComptades: presesComptades
  };
});
