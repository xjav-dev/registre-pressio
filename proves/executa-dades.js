/**
 * executa-dades.js — registre-pressio
 * Proves del servei sobre un magatzem en memòria: mesures, perfil, còpies i importació.
 * S'executa amb: node proves/executa-dades.js
 * Versió: 0.12.0 · 2026-11-10
 */
'use strict';
const path = require('path');
const js = (nom) => require(path.join(__dirname, '..', 'js', nom + '.js'));
const Config = js('config'), Magatzem = js('magatzem'), Copies = js('copies'), Servei = js('servei');

let n = 0, fallades = 0;
const igual = (a, b, desc) => { n++; if (JSON.stringify(a) !== JSON.stringify(b)) { fallades++; console.log('✗ ' + desc + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); } };
const codi = (promesa) => promesa.then(() => 'cap', (e) => e.message);
const canonic = (mesures) => JSON.stringify(mesures.map((m) => Config.CAMPS_MESURA.map((c) => m[c])).sort());
const id = (k) => '00000000-0000-4000-8000-' + String(k).padStart(12, '0');

(async () => {
  let rellotge = new Date('2026-11-10T08:00:00+01:00');
  const ara = () => new Date(rellotge);
  const avanca = (dies) => { rellotge = new Date(rellotge.getTime() + dies * 86400000); };
  const magatzem = Magatzem.memoria();
  const s = Servei.crea(magatzem, { ara });
  const mesura = (k, extra) => Object.assign({ id_mesura: id(k), mesura_el: '2026-11-0' + (1 + k % 9) + 'T08:00:00+01:00', sistolica: 120 + k, diastolica: 80, pols: 60, nota: '' }, extra);

  // Arrencada
  igual((await s.inicia()).mesures, [], 'primera arrencada sense mesures');
  igual(s.estat().benvinguda, false, 'cal la benvinguda');
  igual(s.estat().perfil, { nom: '', idioma: 'es', objectiu_sistolica: 135, objectiu_diastolica: 85 }, 'perfil per defecte');
  igual(s.estat().guia, { preses_serie: 3, minuts_repos: 5, minuts_entre_preses: 2, preses_descartades: 0 }, 'guia per defecte');
  await s.completaBenvinguda('  Maria Prova  ');
  igual([s.estat().benvinguda, s.estat().perfil.nom], [true, 'Maria Prova'], 'benvinguda completada');

  // Mesures
  const r1 = await s.creaMesura(mesura(1, { nota: '=1+1' }));
  igual([r1.mesura.sistolica, r1.mesura.corregida, r1.mesura.esborrat_el, r1.mesura.registrat_el], [121, false, '', ara().toISOString()], 'mesura creada');
  avanca(0.01);
  const repetida = await s.creaMesura(mesura(1, { sistolica: 199 }));
  igual([repetida.mesura.sistolica, (await magatzem.llegeix()).mesures.length], [121, 1], 'repetir un desat no duplica ni canvia');
  igual(s.estat().copies.canvis, 1, 'un canvi sense copiar');
  igual(await codi(s.creaMesura(mesura(2, { sistolica: 400 }))), 'VALOR_FORA_DE_RANG', 'rebuig fora de rang');
  igual(await codi(s.creaMesura(mesura(2, { mesura_el: '2026-11-13T08:00:00+01:00' }))), 'DATA_INVALIDA', 'rebuig de data futura');
  await s.creaMesura(mesura(2));
  const editada = await s.editaMesura(mesura(1, { sistolica: 130, nota: 'canviada' }));
  igual([editada.mesura.sistolica, editada.mesura.corregida, editada.mesura.registrat_el === r1.mesura.registrat_el, editada.mesura.nota], [130, true, true, 'canviada'], 'edició marca corregida i conserva registrat_el');
  const nomesNota = await s.editaMesura(mesura(2, { nota: 'només la nota' }));
  igual(nomesNota.mesura.corregida, false, 'canviar només la nota no marca corregida');
  igual(await codi(s.editaMesura(mesura(9))), 'NO_PERMES', 'no s\'edita una mesura inexistent');
  await s.esborraMesura({ id_mesura: id(2) });
  igual(await codi(s.esborraMesura({ id_mesura: id(2) })), 'NO_PERMES', 'no s\'esborra dues vegades');
  igual((await Servei.crea(magatzem, { ara }).inicia()).mesures.map((m) => m.id_mesura), [id(1)], 'una mesura esborrada no es llista');
  igual((await magatzem.llegeix()).mesures.length, 2, 'l\'esborrat és lògic');
  magatzem.falla = true;
  igual(await codi(s.creaMesura(mesura(3))), 'errorDesat', 'si el dispositiu no desa, es diu');
  magatzem.falla = false;
  igual(s.estat().copies.canvis, 5, 'un error de desat no compta com a canvi');

  // Perfil i guia
  igual(await codi(s.actualitzaPerfil({ objectiu_sistolica: 500 })), 'PERFIL_INVALID', 'objectiu fora de rang');
  igual(await codi(s.actualitzaPerfil({ idioma: 'fr' })), 'PERFIL_INVALID', 'idioma desconegut');
  await s.actualitzaPerfil({ idioma: 'ca' });
  igual(s.estat().copies.canvis, 5, 'canviar l\'idioma no compta com a canvi');
  igual((await s.actualitzaPerfil({ objectiu_sistolica: 130, objectiu_diastolica: 80 })).perfil.objectiu_sistolica, 130, 'objectius desats');
  igual(await codi(s.desaGuia({ preses_serie: 3, minuts_repos: 5, minuts_entre_preses: 2, preses_descartades: 3 })), 'CONFIGURACIO_INVALIDA', 'no es poden descartar totes les preses');
  igual(await codi(s.desaGuia({ preses_serie: 9, minuts_repos: 5, minuts_entre_preses: 2, preses_descartades: 0 })), 'CONFIGURACIO_INVALIDA', 'preses fora de límit');
  igual((await s.desaGuia({ preses_serie: '3', minuts_repos: '5', minuts_entre_preses: '2', preses_descartades: '1' })).guia.preses_descartades, 1, 'guia desada');
  igual(await codi(s.desaDiesAvis('15')), 'CONFIGURACIO_INVALIDA', 'termini d\'avís desconegut');

  // Recordatori de còpia
  igual(s.calAvisar(), false, 'no avisa abans del termini');
  avanca(31);
  igual([s.calAvisar(), s.diesSenseCopia()], [true, 31], 'avisa passat el termini');
  await s.ajornaAvis();
  igual(s.calAvisar(), false, 'ajornat per avui');
  avanca(1);
  igual(s.calAvisar(), true, 'l\'endemà torna a avisar');
  await s.desaDiesAvis('0');
  igual(s.calAvisar(), false, 'mai no avisa si es desactiva');
  await s.desaDiesAvis('7');

  // Còpia
  const copia = await s.fesCopia('manual');
  igual(/^RPS_copia_v\d+\.\d+\.\d+_e4_\d{4}-\d{2}-\d{2}_\d{4}\.json$/.test(copia.nom), true, 'nom del fitxer de còpia');
  const fitxer = JSON.parse(copia.text);
  igual([fitxer.metadades.aplicacio, fitxer.metadades.versio, fitxer.metadades.esquema, fitxer.metadades.motiu], ['RPS', Config.VERSIO, 4, 'manual'], 'metadades de la còpia');
  igual([fitxer.metadades.taules.mesures.files, fitxer.dades.mesures.length, copia.mesures], [2, 2, 1], 'la còpia inclou les esborrades');
  igual(fitxer.metadades.resum.length, 64, 'la còpia porta el resum SHA-256');
  igual(Object.keys(fitxer.dades.configuracio).some((c) => c.charAt(0) === '_'), false, 'les claus de l\'aparell no viatgen');
  igual(copia.text.includes('Maria Prova'), true, 'el perfil viatja a la còpia');
  await s.anotaCopia();
  igual([s.estat().copies.canvis, s.estat().copies.ultima, s.calAvisar()], [0, ara().toISOString(), false], 'còpia anotada');

  // Comprovacions abans d'importar
  const altera = (f) => { const o = JSON.parse(copia.text); f(o); return JSON.stringify(o); };
  const senseResum = (f) => altera((o) => { o.metadades.resum = ''; f(o); });
  igual(await codi(Copies.revisa('això no és JSON')), 'COPIA_ILLEGIBLE', 'fitxer il·legible');
  igual(await codi(Copies.revisa('{"a":1}')), 'COPIA_ILLEGIBLE', 'sense metadades');
  igual(await codi(Copies.revisa(altera((o) => { o.metadades.aplicacio = 'XXX'; }))), 'COPIA_ALTRA_APP', 'còpia d\'una altra aplicació');
  igual(await codi(Copies.revisa(altera((o) => { o.metadades.esquema = 5; }))), 'COPIA_POSTERIOR', 'esquema posterior');
  igual(await codi(Copies.revisa(altera((o) => { o.metadades.esquema = 3; }))), 'MIGRACIO_ABSENT', 'esquema anterior sense migració');
  igual(await codi(Copies.revisa(altera((o) => { o.dades.mesures[0].sistolica = 131; }))), 'COPIA_INCOMPLETA', 'dades alterades: el resum no quadra');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.mesures.pop(); }))), 'COPIA_INCOMPLETA', 'files que no quadren');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.mesures[0].sistolica = 999; }))), 'COPIA_INCOMPLETA', 'valor invàlid');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.mesures[0].extra = 1; }))), 'COPIA_INCOMPLETA', 'camp desconegut');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.mesures[1] = o.dades.mesures[0]; }))), 'COPIA_INCOMPLETA', 'identificador repetit');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.configuracio.idioma = 'fr'; }))), 'COPIA_INCOMPLETA', 'configuració invàlida');
  igual(await codi(Copies.revisa(senseResum((o) => { o.dades.configuracio._esquema = '1'; o.metadades.taules.configuracio.files++; }))), 'COPIA_INCOMPLETA', 'clau de configuració desconeguda');
  igual(await codi(Copies.revisa(senseResum((o) => { o.metadades.taules.mesures.camps = ['id_mesura']; }))), 'COPIA_INCOMPLETA', 'camps que no són els del model');
  igual(await codi(Copies.revisa('x'.repeat(Config.LIMITS.midaCopia + 1))), 'COPIA_MASSA_GRAN', 'fitxer massa gran');
  const abans = JSON.stringify(await magatzem.llegeix());
  igual(JSON.stringify(await magatzem.llegeix()), abans, 'revisar no toca cap dada');

  // Importació: després de canviar dades, tornar a la còpia deixa les dades iguals
  const dadesCopia = canonic((await magatzem.llegeix()).mesures);
  await s.creaMesura(mesura(4));
  await s.actualitzaPerfil({ nom: 'Un altre nom' });
  const preparada = await s.preparaImportacio(copia.text);
  igual([preparada.resum.ara, preparada.resum.copia, preparada.resum.versio, preparada.resum.migrada], [2, 1, Config.VERSIO, false], 'resum de la importació');
  const importada = await s.importa(preparada.revisada, 'fitxer');
  igual(importada.mesures.map((m) => m.id_mesura), [id(1)], 'mesures vigents després d\'importar');
  igual(canonic((await magatzem.llegeix()).mesures), dadesCopia, 'fer una còpia i importar-la deixa les dades iguals');
  igual([s.estat().perfil.nom, s.estat().perfil.idioma, s.estat().guia.preses_descartades], ['Maria Prova', 'ca', 1], 'perfil i guia recuperats');
  igual([s.estat().copies.canvis, s.estat().copies.ultima, s.estat().benvinguda], [0, fitxer.metadades.data, true], 'estat de còpies després d\'importar un fitxer');
  let internes = await s.copiesInternes();
  igual([internes.length, internes[0].motiu, internes[0].mesures], [1, 'abans_importar', 2], 'còpia interna abans d\'importar');
  igual(JSON.parse(internes[0].text).dades.configuracio.nom, 'Un altre nom', 'la còpia interna té l\'estat anterior');

  // Recuperar una còpia interna
  const interna = await s.preparaImportacio(internes[0].text);
  await s.importa(interna.revisada, 'interna');
  igual([s.estat().perfil.nom, s.estat().copies.canvis], ['Un altre nom', 1], 'recuperar una còpia interna deixa canvis per copiar');

  // Si la còpia prèvia falla, no s'importa res
  const estatAbans = JSON.stringify((await magatzem.llegeix()).mesures);
  const desaCopia = magatzem.desaCopia;
  magatzem.desaCopia = () => Promise.reject(new Error('errorDesat'));
  igual(await codi(s.importa(preparada.revisada, 'fitxer')), 'COPIA_PREVIA_FALLIDA', 'sense còpia prèvia no s\'importa');
  igual(await codi(s.esborraTot()), 'COPIA_PREVIA_FALLIDA', 'sense còpia prèvia no s\'esborra');
  igual(JSON.stringify((await magatzem.llegeix()).mesures), estatAbans, 'les dades no han canviat');
  magatzem.desaCopia = desaCopia;

  // Es conserven només les últimes còpies internes
  for (let k = 0; k < Config.LIMITS.copiesInternes + 2; k++) { avanca(0.001); await s.importa(preparada.revisada, 'fitxer'); }
  internes = await s.copiesInternes();
  igual(internes.length, Config.LIMITS.copiesInternes, 'es conserven les últimes còpies internes');
  igual(internes[0].data > internes[internes.length - 1].data, true, 'ordenades de més nova a més antiga');
  await s.esborraCopiaInterna(internes[0].id);
  igual((await s.copiesInternes()).length, Config.LIMITS.copiesInternes - 1, 'una còpia interna es pot esborrar');

  // Esborrar-ho tot
  igual((await s.esborraTot()).mesures, [], 'esborrat total');
  const buit = await magatzem.llegeix();
  igual([buit.mesures.length, Object.keys(buit.config).filter((c) => c.charAt(0) !== '_').length], [0, 0], 'no queda cap mesura ni configuració');
  igual([s.estat().benvinguda, s.estat().perfil.nom, s.estat().copies.ultima], [false, '', ''], 'torna a l\'estat inicial');
  igual((await s.copiesInternes())[0].motiu, 'abans_esborrar', 'còpia interna abans d\'esborrar');

  // Una instal·lació nova recupera una còpia sense fer cap còpia prèvia
  const nou = Magatzem.memoria();
  const s2 = Servei.crea(nou, { ara });
  await s2.inicia();
  await s2.importa((await s2.preparaImportacio(copia.text)).revisada, 'fitxer');
  igual([(await s2.copiesInternes()).length, s2.estat().perfil.nom, s2.estat().benvinguda], [0, 'Maria Prova', true], 'recuperació en un dispositiu nou');

  // Dades d'una versió posterior
  const futur = Magatzem.memoria();
  await futur.desa({ config: { _esquema: '9' } });
  igual(await codi(Servei.crea(futur, { ara }).inicia()), 'DADES_POSTERIORS', 'no s\'obren dades d\'un esquema posterior');

  console.log(n + ' comprovacions, ' + fallades + ' fallades');
  process.exit(fallades ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
