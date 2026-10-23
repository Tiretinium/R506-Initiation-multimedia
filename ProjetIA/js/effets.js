// Confettis 3D : une gerbe de mini-cubes aux couleurs du drapeau, qui retombent et rebondissent sur la carte
import * as THREE from 'three';

const NB_MAX = 300;            // taille du réservoir de particules (plusieurs gerbes peuvent se suivre)
const NB_PAR_GERBE = 150;
const TAILLE = 0.3;
const GRAVITE = 28;
const VITESSE_MIN = 9;
const VITESSE_MAX = 17;
const REBOND = 0.4;            // part de la vitesse verticale gardée à chaque rebond
const FROTTEMENT_SOL = 0.75;   // part de la vitesse horizontale gardée à chaque rebond
const DUREE_VIE_S = 2.2;
const DUREE_DISPARITION_S = 0.5;

// Couleurs dominantes d'un drapeau, lues dans le canvas de sa texture
const cacheCouleurs = new Map();
export function couleursDrapeau(code, canvas) {
    if (cacheCouleurs.has(code)) return cacheCouleurs.get(code);
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const comptes = new Map();
    const pas = 16; // un pixel sur 16 dans chaque sens suffit
    for (let y = pas / 2; y < canvas.height; y += pas) {
        for (let x = pas / 2; x < canvas.width; x += pas) {
            const i = (y * canvas.width + x) * 4;
            // On arrondit pour regrouper les teintes très proches (bords anti-crénelés)
            const cle = [0, 1, 2].map((k) => Math.round(data[i + k] / 32) * 32).join(',');
            comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
        }
    }
    const couleurs = [...comptes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cle]) => {
            const [r, g, b] = cle.split(',').map((v) => Math.min(Number(v), 255) / 255);
            return new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
        });
    cacheCouleurs.set(code, couleurs);
    return couleurs;
}

export function creerEffets(scene) {
    const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(TAILLE, TAILLE, TAILLE),
        new THREE.MeshStandardMaterial({ roughness: 0.5 }),
        NB_MAX
    );
    mesh.frustumCulled = false; // les particules s'éloignent de l'origine du mesh
    mesh.count = 0;
    scene.add(mesh);

    const particules = Array.from({ length: NB_MAX }, () => ({
        vivante: false, age: 0,
        position: new THREE.Vector3(), vitesse: new THREE.Vector3(),
        rotation: new THREE.Euler(), spin: new THREE.Vector3(),
    }));
    const enAttente = []; // gerbes programmées : { debut, origine, couleurs }
    const matrice = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const echelle = new THREE.Vector3();
    let prochaine = 0;

    function lancerGerbe(origine, couleurs) {
        for (let n = 0; n < NB_PAR_GERBE; n++) {
            const indice = prochaine;
            const p = particules[indice];
            prochaine = (prochaine + 1) % NB_MAX; // on recycle les plus anciennes si le réservoir est plein
            p.vivante = true;
            p.age = 0;
            p.position.copy(origine);
            // Direction aléatoire dans un cône tourné vers le haut
            const angle = Math.random() * Math.PI * 2;
            const ouverture = Math.random() * 0.9;
            const vitesse = VITESSE_MIN + Math.random() * (VITESSE_MAX - VITESSE_MIN);
            p.vitesse.set(Math.cos(angle) * ouverture, 1, Math.sin(angle) * ouverture).normalize().multiplyScalar(vitesse);
            p.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            p.spin.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(20);
            mesh.setColorAt(indice, couleurs[n % couleurs.length]);
        }
        mesh.instanceColor.needsUpdate = true;
    }

    // Programme une gerbe dans delaiMs (pour l'accorder avec l'animation du cube)
    function confettis(origine, couleurs, delaiMs = 0) {
        enAttente.push({ debut: performance.now() + delaiMs, origine: origine.clone(), couleurs });
    }

    function vider() {
        enAttente.length = 0;
        for (const p of particules) p.vivante = false;
        mesh.count = 0;
    }

    // Appelé à chaque image avec le temps écoulé (s)
    function maj(dt) {
        const maintenant = performance.now();
        for (let i = enAttente.length - 1; i >= 0; i--) {
            if (maintenant < enAttente[i].debut) continue;
            lancerGerbe(enAttente[i].origine, enAttente[i].couleurs);
            enAttente.splice(i, 1);
        }

        let derniere = -1;
        particules.forEach((p, i) => {
            if (p.vivante) {
                p.age += dt;
                if (p.age > DUREE_VIE_S) p.vivante = false;
            }
            if (!p.vivante) {
                // Instance cachée (échelle nulle) : plus simple que de réordonner le réservoir
                matrice.makeScale(0, 0, 0);
                mesh.setMatrixAt(i, matrice);
                return;
            }
            derniere = i;
            p.vitesse.y -= GRAVITE * dt;
            p.position.addScaledVector(p.vitesse, dt);
            if (p.position.y < TAILLE / 2) {
                p.position.y = TAILLE / 2;
                p.vitesse.y = -p.vitesse.y * REBOND;
                p.vitesse.x *= FROTTEMENT_SOL;
                p.vitesse.z *= FROTTEMENT_SOL;
                p.spin.multiplyScalar(FROTTEMENT_SOL);
            }
            p.rotation.x += p.spin.x * dt;
            p.rotation.y += p.spin.y * dt;
            p.rotation.z += p.spin.z * dt;
            const restant = DUREE_VIE_S - p.age;
            const s = restant < DUREE_DISPARITION_S ? restant / DUREE_DISPARITION_S : 1;
            quaternion.setFromEuler(p.rotation);
            echelle.set(s, s, s);
            matrice.compose(p.position, quaternion, echelle);
            mesh.setMatrixAt(i, matrice);
        });
        mesh.count = derniere + 1;
        mesh.instanceMatrix.needsUpdate = true;
    }

    return { confettis, vider, maj };
}
