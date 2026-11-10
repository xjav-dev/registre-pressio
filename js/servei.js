/**
 * servei.js — registre-pressio
 *
 * Regles de negoci sobre les dades locals: mesures, perfil, mesura guiada i còpies de seguretat.
 * Les pantalles no toquen mai el magatzem directament: tot passa per aquí.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('./config.js'), require('./logica.js'), require('./copies.js'));
  } else {
    arrel.Servei = fabrica(arrel.Config, arrel.Logica, arrel.Copies);
  }
})(typeof self !== 'undefined' ? self : this, function (Config, Logica, Copies) {
  'use strict';

  var DIA_MS = 86400000;

  /**
   * Crea el servei sobre un magatzem.
   * @param {Object} magatzem Magatzem de `Magatzem.obre()` o `Magatzem.memoria()`.
   * @param {{ara: function(): Date}=} opcions Rellotge, per a les proves.
   * @return {Object} Operacions.
   */
  function crea(magatzem, opcions) {
    var cfg = {};
    var ara = (opcions && opcions.ara) || function () { return new Date(); };

    function errorCodi(codi) { return Logica.errorCodi(codi); }

    function valor(clau) {
      return cfg[clau] !== undefined ? cfg[clau] : Config.CONFIGURACIO_INICIAL[clau];
    }

    function perfil() {
      return {
        nom: valor('nom'), idioma: valor('idioma') === 'ca' ? 'ca' : 'es',
        objectiu_sistolica: Number(valor('objectiu_sistolica')), objectiu_diastolica: Number(valor('objectiu_diastolica'))
      };
    }

    function guia() {
      var g = {};
      Object.keys(Config.LIMITS_GUIA).forEach(function (clau) { g[clau] = Number(valor(clau)); });
      return g;
    }

    function canvis() { return Number(cfg._canvis_sense_copia || 0); }

    /** Estat que necessiten les pantalles. Es llegeix de la memòria, sense esperes. */
    function estat() {
      return {
        perfil: perfil(),
        franges: { inici_mati: valor('hora_inici_mati'), fi_mati: valor('hora_fi_mati') },
        guia: guia(),
        benvinguda: cfg._benvinguda === '1',
        copies: { ultima: cfg._ultima_copia || '', canvis: canvis(), diesAvis: Number(valor('dies_avis_copia')) }
      };
    }

    function aplica(config) {
      Object.keys(config || {}).forEach(function (clau) {
        if (config[clau] === null) delete cfg[clau];
        else cfg[clau] = String(config[clau]);
      });
    }

    /** Desa al dispositiu i, quan s'ha confirmat, actualitza la memòria. */
    function desa(canvisNous) {
      return magatzem.desa(canvisNous).then(function () { aplica(canvisNous.config); });
    }

    function unCanviMes() { return { _canvis_sense_copia: String(canvis() + 1) }; }

    function visibles(mesures) {
      return mesures.filter(function (m) { return !m.esborrat_el; });
    }

    function recarrega() {
      return magatzem.llegeix().then(function (r) {
        cfg = r.config;
        return r;
      });
    }

    /* Arrencada */

    /** Aplica a les dades locals les migracions pendents, amb còpia interna prèvia. */
    function migra(esquema, llegit) {
      for (var n = esquema; n < Config.VERSIO_ESQUEMA; n++) {
        if (typeof Copies.MIGRACIONS[n] !== 'function') return Promise.reject(errorCodi('MIGRACIO_ABSENT'));
      }
      return copiaInterna('abans_migrar').then(function () {
        var dades = { mesures: llegit.mesures, configuracio: {} };
        Object.keys(llegit.config).forEach(function (clau) { if (clau.charAt(0) !== '_') dades.configuracio[clau] = llegit.config[clau]; });
        for (var e = esquema; e < Config.VERSIO_ESQUEMA; e++) dades = Copies.MIGRACIONS[e](dades);
        return magatzem.substitueix({ mesures: dades.mesures, config: dades.configuracio }, { _esquema: String(Config.VERSIO_ESQUEMA) });
      }).then(recarrega);
    }

    /**
     * Carrega les dades del dispositiu i les deixa a l'esquema actual.
     * @return {Promise<{mesures: Object[]}>} Mesures vigents.
     */
    function inicia() {
      return recarrega().then(function (r) {
        var esquema = Number(cfg._esquema || 0);
        if (esquema > Config.VERSIO_ESQUEMA) throw errorCodi('DADES_POSTERIORS');
        if (cfg._esquema && esquema < Config.VERSIO_ESQUEMA) return migra(esquema, r);
        return r;
      }).then(function (r) {
        var inicial = {};
        if (!cfg._esquema) inicial._esquema = String(Config.VERSIO_ESQUEMA);
        if (!cfg._primer_us) inicial._primer_us = ara().toISOString();
        return (Object.keys(inicial).length ? desa({ config: inicial }) : Promise.resolve()).then(function () {
          return { mesures: visibles(r.mesures) };
        });
      });
    }

    /* Mesures */

    function mesuraPerId(id) {
      return magatzem.llegeix().then(function (r) {
        return r.mesures.filter(function (m) { return m.id_mesura === id; })[0];
      });
    }

    /**
     * Registra una mesura. Repetir la mateixa crida no en crea cap de nova.
     * @param {Object} dades Dades de la mesura.
     * @return {Promise<{mesura: Object}>} Mesura desada.
     */
    function creaMesura(dades) {
      var mesura;
      try { mesura = Logica.normalitzaMesura(dades, ara().getTime() + DIA_MS); } catch (error) { return Promise.reject(error); }
      return mesuraPerId(mesura.id_mesura).then(function (existent) {
        if (existent) return { mesura: existent };
        var moment = ara().toISOString();
        mesura.registrat_el = moment;
        mesura.modificat_el = moment;
        mesura.corregida = false;
        mesura.esborrat_el = '';
        return desa({ mesures: [mesura], config: unCanviMes() }).then(function () { return { mesura: mesura }; });
      });
    }

    /**
     * Corregeix una mesura. La marca com a corregida si canvien els valors o la data.
     * `registrat_el` no canvia mai.
     */
    function editaMesura(dades) {
      var nova;
      try { nova = Logica.normalitzaMesura(dades, ara().getTime() + DIA_MS); } catch (error) { return Promise.reject(error); }
      return mesuraPerId(nova.id_mesura).then(function (fila) {
        if (!fila || fila.esborrat_el) throw errorCodi('NO_PERMES');
        var canvia = Date.parse(fila.mesura_el) !== Date.parse(nova.mesura_el) ||
          Number(fila.sistolica) !== nova.sistolica || Number(fila.diastolica) !== nova.diastolica ||
          String(fila.pols) !== String(nova.pols);
        if (canvia) fila.corregida = true;
        fila.mesura_el = nova.mesura_el;
        fila.sistolica = nova.sistolica;
        fila.diastolica = nova.diastolica;
        fila.pols = nova.pols;
        fila.nota = nova.nota;
        fila.modificat_el = ara().toISOString();
        return desa({ mesures: [fila], config: unCanviMes() }).then(function () { return { mesura: fila }; });
      });
    }

    /** Marca una mesura com a esborrada. Continua a les còpies per poder recuperar un error. */
    function esborraMesura(dades) {
      var id = dades && dades.id_mesura;
      return mesuraPerId(typeof id === 'string' ? id.toLowerCase() : '').then(function (fila) {
        if (!fila || fila.esborrat_el) throw errorCodi('NO_PERMES');
        var moment = ara().toISOString();
        fila.esborrat_el = moment;
        fila.modificat_el = moment;
        return desa({ mesures: [fila], config: unCanviMes() }).then(function () { return {}; });
      });
    }

    /* Perfil i configuració */

    /** Valida i desa els canvis de perfil. Només accepta els camps previstos. */
    function actualitzaPerfil(c) {
      c = c || {};
      var nous = {};
      if (c.nom !== undefined) {
        var nom = String(c.nom).trim();
        if (nom.length > Config.LIMITS.nom) return Promise.reject(errorCodi('PERFIL_INVALID'));
        nous.nom = nom;
      }
      if (c.idioma !== undefined) {
        if (c.idioma !== 'es' && c.idioma !== 'ca') return Promise.reject(errorCodi('PERFIL_INVALID'));
        nous.idioma = c.idioma;
      }
      var malament = ['objectiu_sistolica', 'objectiu_diastolica'].some(function (camp) {
        if (c[camp] === undefined) return false;
        nous[camp] = String(Number(c[camp]));
        return !Logica.enterEnRang(c[camp], [Config.RANGS[camp].min, Config.RANGS[camp].max]);
      });
      if (malament) return Promise.reject(errorCodi('PERFIL_INVALID'));
      var compta = Object.keys(nous).some(function (clau) { return clau !== 'idioma' && nous[clau] !== valor(clau); });
      if (compta) nous._canvis_sense_copia = String(canvis() + 1);
      return desa({ config: nous }).then(function () { return { perfil: perfil() }; });
    }

    /** Tanca la pantalla de benvinguda i desa el nom, si se n'ha escrit algun. */
    function completaBenvinguda(nom) {
      var net = String(nom || '').trim().slice(0, Config.LIMITS.nom);
      var nous = { _benvinguda: '1' };
      if (net) nous.nom = net;
      return desa({ config: nous });
    }

    /** Valida i desa els paràmetres de la mesura guiada. */
    function desaGuia(valors) {
      var nous = {};
      var malament = Object.keys(Config.LIMITS_GUIA).some(function (clau) {
        var v = valors && valors[clau];
        nous[clau] = String(Number(v));
        return !/^\d{1,2}$/.test(String(v)) || Number(v) < Config.LIMITS_GUIA[clau].min || Number(v) > Config.LIMITS_GUIA[clau].max;
      });
      if (malament || Number(nous.preses_descartades) >= Number(nous.preses_serie)) return Promise.reject(errorCodi('CONFIGURACIO_INVALIDA'));
      nous._canvis_sense_copia = String(canvis() + 1);
      return desa({ config: nous }).then(function () { return { guia: guia() }; });
    }

    /** Desa cada quants dies es recorda fer una còpia; 0 vol dir mai. */
    function desaDiesAvis(dies) {
      if (Config.DIES_AVIS.indexOf(String(dies)) === -1) return Promise.reject(errorCodi('CONFIGURACIO_INVALIDA'));
      return desa({ config: { dies_avis_copia: String(dies) } });
    }

    /* Còpies de seguretat */

    /** Construeix una còpia de totes les dades, sense desar-la enlloc. */
    function fesCopia(motiu) {
      return magatzem.llegeix().then(function (r) {
        return Copies.construeix(r, motiu, ara()).then(function (copia) {
          copia.mesures = visibles(r.mesures).length;
          return copia;
        });
      });
    }

    /** Anota que la persona ha desat una còpia fora de l'aplicació. */
    function anotaCopia() {
      return desa({ config: { _ultima_copia: ara().toISOString(), _canvis_sense_copia: '0', _avis_ajornat: null } });
    }

    /** Llista les còpies internes, de més nova a més antiga. */
    function copiesInternes() {
      return magatzem.copies().then(function (copies) {
        return copies.sort(function (a, b) { return a.data < b.data ? 1 : -1; }).map(function (c) {
          return { id: c.id, data: c.data, motiu: c.motiu, versio: c.versio, esquema: c.esquema, mesures: c.mesures, nom: c.nom, text: c.text };
        });
      });
    }

    /** Desa una còpia dins del dispositiu i conserva només les últimes. Si falla, qui la demana s'atura. */
    function copiaInterna(motiu) {
      return fesCopia(motiu).then(function (copia) {
        return magatzem.desaCopia({
          id: Logica.uuid(), data: copia.metadades.data, motiu: copia.metadades.motiu, versio: copia.metadades.versio,
          esquema: copia.metadades.esquema, mesures: copia.mesures, nom: copia.nom, text: copia.text
        });
      }).then(copiesInternes).then(function (copies) {
        return Promise.all(copies.slice(Config.LIMITS.copiesInternes).map(function (c) { return magatzem.esborraCopia(c.id); }));
      }).catch(function () { throw errorCodi('COPIA_PREVIA_FALLIDA'); });
    }

    function esborraCopiaInterna(id) {
      return magatzem.esborraCopia(id);
    }

    /**
     * Comprova una còpia i en prepara el resum per a la confirmació. No toca cap dada.
     * @param {string} text Contingut del fitxer.
     * @return {Promise<{revisada: Object, resum: Object}>}
     */
    function preparaImportacio(text) {
      return Copies.revisa(text).then(function (revisada) {
        return magatzem.llegeix().then(function (r) {
          return {
            revisada: revisada,
            resum: {
              data: revisada.metadades.data, versio: revisada.metadades.versio, migrada: revisada.migrada,
              ara: visibles(r.mesures).length, copia: visibles(revisada.dades.mesures).length
            }
          };
        });
      });
    }

    function hiHaDades(r) {
      return r.mesures.length > 0 || Object.keys(r.config).some(function (clau) { return clau.charAt(0) !== '_'; });
    }

    /**
     * Substitueix les dades per les d'una còpia ja revisada, després d'una còpia interna de l'estat actual.
     * @param {Object} revisada Resultat de `preparaImportacio`.
     * @param {string} origen «fitxer» si ve d'un fitxer de fora; «interna» si és una còpia automàtica.
     * @return {Promise<{mesures: Object[]}>} Mesures vigents.
     */
    function importa(revisada, origen) {
      return magatzem.llegeix().then(function (r) {
        return hiHaDades(r) ? copiaInterna('abans_importar') : null;
      }).then(function () {
        var interna = { _esquema: String(Config.VERSIO_ESQUEMA), _benvinguda: '1', _avis_ajornat: null };
        if (origen === 'fitxer') {
          interna._canvis_sense_copia = '0';
          interna._ultima_copia = revisada.metadades.data || ara().toISOString();
        } else {
          interna._canvis_sense_copia = '1';
        }
        return magatzem.substitueix(revisada.dades, interna).catch(function () { throw errorCodi('IMPORTACIO_FALLIDA'); });
      }).then(recarrega).then(function (r) {
        return { mesures: visibles(r.mesures) };
      });
    }

    /** Esborra totes les dades del dispositiu, després d'una còpia interna. Les còpies internes es conserven. */
    function esborraTot() {
      return magatzem.llegeix().then(function (r) {
        return hiHaDades(r) ? copiaInterna('abans_esborrar') : null;
      }).then(function () {
        return magatzem.substitueix({ mesures: [], config: {} }, {
          _benvinguda: null, _ultima_copia: null, _canvis_sense_copia: null, _avis_ajornat: null, _primer_us: ara().toISOString()
        });
      }).then(recarrega).then(function () { return { mesures: [] }; });
    }

    /** Dies sencers des de l'última còpia o, si no n'hi ha cap, des del primer ús. */
    function diesSenseCopia() {
      var referencia = Date.parse(cfg._ultima_copia || cfg._primer_us || '');
      return isNaN(referencia) ? 0 : Math.max(0, Math.floor((ara().getTime() - referencia) / DIA_MS));
    }

    /** Indica si toca recordar la còpia: hi ha canvis, ha passat el termini i avui no s'ha ajornat. */
    function calAvisar() {
      var termini = Number(valor('dies_avis_copia'));
      if (!termini || !canvis() || diesSenseCopia() < termini) return false;
      return cfg._avis_ajornat !== Logica.isoLocal(ara()).slice(0, 10);
    }

    function ajornaAvis() {
      return desa({ config: { _avis_ajornat: Logica.isoLocal(ara()).slice(0, 10) } });
    }

    return {
      inicia: inicia, estat: estat, creaMesura: creaMesura, editaMesura: editaMesura, esborraMesura: esborraMesura,
      actualitzaPerfil: actualitzaPerfil, completaBenvinguda: completaBenvinguda, desaGuia: desaGuia, desaDiesAvis: desaDiesAvis,
      fesCopia: fesCopia, anotaCopia: anotaCopia, copiesInternes: copiesInternes,
      esborraCopiaInterna: esborraCopiaInterna, preparaImportacio: preparaImportacio, importa: importa, esborraTot: esborraTot,
      diesSenseCopia: diesSenseCopia, calAvisar: calAvisar, ajornaAvis: ajornaAvis
    };
  }

  return { crea: crea };
});
