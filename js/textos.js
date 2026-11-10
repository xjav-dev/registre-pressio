/**
 * textos.js — registre-pressio
 *
 * Tots els textos visibles, en castellà i català (DD-005), i les novetats de cada versió.
 * La primera novetat ha de ser la de la versió actual.
 *
 * Autoria: Xavi i Claude (Anthropic)
 * Copyright (c) 2026 Xavi
 * Llicència: EUPL-1.2 — vegeu LLICENCIA.txt
 * SPDX-License-Identifier: EUPL-1.2
 * Versió: 0.12.0 · 2026-11-10
 */
(function (arrel, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else arrel.Textos = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var APP = {
    es: {
      nomApp: 'Mi tensión',
      triaIdioma: 'Idioma', borrar: 'Borrar', registrar: 'Registrar', historial: 'Historial', informe: 'Informe', ajustes: 'Ajustes',
      sistolica: 'Máxima', diastolica: 'Mínima', pols: 'Pulso',
      sistolicaLlarg: 'Tensión máxima o sistólica', diastolicaLlarg: 'Tensión mínima o diastólica', polsLlarg: 'Pulso, opcional',
      afegirNota: 'Añadir nota', veureNota: 'Ver nota', notaAfegida: 'Nota añadida', guardar: 'Guardar', tornar: 'Volver',
      tituloNota: 'Nota', ajudaNota: 'Escriba lo que quiera recordar de esta medida.',
      guardat: 'Guardado', guardant: 'Guardando…', tancar: 'Aceptar',
      moltAlt: 'Repita la medida y, si sigue alta o tiene síntomas, avise a su médico o llame al 112.',
      esCorrecte: '¿Es correcto?', siGuardar: 'Sí, guardar', corregir: 'Corregir',
      FALTA_sistolica: 'Falta la máxima', FALTA_diastolica: 'Falta la mínima',
      FORA_DE_RANG: 'Este valor no parece válido', IMPROBABLE: 'El valor {camp} es poco habitual: {valor}.',
      MINIMA_SUPERIOR: 'La mínima es igual o mayor que la máxima.',
      errorGeneric: 'No se ha podido completar. Inténtelo de nuevo.',
      senseMesures: 'Todavía no hay medidas.',
      d7: '7 días', d30: '30 días', d90: '3 meses',
      lectures: 'Lecturas', dies: 'Días con datos', mitjana: 'Promedio', mitjanaSensePrimer: 'Promedio sin el primer día',
      mati: 'Mañana', vespre: 'Noche', diferencia: 'Diferencia mañana-noche', polsMitja: 'Pulso medio',
      minim: 'Mínimo', maxim: 'Máximo', sobreObjectiu: 'Por encima del objetivo',
      insuficients: 'Datos insuficientes para un promedio fiable',
      pdf: 'PDF', tituloPdf: 'Registro de tensión arterial', interval: 'Periodo', generat: 'Generado el',
      peuPdf: 'Datos registrados por el paciente. No constituye un diagnóstico.',
      data: 'Fecha', dia: 'Día', hora: 'Hora', franja: 'Franja', nota: 'Nota',
      versio: 'Versión', nomPersona: 'Nombre',
      editar: 'Editar medida', borrarMesura: '¿Borrar esta medida?', siBorrar: 'Sí, borrar', borrarBoto: 'Borrar medida',
      dataFutura: 'La fecha y la hora no pueden ser futuras.', dataInvalida: 'Revise la fecha y la hora.',
      canviarDades: 'Cambiar mis datos', dadesPersonals: 'Mis datos', objectiuMax: 'Objetivo de máxima', objectiuMin: 'Objetivo de mínima',
      ajudaObjectiu: 'Su médico le indicará qué objetivo debe tener.', nomBuit: 'Escriba su nombre.', objectiuInvalid: 'Revise los objetivos: máxima de 90 a 200 y mínima de 50 a 130.',
      novetats: 'Novedades', periodePers: 'Otras', desde: 'Desde', fins: 'Hasta', intervalInvalid: 'La fecha inicial debe ser anterior a la final.',
      csv: 'CSV', evolucio: 'Evolución', grafFranges: 'Mañana y noche', objectiu: 'Objetivo', maxCurt: 'Máx.', minCurt: 'Mín.',
      tocaGrafic: 'Toque el gráfico para ver los valores.', perDia: 'Promedio por día', perSetmana: 'Promedio por semana',
      notaCorregida: '* Medida corregida', corregida: 'Corregida', si: 'Sí', no: 'No',
      guiada: 'Medida guiada', empezar: 'Empezar', introGuia: 'Siéntese y descanse {repos} minutos antes de la primera toma. Hará {n} tomas, con {entre} minutos entre cada una.',
      reposa: 'Descanse', esperaPresa: 'Espere para la toma {n}', jaEsperat: 'Ya he esperado', presaDe: 'Toma {n} de {total}', presaGuardada: 'Toma {n} guardada: {v}',
      resultat: 'Resultado', noCompta: 'No cuenta para la media', acabar: 'Terminar', sortir: 'Salir', presa: 'Toma',
      veureGrafic: 'Ver en el gráfico', totesPreses: 'Todas las tomas', unaPerSerie: 'Una por serie', mitjanaDe: 'media de {n}',
      errorDesat: 'No se ha podido guardar en este dispositivo. Inténtelo de nuevo.',
      senseMagatzem: 'Este navegador no permite guardar datos. Abra la aplicación en Safari o Chrome, fuera del modo privado.',
      DADES_POSTERIORS: 'Los datos de este dispositivo son de una versión más nueva. Cierre la aplicación y vuelva a abrirla con conexión.',
      benvinguda: 'Le damos la bienvenida', textBenvinguda: 'Sus medidas se guardan solo en este dispositivo y nadie más puede verlas. Haga copias de seguridad de vez en cuando para no perderlas.',
      nomOpcional: 'Su nombre, para el informe (opcional)', recuperarCopia: 'Recuperar una copia',
      copies: 'Copias de seguridad', ajudaCopies: 'Sus medidas están solo en este dispositivo. Haga una copia de vez en cuando y guárdela fuera de la aplicación: en Archivos, en Drive o enviándosela por correo.',
      ultimaCopia: 'Última copia', mai: 'Nunca', canvisSenseCopia: 'Cambios sin copiar', mesuresDesades: 'Medidas guardadas', protegit: 'Almacenamiento protegido',
      ferCopia: 'Hacer una copia ahora', copiaFeta: 'Copia creada. Guárdela en un lugar seguro.',
      recordatori: 'Recordarme hacer una copia', cada7: 'Cada 7 días', cada30: 'Cada 30 días',
      copiesAuto: 'Copias automáticas', ajudaCopiesAuto: 'Antes de recuperar una copia o de borrar los datos, la aplicación guarda una copia dentro del dispositivo. Se conservan las 5 últimas.',
      senseCopiesAuto: 'No hay copias automáticas.', motiu_manual: 'Copia manual', motiu_abans_importar: 'Antes de recuperar una copia', motiu_abans_esborrar: 'Antes de borrar los datos', motiu_abans_migrar: 'Antes de actualizar los datos',
      recuperar: 'Recuperar', exportar: 'Exportar', mesuresN: '{n} medidas', borrarTot: 'Borrar todos los datos',
      titolImportar: '¿Recuperar esta copia?', avisImportar: 'Las medidas actuales se sustituirán por las de la copia. Antes se guardará una copia automática.',
      copiaDel: 'Copia del', mesuresAra: 'Medidas ahora', mesuresCopia: 'Medidas en la copia',
      escriuPerConfirmar: 'Para confirmar, escriba {paraula}', paraulaImportar: 'RECUPERAR', paraulaBorrar: 'BORRAR', siRecuperar: 'Sí, recuperar',
      titolBorrarTot: '¿Borrar todos los datos?', avisBorrarTot: 'Se borrarán de este dispositivo todas las medidas y sus datos. Antes se guardará una copia automática, que podrá borrar después.',
      siBorrarTot: 'Sí, borrar todo', importat: 'Copia recuperada', totBorrat: 'Datos borrados', borrarCopia: '¿Borrar esta copia automática?',
      COPIA_ILLEGIBLE: 'Este archivo no es una copia de seguridad.', COPIA_ALTRA_APP: 'Esta copia no es de esta aplicación.',
      COPIA_POSTERIOR: 'Esta copia es de una versión más nueva. Actualice la aplicación y vuelva a intentarlo.',
      COPIA_INCOMPLETA: 'Esta copia está incompleta o dañada. No se ha cambiado nada.',
      MIGRACIO_ABSENT: 'Esta copia es de una versión antigua que ya no se puede recuperar.', COPIA_MASSA_GRAN: 'El archivo es demasiado grande.',
      IMPORTACIO_FALLIDA: 'No se ha podido recuperar la copia. Sus datos anteriores están en «Copias automáticas».',
      COPIA_PREVIA_FALLIDA: 'No se ha podido guardar la copia automática. No se ha cambiado nada.',
      avisCopia: 'Hace {dies} días que no hace una copia de seguridad.', avisCopiaMai: 'Todavía no ha hecho ninguna copia de seguridad.', mesTard: 'Más tarde',
      presesSerie: 'Tomas por serie (2 a 5)', minutsRepos: 'Minutos de descanso (0 a 30)', minutsEntre: 'Minutos entre tomas (0 a 10)', presesDescartades: 'Primeras tomas que no cuentan (0 a 4)',
      ajudaConfigGuia: 'Cambie estos valores solo si se lo indica su centro de salud.',
      CONFIGURACIO_INVALIDA: 'Revise los valores: deben estar dentro de los límites y las tomas que no cuentan deben ser menos que las tomas.',
      installar: 'Instalar la aplicación', ajudaInstallarIos: 'Para instalarla en el iPhone, pulse el botón Compartir de Safari y elija «Añadir a pantalla de inicio». Así los datos no se borran por falta de uso.',
      diesSetmana: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    },
    ca: {
      nomApp: 'La meva tensió',
      triaIdioma: 'Idioma', borrar: 'Esborrar', registrar: 'Registrar', historial: 'Historial', informe: 'Informe', ajustes: 'Ajustos',
      sistolica: 'Màxima', diastolica: 'Mínima', pols: 'Pols',
      sistolicaLlarg: 'Tensió màxima o sistòlica', diastolicaLlarg: 'Tensió mínima o diastòlica', polsLlarg: 'Pols, opcional',
      afegirNota: 'Afegir nota', veureNota: 'Veure nota', notaAfegida: 'Nota afegida', guardar: 'Desar', tornar: 'Tornar',
      tituloNota: 'Nota', ajudaNota: 'Escriviu el que vulgueu recordar d\'aquesta mesura.',
      guardat: 'Desat', guardant: 'Desant…', tancar: 'D\'acord',
      moltAlt: 'Repetiu la mesura i, si continua alta o teniu símptomes, aviseu el vostre metge o truqueu al 112.',
      esCorrecte: 'És correcte?', siGuardar: 'Sí, desar', corregir: 'Corregir',
      FALTA_sistolica: 'Falta la màxima', FALTA_diastolica: 'Falta la mínima',
      FORA_DE_RANG: 'Aquest valor no sembla vàlid', IMPROBABLE: 'El valor {camp} és poc habitual: {valor}.',
      MINIMA_SUPERIOR: 'La mínima és igual o més gran que la màxima.',
      errorGeneric: 'No s\'ha pogut completar. Torneu-ho a provar.',
      senseMesures: 'Encara no hi ha mesures.',
      d7: '7 dies', d30: '30 dies', d90: '3 mesos',
      lectures: 'Lectures', dies: 'Dies amb dades', mitjana: 'Mitjana', mitjanaSensePrimer: 'Mitjana sense el primer dia',
      mati: 'Matí', vespre: 'Vespre', diferencia: 'Diferència matí-vespre', polsMitja: 'Pols mitjà',
      minim: 'Mínim', maxim: 'Màxim', sobreObjectiu: 'Per sobre de l\'objectiu',
      insuficients: 'Dades insuficients per a una mitjana fiable',
      pdf: 'PDF', tituloPdf: 'Registre de tensió arterial', interval: 'Període', generat: 'Generat el',
      peuPdf: 'Dades registrades pel pacient. No constitueix un diagnòstic.',
      data: 'Data', dia: 'Dia', hora: 'Hora', franja: 'Franja', nota: 'Nota',
      versio: 'Versió', nomPersona: 'Nom',
      editar: 'Editar mesura', borrarMesura: 'Voleu esborrar aquesta mesura?', siBorrar: 'Sí, esborrar', borrarBoto: 'Esborrar mesura',
      dataFutura: 'La data i l\'hora no poden ser futures.', dataInvalida: 'Reviseu la data i l\'hora.',
      canviarDades: 'Canviar les meves dades', dadesPersonals: 'Les meves dades', objectiuMax: 'Objectiu de màxima', objectiuMin: 'Objectiu de mínima',
      ajudaObjectiu: 'El vostre metge us indicarà quin objectiu heu de tenir.', nomBuit: 'Escriviu el vostre nom.', objectiuInvalid: 'Reviseu els objectius: màxima de 90 a 200 i mínima de 50 a 130.',
      novetats: 'Novetats', periodePers: 'Altres', desde: 'Des de', fins: 'Fins a', intervalInvalid: 'La data inicial ha de ser anterior a la final.',
      csv: 'CSV', evolucio: 'Evolució', grafFranges: 'Matí i vespre', objectiu: 'Objectiu', maxCurt: 'Màx.', minCurt: 'Mín.',
      tocaGrafic: 'Toqueu el gràfic per veure els valors.', perDia: 'Mitjana per dia', perSetmana: 'Mitjana per setmana',
      notaCorregida: '* Mesura corregida', corregida: 'Corregida', si: 'Sí', no: 'No',
      guiada: 'Mesura guiada', empezar: 'Començar', introGuia: 'Seieu i reposeu {repos} minuts abans de la primera presa. Fareu {n} preses, amb {entre} minuts entre cadascuna.',
      reposa: 'Reposeu', esperaPresa: 'Espereu per a la presa {n}', jaEsperat: 'Ja he esperat', presaDe: 'Presa {n} de {total}', presaGuardada: 'Presa {n} desada: {v}',
      resultat: 'Resultat', noCompta: 'No compta per a la mitjana', acabar: 'Acabar', sortir: 'Sortir', presa: 'Presa',
      veureGrafic: 'Veure al gràfic', totesPreses: 'Totes les preses', unaPerSerie: 'Una per sèrie', mitjanaDe: 'mitjana de {n}',
      errorDesat: 'No s\'ha pogut desar en aquest dispositiu. Torneu-ho a provar.',
      senseMagatzem: 'Aquest navegador no permet desar dades. Obriu l\'aplicació a Safari o Chrome, fora del mode privat.',
      DADES_POSTERIORS: 'Les dades d\'aquest dispositiu són d\'una versió més nova. Tanqueu l\'aplicació i torneu-la a obrir amb connexió.',
      benvinguda: 'Us donem la benvinguda', textBenvinguda: 'Les vostres mesures es desen només en aquest dispositiu i ningú més no les pot veure. Feu còpies de seguretat de tant en tant per no perdre-les.',
      nomOpcional: 'El vostre nom, per a l\'informe (opcional)', recuperarCopia: 'Recuperar una còpia',
      copies: 'Còpies de seguretat', ajudaCopies: 'Les vostres mesures són només en aquest dispositiu. Feu una còpia de tant en tant i deseu-la fora de l\'aplicació: a Fitxers, al Drive o enviant-vos-la per correu.',
      ultimaCopia: 'Última còpia', mai: 'Mai', canvisSenseCopia: 'Canvis sense copiar', mesuresDesades: 'Mesures desades', protegit: 'Emmagatzematge protegit',
      ferCopia: 'Fer una còpia ara', copiaFeta: 'Còpia creada. Deseu-la en un lloc segur.',
      recordatori: 'Recordar-me de fer una còpia', cada7: 'Cada 7 dies', cada30: 'Cada 30 dies',
      copiesAuto: 'Còpies automàtiques', ajudaCopiesAuto: 'Abans de recuperar una còpia o d\'esborrar les dades, l\'aplicació desa una còpia dins del dispositiu. Es conserven les 5 últimes.',
      senseCopiesAuto: 'No hi ha còpies automàtiques.', motiu_manual: 'Còpia manual', motiu_abans_importar: 'Abans de recuperar una còpia', motiu_abans_esborrar: 'Abans d\'esborrar les dades', motiu_abans_migrar: 'Abans d\'actualitzar les dades',
      recuperar: 'Recuperar', exportar: 'Exportar', mesuresN: '{n} mesures', borrarTot: 'Esborrar totes les dades',
      titolImportar: 'Voleu recuperar aquesta còpia?', avisImportar: 'Les mesures actuals se substituiran per les de la còpia. Abans es desarà una còpia automàtica.',
      copiaDel: 'Còpia del', mesuresAra: 'Mesures ara', mesuresCopia: 'Mesures a la còpia',
      escriuPerConfirmar: 'Per confirmar, escriviu {paraula}', paraulaImportar: 'RECUPERAR', paraulaBorrar: 'ESBORRAR', siRecuperar: 'Sí, recuperar',
      titolBorrarTot: 'Voleu esborrar totes les dades?', avisBorrarTot: 'S\'esborraran d\'aquest dispositiu totes les mesures i les vostres dades. Abans es desarà una còpia automàtica, que podreu esborrar després.',
      siBorrarTot: 'Sí, esborrar-ho tot', importat: 'Còpia recuperada', totBorrat: 'Dades esborrades', borrarCopia: 'Voleu esborrar aquesta còpia automàtica?',
      COPIA_ILLEGIBLE: 'Aquest fitxer no és una còpia de seguretat.', COPIA_ALTRA_APP: 'Aquesta còpia no és d\'aquesta aplicació.',
      COPIA_POSTERIOR: 'Aquesta còpia és d\'una versió més nova. Actualitzeu l\'aplicació i torneu-ho a provar.',
      COPIA_INCOMPLETA: 'Aquesta còpia està incompleta o malmesa. No s\'ha canviat res.',
      MIGRACIO_ABSENT: 'Aquesta còpia és d\'una versió antiga que ja no es pot recuperar.', COPIA_MASSA_GRAN: 'El fitxer és massa gran.',
      IMPORTACIO_FALLIDA: 'No s\'ha pogut recuperar la còpia. Les dades anteriors són a «Còpies automàtiques».',
      COPIA_PREVIA_FALLIDA: 'No s\'ha pogut desar la còpia automàtica. No s\'ha canviat res.',
      avisCopia: 'Fa {dies} dies que no feu cap còpia de seguretat.', avisCopiaMai: 'Encara no heu fet cap còpia de seguretat.', mesTard: 'Més tard',
      presesSerie: 'Preses per sèrie (2 a 5)', minutsRepos: 'Minuts de repòs (0 a 30)', minutsEntre: 'Minuts entre preses (0 a 10)', presesDescartades: 'Primeres preses que no compten (0 a 4)',
      ajudaConfigGuia: 'Canvieu aquests valors només si us ho indica el vostre centre de salut.',
      CONFIGURACIO_INVALIDA: 'Reviseu els valors: han d\'estar dins dels límits i les preses que no compten han de ser menys que les preses.',
      installar: 'Instal·lar l\'aplicació', ajudaInstallarIos: 'Per instal·lar-la a l\'iPhone, premeu el botó Compartir de Safari i trieu «Afegir a la pantalla d\'inici». Així les dades no s\'esborren per falta d\'ús.',
      diesSetmana: ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte']
    }
  };

  var NOVETATS = [
    {
      versio: '0.12.0',
      data: '10/11/2026',
      es: ['La aplicación se instala en el teléfono y funciona sin conexión.', 'Sus medidas se guardan solo en su dispositivo.', 'En Ajustes puede hacer y recuperar copias de seguridad.', 'En Ajustes puede cambiar los tiempos de la medida guiada.'],
      ca: ['L\'aplicació s\'instal·la al telèfon i funciona sense connexió.', 'Les vostres mesures es desen només al vostre dispositiu.', 'A Ajustos podeu fer i recuperar còpies de seguretat.', 'A Ajustos podeu canviar els temps de la mesura guiada.']
    },
    {
      versio: '0.11.0',
      data: '09/11/2026',
      es: ['Puede elegir una medida guiada, con las esperas y las tomas paso a paso.', 'En el informe puede ver todas las tomas o una por serie.'],
      ca: ['Podeu triar una mesura guiada, amb les esperes i les preses pas a pas.', 'A l\'informe podeu veure totes les preses o una per sèrie.']
    },
    {
      versio: '0.10.0',
      data: '09/11/2026',
      es: ['La aplicación se abre con su enlace personal y guarda cada medida directamente.'],
      ca: ['L\'aplicació s\'obre amb el vostre enllaç personal i desa cada mesura directament.']
    },
    {
      versio: '0.9.0',
      data: '08/11/2026',
      es: ['Ahora puede corregir y borrar medidas desde el historial.', 'El informe incluye gráficos y otras fechas.', 'Puede exportar el informe también en CSV.', 'Puede cambiar su nombre y sus objetivos en Ajustes.'],
      ca: ['Ara podeu corregir i esborrar mesures des de l\'historial.', 'L\'informe inclou gràfics i altres dates.', 'Podeu exportar l\'informe també en CSV.', 'Podeu canviar el vostre nom i els objectius a Ajustos.']
    }
  ];

  return { app: APP, novetats: NOVETATS };
});
