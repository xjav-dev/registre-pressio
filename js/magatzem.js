/**
 * magatzem.js — registre-pressio
 *
 * Accés a les dades locals del dispositiu (IndexedDB). És l'únic fitxer que toca la base de dades.
 * Tres magatzems: «mesures», «configuracio» i «copies» (còpies automàtiques internes).
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./config.js'));
  else arrel.Magatzem = fabrica(arrel.Config);
})(typeof self !== 'undefined' ? self : this, function (Config) {
  'use strict';

  /** Les claus de configuració que comencen per «_» són de l'aparell i no viatgen a les còpies. */
  function esInterna(clau) {
    return clau.charAt(0) === '_';
  }

  /**
   * Obre la base de dades del dispositiu.
   * @return {Promise<Object>} Magatzem amb les operacions de lectura i escriptura.
   */
  function obre() {
    return new Promise(function (resol, rebutja) {
      if (typeof indexedDB === 'undefined' || !indexedDB) { rebutja(new Error('senseMagatzem')); return; }
      var peticio;
      try { peticio = indexedDB.open(Config.BASE_DADES, 1); } catch (error) { rebutja(new Error('senseMagatzem')); return; }
      peticio.onupgradeneeded = function () {
        var bd = peticio.result;
        if (!bd.objectStoreNames.contains('mesures')) bd.createObjectStore('mesures', { keyPath: 'id_mesura' });
        if (!bd.objectStoreNames.contains('configuracio')) bd.createObjectStore('configuracio', { keyPath: 'clau' });
        if (!bd.objectStoreNames.contains('copies')) bd.createObjectStore('copies', { keyPath: 'id' });
      };
      peticio.onerror = function () { rebutja(new Error('senseMagatzem')); };
      peticio.onblocked = function () { rebutja(new Error('senseMagatzem')); };
      peticio.onsuccess = function () {
        var bd = peticio.result;
        bd.onversionchange = function () { bd.close(); };
        resol(sobreBase(bd));
      };
    });
  }

  function sobreBase(bd) {
    /** Executa una funció dins d'una transacció i resol quan s'ha confirmat. */
    function transaccio(noms, mode, funcio) {
      return new Promise(function (resol, rebutja) {
        var resultat;
        var tx;
        try { tx = bd.transaction(noms, mode); } catch (error) { rebutja(new Error('errorDesat')); return; }
        tx.oncomplete = function () { resol(resultat); };
        tx.onerror = tx.onabort = function () { rebutja(new Error('errorDesat')); };
        try {
          resultat = funcio(tx);
        } catch (error) {
          try { tx.abort(); } catch (altre) { /* ja avortada */ }
          rebutja(new Error('errorDesat'));
        }
      });
    }

    function tot(tx, nom) {
      var sortida = { files: [] };
      tx.objectStore(nom).getAll().onsuccess = function (ev) { sortida.files = ev.target.result; };
      return sortida;
    }

    function posaConfig(tx, parells) {
      var magatzem = tx.objectStore('configuracio');
      Object.keys(parells || {}).forEach(function (clau) {
        if (parells[clau] === null) magatzem.delete(clau);
        else magatzem.put({ clau: clau, valor: String(parells[clau]) });
      });
    }

    return {
      /** Llegeix totes les mesures (també les esborrades) i la configuració. */
      llegeix: function () {
        return transaccio(['mesures', 'configuracio'], 'readonly', function (tx) {
          return { m: tot(tx, 'mesures'), c: tot(tx, 'configuracio') };
        }).then(function (r) {
          var config = {};
          r.c.files.forEach(function (fila) { config[fila.clau] = String(fila.valor); });
          return { mesures: r.m.files, config: config };
        });
      },

      /** Desa mesures i claus de configuració en una sola transacció. Un valor `null` esborra la clau. */
      desa: function (canvis) {
        return transaccio(['mesures', 'configuracio'], 'readwrite', function (tx) {
          var magatzem = tx.objectStore('mesures');
          (canvis.mesures || []).forEach(function (m) { magatzem.put(m); });
          posaConfig(tx, canvis.config);
        });
      },

      /**
       * Substitueix totes les mesures i la configuració que viatja a les còpies, en una sola transacció.
       * Les claus internes de l'aparell es conserven, llevat de les indicades a `interna`.
       */
      substitueix: function (dades, interna) {
        return transaccio(['mesures', 'configuracio'], 'readwrite', function (tx) {
          var mesures = tx.objectStore('mesures');
          var config = tx.objectStore('configuracio');
          mesures.clear();
          dades.mesures.forEach(function (m) { mesures.put(m); });
          config.getAllKeys().onsuccess = function (ev) {
            ev.target.result.forEach(function (clau) { if (!esInterna(String(clau))) config.delete(clau); });
            posaConfig(tx, dades.config);
            posaConfig(tx, interna);
          };
        });
      },

      /** Llista les còpies automàtiques internes. */
      copies: function () {
        return transaccio(['copies'], 'readonly', function (tx) { return tot(tx, 'copies'); })
          .then(function (r) { return r.files; });
      },

      desaCopia: function (copia) {
        return transaccio(['copies'], 'readwrite', function (tx) { tx.objectStore('copies').put(copia); });
      },

      esborraCopia: function (id) {
        return transaccio(['copies'], 'readwrite', function (tx) { tx.objectStore('copies').delete(id); });
      }
    };
  }

  /** Magatzem en memòria, amb el mateix contracte. Serveix per a les proves. */
  function memoria() {
    var mesures = {}, config = {}, copies = {};
    function clona(x) { return JSON.parse(JSON.stringify(x)); }
    function posaConfig(parells) {
      Object.keys(parells || {}).forEach(function (clau) {
        if (parells[clau] === null) delete config[clau];
        else config[clau] = String(parells[clau]);
      });
    }
    return {
      falla: false,
      llegeix: function () {
        return Promise.resolve({ mesures: Object.keys(mesures).map(function (k) { return clona(mesures[k]); }), config: clona(config) });
      },
      desa: function (canvis) {
        if (this.falla) return Promise.reject(new Error('errorDesat'));
        (canvis.mesures || []).forEach(function (m) { mesures[m.id_mesura] = clona(m); });
        posaConfig(canvis.config);
        return Promise.resolve();
      },
      substitueix: function (dades, interna) {
        if (this.falla) return Promise.reject(new Error('errorDesat'));
        mesures = {};
        dades.mesures.forEach(function (m) { mesures[m.id_mesura] = clona(m); });
        Object.keys(config).forEach(function (clau) { if (!esInterna(clau)) delete config[clau]; });
        posaConfig(dades.config);
        posaConfig(interna);
        return Promise.resolve();
      },
      copies: function () { return Promise.resolve(Object.keys(copies).map(function (k) { return clona(copies[k]); })); },
      desaCopia: function (copia) {
        if (this.falla) return Promise.reject(new Error('errorDesat'));
        copies[copia.id] = clona(copia);
        return Promise.resolve();
      },
      esborraCopia: function (id) { delete copies[id]; return Promise.resolve(); }
    };
  }

  return { obre: obre, memoria: memoria, esInterna: esInterna };
});
