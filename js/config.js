/**
 * config.js — registre-pressio
 *
 * Constants de l'aplicació i model de les dades locals.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else arrel.Config = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    VERSIO: '0.12.0',
    DATA_VERSIO: '2026-11-10',
    VERSIO_ESQUEMA: 4,
    CODI_APP: 'RPS',
    NOM_APP: 'registre-pressio',
    BASE_DADES: 'registre-pressio',

    LIMITS: { nota: 500, nom: 100, copiesInternes: 5, midaCopia: 20 * 1024 * 1024 },

    RANGS: {
      objectiu_sistolica: { min: 90, max: 200 },
      objectiu_diastolica: { min: 50, max: 130 }
    },

    /** Camps d'una mesura, en l'ordre en què es desen a les còpies. */
    CAMPS_MESURA: ['id_mesura', 'mesura_el', 'sistolica', 'diastolica', 'pols', 'nota',
      'registrat_el', 'modificat_el', 'corregida', 'esborrat_el', 'id_serie', 'ordre_serie'],

    /** Configuració que viatja a les còpies. Tots els valors es desen com a text. */
    CONFIGURACIO_INICIAL: {
      nom: '',
      idioma: 'es',
      objectiu_sistolica: '135',
      objectiu_diastolica: '85',
      hora_inici_mati: '04:00',
      hora_fi_mati: '14:00',
      preses_serie: '3',
      minuts_repos: '5',
      minuts_entre_preses: '2',
      preses_descartades: '0',
      dies_avis_copia: '30'
    },

    LIMITS_GUIA: {
      preses_serie: { min: 2, max: 5 },
      minuts_repos: { min: 0, max: 30 },
      minuts_entre_preses: { min: 0, max: 10 },
      preses_descartades: { min: 0, max: 4 }
    },

    DIES_AVIS: ['7', '30', '0']
  };
});
