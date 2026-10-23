// Point d'entrée : chargement des données, création de la scène et boucle d'animation
import { creerScene, creerPlateau } from './scene.js';
import { chargerDrapeaux, creerCubes, animerCubes } from './cubes.js';
import { activerInteraction } from './interaction.js';
import { creerJeu } from './jeu.js';

const { renderer, scene, camera, controls } = creerScene(document.getElementById('scene'));
let cubes = [];
let jeu = null;

renderer.setAnimationLoop(() => {
    const maintenant = performance.now();
    controls.update();
    animerCubes(cubes, maintenant);
    jeu?.tick(maintenant);
    renderer.render(scene, camera);
});

try {
    const { pays } = await fetch('data/pays.json').then((r) => r.json());
    const [, drapeaux] = await Promise.all([creerPlateau(scene, renderer), chargerDrapeaux(pays)]);
    cubes = creerCubes(scene, pays, drapeaux);
    jeu = creerJeu({ scene, camera, controls, cubes });
    activerInteraction(renderer, camera, cubes, { surSurvol: jeu.surSurvol, surClic: jeu.surClic });
    jeu.pret();
} catch (erreur) {
    console.error(erreur);
    const bouton = document.getElementById('btn-jouer');
    bouton.textContent = 'Erreur de chargement';
    bouton.insertAdjacentHTML('afterend',
        '<p class="aide">Ouvre la page via un serveur local (ex. Live Server), pas en double-cliquant sur le fichier.</p>');
}
