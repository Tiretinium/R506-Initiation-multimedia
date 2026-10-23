// Survol et clic sur les cubes par raycasting
import * as THREE from 'three';

// Au-delà de ce déplacement (en px) entre l'appui et le relâchement, c'est un glisser de caméra, pas un clic
const SEUIL_CLIC_PX = 5;

export function activerInteraction(renderer, camera, cubes, { surSurvol, surClic }) {
    const raycaster = new THREE.Raycaster();
    const pointeur = new THREE.Vector2();
    const meshes = cubes.map((c) => c.mesh);
    const canvas = renderer.domElement;
    let cubeSurvole = null;
    let appui = null;

    function cubeSousLaSouris(e) {
        const rect = canvas.getBoundingClientRect();
        pointeur.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointeur.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointeur, camera);
        const touche = raycaster.intersectObjects(meshes, false)[0];
        return touche ? touche.object.userData.cube : null;
    }

    canvas.addEventListener('pointermove', (e) => {
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
        if (e.button === 0) appui = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointerup', (e) => {
        if (!appui || e.button !== 0) return;
        const deplacement = Math.hypot(e.clientX - appui.x, e.clientY - appui.y);
        appui = null;
        if (deplacement > SEUIL_CLIC_PX) return;
        const cube = cubeSousLaSouris(e);
        if (cube) surClic(cube);
    });
}
