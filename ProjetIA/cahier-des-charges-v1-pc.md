# Cahier des charges — Drapocube V1 (version PC)

> Jeu de géographie en 3D : retrouver un pays sur la carte à partir de son drapeau.
> Projet de l'exercice IA du cours R506 (TD4/TD5). Nom « Drapocube » provisoire.
> Version du document : 23/10/2026

---

## 1. Contexte

Le TD4 du cours R506 (*Sensibilisation à la programmation multimédia*, C. Vestri) demande de réaliser une **application web fonctionnelle en pilotant une IA de code**, avec peu ou pas de code écrit à la main. Le sujet doit tourner autour de la **géolocalisation et des cartes** et/ou de la **3D et de l'orientation du smartphone**.

Le projet retenu combine les deux : une **carte du monde en 3D** sur laquelle sont posés des **cubes blancs**, un par pays, placé sur sa **capitale**. Un drapeau est tiré au hasard et le joueur doit cliquer sur le cube du bon pays.

La **V1 vise uniquement le PC** (navigateur de bureau, souris). Le passage au smartphone est prévu en **V2**.

---

## 2. Concept du jeu

1. **Animation de tirage** : une roulette de drapeaux défile vite dans le bandeau du haut, ralentit, puis s'arrête sur le pays tiré au hasard. Son drapeau reste affiché, sans le nom.
2. **Le chrono de 30 secondes démarre.** La carte du monde est couverte de **cubes blancs**, chacun posé sur la capitale d'un pays. Tous les cubes sont identiques : rien n'indique quel pays ils représentent.
3. Le joueur **sélectionne le cube** qu'il pense être le bon (il est mis en surbrillance), puis **valide** avant la fin du chrono. À zéro, la manche est perdue.
4. À la validation, **tous les cubes se retournent et affichent leur drapeau** :
   - le cube du bon pays s'allume en **vert** ;
   - si le joueur s'est trompé, son cube s'allume en **rouge** et une ligne le relie au bon pays, avec la distance.
5. Le joueur marque des points, puis passe à la manche suivante : les cubes redeviennent blancs.

---

## 3. Objectif de la V1

Livrer un jeu **jouable de bout en bout sur PC**, en ligne sur GitHub Pages :

- une partie de **10 manches** ;
- à chaque manche, une **animation de tirage** du pays, puis **30 secondes** pour le placer ;
- une **scène 3D** (Three.js) : un plateau avec la carte du monde et des cubes blancs aux emplacements des pays ;
- une caméra que l'on fait **tourner, zoomer et déplacer** à la souris ;
- la **sélection d'un cube** au clic, puis la **révélation des drapeaux** sur tous les cubes ;
- un **score** et un **écran de fin**.

---

## 4. Périmètre

### Inclus dans la V1

- Jeu solo, 10 manches par partie, sans pays tiré deux fois dans la même partie
- Animation de tirage au début de chaque manche, puis **30 secondes** pour placer le pays
- Un **seul mode de jeu**, « Monde », avec les **196 pays** (193 membres de l'ONU + Vatican, Palestine, Kosovo)
- Carte du monde plaquée sur un plateau 3D, **sans aucun nom** de pays ni de ville
- Cubes blancs cliquables, surbrillance au survol et à la sélection
- Révélation : drapeaux sur tous les cubes, couleurs vert/rouge, ligne et distance
- Score, écran de fin, bouton « Rejouer »
- Déploiement sur GitHub Pages

### Exclu de la V1 (prévu plus tard)

- Version smartphone et contrôle par l'orientation du téléphone (V2)
- Les autres modes de jeu (par continent, mode inverse, etc. : voir section 12)
- Globe 3D à la place de la carte plate
- Multijoueur, comptes, serveur, classement en ligne

---

## 5. Fonctionnalités

Priorités : **P1** = obligatoire pour la V1 · **P2** = souhaitable · **P3** = bonus si le temps le permet.

| ID | Fonctionnalité | Description | Priorité |
| --- | --- | --- | --- |
| F1 | Écran d'accueil | Titre, règles en 3 lignes, bouton « Jouer » | P1 |
| F2 | Scène 3D | Plateau avec la texture de la carte du monde, lumière, caméra en vue plongeante | P1 |
| F3 | Contrôles caméra | Rotation (clic gauche + glisser), zoom (molette), déplacement (clic droit + glisser) avec OrbitControls ; on ne peut pas passer sous le plateau | P1 |
| F4 | Placement des cubes | Un cube blanc par pays, placé sur la latitude et la longitude de sa **capitale** (conversion en section 7) | P1 |
| F5 | Tirage du pays | Tirer 10 pays différents au début de la partie ; un par manche, affiché par son drapeau **sans le nom** | P1 |
| F5b | Animation de tirage | Roulette de drapeaux dans le bandeau, environ 2,5 s : défilement rapide, ralentissement, arrêt sur le pays tiré, petit effet (zoom ou rebond) ; les cubes ne sont pas cliquables pendant l'animation | P1 |
| F5c | Chrono de 30 s | Démarre à la fin de l'animation ; barre ou compte à rebours visible, qui passe en rouge sous 10 s ; à zéro, révélation automatique et 0 point | P1 |
| F6 | Survol | Le cube survolé par la souris se soulève légèrement et se teinte (raycasting) | P1 |
| F7 | Sélection | Un clic sélectionne un cube (contour ou couleur d'accent) ; un autre clic change la sélection | P1 |
| F8 | Validation | Bouton « Valider » (ou touche Entrée), désactivé tant qu'aucun cube n'est sélectionné | P1 |
| F9 | Révélation | Tous les cubes affichent leur drapeau ; bon pays en vert ; si erreur, cube choisi en rouge, ligne vers le bon pays, nom des deux pays et distance | P1 |
| F10 | Score | Points selon la section 6, affichés après chaque manche ; score cumulé toujours visible | P1 |
| F11 | Manche suivante | Les cubes redeviennent blancs, nouveau drapeau ; indicateur « Manche 3/10 » | P1 |
| F12 | Écran de fin | Score total sur 10 000, tableau des 10 manches (drapeau, pays choisi, bon ou faux, points), bouton « Rejouer » | P1 |
| F13 | Animation de révélation | Les cubes pivotent un par un en vague (effet de carte qui se retourne) | P2 |
| F14 | Caméra guidée | À la révélation, la caméra glisse vers le bon pays | P2 |
| F15 | Détail du score | Après chaque manche : points de position et de rapidité affichés séparément (voir section 6) | P1 |
| F16 | Meilleur score | Record enregistré dans le navigateur (`localStorage`) et affiché à l'accueil | P3 |
| F17 | Fiche pays | Après la révélation : capitale, population, lien Wikipédia | P3 |

---

## 6. Règles du jeu et score

- Une partie = **10 manches**, au maximum **1 000 points** par manche, donc **10 000** au total.
- Les points d'une manche se partagent en deux moitiés de **500 points** :
  - **Position** : 500 si c'est le bon pays, puis de moins en moins selon la distance `d` (en km) entre le pays choisi et le bon pays.
  - **Rapidité** : 500 × la part du chrono restante, **multipliée par la précision**. Une réponse rapide mais lointaine ne rapporte donc presque rien : cliquer au hasard dès le début ne paie pas.

```
precision = exp(−d / 1500)          (1 si bon pays)
position  = round(500 × precision)
rapidite  = round(500 × (secondes restantes / 30) × precision)
total     = position + rapidite
```

| Cas | Position | Rapidité | Total |
| --- | --- | --- | --- |
| Bon pays, 30 s restantes | 500 | 500 | 1 000 |
| Bon pays, 15 s restantes | 500 | 250 | 750 |
| Pays voisin à 500 km, 15 s restantes | ~360 | ~180 | ~540 |
| Pays à 1 500 km, 15 s restantes | ~180 | ~90 | ~280 |
| Pays à 5 000 km, 29 s restantes | ~18 | ~17 | ~35 |

- **Temps écoulé** (30 s sans validation) : 0 point. Les drapeaux sont quand même révélés et le bon pays s'allume en vert.
- Distance entre les deux pays (Haversine, R = 6 371 km), calculée entre leurs **capitales** :

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
d = 2 × R × atan2(√a, √(1−a))
```

---

## 7. Scène 3D

### Plateau et carte

- Un plan de **360 × 180 unités** (1 unité = 1° de longitude ou de latitude), posé à plat.
- Texture : une carte du monde **équirectangulaire** (rapport 2:1) **sans étiquettes**, par exemple Natural Earth ou NASA Blue Marble (domaine public), en 4096 × 2048 px.

### Conversion latitude/longitude → position 3D

Comme la carte est équirectangulaire, la conversion est linéaire :

```
x = longitude          (de −180 à +180)
z = −latitude          (de −90 à +90, le nord vers le fond de la scène)
y = taille_cube / 2    (le cube est posé sur le plateau)
```

### Cubes

- Taille : **1,2 × 1,2 × 1,2 unités**. Deux cubes doivent être à au moins **1,56 unité** (1,3 × la taille) l'un de l'autre.
- Capitales trop proches (Rome et le Vatican, Jérusalem et Ramallah…) : au chargement, les cubes qui se chevauchent sont **légèrement écartés** (relaxation itérative, au maximum ~0,8 unité). Un cube déplacé est relié à la vraie position de sa capitale par un **fil discret** terminé par un point.
- Les distances et le score utilisent toujours les **vraies coordonnées**, pas la position affichée du cube.
- État normal : blanc mat. Au survol : soulevé de 0,5 unité et teinté. Sélectionné : couleur d'accent.
- Révélé : le drapeau est appliqué sur la **face du dessus** et les **4 faces latérales**.
- Bon pays : halo ou contour vert. Mauvais choix : contour rouge.

### Drapeaux

- Images **carrées** au format 1:1 (le cube est carré), stockées en local dans `img/drapeaux/<code>.svg`.
- Source : le projet open source **flag-icons** (licence MIT), qui fournit une version carrée de chaque drapeau. Three.js charge mal les SVG en texture : on ajoute un `width`/`height` explicite aux fichiers, puis chaque drapeau est dessiné dans un canvas 256 × 256 qui sert de texture.
- Les drapeaux sont stockés en local plutôt que chargés depuis un site externe, ce qui évite les problèmes de CORS sur les textures.

---

## 8. Données

### Fichier `data/pays.json`

Il est généré **une seule fois** par le script `outils/generer-pays.mjs` (`node outils/generer-pays.mjs`), qui croise trois sources ouvertes. Le jeu ne fait aucun appel d'API pendant la partie. (L'API REST Countries, prévue au départ, demande désormais un compte et une clé : constaté le 23/10/2026.)

| Source | Ce qu'on en tire |
| --- | --- |
| world-countries (mledoze) | Liste des pays, code ISO, nom français, centre du pays |
| Natural Earth, *populated places* | Coordonnées des capitales |
| Wikidata (requête SPARQL) | Nom français des capitales |

```json
{
  "mode": "monde",
  "pays": [
    { "code": "fr", "nom": "France",    "capitale": "Paris",    "lat": 48.87,  "lng": 2.33,   "surCapitale": true },
    { "code": "br", "nom": "Brésil",    "capitale": "Brasilia", "lat": -15.78, "lng": -47.92, "surCapitale": true },
    { "code": "jp", "nom": "Japon",     "capitale": "Tokyo",    "lat": 35.69,  "lng": 139.75, "surCapitale": true },
    { "code": "xk", "nom": "Kosovo",    "capitale": "Pristina", "lat": 42.67,  "lng": 21.17,  "surCapitale": false }
  ]
}
```

- `code` = code ISO 3166-1 alpha-2 en minuscules ; il sert aussi de nom pour le fichier du drapeau.
- `lat` / `lng` = coordonnées de la **capitale**. Le cube est posé à cet endroit, et les distances sont calculées entre capitales.
- **Capitale introuvable** dans Natural Earth (Kosovo, Nauru, Palestine) : le cube est posé au **centre du pays** et `surCapitale` vaut `false`.
- Pays à plusieurs capitales (Afrique du Sud, Bolivie…) : on n'en garde qu'une, la capitale administrative, et on la note dans le README.
- On vérifie quelques capitales à la main (sur Wikipédia), car l'API peut contenir des erreurs ou des valeurs manquantes.
- Les **196 pays** sont tous présents ; les capitales trop proches sont gérées par l'écartement des cubes (section 7).

---

## 9. Contraintes techniques

| Point | Choix |
| --- | --- |
| Langages | HTML, CSS, JavaScript (modules ES), sans framework |
| 3D | Three.js (version fixée) + OrbitControls |
| Interaction | `THREE.Raycaster` pour le survol et le clic sur les cubes |
| Interface | HTML/CSS par-dessus le canvas : bandeau du drapeau, score, boutons |
| Chargement des librairies | CDN avec version **fixée** (jamais `latest`), via une import map |
| Hébergement | GitHub Pages (HTTPS) |
| Navigateurs cibles | Chrome, Firefox et Edge récents, sur écran ≥ 1280 × 720 |
| Performances | 60 images/s avec 196 cubes ; textures des drapeaux préchargées au démarrage |

### Arborescence prévue

```
ProjetIA/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js        # enchaînement des écrans et des manches
│   ├── scene.js       # scène Three.js, plateau, lumière, caméra, contrôles
│   ├── cubes.js       # création des cubes, états (blanc, survol, sélection, révélé)
│   ├── interaction.js # raycasting : survol et clic
│   ├── jeu.js         # tirage des pays, validation, enchaînement des manches
│   └── score.js       # Haversine + calcul du score
├── data/
│   ├── pays.json      # généré par outils/generer-pays.mjs
│   └── monde-110m.json # contours des pays (world-atlas), dessinés dans un canvas
├── img/
│   └── drapeaux/      # fr.svg, br.svg, jp.svg… (196 fichiers)
├── outils/
│   └── generer-pays.mjs
├── CLAUDE.md          # instructions pour l'IA (ou copilot-instructions.md)
├── PROMPTS.md         # journal des prompts
└── README.md
```

---

## 10. Critères d'acceptation de la V1

La V1 est terminée quand **tous** ces points sont vérifiés sur la version en ligne :

- [ ] On peut jouer une partie complète de 10 manches sans erreur dans la console.
- [ ] La carte ne montre aucun nom de pays, et les cubes sont tous blancs et identiques avant la validation.
- [ ] Chaque cube est bien placé sur la capitale de son pays (vérifié visuellement sur 10 pays).
- [ ] L'animation de tirage se joue à chaque manche et s'arrête sur le bon drapeau ; les cubes ne sont pas cliquables pendant l'animation.
- [ ] Le chrono de 30 s démarre après l'animation ; à zéro, la manche donne 0 point et les drapeaux sont révélés.
- [ ] Le survol, la sélection et la validation fonctionnent ; on ne peut pas valider sans avoir sélectionné de cube.
- [ ] À la validation, tous les cubes affichent le bon drapeau ; le bon pays est en vert, et en cas d'erreur le choix est en rouge.
- [ ] Le score respecte la section 6 (bon pays avec 15 s restantes = 750 ; maximum 1 000 par manche).
- [ ] Aucun pays ne sort deux fois dans une même partie.
- [ ] « Manche suivante » remet tous les cubes en blanc ; « Rejouer » relance une nouvelle partie.
- [ ] Le site fonctionne sur GitHub Pages.
- [ ] Le README, le fichier d'instructions IA et `PROMPTS.md` sont à jour.

---

## 11. Plan de réalisation avec l'IA

Chaque étape = un prompt détaillé (contexte, besoin, détails, format), un test, puis un commit.

1. **Préparation** : créer le dépôt, écrire `CLAUDE.md` (stack, version de Three.js, arborescence, règles de code).
2. **Données** : générer `pays.json` avec `outils/generer-pays.mjs`, puis vérifier quelques capitales à la main.
3. **Drapeaux** : récupérer les drapeaux carrés de flag-icons et les convertir en PNG 256 × 256.
4. **Scène** : plateau avec la carte, lumière, caméra, OrbitControls.
5. **Cubes** : fonction de conversion lat/lng → x/z, placement des 196 cubes blancs, écartement des cubes trop proches, vérification visuelle.
6. **Interaction** : raycasting, survol, sélection, bouton Valider.
7. **Révélation** : textures de drapeaux sur les cubes, couleurs vert/rouge, ligne et distance.
8. **Boucle de jeu** : animation de tirage, chrono de 30 s, 10 manches, score, écran de fin, Rejouer.
9. **Robustesse** : chargement des textures, cas limites, nettoyage du code par l'IA.
10. **P2/P3** si le temps le permet : animation en vague, caméra guidée, meilleur score.
11. **Livraison** : déploiement, README, captures, relecture de `PROMPTS.md`.

### Exemple de prompt (étape 5)

```
Contexte : jeu web en JavaScript vanilla (modules ES) avec Three.js (version de CLAUDE.md).
La scène contient un plan de 360 x 180 unités posé à plat (rotation -90° sur X),
texturé avec une carte du monde équirectangulaire. 1 unité = 1 degré.
Besoin : crée js/cubes.js qui exporte creerCubes(scene, pays).
Détails :
  1. pays est le tableau de data/pays.json ({ code, nom, lat, lng }).
  2. Pour chaque pays, un cube BoxGeometry 2x2x2, MeshStandardMaterial blanc,
     placé en x = lng, z = -lat, y = 1.
  3. Stocke le code du pays dans cube.userData.code.
  4. Retourne un tableau des cubes.
  Pas d'autre dépendance que Three.js. Commentaires en français.
Format : le fichier complet, puis les 3 lignes à ajouter dans main.js pour l'appeler.
```

---

## 12. Évolutions prévues (V2 : mobile et plus)

- Version smartphone : interface tactile, sélection au toucher.
- Inclinaison du téléphone (`DeviceOrientationEvent`) pour faire pivoter la carte, avec un bouton de permission pour iOS.
- Globe 3D : les cubes posés sur une sphère au lieu d'une carte plate.
- **Plusieurs modes de jeu**, choisis depuis l'accueil (la V1 n'a que le mode « Monde ») :
  - modes par continent avec tous les pays (carte zoomée pour éviter que les cubes se chevauchent) ;
  - mode inverse : un cube s'allume et le joueur choisit le bon drapeau parmi 4 ;
  - mode « Capitale » : le nom de la capitale s'affiche à la place du drapeau ;
  - mode survie : on continue tant qu'on ne se trompe pas, avec un chrono qui raccourcit.

---

## 13. Questions ouvertes

- Date de rendu et grille d'évaluation exacte : à demander à l'enseignant.
- Projet en solo ou en binôme ?
- Quels modes de jeu ajouter en premier après la V1 ?
