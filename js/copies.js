/**
 * copies.js — registre-pressio
 *
 * Format de les còpies de seguretat: construcció del fitxer i comprovacions abans d'importar.
 * No toca cap dada: només crea i revisa el text d'una còpia.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./config.js'), require('./logica.js'));
  else arrel.Copies = fabrica(arrel.Config, arrel.Logica);
})(typeof self !== 'undefined' ? self : this, function (Config, Logica) {
  'use strict';

  var MOTIUS = ['manual', 'abans_importar', 'abans_esborrar', 'abans_migrar'];

  /**
   * Migracions de les dades d'una còpia, per esquema d'origen: MIGRACIONS[n] porta de n a n+1.
   * Mai no se n'esborra cap. L'esquema 4 és el primer amb dades locals; les còpies anteriors
   * eren fulls de càlcul de Google i no es poden importar.
   */
  var MIGRACIONS = {};

  function errorCodi(codi) { return Logica.errorCodi(codi); }

  function dosXifres(n) { return (n < 10 ? '0' : '') + n; }

  /** Resum SHA-256 en hexadecimal, o cadena buida si el navegador no l'ofereix. */
  function resum(text) {
    var cripto = typeof crypto !== 'undefined' ? crypto : null;
    if (!cripto || !cripto.subtle || typeof TextEncoder === 'undefined') return Promise.resolve('');
    return cripto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (bytes) {
      return Array.prototype.map.call(new Uint8Array(bytes), function (b) { return (b + 256).toString(16).slice(1); }).join('');
    }).catch(function () { return ''; });
  }

  /** Valida un valor de configuració que viatja a les còpies. */
  function configValida(clau, valor) {
    if (typeof valor !== 'string') return false;
    if (clau === 'nom') return valor.length <= Config.LIMITS.nom;
    if (clau === 'idioma') return valor === 'es' || valor === 'ca';
    if (Config.RANGS[clau]) return Logica.enterEnRang(valor, [Config.RANGS[clau].min, Config.RANGS[clau].max]);
    if (Config.LIMITS_GUIA[clau]) return Logica.enterEnRang(valor, [Config.LIMITS_GUIA[clau].min, Config.LIMITS_GUIA[clau].max]);
    if (clau === 'hora_inici_mati' || clau === 'hora_fi_mati') return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
    if (clau === 'dies_avis_copia') return Config.DIES_AVIS.indexOf(valor) !== -1;
    return false;
  }

  /** Valida una mesura sencera tal com es desa, i la retorna amb els camps en ordre. */
  function mesuraDesada(fila) {
    if (!fila || typeof fila !== 'object' || Array.isArray(fila)) throw errorCodi('COPIA_INCOMPLETA');
    if (Object.keys(fila).some(function (camp) { return Config.CAMPS_MESURA.indexOf(camp) === -1; })) throw errorCodi('COPIA_INCOMPLETA');
    var m;
    try { m = Logica.normalitzaMesura(fila); } catch (error) { throw errorCodi('COPIA_INCOMPLETA'); }
    if (!Logica.esIso(fila.registrat_el) || !Logica.esIso(fila.modificat_el)) throw errorCodi('COPIA_INCOMPLETA');
    if (typeof fila.corregida !== 'boolean') throw errorCodi('COPIA_INCOMPLETA');
    if (fila.esborrat_el !== '' && !Logica.esIso(fila.esborrat_el)) throw errorCodi('COPIA_INCOMPLETA');
    return {
      id_mesura: m.id_mesura, mesura_el: m.mesura_el, sistolica: m.sistolica, diastolica: m.diastolica, pols: m.pols,
      nota: m.nota, registrat_el: fila.registrat_el, modificat_el: fila.modificat_el, corregida: fila.corregida,
      esborrat_el: fila.esborrat_el, id_serie: m.id_serie, ordre_serie: m.ordre_serie
    };
  }

  /** Nom del fitxer: ‹codi›_copia_v‹versió›_e‹esquema›_‹AAAA-MM-DD_HHmm›.json, amb l'hora local. */
  function nomFitxer(data) {
    return Config.CODI_APP + '_copia_v' + Config.VERSIO + '_e' + Config.VERSIO_ESQUEMA + '_' +
      data.getFullYear() + '-' + dosXifres(data.getMonth() + 1) + '-' + dosXifres(data.getDate()) + '_' +
      dosXifres(data.getHours()) + dosXifres(data.getMinutes()) + '.json';
  }

  /**
   * Construeix el text d'una còpia amb les seves metadades.
   * @param {{mesures: Object[], config: Object}} dades Totes les mesures (també les esborrades) i la configuració.
   * @param {string} motiu «manual», «abans_importar» o «abans_esborrar».
   * @param {Date} data Moment de la còpia.
   * @return {Promise<{nom: string, text: string, metadades: Object}>} Còpia.
   */
  function construeix(dades, motiu, data) {
    var mesures = dades.mesures.slice().sort(function (a, b) { return a.id_mesura < b.id_mesura ? -1 : 1; }).map(function (m) {
      var fila = {};
      Config.CAMPS_MESURA.forEach(function (camp) { fila[camp] = m[camp] === undefined ? '' : m[camp]; });
      return fila;
    });
    var configuracio = {};
    Object.keys(Config.CONFIGURACIO_INICIAL).forEach(function (clau) {
      if (dades.config[clau] !== undefined) configuracio[clau] = String(dades.config[clau]);
    });
    var cos = { mesures: mesures, configuracio: configuracio };
    return resum(JSON.stringify(cos)).then(function (empremta) {
      var metadades = {
        aplicacio: Config.CODI_APP, nom: Config.NOM_APP, versio: Config.VERSIO, esquema: Config.VERSIO_ESQUEMA,
        data: data.toISOString(), motiu: MOTIUS.indexOf(motiu) === -1 ? 'manual' : motiu,
        taules: {
          mesures: { camps: Config.CAMPS_MESURA, files: mesures.length },
          configuracio: { files: Object.keys(configuracio).length }
        },
        resum: empremta
      };
      return { nom: nomFitxer(data), text: JSON.stringify({ metadades: metadades, dades: cos }), metadades: metadades };
    });
  }

  /**
   * Fa totes les comprovacions d'una còpia sense tocar cap dada: aplicació, versió de l'esquema,
   * integritat i validesa de cada fila. Si l'esquema és anterior, hi aplica les migracions.
   * @param {string} text Contingut del fitxer.
   * @return {Promise<{metadades: Object, esquema: number, migrada: boolean, dades: {mesures: Object[], config: Object}}>}
   */
  function revisa(text) {
    if (typeof text !== 'string') return Promise.reject(errorCodi('COPIA_ILLEGIBLE'));
    if (text.length > Config.LIMITS.midaCopia) return Promise.reject(errorCodi('COPIA_MASSA_GRAN'));
    var fitxer;
    try { fitxer = JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text); } catch (error) { return Promise.reject(errorCodi('COPIA_ILLEGIBLE')); }
    var meta = fitxer && fitxer.metadades;
    if (!meta || typeof meta !== 'object') return Promise.reject(errorCodi('COPIA_ILLEGIBLE'));
    if (meta.aplicacio !== Config.CODI_APP) return Promise.reject(errorCodi('COPIA_ALTRA_APP'));
    var esquema = meta.esquema;
    if (typeof esquema !== 'number' || esquema % 1 !== 0 || esquema < 1) return Promise.reject(errorCodi('COPIA_INCOMPLETA'));
    if (esquema > Config.VERSIO_ESQUEMA) return Promise.reject(errorCodi('COPIA_POSTERIOR'));
    for (var n = esquema; n < Config.VERSIO_ESQUEMA; n++) {
      if (typeof MIGRACIONS[n] !== 'function') return Promise.reject(errorCodi('MIGRACIO_ABSENT'));
    }
    var cos = fitxer.dades;
    var taules = meta.taules;
    if (!cos || typeof cos !== 'object' || !Array.isArray(cos.mesures) || !cos.configuracio || typeof cos.configuracio !== 'object' ||
        Array.isArray(cos.configuracio) || !taules || !taules.mesures || !taules.configuracio) {
      return Promise.reject(errorCodi('COPIA_INCOMPLETA'));
    }
    if (taules.mesures.files !== cos.mesures.length || taules.configuracio.files !== Object.keys(cos.configuracio).length) {
      return Promise.reject(errorCodi('COPIA_INCOMPLETA'));
    }
    if (esquema === Config.VERSIO_ESQUEMA && JSON.stringify(taules.mesures.camps) !== JSON.stringify(Config.CAMPS_MESURA)) {
      return Promise.reject(errorCodi('COPIA_INCOMPLETA'));
    }
    return resum(JSON.stringify(cos)).then(function (empremta) {
      if (meta.resum && empremta && meta.resum !== empremta) throw errorCodi('COPIA_INCOMPLETA');
      var dades = cos;
      for (var e = esquema; e < Config.VERSIO_ESQUEMA; e++) dades = MIGRACIONS[e](dades);
      var vistes = {};
      var mesures = dades.mesures.map(function (fila) {
        var m = mesuraDesada(fila);
        if (vistes[m.id_mesura]) throw errorCodi('COPIA_INCOMPLETA');
        vistes[m.id_mesura] = true;
        return m;
      });
      var config = {};
      Object.keys(dades.configuracio).forEach(function (clau) {
        if (Config.CONFIGURACIO_INICIAL[clau] === undefined || !configValida(clau, dades.configuracio[clau])) throw errorCodi('COPIA_INCOMPLETA');
        config[clau] = dades.configuracio[clau];
      });
      if (config.preses_descartades !== undefined && config.preses_serie !== undefined &&
          Number(config.preses_descartades) >= Number(config.preses_serie)) throw errorCodi('COPIA_INCOMPLETA');
      return {
        metadades: {
          versio: String(meta.versio || ''), esquema: esquema, data: Logica.esIso(meta.data) ? meta.data : '',
          motiu: MOTIUS.indexOf(meta.motiu) === -1 ? 'manual' : meta.motiu
        },
        esquema: esquema, migrada: esquema < Config.VERSIO_ESQUEMA,
        dades: { mesures: mesures, config: config }
      };
    });
  }

  return { construeix: construeix, revisa: revisa, nomFitxer: nomFitxer, configValida: configValida, MIGRACIONS: MIGRACIONS, MOTIUS: MOTIUS };
});
