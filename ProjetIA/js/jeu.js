// Déroulement d'une partie : tirage, chrono, validation, révélation, manches, écran de fin
import * as THREE from 'three';
import { pointsManche, distanceKm } from './score.js';
import { majApparence, retourner, masquer, placerCubes } from './cubes.js';
import { DIFFICULTES, DIFFICULTE_PAR_DEFAUT } from './difficulte.js';

const NB_MANCHES = 10;
const POINTS_MAX = NB_MANCHES * 1000;
const SEUIL_URGENT_S = 10;
const CLE_DIFFICULTE = 'drapocube-difficulte';
const cleRecord = (difficulte) => `drapocube-record-${difficulte}`;
// Sur écran tactile, le nom d'un pays touché après la révélation reste affiché ce temps-là
const DUREE_INFO_TACTILE_MS = 2500;

const $ = (id) => document.getElementById(id);
const formater = (n) => n.toLocaleString('fr-FR');
const urlDrapeau = (code) => `img/drapeaux/${code}.svg`;

function melanger(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
}

// Le stockage du navigateur peut être indisponible (navigation privée) : on ne bloque jamais le jeu
function lire(cle) {
    try { return localStorage.getItem(cle); } catch { return null; }
}

function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, String(valeur)); } catch { /* stockage indisponible */ }
}

const lireRecord = (difficulte) => Number(lire(cleRecord(difficulte))) || 0;

export function creerJeu({ scene, camera, controls, cubes }) {
    const etat = {
        phase: 'chargement', // chargement | accueil | tirage | jeu | revelation | fin
        difficulte: DIFFICULTE_PAR_DEFAUT,
        visibles: [], // cubes présents sur la carte pour la difficulté choisie
        tirables: [], // cubes qui peuvent être tirés
        manches: [],
        indice: 0,
        score: 0,
        selection: null,
        finChrono: 0,
        arc: null,
        cibleCamera: null,
        minuteurInfo: null,
    };
    const reglages = () => DIFFICULTES[etat.difficulte];

    // ---------- Difficulté (écran d'accueil) ----------

    function choisirDifficulte(id) {
        if (!DIFFICULTES[id]) id = DIFFICULTE_PAR_DEFAUT;
        etat.difficulte = id;
        ecrire(CLE_DIFFICULTE, id);
        for (const bouton of document.querySelectorAll('#choix-difficulte button')) {
            bouton.classList.toggle('actif', bouton.dataset.difficulte === id);
            bouton.setAttribute('aria-checked', String(bouton.dataset.difficulte === id));
        }
        $('description-difficulte').textContent = reglages().description;
        const record = lireRecord(id);
        $('record').textContent = record ? `Ton record (${reglages().nom}) : ${formater(record)} pts` : '';

        // La carte de l'accueil montre déjà les cubes de cette difficulté
        etat.visibles = placerCubes(cubes, reglages().surLaCarte);
        etat.tirables = etat.visibles.filter((c) => reglages().tirable(c.pays));
    }

    // ---------- Début de partie et de manche ----------

    function demarrerPartie() {
        etat.manches = melanger(etat.tirables).slice(0, NB_MANCHES)
            .map((cube) => ({ cible: cube, choix: null, points: 0, detail: null }));
        etat.indice = 0;
        etat.score = 0;
        controls.autoRotate = false;
        $('accueil').classList.add('cache');
        $('fin').classList.add('cache');
        $('hud').classList.remove('cache');
        $('score').textContent = '0 pts';
        lancerManche();
    }

    function remettreCubesABlanc() {
        const maintenant = performance.now();
        etat.selection = null;
        retirerArc();
        for (const cube of cubes) {
            cube.survole = cube.selectionne = false;
            cube.marque = null;
            masquer(cube, Math.random() * 250, maintenant);
            majApparence(cube);
        }
    }

    function lancerManche() {
        remettreCubesABlanc();
        $('resultat').classList.add('cache');
        $('btn-valider').classList.remove('cache');
        $('btn-valider').disabled = true;
        $('manche').textContent = `Manche ${etat.indice + 1}/${NB_MANCHES}`;
        majChrono(reglages().duree);

        etat.phase = 'tirage';
        animerTirage(etat.manches[etat.indice].cible.pays).then(() => {
            etat.phase = 'jeu';
            etat.finChrono = performance.now() + reglages().duree * 1000;
        });
    }

    // Roulette de drapeaux : défilement rapide qui ralentit puis s'arrête sur le pays tiré (~2,4 s)
    function animerTirage(cible) {
        const img = $('drapeau-cible');
        const cadre = $('cadre-drapeau');
        const nbEtapes = 16;
        cadre.classList.remove('pop');
        return new Promise((resoudre) => {
            let etape = 0;
            let precedent = null;
            const suivante = () => {
                if (etape === nbEtapes) {
                    img.src = urlDrapeau(cible.code);
                    void cadre.offsetWidth; // relance l'animation CSS
                    cadre.classList.add('pop');
                    setTimeout(resoudre, 350);
                    return;
                }
                let pays;
                do { pays = etat.tirables[Math.floor(Math.random() * etat.tirables.length)].pays; }
                while (pays === precedent || pays === cible);
                precedent = pays;
                img.src = urlDrapeau(pays.code);
                const delai = 50 + 250 * (etape / nbEtapes) ** 2;
                etape++;
                setTimeout(suivante, delai);
            };
            suivante();
        });
    }

    // ---------- Chrono ----------

    function majChrono(secondesRestantes) {
        $('chrono-barre').style.width = `${(secondesRestantes / reglages().duree) * 100}%`;
        $('chrono-texte').textContent = `${Math.ceil(secondesRestantes)} s`;
        $('chrono').classList.toggle('urgent', secondesRestantes < SEUIL_URGENT_S);
    }

    // Appelé à chaque image depuis main.js
    function tick(maintenant) {
        if (etat.phase === 'jeu') {
            const restant = Math.max(0, (etat.finChrono - maintenant) / 1000);
            majChrono(restant);
            if (restant === 0) valider(true);
        }
        glisserCamera();
    }

    // ---------- Interaction avec les cubes ----------

    const drapeauxReveles = () => etat.phase === 'revelation' || etat.phase === 'fin';

    function afficherInfo(cube, x, y) {
        const info = $('info-pays');
        const montrer = cube && cube.revele && drapeauxReveles();
        info.classList.toggle('cache', !montrer);
        if (!montrer) return;
        info.textContent = `${cube.pays.nom} · ${cube.pays.capitale}`;
        info.style.left = `${x}px`;
        info.style.top = `${y}px`;
    }

    function surSurvol(cube, x, y) {
        for (const c of cubes) {
            const survole = c === cube && etat.phase === 'jeu';
            if (c.survole !== survole) {
                c.survole = survole;
                majApparence(c);
            }
        }
        // Une fois les drapeaux révélés, le survol affiche le nom du pays
        if (etat.minuteurInfo === null) afficherInfo(cube, x, y);
    }

    function surClic(cube, x, y, tactile) {
        if (drapeauxReveles()) {
            // Sur écran tactile il n'y a pas de survol : toucher un cube révélé affiche son nom
            if (!tactile) return;
            clearTimeout(etat.minuteurInfo);
            afficherInfo(cube, x, y);
            etat.minuteurInfo = setTimeout(() => {
                etat.minuteurInfo = null;
                afficherInfo(null);
            }, DUREE_INFO_TACTILE_MS);
            return;
        }
        if (etat.phase !== 'jeu') return;
        if (etat.selection) {
            etat.selection.selectionne = false;
            majApparence(etat.selection);
        }
        etat.selection = cube;
        cube.selectionne = true;
        majApparence(cube);
        $('btn-valider').disabled = false;
    }

    // ---------- Validation et révélation ----------

    function valider(tempsEcoule = false) {
        if (etat.phase !== 'jeu') return;
        if (!tempsEcoule && !etat.selection) return;
        etat.phase = 'revelation';
        const maintenant = performance.now();
        const restant = Math.max(0, (etat.finChrono - maintenant) / 1000);
        const manche = etat.manches[etat.indice];
        const cible = manche.cible;
        const choix = tempsEcoule ? null : etat.selection;

        manche.choix = choix;
        manche.detail = pointsManche(choix?.pays ?? null, cible.pays, restant, reglages().duree);
        manche.points = manche.detail.total;
        etat.score += manche.points;
        $('score').textContent = `${formater(etat.score)} pts`;
        $('btn-valider').classList.add('cache');

        // Tous les cubes de la carte se retournent en vague, en partant du bon pays
        for (const cube of etat.visibles) {
            cube.survole = cube.selectionne = false;
            const ecart = cube.mesh.position.distanceTo(cible.mesh.position);
            retourner(cube, true, ecart * 5, maintenant);
            majApparence(cube);
        }
        cible.marque = 'bon';
        majApparence(cible);
        if (choix && choix !== cible) {
            choix.marque = 'faux';
            majApparence(choix);
            tracerArc(choix, cible);
        }
        etat.cibleCamera = cible.mesh.position.clone().setY(0);

        afficherResultat(manche, restant);
    }

    function afficherResultat(manche, restant) {
        const { cible, choix, points } = manche;
        const titre = $('resultat-titre');
        const lieu = `C'était <b>${cible.pays.nom}</b> (capitale : ${cible.pays.capitale}).`;
        let texte;
        if (!choix) {
            titre.textContent = 'Temps écoulé !';
            titre.className = 'faux';
            texte = lieu;
        } else if (choix === cible) {
            titre.textContent = 'Bravo !';
            titre.className = 'bon';
            texte = lieu;
        } else {
            const km = Math.round(distanceKm(choix.pays.lat, choix.pays.lng, cible.pays.lat, cible.pays.lng));
            titre.textContent = 'Raté !';
            titre.className = 'faux';
            texte = `${lieu}<br>Tu as choisi <b>${choix.pays.nom}</b>, à ${formater(km)} km.`;
        }
        $('resultat-texte').innerHTML = texte;
        const { position, temps } = manche.detail;
        $('resultat-points').innerHTML = `<span class="gros">+${formater(points)} pts</span>`
            + (choix ? `<br>position ${position}/500 · rapidité ${temps}/500 (${Math.ceil(restant)} s restantes)` : '');
        $('btn-suivant').textContent = etat.indice === NB_MANCHES - 1 ? 'Voir le résultat' : 'Manche suivante';
        $('resultat').classList.remove('cache');
    }

    // Arc rouge entre le pays choisi et le bon pays
    function tracerArc(cubeDe, cubeVers) {
        const a = cubeDe.mesh.position.clone().setY(0.8);
        const b = cubeVers.mesh.position.clone().setY(0.8);
        const milieu = a.clone().lerp(b, 0.5);
        milieu.y = 4 + a.distanceTo(b) * 0.2;
        const courbe = new THREE.QuadraticBezierCurve3(a, milieu, b);
        etat.arc = new THREE.Mesh(
            new THREE.TubeGeometry(courbe, 64, 0.18, 8),
            new THREE.MeshBasicMaterial({ color: 0xff5a5a })
        );
        scene.add(etat.arc);
    }

    function retirerArc() {
        if (!etat.arc) return;
        scene.remove(etat.arc);
        etat.arc.geometry.dispose();
        etat.arc.material.dispose();
        etat.arc = null;
    }

    // La caméra glisse vers le bon pays ; on arrête si le joueur reprend la main
    function glisserCamera() {
        if (!etat.cibleCamera) return;
        const delta = etat.cibleCamera.clone().sub(controls.target).multiplyScalar(0.06);
        controls.target.add(delta);
        camera.position.add(delta);
        if (controls.target.distanceTo(etat.cibleCamera) < 0.3) etat.cibleCamera = null;
    }
    controls.addEventListener('start', () => { etat.cibleCamera = null; });

    // ---------- Fin de partie ----------

    function suivant() {
        if (etat.phase !== 'revelation') return;
        etat.indice++;
        if (etat.indice >= NB_MANCHES) terminer();
        else lancerManche();
    }

    function terminer() {
        etat.phase = 'fin';
        $('hud').classList.add('cache');
        $('resultat').classList.add('cache');

        const ancienRecord = lireRecord(etat.difficulte);
        $('fin-total').textContent = `${formater(etat.score)} pts sur ${formater(POINTS_MAX)}`;
        $('fin-difficulte').textContent = `Difficulté : ${reglages().nom}`;
        if (etat.score > ancienRecord) {
            ecrire(cleRecord(etat.difficulte), etat.score);
            $('fin-record').textContent = 'Nouveau record !';
        } else {
            $('fin-record').textContent = `Record : ${formater(ancienRecord)} pts`;
        }

        const lignes = etat.manches.map((m, i) => {
            const resultat = !m.choix ? '<span class="faux">temps écoulé</span>'
                : m.choix === m.cible ? '<span class="bon">bon</span>'
                : `<span class="faux">${m.choix.pays.nom}</span>`;
            return `<tr><td>${i + 1}</td><td><img src="${urlDrapeau(m.cible.pays.code)}" alt=""></td>`
                + `<td>${m.cible.pays.nom}</td><td>${resultat}</td><td>${formater(m.points)}</td></tr>`;
        });
        $('fin-tableau').querySelector('tbody').innerHTML = lignes.join('');
        $('fin').classList.remove('cache');
    }

    function retourAccueil() {
        remettreCubesABlanc();
        $('fin').classList.add('cache');
        afficherAccueil();
    }

    function afficherAccueil() {
        etat.phase = 'accueil';
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
        choisirDifficulte(etat.difficulte);
        $('accueil').classList.remove('cache');
    }

    // ---------- Boutons et clavier ----------

    $('btn-jouer').addEventListener('click', demarrerPartie);
    $('btn-rejouer').addEventListener('click', () => {
        remettreCubesABlanc();
        demarrerPartie();
    });
    $('btn-accueil').addEventListener('click', retourAccueil);
    $('btn-valider').addEventListener('click', () => valider());
    $('btn-suivant').addEventListener('click', suivant);
    for (const bouton of document.querySelectorAll('#choix-difficulte button')) {
        bouton.addEventListener('click', () => choisirDifficulte(bouton.dataset.difficulte));
    }
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        // Sinon Entrée activerait aussi le bouton qui a le focus (double action)
        e.preventDefault();
        if (etat.phase === 'jeu') valider();
        else if (etat.phase === 'revelation') suivant();
    });

    function pret() {
        etat.difficulte = lire(CLE_DIFFICULTE) ?? DIFFICULTE_PAR_DEFAUT;
        afficherAccueil();
        $('btn-jouer').disabled = false;
        $('btn-jouer').textContent = 'Jouer';
    }

    return { tick, surSurvol, surClic, pret };
}
