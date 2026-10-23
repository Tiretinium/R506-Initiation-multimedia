// Scène Three.js : rendu, caméra, contrôles et plateau avec la carte du monde
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { feature, mesh } from 'topojson-client';

// Le plateau fait 360 x 180 unités : 1 unité = 1 degré de longitude ou de latitude
const LARGEUR = 360;
const HAUTEUR = 180;

export function creerScene(conteneur) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(conteneur.clientWidth, conteneur.clientHeight);
    conteneur.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1622);

    const camera = new THREE.PerspectiveCamera(45, conteneur.clientWidth / conteneur.clientHeight, 1, 3000);
    // Vue de départ un peu zoomée, centrée entre l'Europe et l'Afrique
    camera.position.set(10, 165, 105);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(10, 0, -20);
    controls.enableDamping = true;
    controls.screenSpacePanning = false; // le déplacement reste parallèle au plateau
    controls.minDistance = 20;
    controls.maxDistance = 340;
    controls.maxPolarAngle = Math.PI * 0.42; // impossible de passer sous le plateau
    controls.addEventListener('change', () => {
        // On garde le point visé au-dessus de la carte
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -LARGEUR / 2, LARGEUR / 2);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -HAUTEUR / 2, HAUTEUR / 2);
        controls.target.y = 0;
    });

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
    const soleil = new THREE.DirectionalLight(0xffffff, 1.6);
    soleil.position.set(60, 160, 90);
    scene.add(soleil);

    window.addEventListener('resize', () => {
        camera.aspect = conteneur.clientWidth / conteneur.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(conteneur.clientWidth, conteneur.clientHeight);
    });

    return { renderer, scene, camera, controls };
}

// Dessine la carte du monde (sans aucun nom) dans un canvas, utilisé comme texture du plateau
function dessinerCarte(topo) {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const x = (lng) => (lng + 180) / 360 * canvas.width;
    const y = (lat) => (90 - lat) / 180 * canvas.height;

    ctx.fillStyle = '#17405c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Quadrillage discret tous les 30°
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    for (let lng = -150; lng <= 150; lng += 30) {
        ctx.beginPath(); ctx.moveTo(x(lng), 0); ctx.lineTo(x(lng), canvas.height); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); ctx.moveTo(0, y(lat)); ctx.lineTo(canvas.width, y(lat)); ctx.stroke();
    }

    // Trace une liste de lignes [lng, lat]. Une ligne qui traverse l'antiméridien (est de la Russie, Fidji)
    // saute de +180 à -180 : on la « déroule » pour qu'elle reste continue, puis on la retrace décalée
    // de 360° pour que la partie qui dépasse réapparaisse de l'autre côté de la carte.
    const tracerLignes = (lignes, fermer) => {
        for (const ligne of lignes) {
            const deroulee = [];
            for (const [lng, lat] of ligne) {
                let l = lng;
                const precedente = deroulee.at(-1);
                if (precedente) {
                    while (l - precedente[0] > 180) l -= 360;
                    while (l - precedente[0] < -180) l += 360;
                }
                deroulee.push([l, lat]);
            }
            const lngs = deroulee.map(([l]) => l);
            const decalages = [0];
            if (Math.max(...lngs) > 180) decalages.push(-360);
            if (Math.min(...lngs) < -180) decalages.push(360);
            for (const decalage of decalages) {
                deroulee.forEach(([l, lat], i) => {
                    if (i === 0) ctx.moveTo(x(l + decalage), y(lat));
                    else ctx.lineTo(x(l + decalage), y(lat));
                });
                if (fermer) ctx.closePath();
            }
        }
    };

    const pays = feature(topo, topo.objects.countries);
    ctx.fillStyle = '#6f9a72';
    for (const p of pays.features) {
        const g = p.geometry;
        if (!g) continue;
        // Un chemin par pays : les trous (ex. le Lesotho dans l'Afrique du Sud) restent corrects
        ctx.beginPath();
        const polygones = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
        for (const anneaux of polygones) tracerLignes(anneaux, true);
        ctx.fill('evenodd');
    }

    const frontieres = mesh(topo, topo.objects.countries, (a, b) => a !== b);
    ctx.strokeStyle = 'rgba(30, 55, 40, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    tracerLignes(frontieres.coordinates, false);
    ctx.stroke();

    return canvas;
}

export async function creerPlateau(scene, renderer) {
    const topo = await fetch('data/monde-110m.json').then((r) => r.json());
    const texture = new THREE.CanvasTexture(dessinerCarte(topo));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // PlaneGeometry est vertical (XY) : on le couche, le nord part vers -z
    const plateau = new THREE.Mesh(
        new THREE.PlaneGeometry(LARGEUR, HAUTEUR),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
    );
    plateau.rotation.x = -Math.PI / 2;
    scene.add(plateau);

    // Socle sous la carte pour lui donner de l'épaisseur
    const socle = new THREE.Mesh(
        new THREE.BoxGeometry(LARGEUR + 4, 4, HAUTEUR + 4),
        new THREE.MeshStandardMaterial({ color: 0x0f2232 })
    );
    socle.position.y = -2.05;
    scene.add(socle);
}
