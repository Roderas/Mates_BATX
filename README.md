# Mates Docent · Estudi matemàtic
## PWA 2.0.0 — Solucionador amb passos i guia docent

Aquesta versió transforma la PWA derivada de `mates-docent(1).html` en un espai de resolució inspirat en el flux d’ús de Symbolab: entrada matemàtica, teclat, passos desplegables, gràfica i quadern. És un projecte independent: no conté codi, serveis, comptes ni motor de Symbolab. No reprodueix tot el seu repertori.

## Publicar a GitHub Pages

1. Descomprimeix el ZIP. Puja TOT el contingut a l’arrel del repositori, no el ZIP ni una carpeta que contingui tots els fitxers.
2. `index.html`, `docent.html`, `manifest.json` i `sw.js` han de quedar al mateix nivell que `studio/`, `icons/`, `js/`, `data/` i `css/`.
3. A GitHub: Settings > Pages > Deploy from a branch > main > /(root). Utilitza el nom real de la branca si no és main.
4. Obre l’adreça HTTPS publicada, espera la còpia offline i prem Instal·lar quan el navegador ho ofereixi. Safari a iPhone/iPad: Compartir > Afegir a la pantalla d’inici.
5. En actualitzar la mateixa app, accepta l’actualització disponible. Tanca les pestanyes antigues si continuen mostrant l’altra versió.

L’app té rutes relatives i conserva `id: ./`, `scope: ./` i `start_url: ./`. Està preparada per a repositoris de projecte (subcarpetes). La instal·lació depèn del navegador. No funciona com a PWA instal·lada obrint l’HTML amb doble clic.

## Estructura

- `index.html`: nou estudi de resolució.
- `studio/engine.js`: motor matemàtic independent. Fraccions exactes, derivació, primitives, límits, àlgebra i mètodes numèrics.
- `studio/worker.js`: executa els càlculs en un Web Worker; permet cancel·lar i evita bloquejar la interfície.
- `studio/app.js`, `graph.js`, `styles.css`, `config.js`, `pwa.js`: interfície, gràfiques, 34 exemples, instal·lació i dades locals.
- `docent.html`, `js/`, `data/`, `css/`: guia docent anterior conservada, amb enllaç al nou solucionador.
- `manifest.json`, `icons/`, `favicon.ico`, `sw.js`: instal·lació, icones i còpia offline.
- `scripts/build-sw.py`: reconstrueix la llista de recursos i la seva empremta després de modificar fitxers.
- `tests/studio/`: proves reproduïbles, resultats i captures de la nova versió.
- `docs/`: abast, verificació, fonts i canvis.

## Operacions

Equacions; inequacions; simplificació; desenvolupament; factorització; sistemes lineals; derivades; primitives; integrals definides; límits; àrees entre corbes; gràfica i estudi local.

Escriu `x^2`, `3x`, `sin(x)`, `exp(x)`, `e^x`, `ln(x)`, `sqrt(x)`, `abs(x)` o `pi`. Log i ln són logaritmes naturals. Angles en radians. Sistemes: `2x+y=5; x-y=1`. Usa la categoria adequada; no s’interpreten ordres en llenguatge natural.

Les fórmules s’escriuen com a text i es previsualitzen amb MathML natiu. No és un editor visual d’arrossegar símbols. No hi ha reconeixement de fotografies o escriptura manual.

## Quadern i dades

Historial de fins a 30 consultes. Quadern de fins a 100 resolucions amb nota docent. Les consultes es recalculen en obrir-les; no s’importa HTML executable. Exportació i importació JSON amb validació. Sense compte ni sincronització remota.

El quadern nou utilitza `mates-estudi:<ruta>:`. La guia manté les dades de `mates-docent-pwa:<ruta>:`; no s’han esborrat ni migrat de forma destructiva. Cadascun té la seva exportació. Canviar el domini, el navegador o el repositori canvia l’espai d’emmagatzematge: exporta abans les còpies.

## Offline i actualitzacions

No hi ha dependències remotes de temps d’execució: codi, estils i icones són locals. MathML utilitza el suport del navegador, sense fitxers de fonts inclosos. El service worker prepara 32 recursos locals abans de declarar llesta la còpia. Els enllaços externs necessiten connexió.

La instal·lació de la còpia és atòmica: si falta un arxiu, la nova versió no substitueix l’anterior. L’actualització espera l’acceptació. La neteja de memòria cau queda limitada a la mateixa ruta de l’app; no toca la d’altres projectes.

Després d’editar codi o contingut, executa `python scripts/build-sw.py` i publica també el nou `sw.js`. Sense regenerar-lo, un navegador podria continuar servint recursos antics.

## Provar localment

Des de la carpeta del projecte: `python -m http.server 8000` (o `py -m http.server 8000` a Windows). Obre `http://localhost:8000`. Un servidor local és només per provar; no publica l’app a Internet.

Proves del motor: `node tests/studio/engine.test.cjs`.
Proves estàtiques: `python tests/studio/static.test.py` (requereix BeautifulSoup i Pillow).
Simulació del service worker: `node tests/studio/service-worker.test.cjs`.
Interfície: `python tests/studio/browser-test.py` (requereix Playwright, Chromium i BeautifulSoup).

Les proves de navegador en aquest lliurament s’han fet amb codi injectat en Chromium perquè l’entorn bloqueja tota navegació URL, també localhost. El motor s’executa en Web Workers reals de tipus Blob. Això no és una prova d’instal·lació del service worker ni de recàrrega offline real. Llegeix `docs/VERIFICACIO.md`.

## Abast

La semblança amb Symbolab és de flux de treball i de tipus d’eines. El motor és més acotat i no és un CAS universal. Les exploracions numèriques no demostren dominis globals ni totes les arrels. Les funcions no implementades s’indiquen. Consulta `docs/ABAST_MOTOR.md`.

La guia i el seguiment PAU s’han conservat de la base aportada; no hi ha una nova verificació de proves PAU en aquesta versió.
