# Especificacions — registre-pressio

| | |
| --- | --- |
| **Nom de l'aplicació** | `registre-pressio` (prefix dels zips; no canvia mai) |
| **Codi curt** | `RPS` (`CODI_APP`) |
| **De qui és** | Ús familiar de Xavi. **No és una aplicació de Creixen Terrassa** (a confirmar: autoria i copyright de les capçaleres, vegeu §12) |
| **Estat** | Aprovades · 2026-11-09. Modificades el 2026-11-10 (DD-024 a DD-028): aplicació web instal·lable amb dades locals. Pendent de validar per publicar la 1.0.0 (§12) |
| **Versió objectiu** | 1.0.0 |

---

## 1. Objectiu

Permetre que persones de la família, algunes d'edat avançada, anotin les seves
mesures de pressió arterial al mòbil amb la mínima interacció. A partir d'aquestes mesures, l'aplicació mostra l'evolució i
genera un informe en PDF i CSV per portar al metge.

## 2. Abast i fora d'abast

### Dins de l'abast (1.0.0)

- Registre manual de sistòlica, diastòlica i pols, amb nota opcional.
- Desat de cada mesura al mateix dispositiu, sense connexió ni compte.
- Mesura guiada opcional: repòs, preses i esperes segons les indicacions del CAP.
- Correcció de valors, data, hora i nota; esborrat de mesures.
- Selecció d'un interval de dates, gràfics i exportació en PDF i CSV.
- Còpies de seguretat en un fitxer del dispositiu, recuperació amb control de versió i recordatori.
- iOS i Android, amb una sola aplicació web instal·lable (PWA) allotjada a GitHub Pages.
- Funcionament sense connexió un cop oberta la primera vegada.
- Interfície en castellà (idioma per defecte) i català.

### Fora de l'abast

- Servidor, full de càlcul o sincronització entre dispositius (DD-024).
- Còpies automàtiques al núvol.
- Connexió amb tensiòmetres (Bluetooth o càmera).
- Lectura o escriptura a Salut d'Apple o Health Connect.
- Diverses persones en un mateix dispositiu i selector de perfil.
- Diagnòstic, interpretació clínica o recomanacions de tractament.
- Recordatoris de mesura i notificacions.
- Registre de medicació.
- Formulari «Suggeriments i errors» (vegeu DD-008).
- Ús fora de la família.

## 3. Usuaris i rols

| Rol | Qui és | Com entra | Què pot fer |
| --- | --- | --- | --- |
| **Persona** | Cada familiar que es mesura la pressió | Icona a la pantalla d'inici del seu telèfon. Sense compte ni enllaç personal | Registrar, consultar, corregir i esborrar les seves mesures; veure gràfics; exportar; canviar l'idioma, el perfil i la mesura guiada; fer i recuperar còpies; esborrar totes les dades |

No hi ha rol d'administració ni cap dada compartida: cada dispositiu té només les
dades de qui el fa servir, i ningú més no les pot veure. Qui publica l'aplicació a
GitHub només publica el codi.

## 4. Casos d'ús

- CU-01. Com a persona, vull obrir l'app des de la icona sense crear cap compte.
- CU-02. Com a persona, vull introduir els valors i prémer «Guardar» per registrar una mesura amb la data i l'hora automàtiques.
- CU-03. Com a persona, vull registrar encara que no tingui connexió.
- CU-04. Com a persona, vull afegir una nota des d'un botó, en una pantalla a part, per apuntar el que m'ha passat en aquell moment.
- CU-12. Com a persona, vull triar una mesura guiada que em marqui el repòs, les esperes i les preses.
- CU-05. Com a persona, vull veure l'historial de les meves mesures.
- CU-06. Com a persona, vull corregir valors, data, hora o nota d'una mesura per esmenar errors o anotar-ne una de feta abans.
- CU-07. Com a persona, vull esborrar una mesura equivocada.
- CU-08. Com a persona, vull triar un interval de dates i veure'n els gràfics i el resum.
- CU-09. Com a persona, vull exportar l'interval en PDF i en CSV per compartir-lo amb el metge.
- CU-10. Com a persona, vull canviar entre castellà i català.
- CU-11. Com a persona, vull recuperar les meves dades si canvio de telèfon, a partir d'una còpia.
- CU-13. Com a persona, vull canviar els temps i les preses de la mesura guiada si el CAP m'ho indica.
- CU-22. Com a persona, vull fer una còpia de seguretat en un fitxer i que l'aplicació em recordi de fer-la.
- CU-23. Com a persona, vull esborrar totes les meves dades del dispositiu.

Els casos CU-20 i CU-21 (alta de persones i revocació d'enllaços) desapareixen amb DD-024.

## 5. Model de dades

Les dades es desen a la base de dades del navegador (IndexedDB, base `registre-pressio`),
dins del dispositiu. Totes les dates són text ISO 8601. Les dades marcades **[P]** són
personals i les **[S]**, de salut. Esquema actual: **4** (`VERSIO_ESQUEMA`).

### Magatzem `mesures` (clau `id_mesura`)

| Camp | Tipus | Notes |
| --- | --- | --- |
| `id_mesura` | UUID | Clau, generada en començar a escriure. Evita duplicats |
| `mesura_el` | ISO amb desplaçament | **[S]** Data i hora de la mesura; editable |
| `sistolica` | Enter (mmHg) | **[S]** |
| `diastolica` | Enter (mmHg) | **[S]** |
| `pols` | Enter (ppm) o buit | **[S]** |
| `nota` | Text, màx. 500 | **[S]** Text lliure |
| `registrat_el` | ISO | Moment real del registre; **no editable** |
| `modificat_el` | ISO | Última modificació |
| `corregida` | Booleà | Indica que s'han canviat els valors o la data |
| `esborrat_el` | ISO o buit | Esborrat lògic, per poder recuperar un error |
| `id_serie` | UUID o buit | Agrupa les preses d'una mesura guiada |
| `ordre_serie` | Enter o buit | Número de presa dins de la sèrie |

**No es desen, es calculen:** dia de la setmana i franja (matí o vespre).

### Magatzem `configuracio` (clau `clau`, valor de text)

- Viatgen a les còpies: `nom` **[P]**, `idioma`, `objectiu_sistolica`, `objectiu_diastolica`,
  `hora_inici_mati`, `hora_fi_mati`, `preses_serie`, `minuts_repos`, `minuts_entre_preses`,
  `preses_descartades` i `dies_avis_copia`.
- Són de l'aparell i no viatgen (comencen per `_`): `_esquema`, `_benvinguda`, `_primer_us`,
  `_ultima_copia`, `_canvis_sense_copia` i `_avis_ajornat`.

### Magatzem `copies` (clau `id`)

Còpies automàtiques internes: `id`, `data`, `motiu`, `versio`, `esquema`, `mesures`, `nom` i
`text` (el mateix contingut que un fitxer de còpia) **[P][S]**. Se'n conserven les 5 últimes.

### Fitxer de còpia

`RPS_copia_v‹versió›_e‹esquema›_‹AAAA-MM-DD_HHmm›.json`, amb dos blocs:

- `metadades`: `aplicacio` (`RPS`), `nom`, `versio`, `esquema`, `data`, `motiu`
  (`manual`, `abans_importar`, `abans_esborrar` o `abans_migrar`), `taules` (camps i nombre de
  files de `mesures`; nombre de claus de `configuracio`) i `resum` (SHA-256 del bloc de dades).
- `dades`: `mesures` (totes, també les esborrades) i `configuracio` (només les claus que viatgen).

## 6. Pantalles i fitxers

Pàgina única (`index.html`). Navegació inferior amb quatre botons grans:
**Registrar · Historial · Informe · Ajustes**.

| Pantalla | Contingut |
| --- | --- |
| Benvinguda (primer ús) | Idioma, avís que les dades es desen només al dispositiu, nom opcional, «Empezar» i «Recuperar una copia» |
| **Registrar** (inici) | Registre directe: sistòlica, diastòlica i pols en gran; teclat numèric propi; botó «Añadir nota»; botó «Guardar». Data i hora visibles. Botó «Medida guiada» |
| Mesura guiada | Indicacions, compte enrere, presa, espera i resum final |
| Nota | Pantalla completa amb àrea de text i botó «Volver» |
| Historial | Llista per dies, amb la més recent primer |
| Editar mesura | Valors, data, hora, nota, «Guardar», «Borrar» |
| Informe | Interval (7 dies, 30 dies, 3 mesos, personalitzat), resum, gràfics, «PDF» i «CSV» |
| Ajustes | Idioma, nom, objectius, última còpia i versió; accés a les dades personals, la mesura guiada, les còpies i les novetats; instal·lació |
| Ajustes › Mesura guiada | Preses per sèrie, minuts de repòs, minuts entre preses i preses que no compten |
| Ajustes › Còpies de seguretat | Estat, «Hacer una copia ahora», «Recuperar una copia», recordatori, còpies automàtiques i «Borrar todos los datos» |

| Fitxer | Funció |
| --- | --- |
| `index.html`, `css/app.css` | Pàgina i estils |
| `manifest.webmanifest`, `icones/` | Instal·lació a la pantalla d'inici |
| `sw.js` | Treballador de servei: desa els fitxers de l'aplicació per obrir-la sense connexió |
| `js/config.js` | Versió, esquema, límits i configuració inicial |
| `js/textos.js` | Textos en castellà i català, i novetats |
| `js/logica.js` | Regles sense interfície: validació, dates, resum, CSV |
| `js/grafics.js` | Model dels gràfics, SVG i PDF |
| `js/magatzem.js` | Únic accés a IndexedDB |
| `js/copies.js` | Format i comprovació de les còpies |
| `js/servei.js` | Regles de negoci sobre les dades |
| `js/pantalles.js` | Pantalles |
| `lib/jspdf.umd.min.js` | jsPDF 2.5.2 (MIT), sense modificar |

## 7. Regles de negoci

### Registre

1. Sistòlica i diastòlica són obligatòries; el pols i la nota són opcionals.
2. **Salt automàtic de camp:** si el valor comença per 1 o 2 a la sistòlica, o per 1 a la diastòlica i al pols, s'esperen tres xifres; si no, dues.
3. En prémer «Guardar», la data i l'hora són les del telèfon i la mesura es desa al dispositiu.
4. La confirmació arriba quan el dispositiu ha desat la mesura i mostra els valors. Després, la pantalla queda buida.
5. Si el dispositiu no pot desar, es manté el que s'ha escrit i es pot tornar a prémer «Guardar» sense risc de duplicar la mesura.

### Mesura guiada

1. És opcional: es tria des de «Registrar», i el registre directe es manté igual.
2. Valors per defecte, segons les indicacions del CAP: 5 minuts de repòs, 3 preses i 2 minuts entre preses. Es canvien a Ajustos › Mesura guiada.
3. Cada presa es desa en el moment, amb `id_serie` i `ordre_serie`. Si es deixa a mitges, les preses fetes queden desades.
4. Les esperes es poden saltar amb «Ya he esperado». El compte enrere es calcula amb l'hora real i, en acabar, sona un avís si el telèfon ho permet.
5. Una sèrie compta com una sola mesura per a les mitjanes i el percentatge per sobre de l'objectiu, amb les preses que indiqui `preses_descartades`. El mínim i el màxim es calculen amb totes les preses.

### Validació (a la pantalla i repetida en desar)

| Camp | Avís «¿Es correcto?» si queda fora de | Rebuig si queda fora de |
| --- | --- | --- |
| Sistòlica | 70–250 | 40–300 |
| Diastòlica | 40–150 | 20–200 |
| Pols | 40–180 | 20–250 |

També es demana confirmació si la diastòlica és igual o superior a la sistòlica.
L'avís no bloqueja: la persona pot confirmar el valor o corregir-lo.

### Avís de valor molt alt

Si una mesura arriba a 180 de sistòlica o 120 de diastòlica, es mostra un missatge
d'aquest tipus: «Repita la medida y, si sigue alta o tiene síntomas, avise a su
médico o llame al 112». **El llindar i el text han de ser validats per un metge
abans de la 1.0.0** (vegeu §12).

### Franges

Matí de les 04:00 a les 13:59; vespre, la resta. L'hora de tall és a la configuració (`hora_inici_mati`, `hora_fi_mati`).

### Resum de l'interval

Mitjana global, mitjana de matí, mitjana de vespre, diferència matí–vespre, pols
mitjà, mínim i màxim, nombre de lectures i de dies amb dades, i percentatge de
lectures per sobre de l'objectiu.

Si l'interval té entre 4 i 14 dies amb dades, també es mostra la mitjana sense el
primer dia, tal com demana el protocol domiciliari. Amb menys de 3 dies es
mostra «Datos insuficientes para un promedio fiable».

Referències: protocol de 7 dies amb dues lectures al matí i dues al vespre,
excloent el primer dia, i llindar domiciliari de 135/85 mmHg
([PubMed 27051984](https://pubmed.ncbi.nlm.nih.gov/27051984/)); mínim de 3 dies
([PMC10530450](https://pmc.ncbi.nlm.nih.gov/articles/PMC10530450)); objectius per
guia i paràmetres de matí i vespre
([PMC8385573](https://pmc.ncbi.nlm.nih.gov/articles/PMC8385573)). L'objectiu de
cada persona el fixa el seu metge.

### Gràfics

1. **Evolució:** sistòlica i diastòlica al llarg del temps, amb totes les preses o una per sèrie, a elecció, i línies de referència als objectius. Matí i vespre es distingeixen per la forma del punt, no només pel color.
2. **Matí i vespre:** mitjanes de cada franja, per dia si l'interval és de fins a 14 dies i per setmana si és més llarg.

### Exportació

Es genera al telèfon i es comparteix amb el menú del sistema o, si no està disponible, es descarrega.

- **PDF:** nom, interval, data de generació, resum, els dos gràfics i la taula de mesures (data, dia, hora, presa, franja, sistòlica, diastòlica, pols, nota). Les mesures corregides porten un asterisc. Peu: «Datos registrados por el paciente. No constituye un diagnóstico».
- **CSV:** UTF-8 amb BOM, separador `;`, capçaleres en l'idioma de la persona, data `DD/MM/AAAA`. Les notes que comencin per `=`, `+`, `-` o `@` es neutralitzen perquè un full de càlcul no les executi.

### Còpies de seguretat

1. **Fer una còpia** genera un fitxer JSON amb totes les dades i el lliura amb el menú de compartir del sistema o, si no n'hi ha, el descarrega. Quan s'ha lliurat, s'anota la data i el comptador de canvis sense copiar torna a zero.
2. **Recordatori:** en obrir l'aplicació, si hi ha canvis sense copiar i han passat 7 o 30 dies (a elecció; per defecte 30) des de l'última còpia o des del primer ús, es mostra un avís, com a màxim una vegada al dia. Es pot desactivar.
3. **Recuperar una còpia** comprova, abans de tocar res: que és d'aquesta aplicació; que l'esquema no és posterior (si ho és, es rebutja) i que, si és anterior, hi ha totes les migracions; que el nombre de files, els camps i el resum quadren; i que cada mesura i cada valor de configuració són vàlids. Si alguna comprovació falla, es diu quina i no es canvia res.
4. Abans de substituir les dades es mostra el resum (data i versió de la còpia, mesures ara i a la còpia) i cal escriure la paraula de confirmació («RECUPERAR»).
5. **Còpia automàtica interna** abans de recuperar una còpia, d'esborrar totes les dades i de migrar. Si no es pot fer, l'operació no es fa. Se'n conserven les 5 últimes; es poden recuperar, exportar i esborrar.
6. **Esborrar totes les dades** exigeix escriure «BORRAR» («ESBORRAR» en català), fa una còpia interna abans i torna a la pantalla de benvinguda. La còpia interna es pot esborrar després.
7. Es demana al navegador que protegeixi l'emmagatzematge (`navigator.storage.persist`) i la pantalla de còpies diu si ho ha concedit.

### Actualitzacions

En obrir l'aplicació amb connexió, el navegador comprova si `sw.js` ha canviat. Si hi ha una
versió nova, la descarrega sencera i s'aplica la propera vegada que s'obre. Les dades no es toquen.

### Processos programats

Cap. Vegeu DD-011.

## 8. Requisits no funcionals

- **Volum:** una persona per dispositiu; unes 1.500 mesures l'any.
- **Rendiment:** desar és immediat; no depèn de cap servidor.
- **Connexió:** només cal per obrir l'aplicació la primera vegada i per rebre actualitzacions.
- **Plataformes:** iPhone amb iOS 17 o posterior i Android amb Chrome actual, amb l'aplicació instal·lada a la pantalla d'inici.
- **Accessibilitat:**
  - text base d'almenys 20 px i valors de la mesura d'almenys 48 px;
  - zones tàctils d'almenys 56 px;
  - contrast mínim de 7:1 en el text principal;
  - cap informació transmesa només amb color;
  - etiquetes per a lectors de pantalla;
  - errors al costat del camp, en llenguatge planer.
- **Sense dependències externes en execució:** tots els fitxers, inclosa la biblioteca de PDF, són dins del projecte. L'aplicació no fa cap petició fora del seu propi lloc.
- **Allotjament:** estàtic, amb HTTPS (GitHub Pages). Funciona en una subcarpeta.

## 9. Privacitat i RGPD

Aquest apartat descriu el tractament previst; no és assessorament legal.

| Pregunta | Resposta |
| --- | --- |
| **Quines dades i per què** | Nom (identificar l'informe, opcional); valors, data, hora i nota (finalitat de l'app). Cap correu, telèfon, DNI ni dada de salut addicional |
| **Qui hi té accés** | Només qui té el dispositiu desbloquejat. Ni qui publica l'aplicació ni GitHub reben cap dada |
| **Conservació** | Mentre la persona vulgui. Les pot esborrar totes des de l'aplicació (CU-23); les còpies internes i els fitxers de còpia s'han d'esborrar a part |
| **On són** | Al navegador del dispositiu (IndexedDB). Els fitxers de còpia, on la persona els desi |
| **Sortides** | Només quan la persona exporta un informe o una còpia i decideix on desar-los o a qui enviar-los. Cap enviament automàtic ni serveis d'analítica |
| **Registre d'accessos** | No n'hi ha: no hi ha servidor |
| **Còpies** | Fitxers JSON **sense xifrar**, amb el nom i totes les mesures. Qui els tingui pot llegir-los: cal desar-los en un lloc de confiança |
| **Repositori** | Públic, només amb codi i documentació. Mai dades, còpies ni exportacions |
| **Desenvolupament** | Només dades inventades |

Si l'aplicació s'obrís a persones de fora de la família, caldria revisar aquest
apartat i el marc legal. Si interpretés valors o orientés decisions clíniques, s'hauria
d'analitzar si és un producte sanitari.

## 10. Criteris d'acceptació

**Registre**

- [ ] Una mesura normal es registra prement només els dígits i «Guardar».
- [ ] La data, l'hora i el dia de la setmana apareixen sense introduir-los.
- [ ] El botó de nota obre una pantalla completa i la nota es desa amb la mesura.
- [ ] Doble toc a «Guardar» no crea dues mesures.
- [ ] Els valors improbables demanen confirmació sense bloquejar.
- [ ] El mode guiat és opcional i el registre directe no canvia.
- [ ] La guia marca 5 minuts de repòs, 3 preses i 2 minuts entre preses, i les esperes es poden saltar.
- [ ] Els paràmetres de la guia es canvien des d'Ajustos.
- [ ] El gràfic permet triar entre totes les preses i una per sèrie, i el mínim i el màxim no es perden.
- [ ] Es pot registrar sense connexió.

**Edició**

- [ ] Es poden corregir valors, data, hora i nota.
- [ ] En canviar la data es recalculen el dia i la franja.
- [ ] `registrat_el` no canvia en editar.
- [ ] Una mesura esborrada desapareix de l'historial, els gràfics i les exportacions.

**Informes**

- [ ] Es pot triar un interval i només s'inclouen les mesures d'aquest interval.
- [ ] El PDF inclou resum, gràfics i taula, i les mesures corregides surten marcades.
- [ ] El CSV s'obre bé a Excel en castellà, amb accents i columnes correctes.
- [ ] Una nota que comença per `=` no s'executa al full de càlcul.
- [ ] L'exportació es pot compartir o descarregar des de l'iPhone i des d'Android.
- [ ] Les mitjanes coincideixen amb un càlcul independent de dades de prova.

**Dades locals i còpies**

- [ ] Les mesures continuen al dispositiu després de tancar i tornar a obrir l'aplicació.
- [ ] Fer una còpia i recuperar-la deixa les dades iguals.
- [ ] Es rebutja un fitxer que no és una còpia, d'una altra aplicació, d'un esquema posterior, o amb files, camps o resum que no quadren, sense canviar res.
- [ ] Sense escriure la paraula de confirmació no es recupera ni s'esborra res.
- [ ] Abans de recuperar o d'esborrar es desa una còpia interna, i si falla no es fa res.
- [ ] El recordatori apareix quan toca i es pot ajornar o desactivar.
- [ ] Una còpia feta en un telèfon es recupera en un altre.
- [ ] L'aplicació no fa cap petició fora del seu lloc (`proves/executa-pwa.js` i `proves/navegador.js`).

**Interfície i plataformes**

- [ ] Tots els textos existeixen en castellà i català, i el castellà és el predeterminat.
- [ ] No hi ha logotip ni identitat de Creixen Terrassa.
- [ ] Es compleixen els mínims d'accessibilitat de §8.
- [ ] S'instal·la a la pantalla d'inici d'un iPhone i d'un Android reals i s'obre sense connexió.
- [ ] Després de diversos dies sense obrir-la, les dades continuen al telèfon.
- [ ] Una versió nova publicada arriba al telèfon sense perdre dades.
- [ ] Una persona d'edat avançada registra una mesura sense ajuda.

## 11. Decisions de disseny

### DD-001 · 2026-11-08 · App web instal·lable connectada a un script vinculat
**Substituïda per DD-018 a DD-020.**
Context: cal registrar sense cobertura i sense dependre d'una sessió de Google, en iOS i Android.
Decisió: client web instal·lable (`web/`), allotjat a part, que parla amb l'Apps Script vinculat al full. S'ha descartat l'app nativa pel cost anual i la distribució.
Conseqüències: **desviació acceptada de la regla d'un sol objecte, només per al client.** Dades i codi de servidor segueixen junts al full. El zip inclou `web/`, que `clasp` no puja. Cal un allotjament estàtic HTTPS.

### DD-002 · 2026-11-08 · Un sol full amb un perfil per persona
**Substituïda per DD-024.**
Context: l'app la faran servir diversos familiars.
Decisió: un full i un script, amb `id_persona` a cada mesura. Substitueix la proposta inicial d'una còpia per persona.
Conseqüències: una sola versió per mantenir; el propietari del full veu les dades de tothom. Qui no ho vulgui necessitarà una instal·lació pròpia.

### DD-003 · 2026-11-08 · Identificació amb testimoni signat, no amb compte de Google
**Substituïda per DD-018 a DD-020.**
Context: amb execució com a propietari, Google no facilita el correu d'usuaris de fora del domini, i executar com a cada usuari els donaria accés al full.
Decisió: testimoni HMAC per persona, obtingut amb un codi d'un sol ús introduït dins de l'app.
Conseqüències: sense inici de sessió. Qui tingui el telèfon desbloquejat veu les dades; es recomana el bloqueig del telèfon.

### DD-004 · 2026-11-08 · Exposició de l'aplicació
**Substituïda per DD-026.**
Accés del desplegament: qualsevol, sense sessió. Sense testimoni, només la pàgina mínima de `doGet`. Cap punt d'entrada POST.
Operacions sense sessió (`OPERACIONS_PUBLIQUES_`), totes amb testimoni: `apiMesures`, `apiCrea`, `apiEdita`, `apiEsborra` i `apiPerfil`.
Administració: panell dins del full (DD-015). Les operacions `apiAdmin…`, `apiCopia…`, `apiCopiesLlista`, `apiHistorial`, `apiProvesExecuta` i `apiDadesProva` exigeixen sessió i el rol de `Rols`.

### DD-005 · 2026-11-08 · Idiomes
Interfície de les persones en castellà (per defecte) i català, amb els textos a `95_Textos.gs`. El servidor retorna codis i la pantalla els tradueix. Administració, codi, comentaris i documentació tècnica, en català.

### DD-006 · 2026-11-08 · Sense identitat de Creixen Terrassa
Sense logotip, colors corporatius ni Fira Sans. Paleta neutra d'alt contrast i tipografia del sistema. La icona de l'app és un disseny genèric propi.

### DD-007 · 2026-11-08 · Dia de la setmana i franja calculats
No es desen per evitar incoherències en corregir una data.

### DD-008 · 2026-11-08 · Sense «Suggeriments i errors» a la 1.0.0
Les persones no tenen compte identificat i és un ús familiar. «Novetats» i la versió es mostren a Ajustes, no a la pantalla de registre.

### DD-009 · 2026-11-08 · Informes i gràfics generats al telèfon
Perquè no calgui passar dades pel servidor per exportar. Biblioteca de PDF inclosa al projecte (`ui_jspdf.html`). Els gràfics es descriuen amb un únic model i es dibuixen en SVG a la pantalla i com a vectors al PDF, sense passar per una imatge: és més nítid i no retarda el menú de compartir de l'iPhone.

### DD-010 · 2026-11-08 · Teclat numèric propi
Tecles més grans que les del sistema i sense que la pantalla es desplaci.

### DD-011 · 2026-11-08 · Sense processos programats
Tot s'executa per acció de l'usuari. Les còpies són manuals i automàtiques abans de migrar. Una còpia periòdica quedaria pendent d'autorització explícita.

### DD-012 · 2026-11-08 · Columna `rebut_el` per sincronitzar
**Substituïda per DD-018 a DD-020.**
Context: `modificat_el` surt del rellotge del telèfon i no serveix per saber què ha arribat des de l'última sincronització.
Decisió: el servidor anota `rebut_el` i el fa servir de cursor. `modificat_el` continua decidint quina versió guanya. Una data de modificació més d'un dia al futur es substitueix per l'hora del servidor.
Conseqüències: el cursor és inclusiu i pot tornar a enviar l'última fila; el telèfon la ignora.

### DD-013 · 2026-11-08 · Intents fallits dels codis
**Substituïda per DD-018 a DD-020.**
Context: al full només hi ha el resum del codi i, per tant, un codi equivocat no es pot atribuir a cap fila.
Decisió: cada error suma un intent a tots els codis vigents.
Conseqüències: cinc errors invaliden els codis pendents i cal generar-ne de nous. A un ús familiar, gairebé mai no hi haurà més d'un codi vigent.

### DD-014 · 2026-11-08 · Abast de la versió 0.1.0
La prova de viabilitat inclou vinculació, registre, sincronització, historial, PDF senzill i ajustos. Queden per a després de superar-la: edició i esborrat, gràfics, CSV, interval personalitzat, `apiPerfil`, còpies i migracions. L'administració de la 0.1.0 és un menú del full; el desplegament d'administració arribarà amb les còpies.

### DD-015 · 2026-11-08 · Administració dins del full
**Substituïda per DD-024.**
Context: un desplegament anònim no identifica ningú, i `doGet` no sap per quin desplegament l'han cridat.
Decisió: el panell s'obre amb un diàleg des del menú del full, amb les operacions protegides pel rol de `Rols`. Substitueix el desplegament d'administració previst.
Conseqüències: només hi ha una URL pública, la de l'API, i menys superfície exposada.

### DD-016 · 2026-11-08 · Abast de la versió 0.9.0
Substitueix DD-014: inclou totes les funcions de les especificacions. La versió 1.0.0 queda reservada per quan estiguin resolts els pendents que la bloquegen (§12).

### DD-017 · 2026-11-08 · Època de dades
**Substituïda per DD-018 a DD-020.**
Context: després d'importar una còpia, els telèfons conservarien mesures que ja no existeixen al full.
Decisió: cada importació incrementa `EPOCA_DADES`. Quan el telèfon detecta el canvi, buida la seva còpia, conserva els canvis pendents i torna a descarregar-ho tot.

### DD-018 · 2026-11-09 · Estructura estàndard, sense `web/`
**Substituïda per DD-024.**
Context: totes les mesures es faran amb connexió, i la part web afegia allotjament, sincronització i una desviació de la regla d'un sol objecte.
Decisió: totes les pantalles viuen dins del projecte d'Apps Script. Substitueix DD-001.
Conseqüències: sense connexió l'aplicació no s'obre ni desa. Cada desat espera Google. La icona de la pantalla d'inici és la que triï el telèfon, i Google mostra el seu avís a la part superior.

### DD-019 · 2026-11-09 · Enllaç personal
**Substituïda per DD-024.**
Context: una pàgina d'Apps Script no pot conservar una vinculació de manera fiable.
Decisió: cada persona té un enllaç amb testimoni signat, com el patró d'enllaços per a famílies. Caduca als 10 anys perquè la icona desada no es pot renovar sola. Desapareixen els codis de 8 xifres. Substitueix DD-003, DD-012 i DD-013.
Conseqüències: l'enllaç és la clau d'accés i es pot revocar. Esquema 2.

### DD-020 · 2026-11-09 · Un sol entorn
**Substituïda per DD-024.**
Context: és un projecte petit i l'usuari ha decidit no mantenir un full de desenvolupament.
Decisió: `.clasp.json` i `.clasp.produccio.json` apunten al mateix projecte. Claude continua treballant només amb dades inventades.
Conseqüències: les proves reals es fan a producció amb una persona inventada, que després s'esborra. Qualsevol error es veu directament a l'entorn real.

### DD-021 · 2026-11-09 · Mesura guiada opcional
Context: el CAP indica 5 minuts de repòs, 3 preses i 2 minuts entre preses.
Decisió: mode triat des de «Registrar», amb esperes que es poden saltar. El registre directe no canvia. Les indicacions només diuen el que ha transmès el CAP.
Conseqüències: esquema 3. El compte enrere depèn del telèfon: si es bloqueja la pantalla, marca el temps correcte en tornar, però pot no sonar.

### DD-022 · 2026-11-09 · Sèries i extrems
Context: una mitjana de sèrie podria amagar els valors extrems.
Decisió: les mitjanes compten cada sèrie una vegada; el mínim i el màxim fan servir totes les preses, i el gràfic d'evolució deixa triar entre totes les preses i una per sèrie.

### DD-023 · 2026-11-09 · Paràmetres de la guia configurables
**Modificada per DD-024:** els paràmetres es canvien a Ajustos, no en un panell.
Context: el CAP ha de confirmar si es descarta la primera presa.
Decisió: `preses_descartades` i la resta de paràmetres es canvien al panell. Per defecte es fa la mitjana de les 3 preses. El canvi recalcula també les sèries ja fetes.

### DD-024 · 2026-11-10 · Aplicació web instal·lable amb les dades al dispositiu
Context: l'usuari demana convertir l'aplicació en una PWA per publicar-la a GitHub i desar les dades localment, en lloc del full de càlcul.
Decisió: lloc estàtic a GitHub Pages, instal·lable i amb funcionament sense connexió. Les dades de cada persona es desen a l'IndexedDB del seu dispositiu. Desapareixen el projecte d'Apps Script, el full, els enllaços personals, els rols i el panell d'administració. Substitueix DD-002, DD-015, DD-018, DD-019 i DD-020.
Conseqüències: **ja no és una aplicació d'Apps Script en un sol objecte**; `clasp`, `src/`, `96_Historial.gs` i les proves de superfície pública deixen d'aplicar-se. Ningú més que la persona veu les seves dades. No hi ha còpia central: si es perd el telèfon o el navegador esborra les dades, només es recuperen d'una còpia (DD-025). Una persona, un dispositiu. Si canvia l'adreça del lloc (nom del repositori, usuari o domini), el telèfon el veu com una aplicació nova i buida: abans cal fer una còpia.

### DD-025 · 2026-11-10 · Còpies de seguretat al dispositiu
Context: sense full ni servidor, la còpia és l'única protecció de les dades.
Decisió: fitxer JSON amb metadades (aplicació, versió, esquema, data, motiu, recomptes i resum SHA-256), lliurat amb el menú de compartir o descarregat. La recuperació fa les mateixes comprovacions que la importació anterior (aplicació, esquema igual / anterior amb migracions / posterior rebutjat, integritat) i valida cada fila. Còpia interna automàtica abans de recuperar, esborrar o migrar, amb les 5 últimes conservades. Confirmació escrivint una paraula. Recordatori cada 7 o 30 dies, o mai. La comprovació d'entorn desapareix perquè ja no hi ha entorns.
Conseqüències: les còpies no van xifrades i les ha de guardar la persona. L'aplicació no pot saber si el fitxer s'ha desat realment: anota la còpia quan el sistema confirma que s'ha compartit o quan s'ha iniciat la descàrrega. Les còpies internes són al mateix dispositiu i no protegeixen de perdre'l.

### DD-026 · 2026-11-10 · Exposició
Substitueix DD-004. El lloc és públic i estàtic: qualsevol que en tingui l'adreça pot obrir l'aplicació, però només hi veu les dades del seu propi dispositiu. No hi ha servidor, operacions remotes ni punts d'entrada. Una política de contingut (`Content-Security-Policy`) només permet fitxers del mateix lloc, i el codi propi no fa cap petició de xarxa. El repositori és públic i només conté codi i documentació.

### DD-027 · 2026-11-10 · Esquema 4 i dades anteriors
Context: fins a l'esquema 3 les dades eren al full de Google i les còpies eren fulls de càlcul.
Decisió: l'esquema 4 és el primer amb dades locals. Les mesures perden `id_persona` i la configuració incorpora el perfil. Les còpies anteriors no es poden recuperar des de l'aplicació (`MIGRACIO_ABSENT`). Les migracions futures s'afegiran a `MIGRACIONS` de `js/copies.js` i no se n'esborrarà cap.
Conseqüències: si al full hi ha mesures reals, s'han de tornar a introduir o cal preparar-ne una conversió a part (§12).

### DD-028 · 2026-11-10 · Actualitzacions amb el treballador de servei
Decisió: `sw.js` desa tots els fitxers de l'aplicació amb un nom que inclou la versió. Una versió nova es descarrega sencera quan s'obre l'aplicació amb connexió i s'aplica en l'obertura següent.
Conseqüències: a cada versió cal canviar `VERSIO` a `js/config.js` i a `sw.js` (ho comprova `proves/executa-pwa.js`); si no, els telèfons no s'actualitzen. Substitueix el requisit «cada obertura serveix la versió desplegada».

## 12. Riscos i pendents

### Riscos

| Risc | Mitigació |
| --- | --- |
| El navegador esborra les dades (a l'iPhone, un lloc no instal·lat pot perdre-les després de 7 dies sense ús; també en esborrar les dades de navegació) | Instal·lar l'aplicació a la pantalla d'inici, demanar emmagatzematge protegit, recordatori de còpia |
| Pèrdua o canvi de telèfon | Còpia en un fitxer fora de l'aplicació i recuperació des de la benvinguda |
| Canvi de l'adreça del lloc a GitHub | Avís al manual: fer una còpia abans i recuperar-la a l'adreça nova |
| El menú de compartir o la descàrrega no funcionen dins de l'aplicació instal·lada a l'iPhone (PDF, CSV i còpia) | **Comprovació prioritària** a la primera prova real |
| Còpia sense xifrar reenviada per error | Avís al manual; desar-la en un lloc de confiança |
| Una versió nova no arriba als telèfons | `VERSIO` a `sw.js` comprovada per les proves |
| Algú interpreta els gràfics com un diagnòstic | Avís a l'informe i cap classificació clínica |
| El telèfon bloqueja la pantalla durant una espera | El compte enrere es calcula amb l'hora real; es demana mantenir la pantalla encesa si el navegador ho permet |

### Pendents de l'usuari

1. **Validació mèdica** del llindar i el text de l'avís de valor molt alt (bloqueja la 1.0.0).
   **Confirmació del CAP:** text de les indicacions i quines preses compten per a la mitjana.
   **Prova en un iPhone i un Android reals**, instal·lada: registre, PDF, CSV, còpia i recuperació (bloqueja la 1.0.0).
2. **Autoria i copyright** de les capçaleres. Proposta: `Autoria: Xavi i Claude (Anthropic)`, `Copyright (c) 2026 Xavi`, EUPL-1.2.
3. **Repositori de GitHub**: compte personal, mai el del centre. Decidir-ne el nom abans que ningú hi desi dades, perquè canviar-lo canvia l'adreça.
4. **Dades del full anterior**: dir si n'hi ha de reals que calgui convertir (DD-027). El full i el seu desplegament es poden retirar quan ja no calguin.
5. **Text oficial de l'EUPL-1.2** a `LLICENCIA.txt`.
6. **Avisar cada familiar** que les dades només són al seu telèfon i que ha de fer còpies.
