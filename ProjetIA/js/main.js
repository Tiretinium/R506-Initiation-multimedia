// Point d'entrée : chargement des données, création de la scène et boucle d'animation
import { creerScene, creerPlateau } from './scene.js';
import { chargerDrapeaux, creerCubes, animerCubes } from './cubes.js';
import { activerInteraction } from './interaction.js';
import { creerJeu } from './jeu.js';
import { capteurOrientationPresent, creerControleInclinaison } from './orientation.js';
import { creerEffets } from './effets.js';
import { capteurMouvementPresent, creerDetecteurSecousse } from './secousse.js';

const DUREE_MESSAGE_MS = 4000;
// Une secousse fait aussi bouger le capteur d'orientation : on fige l'inclinaison un instant
const PAUSE_INCLINAISON_SECOUSSE_MS = 1200;
const ecranTactile = window.matchMedia('(pointer: coarse)').matches;

const { renderer, scene, camera, controls } = creerScene(document.getElementById('scene'));
const inclinaison = creerControleInclinaison(camera, controls);
const effets = creerEffets(scene);
let cubes = [];
let jeu = null;
let precedent = performance.now();

renderer.setAnimationLoop(() => {
    const maintenant = performance.now();
    const dt = Math.min((maintenant - precedent) / 1000, 0.1); // borné si l'onglet était en pause
    precedent = maintenant;
    inclinaison.maj(dt);
    effets.maj(dt);
    controls.update();
    animerCubes(cubes, maintenant);
    jeu?.tick(maintenant);
    renderer.render(scene, camera);
});

function afficherMessage(texte) {
    const message = document.getElementById('message');
    message.textContent = texte;
    message.classList.remove('cache');
    clearTimeout(afficherMessage.minuteur);
    afficherMessage.minuteur = setTimeout(() => message.classList.add('cache'), DUREE_MESSAGE_MS);
}

// ---------- Version smartphone ----------

if (ecranTactile) {
    document.body.classList.add('tactile');
    document.getElementById('aide').textContent =
        'Un doigt pour tourner, deux doigts pour zoomer et déplacer. Touche un cube pour le choisir.';
}

const boutonInclinaison = document.getElementById('btn-inclinaison');
if (ecranTactile && capteurOrientationPresent()) {
    boutonInclinaison.classList.remove('cache');
    boutonInclinaison.addEventListener('click', async () => {
        if (inclinaison.actif) {
            inclinaison.desactiver();
            boutonInclinaison.classList.remove('actif');
            boutonInclinaison.textContent = 'Inclinaison';
            return;
        }
        try {
            boutonInclinaison.textContent = 'Inclinaison…';
            await inclinaison.activer();
            boutonInclinaison.classList.add('actif');
            boutonInclinaison.textContent = 'Inclinaison activée';
            afficherMessage('Incline le téléphone pour te déplacer sur la carte. La position actuelle est le point neutre.');
        } catch (erreur) {
            boutonInclinaison.textContent = 'Inclinaison';
            afficherMessage(erreur.message);
        }
    });
}

// Secouer le téléphone pendant une manche donne un indice. La permission (iOS) est demandée
// au clic sur « Jouer », seul moment où l'on a un geste de l'utilisateur avant la partie.
const secousse = creerDetecteurSecousse(() => {
    inclinaison.suspendre(PAUSE_INCLINAISON_SECOUSSE_MS);
    jeu?.demanderIndice();
});
if (ecranTactile && capteurMouvementPresent()) {
    for (const id of ['btn-jouer', 'btn-rejouer']) {
        document.getElementById(id).addEventListener('click', async () => {
            if (!(await secousse.activer())) afficherMessage("Capteur de mouvement refusé : l'indice par secousse est désactivé.");
        });
    }
}

// ---------- Chargement ----------

try {
    const { pays } = await fetch('data/pays.json').then((r) => r.json());
    const [, drapeaux] = await Promise.all([creerPlateau(scene, renderer), chargerDrapeaux(pays)]);
    cubes = creerCubes(scene, pays, drapeaux);
    jeu = creerJeu({ scene, camera, controls, cubes, effets, tactile: ecranTactile });
    activerInteraction(renderer, camera, cubes, { surSurvol: jeu.surSurvol, surClic: jeu.surClic });
    jeu.pret();
} catch (erreur) {
    console.error(erreur);
    const bouton = document.getElementById('btn-jouer');
    bouton.textContent = 'Erreur de chargement';
    bouton.insertAdjacentHTML('afterend',
        '<p class="aide">Ouvre la page via un serveur local (ex. Live Server), pas en double-cliquant sur le fichier.</p>');
}
