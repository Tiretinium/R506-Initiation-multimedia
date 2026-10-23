# Journal des prompts

Trace du travail avec l'IA (Claude Code) : prompts clés, erreurs de l'IA, corrections demandées.

## 23/10/2026 — Cadrage

1. « Analyse le PDF du cours (exercice d'IA) et fais un cahier des charges avec plusieurs idées de projet originales. »
2. Choix d'un GeoGuessr, puis changement d'idée : carte du monde avec des cubes blancs sur les pays, un drapeau à placer, révélation de tous les drapeaux à la validation.
3. Précisions : cubes posés sur les **capitales** ; V1 = un seul mode, **animation de tirage** puis **30 s** pour placer le pays.

## 23/10/2026 — Développement de la V1

4. « On va partir au développement. »
   - L'IA a voulu générer `pays.json` avec l'API REST Countries : l'API demande désormais un compte et une clé. Correction : liste de 76 pays saisie à la main, avec un script qui vérifie l'espacement entre capitales.
   - Carte du monde dessinée dans un canvas à partir de world-atlas (pas d'image avec des noms de pays).
   - Test automatique d'une partie dans un navigateur sans interface : deux bugs trouvés et corrigés.
     - Entrée validait la manche **et** activait le bouton « Manche suivante » encore sélectionné → manche sautée. Correction : `preventDefault()` sur Entrée.
     - Le curseur « main » restait affiché après être passé sur un bouton. Correction : remise à zéro du curseur dans `pointerleave`.

## 23/10/2026 — Retours après le premier test

5. « On n'a pas tous les 196 pays ; si tu n'as pas la capitale, place le cube sur le pays. Bug : à la manche suivante, des drapeaux restent parfois affichés. »
   - **Bug des drapeaux** : la révélation fait se retourner les cubes en vague (jusqu'à ~1,8 s pour les plus éloignés). En passant vite à la manche suivante, les cubes pas encore retournés étaient ignorés par la remise à zéro, puis affichaient leur drapeau en pleine manche. Correction : fonction `masquer()` qui annule aussi les retournements en attente. Vérifié par un test qui clique sur « Manche suivante » 60 ms après la validation.
   - **196 pays** : script `outils/generer-pays.mjs` qui croise world-countries, Natural Earth et Wikidata. Kosovo, Nauru et Palestine (capitale introuvable) : cube au centre du pays.
   - **Nouveau problème soulevé par l'IA** : avec tous les pays, des capitales se superposent (Vatican dans Rome). Solution : cubes plus petits (1,2) et écartement automatique des cubes qui se chevauchent, avec un fil vers la vraie position. Simulation avant intégration : 0 chevauchement, déplacement maximal ~0,8°.
   - **Bug repéré au passage** : une bande verte traversait l'est de la Russie (polygones qui franchissent la longitude 180°). Correction du tracé de la carte.

## 23/10/2026 — Nouveau barème

6. « Maximum 1000 points par manche : 500 pour le temps de réponse, 500 pour la position (500 si bon, on perd des points avec la distance). »
   - L'IA a signalé un défaut de la règle telle quelle : si les points de temps sont donnés même sur une mauvaise réponse, cliquer au hasard dès le début rapporte près de 500 points. Décision : les points de rapidité sont **multipliés par la précision** de la position.
   - Courbe de distance conservée : `exp(−d / 1500 km)`.
   - Le panneau de résultat affiche le détail position / rapidité.

## 23/10/2026 — Difficultés et version smartphone

7. « On va faire les difficultés et un mode smartphone. »
   - Difficultés proposées par l'IA et retenues : Facile (76 pays connus, 40 s), Normal (196 cubes, tirage des pays de plus de 10 000 km², 30 s), Difficile (tout, 20 s). Champs `connu` et `superficie` ajoutés par le script de génération.
   - Smartphone : jeu au toucher, sélection du cube le plus proche (les cubes sont petits sous le doigt), gestes à deux doigts ignorés, nom du pays au toucher après la révélation, interface portrait/paysage.
   - Mode inclinaison (`DeviceOrientationEvent`) : pencher le téléphone fait glisser la carte. Testé avec un capteur simulé (Chrome DevTools Protocol) : beaucoup trop rapide au premier essai (de l'Europe au Pacifique en 1,5 s), vitesse divisée par environ 2,5 et réponse au carré pour viser finement.
   - À tester sur un vrai téléphone : le capteur n'est accessible qu'en HTTPS (GitHub Pages).

## 23/10/2026 — Fonctionnalités fun

8. « Secouer pour un indice sur téléphone, confettis 3D et cube qui saute. »
   - Indice = continent + cubes des autres continents grisés, −30 % sur la manche (règle proposée par l'IA). Touche I sur PC pour pouvoir tester. Champ `continent` ajouté par le script de génération.
   - L'IA a remarqué que, vus de la distance de départ, cubes et confettis étaient trop petits pour qu'on voie l'animation : ajout d'un zoom de caméra sur une bonne réponse, et retour à la vue du joueur à la manche suivante.
   - Pendant une secousse, l'inclinaison est mise en pause (sinon secouer ferait aussi bouger la carte).
   - Tests : bonne réponse provoquée en repérant le bon cube par script (accès injecté uniquement dans le test), secousse simulée par des `DeviceMotionEvent` synthétiques (un mouvement léger ne déclenche rien, une vraie secousse oui).

## À compléter
<!-- Ajouter ici chaque nouveau prompt important, l'erreur éventuelle de l'IA et la correction demandée. -->
