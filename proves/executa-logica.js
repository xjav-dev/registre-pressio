/**
 * executa-logica.js — registre-pressio
 * Proves de les regles sense interfície, amb càlculs independents.
 * S'executa amb: node proves/executa-logica.js
 * Versió: 0.12.0 · 2026-11-10
 */
'use strict';
const path = require('path');
const arrel = path.join(__dirname, '..');
const L = require(path.join(arrel, 'js', 'logica.js'));
const T = require(path.join(arrel, 'js', 'textos.js'));
const Config = require(path.join(arrel, 'js', 'config.js'));

let n = 0, fallades = 0;
const igual = (a, b, desc) => { n++; if (JSON.stringify(a) !== JSON.stringify(b)) { fallades++; console.log('✗ ' + desc + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); } };

// Salt automàtic
igual(L.campComplet('sistolica', '12'), false, 'sistòlica 12 espera una xifra més');
igual(L.campComplet('sistolica', '128'), true, 'sistòlica 128 completa');
igual(L.campComplet('sistolica', '98'), true, 'sistòlica 98 completa');
igual(L.campComplet('sistolica', '21'), false, 'sistòlica 21 espera una xifra més');
igual(L.campComplet('diastolica', '82'), true, 'diastòlica 82 completa');
igual(L.campComplet('diastolica', '10'), false, 'diastòlica 10 espera una xifra més');
igual(L.campComplet('pols', '110'), true, 'pols 110 complet');

// Validació
igual(L.valida({ sistolica: '128', diastolica: '82', pols: '' }).errors, [], 'pols opcional');
igual(L.valida({ sistolica: '', diastolica: '82', pols: '' }).errors[0].codi, 'FALTA', 'sistòlica obligatòria');
igual(L.valida({ sistolica: '310', diastolica: '82', pols: '' }).errors[0].codi, 'FORA_DE_RANG', 'rebuig alt');
igual(L.valida({ sistolica: '260', diastolica: '82', pols: '' }).avisos[0].codi, 'IMPROBABLE', 'avís alt');
igual(L.valida({ sistolica: '250', diastolica: '82', pols: '' }).avisos, [], 'límit d\'avís inclòs');
igual(L.valida({ sistolica: '80', diastolica: '90', pols: '' }).avisos.slice(-1)[0].codi, 'MINIMA_SUPERIOR', 'mínima superior');
igual(L.valida({ sistolica: '180', diastolica: '90', pols: '' }).valorMoltAlt, true, 'molt alt per sistòlica');
igual(L.valida({ sistolica: '150', diastolica: '120', pols: '' }).valorMoltAlt, true, 'molt alt per diastòlica');
igual(L.valida({ sistolica: '179', diastolica: '119', pols: '' }).valorMoltAlt, false, 'no molt alt');

// Dates: 8 de novembre de 2026 és diumenge
igual(L.parts('2026-11-08T23:30:00+01:00').diaSetmana, 0, 'dia de la setmana');
igual(L.parts('2026-11-08T23:30:00+01:00').data, '2026-11-08', 'la data no canvia de dia');
igual(L.parts('2026-02-28T00:05:00-05:00').hora, 0, 'desplaçament respectat');
igual(L.franja('2026-11-08T03:59:00+01:00'), 'vespre', 'abans del matí');
igual(L.franja('2026-11-08T04:00:00+01:00'), 'mati', 'inici del matí');
igual(L.franja('2026-11-08T13:59:00+01:00'), 'mati', 'final del matí');
igual(L.franja('2026-11-08T14:00:00+01:00'), 'vespre', 'inici del vespre');
igual(L.franja('2026-11-08T14:30:00+01:00', { inici_mati: '05:00', fi_mati: '15:00' }), 'mati', 'franges configurables');
const iso = L.isoLocal(new Date('2026-07-01T10:00:00Z'));
igual(Date.parse(iso), Date.parse('2026-07-01T10:00:00Z'), 'isoLocal conserva l\'instant');

// Resum amb 5 dies: mitjanes calculades a mà
const m = (d, h, s, di, p, extra) => Object.assign({ mesura_el: '2026-11-0' + d + 'T' + h + ':00:00+01:00', sistolica: s, diastolica: di, pols: p }, extra);
const dades = [m(1, '08', 150, 100, 80), m(2, '08', 130, 80, 70), m(2, '20', 140, 90, ''), m(3, '08', 120, 70, 60), m(4, '20', 134, 84, 60), m(5, '08', 126, 76, 70), m(5, '09', 200, 120, 90, { esborrat_el: '2026-11-05T10:00:00Z' })];
const r = L.resum(dades, { sistolica: 135, diastolica: 85 });
igual(r.lectures, 6, 'exclou les esborrades');
igual(r.dies, 5, 'dies amb dades');
igual(r.global, { sistolica: 133, diastolica: 83 }, 'mitjana global');
igual(r.senseprimer, { sistolica: 130, diastolica: 80 }, 'mitjana sense el primer dia');
igual(r.mati, { sistolica: 132, diastolica: 82 }, 'mitjana de matí');
igual(r.vespre, { sistolica: 137, diastolica: 87 }, 'mitjana de vespre');
igual(r.diferencia, { sistolica: -5, diastolica: -5 }, 'diferència');
igual(r.pols, 68, 'pols mitjà sense buits');
igual(r.minim, { sistolica: 120, diastolica: 70 }, 'mínim');
igual(r.maxim, { sistolica: 150, diastolica: 100 }, 'màxim');
igual(r.percentatgeSobre, 33, 'percentatge per sobre');
igual(r.suficient, true, 'dies suficients');
igual(L.resum(dades.slice(0, 2), { sistolica: 135, diastolica: 85 }).suficient, false, 'dies insuficients');
igual(L.resum(dades.slice(0, 2), { sistolica: 135, diastolica: 85 }).senseprimer, null, 'menys de 4 dies');
igual(L.resum([], { sistolica: 135, diastolica: 85 }).global, null, 'sense dades');

// CSV
igual(L.celaCsv('=1+1'), "'=1+1", 'neutralitza =');
igual(L.celaCsv('+34'), "'+34", 'neutralitza +');
igual(L.celaCsv('-1'), "'-1", 'neutralitza -');
igual(L.celaCsv('@a'), "'@a", 'neutralitza @');
igual(L.celaCsv('a;b"c'), '"a;b""c"', 'escapa el separador');

// Textos: mateixes claus en tots dos idiomes
const context = { T: T.app };
igual(Object.keys(context.T.ca).sort(), Object.keys(context.T.es).sort(), 'claus iguals en castellà i català');


// Intervals i dates
igual(L.sumaDies('2026-11-08', -6), '2026-11-02', 'resta dies');
igual(L.sumaDies('2026-02-28', 1), '2026-03-01', 'canvi de mes');
const inter = [m(1, '23', 120, 80, 70), m(2, '00', 121, 80, 70), m(3, '08', 122, 80, 70, { esborrat_el: 'x' })];
igual(L.filtraInterval(inter, '2026-11-01', '2026-11-01').length, 1, 'extrem final inclòs');
igual(L.filtraInterval(inter, '2026-11-02', '2026-11-30').length, 1, 'extrem inicial inclòs i esborrades fora');
igual(L.composaIso('2026-02-30', '10:00'), null, 'data impossible');
igual(L.composaIso('', '10:00'), null, 'data buida');
igual(L.composaIso('2026-11-08', '10:05').slice(0, 16), '2026-11-08T10:05', 'composa data i hora');
igual(L.dataCurta('2026-11-08T23:30:00+01:00'), '08/11/2026', 'data curta');

// Sèries
const pr = (o, s, d, p, hora) => ({ id_mesura: 'm' + o, id_serie: 's1', ordre_serie: o, mesura_el: '2026-11-01T08:' + hora + ':00+01:00', sistolica: s, diastolica: d, pols: p });
const serie1 = [pr(3, 120, 80, 60, '09'), pr(1, 150, 95, 90, '05'), pr(2, 130, 85, '', '07')];
const u1 = L.agrupaSeries(serie1)[0];
igual([Math.round(u1.sistolica), Math.round(u1.diastolica), u1.pols, u1.preses], [133, 87, 75, 3], 'mitjana de les 3 preses');
const u2 = L.agrupaSeries(serie1, { preses_descartades: 1 })[0];
igual([u2.sistolica, Math.round(u2.diastolica), u2.pols, u2.preses, u2.mesura_el.slice(11, 16)], [125, 83, 60, 2, '08:07'], 'descarta la primera per configuració');
igual(L.agrupaSeries([pr(1, 150, 95, 90, '05')], { preses_descartades: 1 })[0].sistolica, 150, 'una sèrie incompleta no es perd');
igual(L.agrupaSeries(serie1.concat([m(2, '09', 111, 70, 60)])).length, 2, 'les mesures directes són unitats pròpies');
igual(L.agrupaSeries(serie1.map((x, i) => (i === 1 ? Object.assign({}, x, { esborrat_el: 'x' }) : x)))[0].preses, 2, 'una presa esborrada no compta');
const rs = L.resum(serie1.concat([m(2, '20', 140, 90, 80), m(3, '20', 140, 90, 80)]), { sistolica: 135, diastolica: 85 });
igual(rs.lectures, 5, 'lectures: totes les preses');
igual(rs.unitats, 3, 'unitats per a les mitjanes');
igual(rs.global, { sistolica: 138, diastolica: 89 }, 'la mitjana compta la sèrie una sola vegada');
igual(rs.maxim, { sistolica: 150, diastolica: 95 }, 'el màxim no es perd amb la mitjana');
igual(rs.minim, { sistolica: 120, diastolica: 80 }, 'el mínim no es perd amb la mitjana');
igual(L.resum(serie1.concat([m(2, '20', 140, 90, 80), m(3, '20', 140, 90, 80)]), { sistolica: 135, diastolica: 88 }).percentatgeSobre, 67, 'percentatge per unitat');

// Mitjanes per franja
const curt = L.mitjanesFranja(dades, '2026-11-01', '2026-11-05');
igual(curt.perDia, true, 'per dia fins a 14 dies');
igual(curt.punts.length, 5, 'un punt per dia');
igual(curt.punts[1].vespre, { sistolica: 140, diastolica: 90 }, 'mitjana de vespre del dia');
igual(curt.punts[3].mati, null, 'dia sense mesura de matí');
igual(L.mitjanesFranja(dades, '2026-11-01', '2026-11-14').perDia, true, '14 dies encara és per dia');
const llarg = L.mitjanesFranja(dades, '2026-11-01', '2026-11-15');
igual(llarg.perDia, false, '15 dies és per setmana');
igual(llarg.punts[0].data, '2026-10-26', 'la setmana comença en dilluns');
igual(llarg.punts[0].mati, { sistolica: 150, diastolica: 100 }, 'mitjana de la primera setmana');
igual(llarg.punts[1].mati, { sistolica: 125, diastolica: 75 }, 'mitjana de la segona setmana');

// CSV
const contextCsv = { T: T.app };
const tEs = (k) => contextCsv.T.es[k];
const csv = L.generaCsv([m(8, '08', 128, 82, '', { nota: '=A1;"x"', corregida: true })], tEs);
igual(csv.charCodeAt(0), 0xFEFF, 'CSV amb BOM');
const filesCsv = csv.slice(1).split('\r\n');
igual(filesCsv[0], 'Fecha;Día;Hora;Toma;Franja;Máxima;Mínima;Pulso;Nota;Corregida', 'capçaleres en castellà');
igual(filesCsv[1], '08/11/2026;domingo;08:00;;Mañana;128;82;;' + L.celaCsv('=A1;"x"') + ';Sí', 'fila del CSV');
igual(L.celaCsv('=A1;"x"').charAt(1), "'", 'nota neutralitzada dins del CSV');

// Gràfics
const G = require(path.join(arrel, 'js', 'grafics.js'));
const opts = { amplada: 300, mida: 16, alcada: 200, t: (k) => contextCsv.T.es[k], objectius: { sistolica: 135, diastolica: 85 } };
const ev = G.evolucio(dades.slice(0, 6), opts);
const dins = (mod) => mod.prims.every((p) => p.t !== 'text' || (p.x >= 0 && p.x <= mod.w && p.y <= mod.h));
igual(dins(ev), true, 'els textos de l\'evolució caben');
igual(ev.lectures.length, 6, 'una lectura per mesura');
igual(ev.prims.filter((p) => p.t === 'linia' && p.puntejat && p.x2 - p.x1 > 50).length, 2, 'dues línies d\'objectiu');
igual(ev.prims.filter((p) => p.t === 'polilinia').length, 2, 'dues sèries');
igual(ev.prims.some((p) => p.t === 'quadrat') && ev.prims.some((p) => p.t === 'cercle'), true, 'matí i vespre amb formes diferents');
const fr = G.franges(curt, opts);
igual(dins(fr), true, 'els textos de les franges caben');
igual(fr.lectures.length, 5, 'una lectura per dia');
igual(G.evolucio(dades.slice(0, 1), opts).lectures[0].x > 0, true, 'una sola mesura es pot dibuixar');

// Validació d'una mesura abans de desar-la
const idA = '11111111-1111-4111-8111-111111111111';
const base = { id_mesura: idA, mesura_el: '2026-11-08T10:00:00+01:00', sistolica: 128, diastolica: 82, pols: '', nota: '' };
const codi = (f) => { try { f(); return 'cap'; } catch (e) { return e.message; } };
igual(L.normalitzaMesura(base).pols, '', 'pols buit acceptat');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { id_mesura: 'x' }))), 'ID_INVALID', 'identificador invàlid');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { sistolica: 301 }))), 'VALOR_FORA_DE_RANG', 'sistòlica fora de rang');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { pols: 10 }))), 'VALOR_FORA_DE_RANG', 'pols fora de rang');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { mesura_el: '2026-11-08 10:00' }))), 'DATA_INVALIDA', 'data sense format ISO');
igual(codi(() => L.normalitzaMesura(base, Date.parse('2026-11-01T00:00:00Z'))), 'DATA_INVALIDA', 'data més enllà del límit');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { nota: 'x'.repeat(501) }))), 'NOTA_INVALIDA', 'nota massa llarga');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { ordre_serie: 1 }))), 'SERIE_INVALIDA', 'ordre sense sèrie');
igual(codi(() => L.normalitzaMesura(Object.assign({}, base, { id_serie: idA }))), 'SERIE_INVALIDA', 'sèrie sense ordre');
igual(L.normalitzaMesura(Object.assign({}, base, { id_serie: idA, ordre_serie: 2 })).ordre_serie, 2, 'sèrie amb ordre');

// Coherència de versions i de textos
const fs2 = require('fs');
const llegeix = (r) => fs2.readFileSync(path.join(arrel, r), 'utf8');
igual(T.novetats[0].versio, Config.VERSIO, 'novetats de la versió actual');
const pantalles = llegeix('js/pantalles.js');
const claus = [...new Set([...pantalles.matchAll(/\bt\('(\w+)'\)/g)].map((x) => x[1]))];
igual(claus.filter((c) => T.app.es[c] === undefined || T.app.ca[c] === undefined), [], 'tots els textos de les pantalles existeixen');
const Copies = require(path.join(arrel, 'js', 'copies.js'));
igual(Copies.MOTIUS.filter((m) => !T.app.es['motiu_' + m] || !T.app.ca['motiu_' + m]), [], 'tots els motius de còpia tenen text');
igual(/^[A-ZÀ-Ú]+$/.test(T.app.es.paraulaImportar + T.app.ca.paraulaImportar + T.app.es.paraulaBorrar + T.app.ca.paraulaBorrar), true, 'les paraules de confirmació són en majúscules');

console.log(n + ' comprovacions, ' + fallades + ' fallades');
process.exit(fallades ? 1 : 0);
