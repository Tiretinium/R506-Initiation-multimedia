# Drapocube — V1 PC

Jeu de géographie en 3D : un drapeau est tiré au hasard, tu as 30 secondes pour cliquer sur le cube blanc posé sur la capitale de ce pays. À la validation, tous les cubes se retournent et révèlent leur drapeau.

Projet de l'exercice IA du cours R506 (Sensibilisation à la programmation multimédia). Cahier des charges : [cahier-des-charges-v1-pc.md](cahier-des-charges-v1-pc.md).

## Lancer le jeu

Le jeu charge des fichiers (`fetch`) et des modules ES : il faut un serveur local, un double-clic sur `index.html` ne suffit pas.

- VS Code : clic droit sur `index.html` → *Open with Live Server*
- ou en ligne de commande, depuis ce dossier : `python -m http.server 8000`, puis ouvrir http://localhost:8000

## Comment jouer

1. Clique sur **Jouer** : une roulette de drapeaux s'arrête sur le pays à trouver.
2. Le chrono de 30 s démarre. Clique sur le cube de ce pays (il devient bleu), puis **Valider** (ou Entrée).
3. Les cubes révèlent leur drapeau : vert = bon pays, rouge = ton choix s'il est faux. Survole un cube pour voir son nom.
4. 10 manches, puis l'écran de fin avec le détail.

Souris : clic gauche + glisser pour tourner, molette pour zoomer, clic droit + glisser pour déplacer.

## Score

Jusqu'à **1 000 pts par manche** (10 000 par partie), en deux moitiés :

- **Position, sur 500** : 500 pour le bon pays, sinon `500 × exp(−distance / 1500 km)` (distance entre capitales)
- **Rapidité, sur 500** : `500 × (secondes restantes / 30)`, multiplié par la même précision que la position, pour que cliquer vite au hasard ne rapporte rien
- Temps écoulé : 0 pt

## Technique

| Fichier | Rôle |
| --- | --- |
| `js/main.js` | Chargement des données, boucle d'animation |
| `js/scene.js` | Scène Three.js, caméra, OrbitControls, carte du monde dessinée dans un canvas |
| `js/cubes.js` | Cubes, textures des drapeaux, états et animation de retournement |
| `js/interaction.js` | Survol et clic par raycasting |
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
