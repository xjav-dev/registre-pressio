# Registre de canvis — registre-pressio

Tots els canvis rellevants de l'aplicació a partir de la primera versió.
Format basat en «Keep a Changelog»; les versions segueixen el versionat
semàntic (MAJOR.MENOR.PEGAT).

## [Sense publicar]

## [0.12.0] · 2026-11-10
Resum: l'aplicació s'instal·la al telèfon, funciona sense connexió i desa les dades al mateix dispositiu, amb còpies de seguretat en un fitxer.
Migració d'esquema: sí (esquema 3 → 4, dades locals). Les dades del full no es traspassen soles (DD-027).

### Afegit
- Aplicació web instal·lable (PWA) per publicar a GitHub Pages, amb icona pròpia i funcionament sense connexió. (CU-03, DD-024, DD-028)
- Còpies de seguretat en un fitxer del dispositiu, amb recuperació comprovada, confirmació escrita, còpies automàtiques internes i recordatori. (CU-11, CU-22, DD-025)
- Pantalla de benvinguda, amb l'opció de recuperar una còpia. (CU-11)
- Els temps i les preses de la mesura guiada es canvien a Ajustos. (CU-13)
- Esborrat de totes les dades des de l'aplicació, amb còpia interna prèvia. (CU-23)
- [intern] `proves/executa-dades.js`, `proves/executa-pwa.js` i la prova de navegador `proves/navegador.js`.

### Canviat
- Les mesures i el perfil es desen al dispositiu (IndexedDB) en lloc del full de Google. (DD-024)
- [intern] Estructura de lloc estàtic: `index.html`, `sw.js`, `manifest.webmanifest`, `js/`, `css/`, `lib/` i `icones/`. (DD-024)

### Eliminat
- L'enllaç personal, el panell d'administració i el full de càlcul. (DD-024)
- [intern] El projecte d'Apps Script (`src/`, `.clasp*.json`), `96_Historial.gs` i la seva eina, i les proves del servidor. (DD-024)

### Seguretat
- Política de contingut que només permet fitxers del mateix lloc; l'aplicació no fa cap petició de xarxa. (DD-026)

## [0.11.0] · 2026-11-09
Resum: es pot triar una mesura guiada amb les esperes i les 3 preses que indica el CAP.
Migració d'esquema: sí (`migra_2_a_3`, esquema 2 → 3). Cal executar-la des del panell si ja hi havia dades.

### Afegit
- Mesura guiada pas a pas, amb compte enrere, avís sonor i resum final. (CU-12, DD-021)
- Al gràfic d'evolució es pot triar entre totes les preses o una per sèrie. (DD-022)
- La columna «Toma» a l'historial, al PDF i al CSV.
- [intern] Paràmetres de la mesura guiada al panell, inclòs quines preses descarta la mitjana. (DD-023)

### Canviat
- Les mitjanes compten cada sèrie una sola vegada; el mínim i el màxim es calculen amb totes les preses. (DD-022)

## [0.10.0] · 2026-11-09
Resum: l'aplicació s'obre amb un enllaç personal i desa cada mesura directament.
Migració d'esquema: sí (`migra_1_a_2`, esquema 1 → 2). Cal executar-la des del panell si ja hi havia dades.

### Canviat
- L'accés és un enllaç personal en lloc d'un codi de 8 xifres. (DD-019)
- Cada mesura es desa directament i la pantalla confirma quan arriba al full. (DD-018)
- [intern] Totes les pantalles viuen dins del projecte d'Apps Script, en un sol objecte. (DD-018)
- [intern] Un sol entorn, el de producció. (DD-020)

### Eliminat
- El registre sense connexió. (DD-018)
- [intern] La carpeta `web/`, l'allotjament a part i la sincronització. (DD-018)
- [intern] La pestanya `CodisVinculacio` i la columna `rebut_el`. (DD-019)

## [0.9.0] · 2026-11-08
Resum: l'aplicació ja permet corregir mesures, veure gràfics i exportar l'informe en PDF i CSV.
Migració d'esquema: no (esquema 1).

### Afegit
- Correcció i esborrat de mesures des de l'historial. (CU-06, CU-07)
- Gràfics d'evolució i de matí i vespre, a la pantalla i al PDF. (CU-08, DD-009)
- Exportació en CSV i interval de dates personalitzat. (CU-08, CU-09)
- Canvi del nom i els objectius des d'Ajustos, i pantalla de novetats. (CU-10)
- [intern] Panell d'administració dins del full: persones, codis, baixes i historial. (CU-20, CU-21, DD-015)
- [intern] Esborrat de totes les dades d'una persona, amb còpia prèvia i confirmació escrita. (CU-23)
- [intern] Còpies de seguretat i importació amb control de versió. (CU-22)
- [intern] Migracions amb còpia prèvia i selecció de l'entorn en instal·lar.

### Canviat
- Al PDF, la data va primer i el dia de la setmana, després.
- [intern] El menú del full queda reduït a instal·lar i obrir l'administració. (DD-015)

## [0.1.0] · 2026-11-08
Resum: prova de viabilitat per registrar mesures al telèfon, també sense cobertura.
Migració d'esquema: no (instal·lació inicial, esquema 1).

### Afegit
- Vinculació del telèfon amb un codi d'un sol ús. (CU-01)
- Registre de sistòlica, diastòlica i pols amb teclat propi i nota en pantalla a part. (CU-02, CU-04)
- Desat al telèfon i enviament automàtic quan hi ha connexió. (CU-03)
- Historial de mesures i informe PDF senzill per interval. (CU-05, CU-09)
- Interfície en castellà i català. (CU-10)
- [intern] Menú d'administració al full per instal·lar, donar d'alta i revocar accessos. (CU-20, CU-21)
- [intern] Columna `rebut_el` a `Mesures` per a la sincronització. (DD-012)
