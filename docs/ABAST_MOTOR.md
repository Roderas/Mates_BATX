# Abast i límits del motor 2.0.0

## Càlcul exacte i repertori simbòlic

Els nombres de l’entrada es representen com a racionals BigInt. Les operacions aritmètiques bàsiques preserven les fraccions exactes. Les representacions amb radicals o pi no impliquen un decimal exacte.

Equacions: solucions simbòliques lineals i quadràtiques amb coeficients racionals, també després de portar expressions racionals a un numerador comú. Es contrasten candidats amb l’expressió original. Altres equacions passen a cerca numèrica acotada; no es garanteix exhaustivitat.

Inequacions: numerador i denominador polinòmics de grau màxim 2; taula de signes, zeros inclosos o exclosos segons el símbol, denominadors exclosos. No hi ha resolució general de sistemes d’inequacions.

Sistemes: 2 a 4 equacions lineals, variables x, y, z; coeficients racionals i Gauss-Jordan amb operacions de fila. Casos determinats, indeterminats amb paràmetres i incompatibles. No hi ha discussió general amb paràmetres de coeficient.

Polinomis: grau màxim 12. Factorització per arrels racionals candidates i factors quadràtics; pot quedar parcial. La simplificació no és una normalització universal de totes les identitats.

Derivades: ordre 1 o 2; sumes, productes, quocients, potències, sin, cos, tan, exp, ln, sqrt, abs i trigonomètriques inverses. S’anoten regles aplicades. Les fórmules només són vàlides on existeixen les derivades. En punts singulars d’abs o arrels pot caldre un estudi lateral que no s’automatitza. La tangent usa coeficients numèrics.

Primitives: polinomis, funcions elementals d’arguments afins, alguns canvis u′g(u), potències, logaritmes, exponencials, quadrats de sin/cos, productes de polinomi fins a grau 5 per exp/sin/cos afí i fraccions racionals amb denominador lineal/quadràtic en casos reconeguts. No inclou tot el càlcul simbòlic d’integrals. No trobar una primitiva no significa que no existeixi.

Límits: funcions racionals, substitució elemental en punts interiors admesos, alguns quocients analítics a zero mitjançant Taylor fins a ordre 6 i un patró exponencial notable a l’infinit. Les altres entrades ofereixen només exploració numèrica, sense conclusió analítica.

## Mètodes numèrics

Arrels: mostreig, bisecció i exploració de mínims de valor absolut. Interval finit, màxim 80 candidats. No es garanteixen arrels de multiplicitat alta, arrels molt juntes, oscil·lacions molt ràpides ni totes les discontinuïtats. El residu petit és un control, no una prova.

Integrals: Simpson adaptatiu inicialitzat amb 17 subintervals, tolerància interna i màxim 100000 avaluacions. L’estimació d’error no és una cota demostrada. Només intervals finits propis. Es rebutgen singularitats detectades; no s’afirmen condicions de continuïtat universals només amb mostreig. No s’interpreta un valor principal de Cauchy com una integral pròpia.

Àrees: integral numèrica de |f-g| amb extrems ordenats. Cal indicar a i b; no s’escull automàticament una regió de totes les possibles.

Gràfiques: mostreig finit, escalat, zoom, desplaçament i heurístiques per interrompre segments prop de discontinuïtats. El dibuix no demostra un domini, una asímptota ni exhaustivitat dels candidats. Les restriccions s’obtenen de l’expressió original, sense resoldre sempre les desigualtats que les defineixen.

## Interfície i dades

Entrada textual amb teclat d’inserció i MathML natiu: no OCR, no escriptura manual, no ordres en llenguatge natural. Només nombres reals. No resolució general d’equacions diferencials, vectors simbòlics ni geometria 3D al nou motor; la guia anterior manté les seves eines.

El càlcul es cancel·la al cap de 10 segons; la interfície no transforma aquest timeout en cap resposta matemàtica. Hi ha límits d’entrada, profunditat i mida dels nombres. L’app no avalua codi JavaScript de l’usuari.

El quadern guarda consultes i notes, no solucions HTML alienes. No es transmeten a cap servidor. Es poden perdre en esborrar dades del navegador: exporta còpies periòdiques.
