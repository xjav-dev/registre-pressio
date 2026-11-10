/**
 * navegador.js — registre-pressio
 * Prova de punta a punta en un navegador real: registre, historial, informe, còpia,
 * esborrat, recuperació i funcionament sense connexió. Només amb dades inventades.
 * Necessita Playwright amb Chromium: node proves/navegador.js [carpeta-de-captures]
 * Versió: 0.12.0 · 2026-11-10
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { chromium } = require('playwright');
const arrel = path.join(__dirname, '..');
const captures = process.argv[2] || '';
const TIPUS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

let n = 0, fallades = 0;
const comprova = (ok, desc, detall) => { n++; if (!ok) { fallades++; console.log('✗ ' + desc + (detall === undefined ? '' : '  → ' + JSON.stringify(detall))); } };

(async () => {
  const servidor = http.createServer((peticio, resposta) => {
    let ruta = decodeURIComponent(peticio.url.split('?')[0]).replace(/^\/app\//, '');
    if (ruta === '' || ruta === '/') ruta = 'index.html';
    const fitxer = path.join(arrel, ruta);
    if (fitxer.indexOf(arrel) !== 0 || !fs.existsSync(fitxer) || fs.statSync(fitxer).isDirectory()) { resposta.writeHead(404); resposta.end(); return; }
    resposta.writeHead(200, { 'Content-Type': TIPUS[path.extname(fitxer)] || 'application/octet-stream' });
    resposta.end(fs.readFileSync(fitxer));
  });
  await new Promise((resol) => servidor.listen(0, '127.0.0.1', resol));
  const adreca = 'http://127.0.0.1:' + servidor.address().port + '/app/';
  const navegador = await chromium.launch();
  const context = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: captures ? 2 : 1, locale: 'es-ES', acceptDownloads: true });
  const pagina = await context.newPage();
  const errors = [], externes = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  pagina.on('pageerror', (e) => errors.push(String(e)));
  pagina.on('request', (r) => { if (r.url().indexOf(adreca) !== 0 && !/^blob:|^data:/.test(r.url())) externes.push(r.url()); });
  const captura = async (nom) => { if (captures) await pagina.screenshot({ path: path.join(captures, nom + '.png') }); };
  const boto = (text) => pagina.getByRole('button', { name: text, exact: true });
  const tecleja = async (xifres) => { for (const x of xifres) await pagina.locator('.tecla', { hasText: new RegExp('^' + x + '$') }).click(); };
  const baixa = async (accio) => {
    const [descarrega] = await Promise.all([pagina.waitForEvent('download'), accio()]);
    const desti = path.join(os.tmpdir(), 'rps-prova-' + Date.now() + '-' + descarrega.suggestedFilename());
    await descarrega.saveAs(desti);
    return { nom: descarrega.suggestedFilename(), ruta: desti };
  };

  // Benvinguda
  await pagina.goto(adreca);
  await pagina.getByRole('heading', { name: 'Le damos la bienvenida' }).waitFor();
  await captura('01-benvinguda');
  await pagina.locator('#b-nom').fill('Persona de Prova');
  await boto('Empezar').click();

  // Registre directe: 128 / 82, pols 65, amb salt automàtic de camp
  await tecleja('1288265');
  await captura('02-registre');
  await boto('Guardar').click();
  await pagina.getByRole('heading', { name: 'Guardado' }).waitFor();
  comprova((await pagina.locator('.confirmacio-valors').textContent()) === '128 / 82 · Pulso 65', 'la confirmació mostra els valors');
  await boto('Aceptar').click();
  await tecleja('18595');
  await boto('Guardar').click();
  await pagina.locator('.avis-alt').waitFor();
  await boto('Aceptar').click();

  // Historial i edició
  await boto('Historial').click();
  comprova(await pagina.locator('.fila-valor').count() === 2, 'l\'historial té dues mesures');
  await pagina.locator('.fila-mesura').first().click();
  await pagina.locator('#e-sis').fill('150');
  await pagina.locator('#e-nota').fill('=nota de prova');
  await boto('Guardar').click();
  await pagina.locator('.fila-valor', { hasText: '150 / 95 *' }).waitFor();
  await captura('03-historial');

  // Informe: PDF i CSV
  await boto('Informe').click();
  await pagina.locator('.grafic svg').first().waitFor();
  await captura('04-informe');
  const pdf = await baixa(() => boto('PDF').click());
  comprova(fs.readFileSync(pdf.ruta).slice(0, 5).toString() === '%PDF-', 'el PDF es genera', pdf.nom);
  const csv = await baixa(() => boto('CSV').click());
  comprova(/128;82;65/.test(fs.readFileSync(csv.ruta, 'utf8')) && /'=nota de prova/.test(fs.readFileSync(csv.ruta, 'utf8')), 'el CSV té les mesures i neutralitza la nota');

  // Mesura guiada configurable
  await boto('Ajustes').click();
  await captura('05-ajustos');
  await boto('Medida guiada').click();
  await pagina.locator('#g-minuts_repos').fill('0');
  await pagina.locator('#g-minuts_entre_preses').fill('0');
  await pagina.locator('#g-preses_serie').fill('2');
  await boto('Guardar').click();
  await boto('Registrar').click();
  await boto('Medida guiada').click();
  await boto('Empezar').click();
  await tecleja('1308060');
  await boto('Guardar').click();
  await pagina.getByRole('heading', { name: 'Toma 2 de 2' }).waitFor();
  await tecleja('1267858');
  await boto('Guardar').click();
  await pagina.getByRole('heading', { name: 'Resultado' }).waitFor();
  comprova((await pagina.locator('.mitjana-serie').textContent()) === '128 / 79', 'mitjana de la sèrie guiada');
  await boto('Terminar').click();

  // Còpia de seguretat
  await boto('Ajustes').click();
  await boto('Copias de seguridad').click();
  await pagina.getByRole('heading', { name: 'Copias de seguridad' }).waitFor();
  const fila = (nom) => pagina.locator('tr', { hasText: nom }).locator('td');
  comprova((await fila('Última copia').textContent()) === 'Nunca', 'encara no hi ha cap còpia');
  comprova(Number(await fila('Cambios sin copiar').textContent()) >= 5, 'hi ha canvis sense copiar');
  await captura('06-copies');
  const copia = await baixa(() => boto('Hacer una copia ahora').click());
  comprova(/^RPS_copia_v\d+\.\d+\.\d+_e4_.*\.json$/.test(copia.nom), 'nom del fitxer de còpia', copia.nom);
  const contingut = JSON.parse(fs.readFileSync(copia.ruta, 'utf8'));
  comprova(contingut.dades.mesures.length === 4 && contingut.dades.configuracio.nom === 'Persona de Prova', 'la còpia conté les mesures i el perfil');
  await pagina.locator('.avis', { hasText: 'Copia creada' }).waitFor();
  comprova((await fila('Cambios sin copiar').textContent()) === '0', 'després de la còpia no queden canvis');

  // Esborrar-ho tot: cal escriure la paraula
  await boto('Borrar todos los datos').click();
  comprova(await boto('Sí, borrar todo').isDisabled(), 'no es pot esborrar sense escriure la paraula');
  await pagina.locator('.dialeg input').fill('borrar');
  await captura('07-esborrar');
  await boto('Sí, borrar todo').click();
  await pagina.getByRole('heading', { name: 'Datos borrados' }).waitFor();
  await boto('Aceptar').click();
  await pagina.getByRole('heading', { name: 'Le damos la bienvenida' }).waitFor();

  // Un fitxer que no és una còpia es rebutja sense tocar res
  const fals = path.join(os.tmpdir(), 'rps-prova-fals.json');
  fs.writeFileSync(fals, '{"metadades":{"aplicacio":"ALTRA"}}');
  let [selector] = await Promise.all([pagina.waitForEvent('filechooser'), boto('Recuperar una copia').click()]);
  await selector.setFiles(fals);
  await pagina.locator('.dialeg p', { hasText: 'Esta copia no es de esta aplicación.' }).waitFor();
  await boto('Aceptar').click();

  // Recuperar la còpia
  [selector] = await Promise.all([pagina.waitForEvent('filechooser'), boto('Recuperar una copia').click()]);
  await selector.setFiles(copia.ruta);
  await pagina.getByRole('heading', { name: '¿Recuperar esta copia?' }).waitFor();
  await captura('08-recuperar');
  await pagina.locator('.dialeg input').fill('RECUPERAR');
  await boto('Sí, recuperar').click();
  await pagina.locator('.avis', { hasText: 'Copia recuperada' }).waitFor();
  comprova((await fila('Medidas guardadas').textContent()) === '4', 'les mesures han tornat');
  comprova(await pagina.locator('.copia-interna').count() === 1, 'queda la còpia automàtica d\'abans d\'esborrar');
  await captura('09-recuperat');

  // Sense connexió i després de recarregar: l'aplicació s'obre i les dades hi són
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await pagina.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await pagina.reload();
  await boto('Historial').click();
  comprova(await pagina.locator('.fila-valor').count() === 4, 'sense connexió, l\'aplicació s\'obre amb les dades');
  await boto('Ajustes').click();
  await pagina.getByRole('button', { name: 'Català' }).click();
  comprova(await boto('Còpies de seguretat').count() === 1, 'canvi d\'idioma a català');
  await context.setOffline(false);
  await pagina.reload();
  comprova(await boto('Ajustos').count() === 1, 'l\'idioma es conserva en tornar a obrir');

  comprova(errors.length === 0, 'cap error ni avís de política de contingut a la consola', errors);
  comprova(externes.length === 0, 'cap petició fora de l\'aplicació', externes);
  await navegador.close();
  servidor.close();
  console.log(n + ' comprovacions, ' + fallades + ' fallades');
  process.exit(fallades ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
