/**
 * executa-pwa.js — registre-pressio
 * Comprova que l'aplicació instal·lable és coherent: versions, fitxers desats pel treballador
 * de servei, manifest, i que cap fitxer de l'aplicació surt del dispositiu.
 * S'executa amb: node proves/executa-pwa.js
 * Versió: 0.12.0 · 2026-11-10
 */
'use strict';
const fs = require('fs'), path = require('path');
const arrel = path.join(__dirname, '..');
const llegeix = (r) => fs.readFileSync(path.join(arrel, r), 'utf8');
const existeix = (r) => fs.existsSync(path.join(arrel, r));
const Config = require(path.join(arrel, 'js', 'config.js'));

let n = 0, fallades = 0;
const igual = (a, b, desc) => { n++; if (JSON.stringify(a) !== JSON.stringify(b)) { fallades++; console.log('✗ ' + desc + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); } };

// Versions
const sw = llegeix('sw.js');
igual(/var VERSIO = '([^']+)'/.exec(sw)[1], Config.VERSIO, 'la versió de sw.js és la de config.js');
const canvis = llegeix('CANVIS.md');
const primera = /^## \[(\d+\.\d+\.\d+)\] · (\d{4}-\d{2}-\d{2})/m.exec(canvis);
igual([primera[1], primera[2]], [Config.VERSIO, Config.DATA_VERSIO], 'la primera versió de CANVIS.md és l\'actual');
igual(/^## \[Sense publicar\]/m.test(canvis), true, 'CANVIS.md té l\'apartat «Sense publicar»');

// Fitxers de l'aplicació: els que carrega index.html han de ser a la llista de sw.js, i tots han d'existir
const fitxers = JSON.parse(/var FITXERS = (\[[\s\S]*?\]);/.exec(sw)[1].replace(/'/g, '"'));
igual(fitxers.filter((f) => f !== './' && !existeix(f)), [], 'tots els fitxers de sw.js existeixen');
const index = llegeix('index.html');
const carregats = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((x) => x[1]);
igual(carregats.filter((f) => /^(https?:)?\/\//.test(f)), [], 'index.html no carrega res de fora');
igual(carregats.filter((f) => fitxers.indexOf(f) === -1), [], 'tot el que carrega index.html es desa per a ús sense connexió');
const manifest = JSON.parse(llegeix('manifest.webmanifest'));
igual(manifest.icons.map((i) => i.src).filter((f) => fitxers.indexOf(f) === -1), [], 'les icones del manifest es desen');
igual([manifest.start_url, manifest.scope, manifest.display], ['./', './', 'standalone'], 'el manifest funciona en una subcarpeta de GitHub Pages');
igual(manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512') && manifest.icons.some((i) => i.purpose === 'maskable'), true, 'icones de 192, 512 i amb màscara');
const perCarpeta = fs.readdirSync(path.join(arrel, 'js')).map((f) => 'js/' + f).concat(fs.readdirSync(path.join(arrel, 'css')).map((f) => 'css/' + f));
igual(perCarpeta.filter((f) => fitxers.indexOf(f) === -1), [], 'cap fitxer de js/ o css/ queda fora de sw.js');
igual(existeix('.nojekyll'), true, 'hi ha .nojekyll');

// Les dades no surten del dispositiu: cap crida de xarxa al codi propi, i política de contingut restrictiva
const codi = fs.readdirSync(path.join(arrel, 'js')).map((f) => [f, llegeix('js/' + f)]);
igual(codi.filter((c) => /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|google\.script/.test(c[1])).map((c) => c[0]), [], 'el codi propi no fa cap petició de xarxa');
igual(codi.filter((c) => /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function/.test(c[1])).map((c) => c[0]), [], 'cap contingut s\'insereix com a HTML');
igual(codi.filter((c) => c[0] !== 'magatzem.js' && /indexedDB|localStorage|sessionStorage/.test(c[1])).map((c) => c[0]), [], 'només magatzem.js toca les dades del dispositiu');
igual(/Content-Security-Policy" content="default-src 'self';/.test(index), true, 'política de contingut: només fitxers propis');
igual(/<script(?![^>]*\bsrc=)/.test(index), false, 'cap script dins de la pàgina');
igual(/caches\.open\(MEMORIA\)/.test(sw) && !/indexedDB/.test(sw), true, 'el treballador de servei no toca les dades');

// Capçaleres amb la versió actual
const propis = ['index.html', 'sw.js', 'css/app.css'].concat(codi.map((c) => 'js/' + c[0])).concat(fs.readdirSync(__dirname).map((f) => 'proves/' + f));
igual(propis.filter((f) => llegeix(f).slice(0, 900).indexOf('Versió: ' + Config.VERSIO + ' · ' + Config.DATA_VERSIO) === -1), [], 'capçaleres amb la versió i la data actuals');

// Res que no hagi d'anar al repositori
const prohibits = [];
(function recorre(carpeta) {
  fs.readdirSync(path.join(arrel, carpeta)).forEach((f) => {
    const r = path.join(carpeta, f);
    if (f === '.git' || f === 'node_modules') return;
    if (fs.statSync(path.join(arrel, r)).isDirectory()) recorre(r);
    else if (/\.(csv|xlsx|zip)$|^RPS_copia_|\.clasp/.test(f)) prohibits.push(r);
  });
})('.');
igual(prohibits, [], 'cap dada, còpia ni fitxer de clasp al projecte');

console.log(n + ' comprovacions, ' + fallades + ' fallades');
process.exit(fallades ? 1 : 0);
