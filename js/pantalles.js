/**
 * pantalles.js — registre-pressio
 *
 * Pantalles de l'aplicació. El contingut variable s'hi posa sempre com a text.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function () {
  'use strict';

  var CAMPS = ['sistolica', 'diastolica', 'pols'];
  var TEXTOS = Textos.app;
  var servei = null;
  var estat = {
    idioma: 'es', pantalla: 'registrar', perfil: null, franges: null, configGuia: null, copies: null,
    guia: null, vistaGrafic: 'preses', mesures: [], errorInici: '', installacio: null, protegit: null,
    copiesInternes: [], copiaPreparada: null, avisCopies: '',
    periode: { tipus: 7, desde: '', fins: '' }, form: null, edicio: null
  };
  var arrel = document.getElementById('app');

  /** Copia a l'estat de les pantalles el que el servei té a la memòria. */
  function refresca() {
    var e = servei.estat();
    estat.perfil = e.perfil;
    estat.franges = e.franges;
    estat.configGuia = e.guia;
    estat.copies = e.copies;
    estat.idioma = e.perfil.idioma;
    return e;
  }

  /** Crida una operació del servei i refresca l'estat quan s'ha desat al dispositiu. */
  function crida(nom, dades) {
    return servei[nom](dades).then(function (r) { refresca(); return r; });
  }

  function missatgeError(error) {
    return error && TEXTOS.es[error.message] ? t(error.message) : t('errorDesat');
  }

  function t(clau) {
    var valor = TEXTOS[estat.idioma][clau];
    return valor !== undefined ? valor : (TEXTOS.es[clau] !== undefined ? TEXTOS.es[clau] : clau);
  }

  /** Crea un element; `text` s'assigna amb textContent, mai com a HTML. */
  function el(etiqueta, props, fills) {
    var node = document.createElement(etiqueta);
    Object.keys(props || {}).forEach(function (clau) {
      if (clau === 'text') node.textContent = props[clau];
      else if (clau === 'clic') node.addEventListener('click', props[clau]);
      else if (props[clau] !== undefined && props[clau] !== false) node.setAttribute(clau, props[clau] === true ? '' : props[clau]);
    });
    (fills || []).forEach(function (f) { if (f) node.appendChild(f); });
    return node;
  }

  function formNou() {
    return { id: Logica.uuid(), sistolica: '', diastolica: '', pols: '', nota: '', camp: 'sistolica', error: '', desant: false, notaAfegida: false };
  }

  function dosXifres(n) { return (n < 10 ? '0' : '') + n; }

  function textData(iso) {
    var p = Logica.parts(iso);
    return t('diesSetmana')[p.diaSetmana] + ' ' + dosXifres(p.dia) + '/' + dosXifres(p.mes) + '/' + p.any;
  }

  /** Format del PDF: primer la data i després el dia de la setmana. */
  function textDataPdf(iso) {
    return Logica.dataCurta(iso) + ' ' + t('diesSetmana')[Logica.parts(iso).diaSetmana];
  }

  function ambHora(data) { return data + 'T00:00:00+00:00'; }

  function textHora(iso) { return Logica.horaCurta(iso); }

  var pantallaPintada = null;

  function pinta() {
    var mateixaPantalla = pantallaPintada === estat.pantalla;
    var desplacament = window.scrollY;
    pantallaPintada = estat.pantalla;
    arrel.textContent = '';
    document.documentElement.lang = estat.idioma;
    document.title = t('nomApp');
    if (estat.errorInici) {
      arrel.appendChild(el('main', { class: 'contingut benvinguda' }, [el('h1', { text: t('nomApp') }), el('p', { class: 'error', role: 'alert', text: t(estat.errorInici) })]));
      return;
    }
    if (estat.pantalla === 'benvinguda') { arrel.appendChild(pantallaBenvinguda()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'copies') { arrel.appendChild(pantallaCopies()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'configGuia') { arrel.appendChild(pantallaConfigGuia()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'guiada') { arrel.appendChild(pantallaGuia()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'nota') { arrel.appendChild(pantallaNota()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'editar') { arrel.appendChild(pantallaEditar()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'perfil') { arrel.appendChild(pantallaPerfil()); window.scrollTo(0, 0); return; }
    if (estat.pantalla === 'novetats') { arrel.appendChild(pantallaNovetats()); window.scrollTo(0, 0); return; }
    var cos = { registrar: pantallaRegistre, historial: pantallaHistorial, informe: pantallaInforme, ajustes: pantallaAjustes }[estat.pantalla]();
    arrel.appendChild(el('main', { class: 'contingut' }, [cos]));
    arrel.appendChild(navegacio());
    window.scrollTo(0, mateixaPantalla ? desplacament : 0);
  }

  function navegacio() {
    return el('nav', { class: 'nav', 'aria-label': t('nomApp') }, ['registrar', 'historial', 'informe', 'ajustes'].map(function (p) {
      return el('button', {
        class: 'nav-boto', 'aria-current': estat.pantalla === p ? 'page' : undefined, text: t(p),
        clic: function () { estat.pantalla = p; pinta(); }
      });
    }));
  }

  /* Idioma i teclat */
  function selectorIdioma() {
    return el('div', { class: 'selector', role: 'group', 'aria-label': t('triaIdioma') }, [['es', 'Español'], ['ca', 'Català']].map(function (par) {
      return el('button', {
        class: 'opcio', 'aria-pressed': String(estat.idioma === par[0]), text: par[1],
        clic: function () {
          estat.idioma = par[0];
          pinta();
          desaPerfil({ idioma: par[0] }).catch(function () {});
        }
      });
    }));
  }

  function teclat(enPrem, enEsborra) {
    var tecles = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (x) {
      return el('button', { class: 'tecla', text: x, clic: function () { enPrem(x); } });
    });
    tecles.push(el('button', { class: 'tecla tecla-esborra', text: t('borrar'), clic: enEsborra }));
    tecles.push(el('button', { class: 'tecla', text: '0', clic: function () { enPrem('0'); } }));
    return el('div', { class: 'teclat' }, tecles);
  }

  /* Registre */
  function pantallaRegistre() {
    var f = estat.form;
    var ara = Logica.isoLocal(new Date());
    return el('section', { class: 'registre' }, [
      capcaleraRegistre(ara),
      el('div', { class: 'camps' }, CAMPS.map(function (camp) {
        return el('button', {
          class: 'camp', 'aria-pressed': String(f.camp === camp), 'aria-label': t(camp + 'Llarg') + ': ' + (f[camp] || '—'),
          clic: function () { f.camp = camp; f.error = ''; pinta(); }
        }, [el('span', { class: 'camp-nom', text: t(camp) }), el('span', { class: 'camp-valor', text: f[camp] || '–' })]);
      })),
      f.notaAfegida && !f.error
        ? el('p', { class: 'avis-nota', role: 'status', text: t('notaAfegida') })
        : el('p', { class: 'error zona-error', role: 'alert', text: f.error }),
      teclat(premXifra, esborraXifra),
      el('div', { class: 'accions' }, [
        el('button', { class: 'secundari', text: f.nota ? t('veureNota') : t('afegirNota'), clic: function () { estat.pantalla = 'nota'; pinta(); } }),
        el('button', { class: 'principal', disabled: f.desant, text: f.desant ? t('guardant') : t('guardar'), clic: intentaDesar })
      ])
    ]);
  }

  function capcaleraRegistre(ara) {
    if (estat.guia) {
      return el('div', { class: 'capcalera-registre' }, [
        el('h1', { text: t('presaDe').replace('{n}', estat.guia.ordre).replace('{total}', estat.configGuia.preses_serie) }),
        el('button', { class: 'secundari boto-capcalera', text: t('sortir'), clic: surtGuia })
      ]);
    }
    return el('div', { class: 'capcalera-registre' }, [
      el('p', { class: 'data-actual' }, [el('span', { text: textData(ara) }), el('span', { text: textHora(ara) })]),
      el('button', { class: 'secundari boto-capcalera', text: t('guiada'), clic: obreGuia })
    ]);
  }

  function premXifra(x) {
    var f = estat.form;
    if (Logica.campComplet(f.camp, f[f.camp])) {
      var seguent = CAMPS[CAMPS.indexOf(f.camp) + 1];
      if (!seguent) return;
      f.camp = seguent;
      if (f[f.camp] && Logica.campComplet(f.camp, f[f.camp])) return;
    }
    f[f.camp] += x;
    f.error = '';
    f.notaAfegida = false;
    if (Logica.campComplet(f.camp, f[f.camp]) && CAMPS.indexOf(f.camp) < 2) {
      f.camp = CAMPS[CAMPS.indexOf(f.camp) + 1];
    }
    pinta();
  }

  function esborraXifra() {
    var f = estat.form;
    if (f[f.camp]) f[f.camp] = f[f.camp].slice(0, -1);
    else if (CAMPS.indexOf(f.camp) > 0) f.camp = CAMPS[CAMPS.indexOf(f.camp) - 1];
    f.error = '';
    f.notaAfegida = false;
    pinta();
  }

  function textError(e) {
    return e.codi === 'FALTA' ? t('FALTA_' + e.camp) : t(e.codi) + ' (' + t(e.camp) + ')';
  }

  function intentaDesar() {
    var f = estat.form;
    if (f.desant) return;
    var v = Logica.valida(f);
    if (v.errors.length) {
      f.camp = v.errors[0].camp;
      f.error = textError(v.errors[0]);
      pinta();
      return;
    }
    if (v.avisos.length) { dialegConfirmacio(v, f, function () { desa(v); }); return; }
    desa(v);
  }

  function textAvis(a, valors) {
    if (a.codi === 'MINIMA_SUPERIOR') return t(a.codi);
    return t(a.codi).replace('{camp}', t(a.camp)).replace('{valor}', valors[a.camp]);
  }

  function dialeg(fills) {
    var fons = el('div', { class: 'fons-dialeg' }, [el('div', { class: 'dialeg', role: 'dialog', 'aria-modal': 'true' }, fills)]);
    document.body.appendChild(fons);
    return fons;
  }

  function dialegConfirmacio(v, valors, enAcceptar) {
    var fons = dialeg([
      el('h2', { text: t('esCorrecte') }),
      el('div', {}, v.avisos.map(function (a) { return el('p', { text: textAvis(a, valors) }); })),
      el('button', { class: 'principal', text: t('siGuardar'), clic: function () { fons.remove(); enAcceptar(); } }),
      el('button', { class: 'secundari', text: t('corregir'), clic: function () { fons.remove(); } })
    ]);
  }

  function desa(v) {
    var f = estat.form;
    if (f.desant) return;
    f.desant = true;
    pinta();
    crida('creaMesura', {
      id_mesura: f.id, mesura_el: Logica.isoLocal(new Date()), sistolica: Number(f.sistolica), diastolica: Number(f.diastolica),
      pols: f.pols === '' ? '' : Number(f.pols), nota: f.nota,
      id_serie: estat.guia ? estat.guia.id : '', ordre_serie: estat.guia ? estat.guia.ordre : ''
    }).then(function (r) {
      estat.mesures = estat.mesures.filter(function (x) { return x.id_mesura !== r.mesura.id_mesura; }).concat([r.mesura]);
      estat.form = formNou();
      if (estat.mesures.length === 1) demanaPersistencia();
      if (estat.guia) { guiaDesada(r.mesura, v.valorMoltAlt); return; }
      pinta();
      confirmacio(r.mesura, v.valorMoltAlt);
    }).catch(function (error) {
      f.desant = false;
      f.error = missatgeError(error);
      pinta();
    });
  }

  function confirmacio(m, moltAlt) {
    var valors = m.sistolica + ' / ' + m.diastolica + (m.pols !== '' ? ' · ' + t('pols') + ' ' + m.pols : '');
    var temps = 0;
    var fons = dialeg([
      el('h2', { text: t('guardat') }),
      el('p', { class: 'confirmacio-valors', text: valors }),
      moltAlt ? el('p', { class: 'avis-alt', text: t('moltAlt') }) : null,
      el('button', { class: 'principal', text: t('tancar'), clic: function () { clearTimeout(temps); fons.remove(); } })
    ]);
    if (!moltAlt) temps = setTimeout(function () { fons.remove(); }, 3000);
  }

  /* Mesura guiada */
  var rellotge = null, audio = null, bloqueigPantalla = null;

  function obreGuia() {
    estat.form = formNou();
    estat.guia = { id: null, ordre: 1, preses: [], pas: 'inici', fi: 0 };
    estat.pantalla = 'guiada';
    pinta();
  }

  function aturaRellotge() {
    if (rellotge) clearInterval(rellotge);
    rellotge = null;
  }

  function demanaPantallaEncesa() {
    if (!navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(function (b) { bloqueigPantalla = b; }).catch(function () {});
  }

  function allibera() {
    aturaRellotge();
    if (bloqueigPantalla) bloqueigPantalla.release().catch(function () {});
    bloqueigPantalla = null;
  }

  function surtGuia() {
    allibera();
    estat.guia = null;
    estat.form = formNou();
    estat.pantalla = 'registrar';
    pinta();
  }

  /** Prepara el so dins del toc de «Començar», que és quan el navegador el permet. */
  function preparaAudio() {
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (Context) { audio = audio || new Context(); audio.resume(); }
    } catch (error) { audio = null; }
  }

  function avisSonor() {
    try {
      if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      if (!audio) return;
      [0, 0.4, 0.8].forEach(function (retard) {
        var oscil = audio.createOscillator(), guany = audio.createGain();
        oscil.frequency.value = 880;
        guany.gain.value = 0.4;
        oscil.connect(guany);
        guany.connect(audio.destination);
        oscil.start(audio.currentTime + retard);
        oscil.stop(audio.currentTime + retard + 0.25);
      });
    } catch (error) { audio = null; }
  }

  function iniciaGuia() {
    preparaAudio();
    demanaPantallaEncesa();
    estat.guia.id = Logica.uuid();
    iniciaEspera(estat.configGuia.minuts_repos);
  }

  function iniciaEspera(minuts) {
    aturaRellotge();
    if (minuts <= 0) { estat.guia.pas = 'presa'; pinta(); return; }
    estat.guia.fi = Date.now() + minuts * 60000;
    estat.guia.pas = 'espera';
    pinta();
    rellotge = setInterval(ticEspera, 500);
  }

  function textCompte(ms) {
    var segons = Math.ceil(Math.max(0, ms) / 1000);
    return Math.floor(segons / 60) + ':' + dosXifres(segons % 60);
  }

  function ticEspera() {
    if (!estat.guia || estat.guia.pas !== 'espera') { aturaRellotge(); return; }
    var resta = estat.guia.fi - Date.now();
    if (resta <= 0) { avisSonor(); acabaEspera(); return; }
    var compte = document.getElementById('compte');
    if (compte) compte.textContent = textCompte(resta);
  }

  function acabaEspera() {
    aturaRellotge();
    estat.guia.pas = 'presa';
    pinta();
  }

  function guiaDesada(mesura, moltAlt) {
    var g = estat.guia;
    g.preses.push(mesura);
    g.darrera = mesura;
    if (g.ordre >= estat.configGuia.preses_serie) {
      allibera();
      g.pas = 'resum';
      pinta();
    } else {
      g.ordre += 1;
      iniciaEspera(estat.configGuia.minuts_entre_preses);
    }
    if (moltAlt) confirmacio(mesura, true);
  }

  function valorsMesura(m) { return m.sistolica + ' / ' + m.diastolica + (m.pols !== '' ? ' · ' + t('pols') + ' ' + m.pols : ''); }

  function pantallaGuia() {
    var g = estat.guia, c = estat.configGuia;
    if (g.pas === 'presa') return el('main', { class: 'contingut' }, [pantallaRegistre()]);
    if (g.pas === 'inici') {
      return el('main', { class: 'contingut apilats' }, [
        el('h1', { text: t('guiada') }),
        el('p', { class: 'text-guia', text: t('introGuia').replace('{repos}', c.minuts_repos).replace('{n}', c.preses_serie).replace('{entre}', c.minuts_entre_preses) }),
        el('button', { class: 'principal', text: t('empezar'), clic: iniciaGuia }),
        el('button', { class: 'secundari', text: t('tornar'), clic: surtGuia })
      ]);
    }
    if (g.pas === 'espera') {
      return el('main', { class: 'contingut guia-espera apilats' }, [
        g.darrera ? el('p', { class: 'guia-desada', role: 'status', text: t('presaGuardada').replace('{n}', g.ordre - 1).replace('{v}', g.darrera.sistolica + ' / ' + g.darrera.diastolica) }) : null,
        el('h1', { text: g.preses.length ? t('esperaPresa').replace('{n}', g.ordre) : t('reposa') }),
        el('p', { id: 'compte', class: 'compte', role: 'timer', text: textCompte(g.fi - Date.now()) }),
        el('button', { class: 'boto-discret', text: t('jaEsperat'), clic: acabaEspera }),
        el('button', { class: 'secundari', text: t('sortir'), clic: surtGuia })
      ]);
    }
    var comptades = Logica.presesComptades(g.preses, c).map(function (m) { return m.id_mesura; });
    var mitjana = Logica.agrupaSeries(g.preses, c)[0];
    return el('main', { class: 'contingut apilats' }, [
      el('h1', { text: t('resultat') }),
      el('table', { class: 'resum ajustos' }, [el('tbody', {}, g.preses.map(function (m) {
        return el('tr', {}, [
          el('th', { scope: 'row' }, [el('span', { text: t('presa') + ' ' + m.ordre_serie }), comptades.indexOf(m.id_mesura) === -1 ? el('span', { class: 'no-compta', text: t('noCompta') }) : null]),
          el('td', { text: valorsMesura(m) })
        ]);
      }).concat([el('tr', {}, [
        el('th', { scope: 'row', text: t('mitjana') }),
        el('td', { class: 'mitjana-serie', text: Math.round(mitjana.sistolica) + ' / ' + Math.round(mitjana.diastolica) })
      ])]))]),
      el('button', { class: 'principal', text: t('acabar'), clic: surtGuia })
    ]);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !estat.guia || estat.guia.pas === 'resum') return;
    demanaPantallaEncesa();
    ticEspera();
  });

  /* Nota */
  function pantallaNota() {
    var f = estat.form;
    var area = el('textarea', { id: 'nota', maxlength: '500', rows: '6', 'aria-describedby': 'ajuda-nota' });
    area.value = f.nota;
    return el('main', { class: 'contingut pantalla-nota' }, [
      el('h1', { text: t('tituloNota') }),
      el('label', { id: 'ajuda-nota', for: 'nota', text: t('ajudaNota') }),
      area,
      el('button', {
        class: 'principal', text: t('tornar'),
        clic: function () {
          f.nota = area.value.trim().slice(0, 500);
          f.notaAfegida = !!f.nota;
          estat.pantalla = estat.guia ? 'guiada' : 'registrar';
          pinta();
        }
      })
    ]);
  }

  /* Historial */
  function mesuresOrdenades() {
    return estat.mesures.filter(function (m) { return !m.esborrat_el; }).sort(function (a, b) {
      return Date.parse(b.mesura_el) - Date.parse(a.mesura_el);
    });
  }

  function pantallaHistorial() {
    var llista = mesuresOrdenades();
    if (!llista.length) return el('section', {}, [el('h1', { text: t('historial') }), el('p', { text: t('senseMesures') })]);
    var perDia = {}, ordre = [];
    llista.forEach(function (m) {
      var d = Logica.parts(m.mesura_el).data;
      if (!perDia[d]) { perDia[d] = []; ordre.push(d); }
      perDia[d].push(m);
    });
    return el('section', {}, [el('h1', { text: t('historial') })].concat(ordre.map(function (d) {
      return el('div', { class: 'dia' }, [
        el('h2', { text: textData(perDia[d][0].mesura_el) }),
        el('div', {}, perDia[d].map(filaMesura))
      ]);
    })));
  }

  function filaMesura(m) {
    var valors = m.sistolica + ' / ' + m.diastolica + (m.corregida ? ' *' : '');
    return el('button', {
      class: 'fila-mesura', 'aria-label': t('editar') + ': ' + textHora(m.mesura_el) + ', ' + valors,
      clic: function () { obreEdicio(m); }
    }, [el('span', { class: 'fila' }, [
      el('span', { class: 'fila-hora', text: textHora(m.mesura_el) }),
      el('span', { class: 'fila-valor', text: valors }),
      el('span', { class: 'fila-pols', text: m.pols !== '' ? t('pols') + ' ' + m.pols : '' }),
      m.ordre_serie ? el('span', { class: 'fila-nota', text: t('presa') + ' ' + m.ordre_serie }) : null,
      m.nota ? el('span', { class: 'fila-nota', text: m.nota }) : null
    ])]);
  }

  /* Edició */
  function obreEdicio(m) {
    estat.edicio = m;
    estat.pantalla = 'editar';
    pinta();
  }

  function camp(id, etiqueta, entrada) {
    return el('div', {}, [el('label', { for: id, text: etiqueta }), entrada]);
  }

  function entradaNumero(id, valor, maxim) {
    var e = el('input', { id: id, type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: maxim || '3', autocomplete: 'off' });
    e.value = valor === '' || valor === undefined ? '' : String(valor);
    return e;
  }

  function pantallaEditar() {
    var m = estat.edicio;
    var p = Logica.parts(m.mesura_el);
    var dataInicial = p.data, horaInicial = textHora(m.mesura_el);
    var e = {
      sistolica: entradaNumero('e-sis', m.sistolica), diastolica: entradaNumero('e-dia', m.diastolica), pols: entradaNumero('e-pols', m.pols),
      data: el('input', { id: 'e-data', type: 'date' }), hora: el('input', { id: 'e-hora', type: 'time' }),
      nota: el('textarea', { id: 'e-nota', maxlength: '500', rows: '3' })
    };
    e.data.value = dataInicial; e.hora.value = horaInicial; e.nota.value = m.nota || '';
    var zonaError = el('p', { class: 'error zona-error', role: 'alert' });

    function tanca() { estat.pantalla = 'historial'; estat.edicio = null; pinta(); }

    var ocupat = false;

    /** Desa una modificació i torna a l'historial quan el dispositiu la confirma. */
    function envia(operacio, dades) {
      if (ocupat) return;
      ocupat = true;
      zonaError.textContent = t('guardant');
      crida(operacio, dades).then(function (r) {
        estat.mesures = estat.mesures.filter(function (x) { return x.id_mesura !== m.id_mesura; });
        if (r.mesura) estat.mesures.push(r.mesura);
        tanca();
      }).catch(function (error) {
        ocupat = false;
        zonaError.textContent = missatgeError(error);
      });
    }

    function guarda() {
      var valors = { sistolica: e.sistolica.value.trim(), diastolica: e.diastolica.value.trim(), pols: e.pols.value.trim() };
      var v = Logica.valida(valors);
      if (v.errors.length) { zonaError.textContent = textError(v.errors[0]); return; }
      var canviaData = e.data.value !== dataInicial || e.hora.value !== horaInicial;
      var novaData = canviaData ? Logica.composaIso(e.data.value, e.hora.value) : m.mesura_el;
      if (!novaData) { zonaError.textContent = t('dataInvalida'); return; }
      if (canviaData && Date.parse(novaData) > Date.now() + 300000) { zonaError.textContent = t('dataFutura'); return; }
      var pols = valors.pols === '' ? '' : Number(valors.pols);
      function aplica() {
        envia('editaMesura', {
          id_mesura: m.id_mesura, mesura_el: novaData, sistolica: Number(valors.sistolica), diastolica: Number(valors.diastolica),
          pols: pols, nota: e.nota.value.trim().slice(0, 500)
        });
      }
      if (v.avisos.length) dialegConfirmacio(v, valors, aplica);
      else aplica();
    }

    function esborra() {
      var fons = dialeg([
        el('h2', { text: t('borrarMesura') }),
        el('p', { class: 'confirmacio-valors', text: m.sistolica + ' / ' + m.diastolica }),
        el('button', {
          class: 'perill', text: t('siBorrar'),
          clic: function () {
            fons.remove();
            envia('esborraMesura', { id_mesura: m.id_mesura });
          }
        }),
        el('button', { class: 'secundari', text: t('tornar'), clic: function () { fons.remove(); } })
      ]);
    }

    return el('main', { class: 'contingut formulari' }, [
      el('h1', { text: t('editar') }),
      el('div', { class: 'tres-columnes' }, [
        camp('e-sis', t('sistolica'), e.sistolica), camp('e-dia', t('diastolica'), e.diastolica), camp('e-pols', t('pols'), e.pols)
      ]),
      el('div', { class: 'dues-columnes' }, [camp('e-data', t('data'), e.data), camp('e-hora', t('hora'), e.hora)]),
      camp('e-nota', t('nota'), e.nota),
      zonaError,
      el('button', { class: 'principal', text: t('guardar'), clic: guarda }),
      el('button', { class: 'secundari', text: t('tornar'), clic: tanca }),
      el('button', { class: 'perill', text: t('borrarBoto'), clic: esborra })
    ]);
  }

  /* Informe */
  function interval() {
    var p = estat.periode;
    if (p.tipus === 'pers') return { desde: p.desde, fins: p.fins };
    var fins = Logica.avui();
    return { desde: Logica.sumaDies(fins, 1 - p.tipus), fins: fins };
  }

  function objectius() {
    var p = estat.perfil || {};
    return { sistolica: p.objectiu_sistolica || 135, diastolica: p.objectiu_diastolica || 85 };
  }

  function parella(v) { return v ? v.sistolica + ' / ' + v.diastolica : '–'; }

  function filesResum(r) {
    var files = [[t('lectures'), String(r.lectures)], [t('dies'), String(r.dies)]];
    if (!r.suficient) { files.push([t('insuficients'), '']); return files; }
    files.push([t('mitjana'), parella(r.global)]);
    if (r.senseprimer) files.push([t('mitjanaSensePrimer'), parella(r.senseprimer)]);
    files.push([t('mati'), parella(r.mati)], [t('vespre'), parella(r.vespre)], [t('diferencia'), parella(r.diferencia)]);
    if (r.pols !== null) files.push([t('polsMitja'), String(r.pols)]);
    files.push([t('minim'), parella(r.minim)], [t('maxim'), parella(r.maxim)], [t('sobreObjectiu'), r.percentatgeSobre + ' %']);
    return files;
  }

  function selectorPeriode() {
    return el('div', { class: 'selector selector-4' }, [[7, 'd7'], [30, 'd30'], [90, 'd90'], ['pers', 'periodePers']].map(function (par) {
      return el('button', {
        class: 'opcio', 'aria-pressed': String(estat.periode.tipus === par[0]), text: t(par[1]),
        clic: function () {
          if (par[0] === 'pers' && !estat.periode.desde) {
            estat.periode.fins = Logica.avui();
            estat.periode.desde = Logica.sumaDies(estat.periode.fins, -13);
          }
          estat.periode.tipus = par[0];
          pinta();
        }
      });
    }));
  }

  function campsPeriode() {
    function entrada(id, clau, etiqueta) {
      var e = el('input', { id: id, type: 'date' });
      e.value = estat.periode[clau];
      e.addEventListener('change', function () { if (e.value) { estat.periode[clau] = e.value; pinta(); } });
      return el('div', {}, [el('label', { for: id, text: etiqueta }), e]);
    }
    return el('div', { class: 'interval' }, [entrada('i-desde', 'desde', t('desde')), entrada('i-fins', 'fins', t('fins'))]);
  }

  function opcionsGrafic(amplada, mida, alcada) {
    return { amplada: amplada, mida: mida, alcada: alcada, t: t, objectius: objectius(), franges: estat.franges };
  }

  function grafic(titol, model, descripcio, ajuda) {
    var svg = Grafics.aSvg(model, descripcio);
    var lectura = el('p', { class: 'lectura', 'aria-live': 'polite', text: ajuda });
    svg.addEventListener('click', function (ev) {
      var caixa = svg.getBoundingClientRect();
      lectura.textContent = svg.seleccionaX((ev.clientX - caixa.left) * model.w / caixa.width);
    });
    var figura = el('div', { class: 'grafic' }, [el('h2', { text: titol }), lectura]);
    figura.insertBefore(svg, lectura);
    return figura;
  }

  function dadesEvolucio(llista) {
    return estat.vistaGrafic === 'series' ? Logica.agrupaSeries(llista, estat.configGuia) : llista;
  }

  function selectorVista() {
    return el('div', { role: 'group', 'aria-label': t('veureGrafic') }, [
      el('p', { class: 'etiqueta-vista', text: t('veureGrafic') }),
      el('div', { class: 'selector' }, [['preses', 'totesPreses'], ['series', 'unaPerSerie']].map(function (par) {
        return el('button', { class: 'opcio', 'aria-pressed': String(estat.vistaGrafic === par[0]), text: t(par[1]), clic: function () { estat.vistaGrafic = par[0]; pinta(); } });
      }))
    ]);
  }

  function pantallaInforme() {
    var capcalera = [el('h1', { text: t('informe') }), selectorPeriode()];
    if (estat.periode.tipus === 'pers') capcalera.push(campsPeriode());
    var i = interval();
    if (i.desde > i.fins) {
      capcalera.push(el('p', { class: 'error', role: 'alert', text: t('intervalInvalid') }));
      return el('section', {}, capcalera);
    }
    var llista = Logica.filtraInterval(mesuresOrdenades(), i.desde, i.fins);
    var r = Logica.resum(llista, objectius(), estat.franges, estat.configGuia);
    var seccio = capcalera.concat([
      el('table', { class: 'resum' }, [el('tbody', {}, filesResum(r).map(function (f) {
        return el('tr', {}, [el('th', { scope: 'row', text: f[0] }), el('td', { text: f[1] })]);
      }))]),
      el('div', { class: 'exportacio' }, [
        el('button', { class: 'principal', disabled: !llista.length, text: t('pdf'), clic: function () { compartirPdf(llista, r, i); } }),
        el('button', { class: 'principal', disabled: !llista.length, text: t('csv'), clic: function () { compartirCsv(llista); } })
      ])
    ]);
    if (llista.length) {
      var amplada = Math.min(arrel.clientWidth || 320, 520) - 24;
      var grups = Logica.mitjanesFranja(Logica.agrupaSeries(llista, estat.configGuia), i.desde, i.fins, estat.franges);
      if (llista.some(function (m) { return m.id_serie; })) seccio.push(selectorVista());
      seccio.push(grafic(t('evolucio'), Grafics.evolucio(dadesEvolucio(llista), opcionsGrafic(amplada, 16, 220)), t('evolucio') + '. ' + parella(r.global), t('tocaGrafic')));
      seccio.push(grafic(t('grafFranges') + ' · ' + t(grups.perDia ? 'perDia' : 'perSetmana'), Grafics.franges(grups, opcionsGrafic(amplada, 16, 130)), t('grafFranges') + '. ' + t('mati') + ' ' + parella(r.mati) + '. ' + t('vespre') + ' ' + parella(r.vespre), t('tocaGrafic')));
    }
    return el('section', {}, seccio);
  }

  function generaPdf(llista, r, i) {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var y = 18;
    function peu() {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(t('peuPdf'), 15, 287);
      doc.text(t('notaCorregida'), 195, 287, { align: 'right' });
    }
    function novaPagina() { peu(); doc.addPage(); y = 18; }
    function salt(alcada) { if (y + alcada > 278) novaPagina(); }
    doc.setFontSize(18);
    doc.text(t('tituloPdf'), 15, y); y += 9;
    doc.setFontSize(11);
    doc.text((estat.perfil && estat.perfil.nom) || '', 15, y); y += 6;
    doc.text(t('interval') + ': ' + textDataPdf(ambHora(i.desde)) + ' – ' + textDataPdf(ambHora(i.fins)), 15, y); y += 6;
    doc.text(t('generat') + ': ' + textDataPdf(Logica.isoLocal(new Date())), 15, y); y += 10;
    filesResum(r).forEach(function (f) {
      salt(6);
      doc.setFontSize(11);
      doc.text(f[0], 15, y);
      doc.text(f[1], 110, y);
      y += 6;
    });
    y += 6;

    function afegeixGrafic(titol, model) {
      var alcada = model.h * 180 / model.w;
      salt(alcada + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(titol, 15, y);
      doc.setFont('helvetica', 'normal');
      y += 3;
      Grafics.aPdf(doc, model, 15, y, 180);
      y += alcada + 6;
    }
    var grups = Logica.mitjanesFranja(Logica.agrupaSeries(llista, estat.configGuia), i.desde, i.fins, estat.franges);
    afegeixGrafic(t('evolucio'), Grafics.evolucio(dadesEvolucio(llista), opcionsGrafic(640, 14, 220)));
    afegeixGrafic(t('grafFranges') + ' · ' + t(grups.perDia ? 'perDia' : 'perSetmana'), Grafics.franges(grups, opcionsGrafic(640, 14, 130)));

    var cols = [[t('data'), 15], [t('dia'), 41], [t('hora'), 67], [t('presa'), 80], [t('franja'), 93], [t('sistolica'), 110], [t('diastolica'), 127], [t('pols'), 144], [t('nota'), 158]];
    function capcalera() {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      cols.forEach(function (c) { doc.text(c[0], c[1], y); });
      doc.setFont('helvetica', 'normal');
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 7;
    }
    salt(14);
    capcalera();
    llista.forEach(function (m) {
      var nota = doc.splitTextToSize(m.nota || '', 37);
      var alcada = Math.max(6, nota.length * 4.5);
      if (y + alcada > 278) { novaPagina(); capcalera(); }
      doc.setFontSize(10);
      doc.text(Logica.dataCurta(m.mesura_el) + (m.corregida ? ' *' : ''), 15, y);
      doc.text(t('diesSetmana')[Logica.parts(m.mesura_el).diaSetmana], 41, y);
      doc.text(textHora(m.mesura_el), 67, y);
      doc.text(m.ordre_serie ? String(m.ordre_serie) : '', 80, y);
      doc.text(t(Logica.franja(m.mesura_el, estat.franges)), 93, y);
      doc.text(String(m.sistolica), 110, y);
      doc.text(String(m.diastolica), 127, y);
      doc.text(m.pols === '' ? '' : String(m.pols), 144, y);
      doc.text(nota, 158, y);
      y += alcada;
    });
    peu();
    return doc.output('blob');
  }

  function descarrega(fitxer) {
    var enllac = el('a', { href: URL.createObjectURL(fitxer), download: fitxer.name });
    document.body.appendChild(enllac);
    enllac.click();
    enllac.remove();
  }

  function comparteix(fitxer, titol) {
    if (navigator.canShare && navigator.canShare({ files: [fitxer] })) {
      navigator.share({ files: [fitxer], title: titol }).catch(function (error) {
        if (error.name !== 'AbortError') descarrega(fitxer);
      });
      return;
    }
    descarrega(fitxer);
  }

  function compartirPdf(llista, r, i) {
    comparteix(new File([generaPdf(llista, r, i)], 'tension-arterial.pdf', { type: 'application/pdf' }), t('tituloPdf'));
  }

  function compartirCsv(llista) {
    var text = Logica.generaCsv(llista, t, estat.franges);
    comparteix(new File([text], 'tension-arterial.csv', { type: 'text/csv;charset=utf-8' }), t('tituloPdf'));
  }

  /* Ajustos */
  function textMoment(iso) {
    return iso ? Logica.dataCurta(iso) + ' ' + Logica.horaCurta(iso) : t('mai');
  }

  function taula(files) {
    return el('table', { class: 'resum ajustos' }, [el('tbody', {}, files.map(function (f) {
      return el('tr', {}, [el('th', { scope: 'row', text: f[0] }), el('td', { text: f[1] })]);
    }))]);
  }

  function esIosSenseInstallar() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  }

  function installa() {
    var peticio = estat.installacio;
    if (!peticio) return;
    estat.installacio = null;
    peticio.prompt();
    pinta();
  }

  function pantallaAjustes() {
    var p = estat.perfil || {};
    var fills = [
      el('h1', { text: t('ajustes') }),
      selectorIdioma(),
      taula([
        [t('nomPersona'), p.nom || '–'],
        [t('objectiu'), objectius().sistolica + ' / ' + objectius().diastolica],
        [t('ultimaCopia'), textMoment(estat.copies.ultima)],
        [t('versio'), Config.VERSIO]
      ]),
      el('button', { class: 'secundari', text: t('canviarDades'), clic: function () { estat.pantalla = 'perfil'; pinta(); } }),
      el('button', { class: 'secundari', text: t('guiada'), clic: function () { estat.pantalla = 'configGuia'; pinta(); } }),
      el('button', { class: 'secundari', text: t('copies'), clic: function () { obreCopies(''); } }),
      el('button', { class: 'secundari', text: t('novetats'), clic: function () { estat.pantalla = 'novetats'; pinta(); } })
    ];
    if (estat.installacio) fills.push(el('button', { class: 'secundari', text: t('installar'), clic: installa }));
    else if (esIosSenseInstallar()) fills.push(el('p', { class: 'ajuda ajuda-installar', text: t('ajudaInstallarIos') }));
    return el('section', { class: 'apilats' }, fills);
  }

  /** Desa canvis de perfil al dispositiu i els aplica quan es confirmen. */
  function desaPerfil(canvis) {
    return crida('actualitzaPerfil', canvis);
  }

  function pantallaConfigGuia() {
    var c = estat.configGuia;
    var camps = [['preses_serie', 'presesSerie'], ['minuts_repos', 'minutsRepos'], ['minuts_entre_preses', 'minutsEntre'], ['preses_descartades', 'presesDescartades']];
    var entrades = {};
    var zonaError = el('p', { class: 'error zona-error', role: 'alert' });
    function torna() { estat.pantalla = 'ajustes'; pinta(); }
    function guarda() {
      var valors = {};
      camps.forEach(function (par) { valors[par[0]] = entrades[par[0]].value.trim(); });
      zonaError.textContent = t('guardant');
      crida('desaGuia', valors).then(torna).catch(function (error) { zonaError.textContent = missatgeError(error); });
    }
    return el('main', { class: 'contingut formulari' }, [
      el('h1', { text: t('guiada') }),
      el('p', { class: 'ajuda', text: t('ajudaConfigGuia') })
    ].concat(camps.map(function (par) {
      entrades[par[0]] = entradaNumero('g-' + par[0], c[par[0]], '2');
      return camp('g-' + par[0], t(par[1]), entrades[par[0]]);
    })).concat([
      zonaError,
      el('button', { class: 'principal', text: t('guardar'), clic: guarda }),
      el('button', { class: 'secundari', text: t('tornar'), clic: torna })
    ]));
  }

  /* Còpies de seguretat */

  /** Demana al navegador que no esborri les dades per falta d'espai o d'ús. */
  function demanaPersistencia() {
    if (!navigator.storage || !navigator.storage.persist) return;
    navigator.storage.persist().then(function (protegit) { estat.protegit = protegit; }).catch(function () {});
  }

  /**
   * Obre la pantalla de còpies. La còpia es deixa preparada perquè el botó la pugui
   * compartir dins del mateix toc, que és quan el telèfon ho permet.
   */
  function obreCopies(avis) {
    estat.avisCopies = avis || '';
    return Promise.all([servei.copiesInternes(), servei.fesCopia('manual')]).then(function (r) {
      estat.copiesInternes = r[0];
      estat.copiaPreparada = r[1];
    }).catch(function () {
      estat.copiesInternes = [];
      estat.copiaPreparada = null;
    }).then(function () {
      refresca();
      estat.pantalla = 'copies';
      pinta();
    });
  }

  function avisDialeg(titol, text) {
    var fons = dialeg([
      el('h2', { text: titol }),
      text ? el('p', { text: text }) : null,
      el('button', { class: 'principal', text: t('tancar'), clic: function () { fons.remove(); } })
    ]);
  }

  function mostraErrorCopia(error) {
    avisDialeg(t('copies'), missatgeError(error));
  }

  /** Lliura un fitxer de còpia amb el menú del sistema o, si no n'hi ha, el descarrega. Resol `false` si es cancel·la. */
  function lliuraCopia(copia) {
    var fitxer = new File([copia.text], copia.nom, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [fitxer] })) {
      return navigator.share({ files: [fitxer], title: t('copies') }).then(function () { return true; }, function (error) {
        if (error.name === 'AbortError') return false;
        descarrega(fitxer);
        return true;
      });
    }
    descarrega(fitxer);
    return Promise.resolve(true);
  }

  function fesCopiaAra() {
    var copia = estat.copiaPreparada;
    if (!copia) return;
    lliuraCopia(copia).then(function (feta) {
      if (!feta) return null;
      return servei.anotaCopia().then(function () { return obreCopies(t('copiaFeta')); });
    }).catch(mostraErrorCopia);
  }

  /** Diàleg d'una acció que substitueix o esborra dades: cal escriure una paraula per confirmar. */
  function dialegEscrit(titol, avis, files, paraula, textBoto, enAcceptar) {
    var entrada = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': paraula });
    function coincideix() { return entrada.value.trim().toUpperCase() === paraula; }
    var boto = el('button', {
      class: 'perill', text: textBoto, disabled: true,
      clic: function () { if (coincideix()) { fons.remove(); enAcceptar(); } }
    });
    entrada.addEventListener('input', function () { boto.disabled = !coincideix(); });
    var fons = dialeg([
      el('h2', { text: titol }),
      el('p', { class: 'avis-alt', text: avis }),
      taula(files),
      el('p', { text: t('escriuPerConfirmar').replace('{paraula}', paraula) }),
      entrada,
      boto,
      el('button', { class: 'secundari', text: t('tornar'), clic: function () { fons.remove(); } })
    ]);
  }

  /** Comprova una còpia sense tocar cap dada i, si és vàlida, en demana la confirmació. */
  function revisaIConfirma(text, origen) {
    return servei.preparaImportacio(text).then(function (p) {
      var files = [
        [t('copiaDel'), p.resum.data ? textMoment(p.resum.data) : '–'],
        [t('versio'), p.resum.versio || '–'],
        [t('mesuresAra'), String(p.resum.ara)],
        [t('mesuresCopia'), String(p.resum.copia)]
      ];
      dialegEscrit(t('titolImportar'), t('avisImportar'), files, t('paraulaImportar'), t('siRecuperar'), function () {
        servei.importa(p.revisada, origen).then(function (r) {
          estat.mesures = r.mesures;
          estat.form = formNou();
          return obreCopies(t('importat'));
        }).catch(function (error) {
          mostraErrorCopia(error);
          if (estat.pantalla === 'copies') obreCopies('');
        });
      });
    });
  }

  function llegeixText(fitxer) {
    return new Promise(function (resol, rebutja) {
      var lector = new FileReader();
      lector.onload = function () { resol(String(lector.result)); };
      lector.onerror = function () { rebutja(new Error('COPIA_ILLEGIBLE')); };
      lector.readAsText(fitxer);
    });
  }

  function triaFitxer() {
    var entrada = el('input', { type: 'file', accept: '.json,application/json', class: 'amagat' });
    entrada.addEventListener('change', function () {
      var fitxer = entrada.files && entrada.files[0];
      entrada.remove();
      if (!fitxer) return;
      if (fitxer.size > Config.LIMITS.midaCopia) { mostraErrorCopia(new Error('COPIA_MASSA_GRAN')); return; }
      llegeixText(fitxer).then(function (text) { return revisaIConfirma(text, 'fitxer'); }).catch(mostraErrorCopia);
    });
    document.body.appendChild(entrada);
    entrada.click();
  }

  function borraTot() {
    dialegEscrit(t('titolBorrarTot'), t('avisBorrarTot'), [[t('mesuresDesades'), String(estat.mesures.length)]], t('paraulaBorrar'), t('siBorrarTot'), function () {
      servei.esborraTot().then(function () {
        estat.mesures = [];
        estat.form = formNou();
        refresca();
        estat.pantalla = 'benvinguda';
        pinta();
        avisDialeg(t('totBorrat'), '');
      }).catch(mostraErrorCopia);
    });
  }

  function filaCopia(c) {
    function esborra() {
      var fons = dialeg([
        el('h2', { text: t('borrarCopia') }),
        el('p', { text: textMoment(c.data) }),
        el('button', {
          class: 'perill', text: t('siBorrar'),
          clic: function () {
            fons.remove();
            servei.esborraCopiaInterna(c.id).then(function () { return obreCopies(''); }).catch(mostraErrorCopia);
          }
        }),
        el('button', { class: 'secundari', text: t('tornar'), clic: function () { fons.remove(); } })
      ]);
    }
    return el('div', { class: 'copia-interna' }, [
      el('p', { class: 'guia-desada', text: textMoment(c.data) }),
      el('p', { text: t('motiu_' + c.motiu) + ' · ' + t('mesuresN').replace('{n}', c.mesures) }),
      el('div', { class: 'tres-columnes' }, [
        el('button', { class: 'secundari', text: t('recuperar'), clic: function () { revisaIConfirma(c.text, 'interna').catch(mostraErrorCopia); } }),
        el('button', { class: 'secundari', text: t('exportar'), clic: function () { lliuraCopia(c).catch(mostraErrorCopia); } }),
        el('button', { class: 'perill', text: t('borrar'), clic: esborra })
      ])
    ]);
  }

  function selectorAvis() {
    return el('div', { role: 'group', 'aria-label': t('recordatori') }, [
      el('p', { class: 'etiqueta-vista', text: t('recordatori') }),
      el('div', { class: 'selector selector-4' }, [['7', 'cada7'], ['30', 'cada30'], ['0', 'mai']].map(function (par) {
        return el('button', {
          class: 'opcio', 'aria-pressed': String(String(estat.copies.diesAvis) === par[0]), text: t(par[1]),
          clic: function () { crida('desaDiesAvis', par[0]).then(pinta).catch(mostraErrorCopia); }
        });
      }))
    ]);
  }

  function pantallaCopies() {
    var c = estat.copies;
    var files = [
      [t('ultimaCopia'), textMoment(c.ultima)],
      [t('canvisSenseCopia'), String(c.canvis)],
      [t('mesuresDesades'), String(estat.mesures.length)]
    ];
    if (estat.protegit !== null) files.push([t('protegit'), estat.protegit ? t('si') : t('no')]);
    return el('main', { class: 'contingut apilats' }, [
      el('h1', { text: t('copies') }),
      el('p', { class: 'ajuda', text: t('ajudaCopies') }),
      estat.avisCopies ? el('p', { class: 'avis', role: 'status', text: estat.avisCopies }) : null,
      taula(files),
      el('button', { class: 'principal', disabled: !estat.copiaPreparada, text: t('ferCopia'), clic: fesCopiaAra }),
      el('button', { class: 'secundari', text: t('recuperarCopia'), clic: triaFitxer }),
      selectorAvis(),
      el('h2', { text: t('copiesAuto') }),
      el('p', { class: 'ajuda', text: t('ajudaCopiesAuto') }),
      estat.copiesInternes.length
        ? el('div', {}, estat.copiesInternes.map(filaCopia))
        : el('p', { text: t('senseCopiesAuto') }),
      el('button', { class: 'perill', text: t('borrarTot'), clic: borraTot }),
      el('button', { class: 'secundari', text: t('tornar'), clic: function () { estat.pantalla = 'ajustes'; pinta(); } })
    ]);
  }

  /** Recorda la còpia en obrir l'aplicació, com a màxim una vegada al dia. */
  function avisaCopia() {
    if (!servei.calAvisar()) return;
    var fons = dialeg([
      el('h2', { text: t('copies') }),
      el('p', { text: estat.copies.ultima ? t('avisCopia').replace('{dies}', servei.diesSenseCopia()) : t('avisCopiaMai') }),
      el('button', { class: 'principal', text: t('ferCopia'), clic: function () { fons.remove(); obreCopies(''); } }),
      el('button', { class: 'secundari', text: t('mesTard'), clic: function () { fons.remove(); servei.ajornaAvis().catch(function () {}); } })
    ]);
  }

  /* Benvinguda */
  function pantallaBenvinguda() {
    var nom = el('input', { id: 'b-nom', type: 'text', maxlength: '100', autocomplete: 'off' });
    function comenca() {
      servei.completaBenvinguda(nom.value).then(function () {
        refresca();
        estat.pantalla = 'registrar';
        pinta();
        demanaPersistencia();
      }).catch(function (error) { avisDialeg(t('nomApp'), missatgeError(error)); });
    }
    return el('main', { class: 'contingut formulari benvinguda' }, [
      el('h1', { text: t('benvinguda') }),
      selectorIdioma(),
      el('p', { text: t('textBenvinguda') }),
      camp('b-nom', t('nomOpcional'), nom),
      el('button', { class: 'principal', text: t('empezar'), clic: comenca }),
      el('button', { class: 'secundari', text: t('recuperarCopia'), clic: triaFitxer })
    ]);
  }

  function pantallaPerfil() {
    var p = estat.perfil || {};
    var nom = el('input', { id: 'p-nom', type: 'text', maxlength: '100', autocomplete: 'off' });
    nom.value = p.nom || '';
    var max = entradaNumero('p-max', objectius().sistolica), min = entradaNumero('p-min', objectius().diastolica);
    var zonaError = el('p', { class: 'error zona-error', role: 'alert' });
    function torna() { estat.pantalla = 'ajustes'; pinta(); }
    function guarda() {
      var n = nom.value.trim(), s = max.value.trim(), d = min.value.trim();
      if (!n) { zonaError.textContent = t('nomBuit'); return; }
      if (!/^\d{2,3}$/.test(s) || !/^\d{2,3}$/.test(d) || +s < 90 || +s > 200 || +d < 50 || +d > 130) { zonaError.textContent = t('objectiuInvalid'); return; }
      zonaError.textContent = t('guardant');
      desaPerfil({ nom: n, objectiu_sistolica: +s, objectiu_diastolica: +d }).then(torna).catch(function (error) {
        zonaError.textContent = missatgeError(error);
      });
    }
    return el('main', { class: 'contingut formulari' }, [
      el('h1', { text: t('dadesPersonals') }),
      camp('p-nom', t('nomPersona'), nom),
      el('div', { class: 'dues-columnes' }, [camp('p-max', t('objectiuMax'), max), camp('p-min', t('objectiuMin'), min)]),
      el('p', { class: 'ajuda', text: t('ajudaObjectiu') }),
      zonaError,
      el('button', { class: 'principal', text: t('guardar'), clic: guarda }),
      el('button', { class: 'secundari', text: t('tornar'), clic: torna })
    ]);
  }

  function pantallaNovetats() {
    return el('main', { class: 'contingut' }, [el('h1', { text: t('novetats') })].concat(Textos.novetats.map(function (n) {
      return el('div', { class: 'novetat' }, [
        el('h2', { text: n.versio + ' · ' + n.data }),
        el('ul', {}, n[estat.idioma].map(function (x) { return el('li', { text: x }); }))
      ]);
    })).concat([el('button', { class: 'principal', text: t('tornar'), clic: function () { estat.pantalla = 'ajustes'; pinta(); } })]));
  }

  /* Arrencada */
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    estat.installacio = ev;
    if (estat.pantalla === 'ajustes' && servei) pinta();
  });
  window.addEventListener('appinstalled', function () {
    estat.installacio = null;
    if (estat.pantalla === 'ajustes' && servei) pinta();
  });

  function arrenca() {
    estat.form = formNou();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
    Magatzem.obre().then(function (magatzem) {
      servei = Servei.crea(magatzem);
      return servei.inicia();
    }).then(function (r) {
      var e = refresca();
      estat.mesures = r.mesures;
      if (!e.benvinguda) {
        estat.pantalla = 'benvinguda';
        if (!r.mesures.length && /^ca\b/i.test(navigator.language || '')) estat.idioma = 'ca';
      }
      pinta();
      if (e.benvinguda) avisaCopia();
      if (navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then(function (protegit) {
          estat.protegit = protegit;
          if (!protegit && estat.mesures.length) demanaPersistencia();
        }).catch(function () {});
      }
    }).catch(function (error) {
      estat.errorInici = error && TEXTOS.es[error.message] ? error.message : 'senseMagatzem';
      pinta();
    });
  }

  arrenca();
})();
