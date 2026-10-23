# Instructions pour l'IA — Drapocube

## Le projet
Jeu web : retrouver un pays sur une carte du monde en 3D à partir de son drapeau. Spécifications complètes dans `cahier-des-charges-v1-pc.md` ; s'y référer avant toute nouvelle fonctionnalité.

## Stack
- HTML, CSS, JavaScript vanilla en modules ES, sans framework ni bundler.
- Three.js **0.186.1** et topojson-client **3.1.0**, chargés par l'import map de `index.html`. Ne jamais changer de version sans le demander, ne jamais utiliser `latest`.
- Le jeu doit tourner sur GitHub Pages : uniquement des fichiers statiques, chemins relatifs.

## Règles de code
- Noms de variables, fonctions et commentaires en français, comme le code existant.
- Un fichier = un rôle (voir le tableau du README). Pas de logique de jeu dans `scene.js` ni de Three.js dans `score.js`.
- Constantes nommées en haut du fichier plutôt que des nombres magiques.
- Commentaires courts qui expliquent le *pourquoi*, pas le *quoi*.
- Aucune information qui révèle le pays avant la validation (pas de nom, pas de tooltip, pas de couleur différente).

## Repères techniques
- Plateau de 360 × 180 unités : 1 unité = 1 degré. Position d'un cube : `x = lng`, `z = -lat`.
- Les cubes sont posés sur les capitales (`data/pays.json`, généré par `outils/generer-pays.mjs` : ne pas l'éditer à la main, modifier le script). Les cubes trop proches sont écartés au chargement (`calculerPositions` dans `cubes.js`) ; distances et score utilisent toujours les vraies coordonnées.
- Toute remise à zéro des cubes passe par `masquer()` : elle annule aussi les retournements encore en attente.
- Les drapeaux SVG ont un `width`/`height` explicites pour pouvoir être dessinés dans un canvas.

## Vérification
- Tester via un serveur local (Live Server ou `python -m http.server`), console ouverte : aucune erreur.
- Jouer au moins une partie complète de 10 manches après chaque modification de `jeu.js`.
