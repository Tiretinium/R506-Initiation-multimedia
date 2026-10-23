# Drapocube

Jeu de géographie en 3D, sur PC et smartphone : un drapeau est tiré au hasard, tu as quelques secondes pour choisir sur le cube blanc posé sur la capitale de ce pays. À la validation, tous les cubes se retournent et révèlent leur drapeau.

Projet de l'exercice IA du cours R506 (Sensibilisation à la programmation multimédia). Cahier des charges : [cahier-des-charges-v1-pc.md](cahier-des-charges-v1-pc.md).

## Lancer le jeu

Le jeu charge des fichiers (`fetch`) et des modules ES : il faut un serveur local, un double-clic sur `index.html` ne suffit pas.

- VS Code : clic droit sur `index.html` → *Open with Live Server*
- ou en ligne de commande, depuis ce dossier : `python -m http.server 8000`, puis ouvrir http://localhost:8000

Sur smartphone, le mode **Inclinaison** a besoin d'une page en **HTTPS** : teste-le sur la version GitHub Pages (une adresse locale du type `http://192.168…` ne donne pas accès au capteur).

## Comment jouer

1. Choisis la difficulté, puis **Jouer** : une roulette de drapeaux s'arrête sur le pays à trouver.
2. Le chrono démarre. Clique sur le cube de ce pays (il devient bleu), puis **Valider** (ou Entrée).
3. Les cubes révèlent leur drapeau : vert = bon pays, rouge = ton choix s'il est faux. Survole un cube pour voir son nom.
4. 10 manches, puis l'écran de fin avec le détail.

Souris : clic gauche + glisser pour tourner, molette pour zoomer, clic droit + glisser pour déplacer.

Smartphone : un doigt pour tourner, deux doigts pour zoomer et déplacer, toucher un cube pour le choisir. Le bouton **Inclinaison** permet de se déplacer sur la carte en penchant le téléphone (la position au moment de l'activation est le point neutre). Après la révélation, touche un cube pour voir son nom.

## Difficultés

| Difficulté | Cubes sur la carte | Pays tirés | Chrono |
| --- | --- | --- | --- |
| Facile | 76 pays connus | Ces 76 pays | 40 s |
| Normal | Les 196 | Pays de plus de 10 000 km² (162) | 30 s |
| Difficile | Les 196 | Les 196, micro-États compris | 20 s |

Un record est gardé pour chaque difficulté.

## Score

Jusqu'à **1 000 pts par manche** (10 000 par partie), en deux moitiés :

- **Position, sur 500** : 500 pour le bon pays, sinon `500 × exp(−distance / 1500 km)` (distance entre capitales)
- **Rapidité, sur 500** : `500 × (secondes restantes / durée du chrono)`, multiplié par la même précision que la position, pour que cliquer vite au hasard ne rapporte rien
- Temps écoulé : 0 pt

## Technique

| Fichier | Rôle |
| --- | --- |
| `js/main.js` | Chargement des données, boucle d'animation |
| `js/scene.js` | Scène Three.js, caméra, OrbitControls, carte du monde dessinée dans un canvas |
| `js/cubes.js` | Cubes, textures des drapeaux, états et animation de retournement |
| `js/interaction.js` | Survol, clic et toucher par raycasting (cube le plus proche si le doigt tombe à côté) |
| `js/orientation.js` | Mode inclinaison : `DeviceOrientationEvent` → déplacement de la carte |
| `js/difficulte.js` | Réglages des difficultés |
| `js/jeu.js` | Tirage, chrono, validation, révélation, manches, écran de fin |
| `js/score.js` | Distance de Haversine et points |

Librairies (CDN, versions fixées) : Three.js 0.186.1, topojson-client 3.1.0.

## Données et licences

- `data/pays.json` : les 196 pays (193 membres de l'ONU + Vatican, Palestine, Kosovo), générés par `node outils/generer-pays.mjs` à partir de [world-countries](https://github.com/mledoze/countries) (noms français), [Natural Earth](https://www.naturalearthdata.com/) (coordonnées des capitales) et [Wikidata](https://www.wikidata.org/) (noms français des capitales).
  - Pays à plusieurs capitales : Afrique du Sud → Pretoria, Côte d'Ivoire → Yamoussoukro, Bolivie → Sucre, Tanzanie → Dodoma, Bénin → Porto-Novo.
  - Capitale introuvable (Kosovo, Nauru, Palestine) : cube au centre du pays.
  - Capitales trop proches (Rome/Vatican, Jérusalem/Ramallah…) : les cubes sont légèrement écartés et reliés à leur vraie position par un fil.
- `data/monde-110m.json` : contours des pays [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth, domaine public).
- `img/drapeaux/` : 196 drapeaux carrés [flag-icons](https://github.com/lipis/flag-icons) 7.2.3 (licence MIT).
