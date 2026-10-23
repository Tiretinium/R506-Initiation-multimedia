// Cubes posés sur les capitales : création, états (blanc, survol, sélection, révélé) et animations
import * as THREE from 'three';

const TAILLE = 1.2;
const LEVEE_SURVOL = 0.4;
const LEVEE_MARQUE = 1.0;
// Distance minimale entre deux cubes, et déplacement au-delà duquel on relie le cube à sa vraie position
const ESPACEMENT = TAILLE * 1.3;
const SEUIL_FIL = TAILLE * 0.3;
export const DUREE_RETOURNEMENT_MS = 550;
// Animations de révélation : saut de joie (bon pays) et écrasement façon gelée (mauvais choix)
const DUREE_SAUT_MS = 1100;
const HAUTEUR_SAUT = 4;
const DUREE_ECRASEMENT_MS = 1200;

const COULEUR_BLANC = new THREE.Color(0xf2f2f2);
const COULEUR_SELECTION = new THREE.Color(0x4da3ff);
const COULEUR_HORS_INDICE = new THREE.Color(0x46525e); // cubes écartés par l'indice (autre continent)
const COULEUR_BON = 0x3ecf6e;
const COULEUR_FAUX = 0xff5a5a;

const geometrieCube = new THREE.BoxGeometry(TAILLE, TAILLE, TAILLE);
const geometrieHalo = new THREE.RingGeometry(TAILLE * 0.9, TAILLE * 1.5, 40);

// Conversion latitude/longitude -> position sur le plateau (carte équirectangulaire)
export function latLngVersPosition(lat, lng) {
    return new THREE.Vector3(lng, 0, -lat);
}

function chargerImage(src) {
    return new Promise((resoudre, rejeter) => {
        const img = new Image();
        img.onload = () => resoudre(img);
        img.onerror = () => rejeter(new Error(`Image introuvable : ${src}`));
        img.src = src;
    });
}

// Charge les drapeaux SVG et les convertit en textures carrées (Three.js gère mal le SVG directement)
export async function chargerDrapeaux(pays) {
    const textures = new Map();
    await Promise.all(pays.map(async (p) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        try {
            ctx.drawImage(await chargerImage(`img/drapeaux/${p.code}.svg`), 0, 0, 256, 256);
        } catch (erreur) {
            // Drapeau manquant : on affiche un point d'interrogation plutôt que de bloquer le jeu
            console.warn(erreur.message);
            ctx.fillStyle = '#888';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 160px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 128, 136);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.set(p.code, texture);
    }));
    return textures;
}

// Certaines capitales sont trop proches pour que leurs cubes tiennent côte à côte (Rome et le Vatican,
// Jérusalem et Ramallah…). On écarte les cubes qui se chevauchent, en les gardant au plus près
// de leur vraie position (relaxation itérative).
function calculerPositions(pays) {
    const ancres = pays.map((p) => latLngVersPosition(p.lat, p.lng));
    const positions = ancres.map((a) => a.clone());
    for (let iteration = 0; iteration < 400; iteration++) {
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                let dx = positions[j].x - positions[i].x;
                let dz = positions[j].z - positions[i].z;
                let d = Math.hypot(dx, dz);
                if (d >= ESPACEMENT) continue;
                if (d < 1e-6) {
                    // Positions identiques : direction fixe (déterminée par l'indice) pour les séparer
                    dx = Math.cos(i * 2.4);
                    dz = Math.sin(i * 2.4);
                    d = 1;
                }
                const poussee = (ESPACEMENT - d) / 2 / d;
                positions[i].x -= dx * poussee;
                positions[i].z -= dz * poussee;
                positions[j].x += dx * poussee;
                positions[j].z += dz * poussee;
            }
        }
        // Rappel léger vers la vraie position
        positions.forEach((p, i) => p.lerp(ancres[i], 0.02));
    }
    return positions.map((position, i) => ({ position, ancre: ancres[i] }));
}

// Fils discrets + points entre les cubes déplacés et la vraie position de leur capitale
const fils = new THREE.Group();
const materiauFil = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const materiauPoint = new THREE.MeshBasicMaterial({ color: 0xffffff });
const geometriePoint = new THREE.CircleGeometry(0.12, 16);

function creerFil(position, ancre) {
    const geometrie = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(position.x, 0.03, position.z),
        new THREE.Vector3(ancre.x, 0.03, ancre.z),
    ]);
    fils.add(new THREE.Line(geometrie, materiauFil));
    const point = new THREE.Mesh(geometriePoint, materiauPoint);
    point.rotation.x = -Math.PI / 2;
    point.position.set(ancre.x, 0.04, ancre.z);
    fils.add(point);
}

// Affiche les cubes des pays retenus par la difficulté et recalcule leur placement :
// avec moins de cubes, il y a moins de chevauchements, donc moins de cubes déplacés.
export function placerCubes(cubes, surLaCarte) {
    for (const objet of [...fils.children]) {
        if (objet.isLine) objet.geometry.dispose();
        fils.remove(objet);
    }
    const visibles = cubes.filter((c) => surLaCarte(c.pays));
    for (const cube of cubes) {
        cube.visible = visibles.includes(cube);
        cube.mesh.visible = cube.visible;
    }
    const emplacements = calculerPositions(visibles.map((c) => c.pays));
    visibles.forEach((cube, i) => {
        const { position, ancre } = emplacements[i];
        cube.mesh.position.set(position.x, TAILLE / 2, position.z);
        cube.halo.position.set(position.x, 0.05, position.z);
        if (position.distanceTo(ancre) > SEUIL_FIL) creerFil(position, ancre);
    });
    return visibles;
}

export function creerCubes(scene, pays, drapeaux) {
    scene.add(fils);
    return pays.map((p) => {
        const blanc = new THREE.MeshStandardMaterial({ color: COULEUR_BLANC.clone(), roughness: 0.55 });
        const drapeau = new THREE.MeshStandardMaterial({ map: drapeaux.get(p.code), roughness: 0.55 });

        const mesh = new THREE.Mesh(geometrieCube, blanc);
        mesh.position.y = TAILLE / 2;
        scene.add(mesh);

        const halo = new THREE.Mesh(geometrieHalo, new THREE.MeshBasicMaterial({
            color: COULEUR_BON, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
        }));
        halo.rotation.x = -Math.PI / 2;
        halo.visible = false;
        scene.add(halo);

        const cube = {
            pays: p, mesh, halo, blanc, drapeau, visible: true,
            survole: false, selectionne: false, revele: false, marque: null,
            horsIndice: false,
            hauteur: TAILLE / 2, // hauteur de base, sans l'animation de saut
            retournement: null, // { debut, versDrapeau } pendant l'animation
            saut: null, // { debut, type: 'joie' | 'ecrase' }
        };
        mesh.userData.cube = cube;
        return cube;
    });
}

// Met à jour la couleur du cube blanc selon son état
export function majApparence(cube) {
    cube.blanc.color.copy(cube.selectionne ? COULEUR_SELECTION : cube.horsIndice ? COULEUR_HORS_INDICE : COULEUR_BLANC);
    cube.blanc.emissive.setHex(cube.survole && !cube.selectionne ? 0x222222 : 0x000000);
    cube.halo.visible = cube.marque !== null;
    if (cube.marque) cube.halo.material.color.setHex(cube.marque === 'bon' ? COULEUR_BON : COULEUR_FAUX);
}

// Lance le retournement du cube (vers le drapeau ou vers le blanc) après un délai
export function retourner(cube, versDrapeau, delaiMs, maintenant) {
    cube.retournement = { debut: maintenant + delaiMs, versDrapeau };
}

// Lance l'animation de révélation du cube : 'joie' (bon pays) ou 'ecrase' (mauvais choix)
export function animerSaut(cube, type, delaiMs, maintenant) {
    cube.saut = { debut: maintenant + delaiMs, type };
}

// Remet le cube en blanc. Un retournement vers le drapeau encore en attente (vague de révélation
// pas terminée) est annulé : sinon le drapeau apparaîtrait pendant la manche suivante.
export function masquer(cube, delaiMs, maintenant) {
    cube.saut = null;
    cube.mesh.scale.set(1, 1, 1);
    cube.mesh.rotation.y = 0;
    cube.horsIndice = false;
    if (cube.revele) {
        retourner(cube, false, delaiMs, maintenant);
    } else {
        cube.retournement = null;
        cube.mesh.rotation.x = 0;
        cube.mesh.material = cube.blanc;
    }
}

// Saut de joie : un grand bond en faisant un tour sur lui-même, puis un petit rebond.
// Renvoie le décalage vertical et applique rotation et écrasement à l'atterrissage.
function animerJoie(mesh, t) {
    const bond = (debut, fin, hauteur) => (t >= debut && t <= fin)
        ? hauteur * 4 * ((t - debut) / (fin - debut)) * (1 - (t - debut) / (fin - debut)) : 0;
    const decalage = bond(0, 0.6, HAUTEUR_SAUT) + bond(0.6, 0.85, HAUTEUR_SAUT * 0.25);
    mesh.rotation.y = Math.min(t / 0.6, 1) * Math.PI * 2;
    // Petit écrasement au moment où il retouche le plateau
    const impact = Math.max(0, 1 - Math.abs(t - 0.6) / 0.06) + Math.max(0, 1 - Math.abs(t - 0.85) / 0.05) * 0.5;
    mesh.scale.set(1 + 0.25 * impact, 1 - 0.35 * impact, 1 + 0.25 * impact);
    return decalage - TAILLE / 2 * 0.35 * impact;
}

// Écrasement façon gelée : aplati d'un coup, puis il reprend sa forme en oscillant
function animerEcrasement(mesh, t) {
    const sy = 1 - 0.65 * Math.exp(-3.5 * t) * Math.cos(11 * t);
    const sxz = 1 + (1 - sy) * 0.6;
    mesh.scale.set(sxz, sy, sxz);
    return -TAILLE / 2 * (1 - sy); // la base du cube reste posée
}

// Appelé à chaque image : hauteur du cube, animations de saut et de retournement
export function animerCubes(cubes, maintenant) {
    for (const cube of cubes) {
        const levee = cube.marque ? LEVEE_MARQUE
            : (cube.survole || cube.selectionne) && !cube.revele ? LEVEE_SURVOL : 0;
        const hauteurCible = TAILLE / 2 + levee;
        cube.hauteur += (hauteurCible - cube.hauteur) * 0.18;

        let decalage = 0;
        const s = cube.saut;
        if (s && maintenant >= s.debut) {
            const duree = s.type === 'joie' ? DUREE_SAUT_MS : DUREE_ECRASEMENT_MS;
            const t = Math.min((maintenant - s.debut) / duree, 1);
            decalage = s.type === 'joie' ? animerJoie(cube.mesh, t) : animerEcrasement(cube.mesh, t);
            if (t === 1) {
                cube.saut = null;
                cube.mesh.scale.set(1, 1, 1);
                cube.mesh.rotation.y = 0;
                decalage = 0;
            }
        }
        cube.mesh.position.y = cube.hauteur + decalage;

        const r = cube.retournement;
        if (!r || maintenant < r.debut) continue;
        const t = Math.min((maintenant - r.debut) / DUREE_RETOURNEMENT_MS, 1);
        // Un tour complet sur l'axe X ; on change de matière à mi-parcours
        cube.mesh.rotation.x = t * Math.PI * 2;
        if (t >= 0.5 && cube.revele !== r.versDrapeau) {
            cube.revele = r.versDrapeau;
            cube.mesh.material = r.versDrapeau ? cube.drapeau : cube.blanc;
        }
        if (t === 1) {
            cube.mesh.rotation.x = 0;
            cube.retournement = null;
        }
    }
}

export { TAILLE as TAILLE_CUBE };
