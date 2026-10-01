# Verificació de Mates Docent · Estudi 2.0.0

Data de construcció: 1 d’octubre de 2026.

## Resultats executats

| Suite | Comprovacions | Superades |
|---|---:|---:|
| Motor matemàtic i exemples | 200 | 200 |
| Interfície en Chromium | 81 | 81 |
| Fitxers, sintaxi, manifest i icones | 72 | 72 |
| Simulació del service worker | 22 | 22 |
| **Total** | **375** | **375** |

Aquests resultats corresponen als casos provats, no a una demostració de correcció universal. Els scripts i els resultats JSON detallats són a `tests/studio/`.

## Motor

Proves de precedència i sintaxi, racionals exactes, negatives i potències, equacions, identitats amb restriccions, inequacions amb fronteres, sistemes determinats/indeterminats/incompatibles, derivades i traces, primitives contrastades derivant, quadratura numèrica i integrals impròpies rebutjades, àrees, límits, factorització, cerca de zeros, entrades no vàlides i els 34 exemples de la interfície.

Entre els controls: abs en zero no genera una tangent ordinària; una singularitat cancel·lada entre dues corbes no es tracta com una integral pròpia; la quadratura es comprova també en exemples oscil·latoris; una taula al voltant d’un límit no es converteix automàticament en una conclusió.

## Interfície

Chromium de l’entorn amb Playwright. Proves a amplades 320, 390, 768, 1024 i 1440. Sense desbordament horitzontal de la pàgina en aquests casos. Entrada i previsualització MathML, cada exemple, passos, teclat, errors, canvi de tema, quadern, notes, cerca, còpia i importació JSON, exportació PNG, zoom i selecció de corbes. Sense excepcions JavaScript no gestionades en la prova.

**Limitació de l’entorn:** la navegació URL està bloquejada per l’administrador (`ERR_BLOCKED_BY_ADMINISTRATOR`), inclús a `127.0.0.1`. Per tant s’han injectat el codi i els estils en una pàgina `about:blank`. El mateix motor s’ha executat en Web Workers reals creats des de Blob. L’emmagatzematge és un doble en memòria; les API de portapapers i impressió estan substituïdes per verificar el contingut i els esdeveniments. No s’ha afirmat que això sigui una recàrrega offline real.

Les captures `desktop.png` i `mobile.png` mostren aquesta interfície executada localment; hi figura expressament «Mode de prova local». No són captures d’un desplegament públic.

## Service worker i instal·lació

Proves de fitxers reals per al manifest, les mides PNG, les rutes relatives i l’empremta de 32 recursos. Simulació per esdeveniments del `sw.js` real, amb CacheStorage i fetch en memòria: precàrrega, estat de disponibilitat, peticions offline, aïllament entre repositoris, recursos que falten, conservació de la versió anterior, acceptació d’actualitzacions i neteja limitada a la ruta pròpia.

**No executat:** instal·lació en dispositius físics, proves Safari/iOS reals, registre del service worker en una web publicada, recàrrega real sense connexió i desplegament al GitHub de l’usuari. Tampoc s’ha certificat accessibilitat universal o tota entrada matemàtica possible.

## Validació final sobre la web publicada

1. Comprova que el manifest i `sw.js` es descarreguen sense errors i que apareix «Disponible sense connexió».
2. Resol una equació i una derivada, desa una nota i exporta el quadern.
3. Instal·la l’app, tanca les pestanyes i obre-la des de la icona.
4. Desconnecta la xarxa, recarrega i comprova el nou motor i `docent.html`.
5. Publica una revisió, accepta l’actualització i comprova que es manté la nota.

## Abast funcional

La nova versió és un resolutor local amb regles acotades, no una rèplica completa de Symbolab. El domini i els resultats numèrics porten advertiments; els casos no implementats s’identifiquen. La guia anterior i el seguiment manual PAU es conserven, sense una nova verificació dels exàmens.
