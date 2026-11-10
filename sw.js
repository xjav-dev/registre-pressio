/**
 * sw.js — registre-pressio
 *
 * Treballador de servei: desa l'aplicació al dispositiu perquè s'obri sense connexió.
 * No desa ni envia cap dada de les persones: només els fitxers de l'aplicació.
 * En publicar una versió nova cal canviar VERSIO; així els telèfons la descarreguen.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
'use strict';

var VERSIO = '0.12.0';
var PREFIX = 'registre-pressio-v';
var MEMORIA = PREFIX + VERSIO;
var FITXERS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/config.js',
  'js/textos.js',
  'js/logica.js',
  'js/grafics.js',
  'js/magatzem.js',
  'js/copies.js',
  'js/servei.js',
  'js/pantalles.js',
  'lib/jspdf.umd.min.js',
  'icones/icona-32.png',
  'icones/icona-180.png',
  'icones/icona-192.png',
  'icones/icona-512.png',
  'icones/icona-mascara-512.png'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(MEMORIA).then(function (memoria) {
    return memoria.addAll(FITXERS.map(function (fitxer) { return new Request(fitxer, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (claus) {
    return Promise.all(claus.filter(function (clau) {
      return clau.indexOf(PREFIX) === 0 && clau !== MEMORIA;
    }).map(function (clau) { return caches.delete(clau); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (ev) {
  var peticio = ev.request;
  if (peticio.method !== 'GET' || new URL(peticio.url).origin !== self.location.origin) return;
  ev.respondWith(caches.open(MEMORIA).then(function (memoria) {
    return memoria.match(peticio, { ignoreSearch: true }).then(function (desat) {
      if (desat) return desat;
      return fetch(peticio).catch(function (error) {
        if (peticio.mode === 'navigate') return memoria.match('index.html');
        throw error;
      });
    });
  }));
});
