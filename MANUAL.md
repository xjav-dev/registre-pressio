# Manual — registre-pressio 0.12.0

Aplicació web instal·lable. Les mesures es desen **només al telèfon de cada persona**: no hi ha servidor, full de càlcul ni comptes. La publicació a GitHub s'explica a `README.md`.

## Instal·lació al telèfon

1. Obre l'adreça de l'aplicació amb **Safari** (iPhone) o **Chrome** (Android). La primera vegada cal connexió.
2. Afegeix-la a la pantalla d'inici:
   - iPhone: botó **Compartir** › **Afegir a la pantalla d'inici**.
   - Android: **Ajustes** › **Instalar la aplicación**, o el menú de Chrome › **Instal·lar aplicació**.
3. Obre-la sempre des de la icona. A partir d'aquí funciona sense connexió.

Convé instal·lar-la: a l'iPhone, un lloc web que no està a la pantalla d'inici pot perdre les dades si passa uns dies sense obrir-se.

A la pantalla de benvinguda es tria l'idioma i, si es vol, s'escriu el nom que sortirà a l'informe. Si es ve d'un altre telèfon, **Recuperar una copia** carrega les dades d'un fitxer de còpia.

## Ús

1. A **Registrar**, escriu els valors amb el teclat de la pantalla i prem **Guardar**. La data i l'hora s'anoten soles. **Añadir nota** obre una pantalla per escriure el que calgui.
   Si es vol, **Medida guiada** acompanya el repòs, les preses i les esperes. Es poden saltar les esperes amb **Ya he esperado**. Convé que la pantalla no es bloquegi durant l'espera.
2. A **Historial**, toca una mesura per corregir-ne els valors, la data, l'hora o la nota, o per esborrar-la.
3. A **Informe**, tria el període, consulta el resum i els gràfics (pots veure totes les preses o una per sèrie), i comparteix el **PDF** o el **CSV**.
4. A **Ajustes**, pots canviar l'idioma, el nom de l'informe i els objectius que t'hagi indicat el metge.

### Mesura guiada

A **Ajustes › Medida guiada** es canvien les preses per sèrie, els minuts de repòs, els minuts entre preses i quantes primeres preses no compten per a la mitjana. Per defecte: 3 preses, 5 minuts, 2 minuts i cap descartada. Si el CAP indica que es descarta la primera presa, posa-hi un 1. El canvi també recalcula les sèries ja fetes.

## Còpies de seguretat

Les dades només són al telèfon. Si es perd, s'espatlla o s'esborren les dades del navegador, **només es recuperen d'una còpia**. Tot es fa a **Ajustes › Copias de seguridad**.

- **Hacer una copia ahora** crea un fitxer `RPS_copia_v…json` i obre el menú del telèfon per desar-lo (a Fitxers, al Drive, enviar-lo per correu…). A Android pot anar directament a la carpeta de descàrregues. La pantalla mostra la data de l'última còpia i quants canvis hi ha sense copiar.
- **Recordarme hacer una copia**: cada 7 dies, cada 30 (per defecte) o mai. L'avís surt en obrir l'aplicació si hi ha canvis sense copiar, com a màxim un cop al dia.
- **Recuperar una copia** demana el fitxer, el comprova i mostra quantes mesures hi ha ara i quantes n'hi ha a la còpia. Per confirmar cal escriure **RECUPERAR**. Les dades actuals se substitueixen per les de la còpia. Si el fitxer no és d'aquesta aplicació, està malmès o és d'una versió més nova, es rebutja i no es canvia res.
- **Copias automáticas**: abans de recuperar una còpia o d'esborrar les dades, l'aplicació en desa una dins del telèfon. Es conserven les 5 últimes i es poden recuperar, exportar o esborrar. Serveixen per desfer un error, no per si es perd el telèfon.
- **Borrar todos los datos** esborra les mesures i el perfil del telèfon. Cal escriure **BORRAR** (**ESBORRAR** en català). Queda una còpia automàtica, que es pot esborrar després des de la mateixa pantalla.
- **Almacenamiento protegido** indica si el telèfon ha acceptat no esborrar les dades per falta d'espai. Si diu «No», les còpies encara són més importants.

El fitxer de còpia **no va xifrat**: conté el nom i totes les mesures. Desa'l en un lloc de confiança.

### Canvi de telèfon

1. Al telèfon vell: **Hacer una copia ahora** i envia't el fitxer.
2. Al telèfon nou: instal·la l'aplicació, i a la benvinguda prem **Recuperar una copia** i tria el fitxer.

## Actualitzacions

Quan es publica una versió nova, el telèfon la descarrega en obrir l'aplicació amb connexió i l'aplica la vegada següent que s'obre. Les dades no es toquen. La versió es veu a **Ajustes**, i els canvis, a **Novedades**.

L'aplicació no fa diagnòstics.
