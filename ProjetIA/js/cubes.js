// Cubes posés sur les capitales : création, états (blanc, survol, sélection, révélé) et animations
import * as THREE from 'three';

const TAILLE = 1.2;
const LEVEE_SURVOL = 0.4;
const LEVEE_MARQUE = 1.0;
// Distance minimale entre deux cubes, et déplacement au-delà duquel on relie le cube à sa vraie position
const ESPACEMENT = TAILLE * 1.3;
const SEUIL_FIL = TAILLE * 0.3;
const DUREE_RETOURNEMENT_MS = 550;

const COULEUR_BLANC = new THREE.Color(0xf2f2f2);
const COULEUR_SELECTION = new THREE.Color(0x4da3ff);
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

// Fil discret + point entre un cube déplacé et la vraie position de sa capitale
function creerFil(scene, position, ancre) {
    const materiau = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const geometrie = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(position.x, 0.03, position.z),
        new THREE.Vector3(ancre.x, 0.03, ancre.z),
    ]);
    scene.add(new THREE.Line(geometrie, materiau));
    const point = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    point.rotation.x = -Math.PI / 2;
    point.position.set(ancre.x, 0.04, ancre.z);
    scene.add(point);
}

export function creerCubes(scene, pays, drapeaux) {
    const emplacements = calculerPositions(pays);
    return pays.map((p, i) => {
        const blanc = new THREE.MeshStandardMaterial({ color: COULEUR_BLANC.clone(), roughness: 0.55 });
        const drapeau = new THREE.MeshStandardMaterial({ map: drapeaux.get(p.code), roughness: 0.55 });

        const mesh = new THREE.Mesh(geometrieCube, blanc);
        const { position: base, ancre } = emplacements[i];
        mesh.position.set(base.x, TAILLE / 2, base.z);
        if (base.distanceTo(ancre) > SEUIL_FIL) creerFil(scene, base, ancre);
        scene.add(mesh);

        const halo = new THREE.Mesh(geometrieHalo, new THREE.MeshBasicMaterial({
            color: COULEUR_BON, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
        }));
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(base.x, 0.05, base.z);
        halo.visible = false;
        scene.add(halo);

        const cube = {
            pays: p, mesh, halo, blanc, drapeau,
            survole: false, selectionne: false, revele: false, marque: null,
            retournement: null, // { debut, versDrapeau } pendant l'animation
        };
        mesh.userData.cube = cube;
        return cube;
    });
}

// Met à jour la couleur du cube blanc selon son état
export function majApparence(cube) {
    cube.blanc.color.copy(cube.selectionne ? COULEUR_SELECTION : COULEUR_BLANC);
    cube.blanc.emissive.setHex(cube.survole && !cube.selectionne ? 0x222222 : 0x000000);
    cube.halo.visible = cube.marque !== null;
    if (cube.marque) cube.halo.material.color.setHex(cube.marque === 'bon' ? COULEUR_BON : COULEUR_FAUX);
}

// Lance le retournement du cube (vers le drapeau ou vers le blanc) après un délai
export function retourner(cube, versDrapeau, delaiMs, maintenant) {
    cube.retournement = { debut: maintenant + delaiMs, versDrapeau };
}

// Remet le cube en blanc. Un retournement vers le drapeau encore en attente (vague de révélation
// pas terminée) est annulé : sinon le drapeau apparaîtrait pendant la manche suivante.
export function masquer(cube, delaiMs, maintenant) {
    if (cube.revele) {
        retourner(cube, false, delaiMs, maintenant);
    } else {
        cube.retournement = null;
        cube.mesh.rotation.x = 0;
        cube.mesh.material = cube.blanc;
    }
}

// Appelé à chaque image : hauteur du cube et animation de retournement
export function animerCubes(cubes, maintenant) {
    for (const cube of cubes) {
        const levee = cube.marque ? LEVEE_MARQUE
            : (cube.survole || cube.selectionne) && !cube.revele ? LEVEE_SURVOL : 0;
        const hauteurCible = TAILLE / 2 + levee;
        cube.mesh.position.y += (hauteurCible - cube.mesh.position.y) * 0.18;

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
