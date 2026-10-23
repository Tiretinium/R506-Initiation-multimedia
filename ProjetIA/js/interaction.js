// Survol, clic et toucher sur les cubes par raycasting
import * as THREE from 'three';

// Au-delà de ce déplacement (en px) entre l'appui et le relâchement, c'est un glisser de caméra, pas un clic.
// Le doigt bouge plus que la souris, d'où un seuil plus large en tactile.
const SEUIL_CLIC_PX = { souris: 5, tactile: 12 };
// Les cubes sont petits : si on ne touche aucun cube pile, on prend le plus proche dans ce rayon (px)
const RAYON_PROCHE_PX = { souris: 10, tactile: 28 };

export function activerInteraction(renderer, camera, cubes, { surSurvol, surClic }) {
    const raycaster = new THREE.Raycaster();
    const pointeur = new THREE.Vector2();
    const canvas = renderer.domElement;
    const projete = new THREE.Vector3();
    let cubeSurvole = null;
    let appui = null;
    // Un geste à deux doigts (zoom, déplacement) ne doit jamais compter comme un toucher de cube
    const pointeursActifs = new Set();
    let gesteMultiple = false;

    // Le raycaster teste aussi les objets masqués : on ne garde que les cubes de la carte
    const meshesVisibles = () => cubes.filter((c) => c.visible).map((c) => c.mesh);

    function cubeSousLaSouris(e) {
        const rect = canvas.getBoundingClientRect();
        pointeur.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointeur.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointeur, camera);
        const touche = raycaster.intersectObjects(meshesVisibles(), false)[0];
        return touche ? touche.object.userData.cube : null;
    }

    // Cube visible dont le centre, à l'écran, est le plus proche du point (dans un rayon donné)
    function cubeLePlusProche(e, rayonPx) {
        const rect = canvas.getBoundingClientRect();
        let meilleur = null;
        let meilleureDistance = rayonPx;
        for (const cube of cubes) {
            if (!cube.visible) continue;
            projete.copy(cube.mesh.position).project(camera);
            if (projete.z > 1) continue; // derrière la caméra
            const x = rect.left + (projete.x + 1) / 2 * rect.width;
            const y = rect.top + (1 - projete.y) / 2 * rect.height;
            const d = Math.hypot(x - e.clientX, y - e.clientY);
            if (d < meilleureDistance) {
                meilleureDistance = d;
                meilleur = cube;
            }
        }
        return meilleur;
    }

    const typePointeur = (e) => (e.pointerType === 'touch' || e.pointerType === 'pen' ? 'tactile' : 'souris');

    canvas.addEventListener('pointermove', (e) => {
        if (typePointeur(e) === 'tactile') return; // pas de survol au doigt
        const cube = cubeSousLaSouris(e);
        if (cube !== cubeSurvole) {
            cubeSurvole = cube;
            canvas.style.cursor = cube ? 'pointer' : '';
        }
        surSurvol(cube, e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerleave', () => {
        cubeSurvole = null;
        canvas.style.cursor = '';
        surSurvol(null);
    });

    canvas.addEventListener('pointerdown', (e) => {
        pointeursActifs.add(e.pointerId);
        if (pointeursActifs.size > 1) gesteMultiple = true;
        if (e.button === 0) appui = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointercancel', (e) => {
        pointeursActifs.delete(e.pointerId);
        appui = null;
    });

    canvas.addEventListener('pointerup', (e) => {
        pointeursActifs.delete(e.pointerId);
        if (gesteMultiple) {
            if (pointeursActifs.size === 0) gesteMultiple = false;
            appui = null;
            return;
        }
        if (!appui || e.button !== 0) return;
        const type = typePointeur(e);
        const deplacement = Math.hypot(e.clientX - appui.x, e.clientY - appui.y);
        appui = null;
        if (deplacement > SEUIL_CLIC_PX[type]) return;
        const cube = cubeSousLaSouris(e) ?? cubeLePlusProche(e, RAYON_PROCHE_PX[type]);
        if (cube) surClic(cube, e.clientX, e.clientY, type === 'tactile');
    });
}
