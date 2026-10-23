// Mode inclinaison (smartphone) : incliner le téléphone fait glisser la carte, comme une bille sur un plateau.
// La position du téléphone au moment de l'activation sert de position neutre.
import * as THREE from 'three';

const ZONE_MORTE_DEG = 4;     // petites inclinaisons ignorées (main qui tremble)
const INCLINAISON_MAX_DEG = 30; // au-delà, la vitesse n'augmente plus
const VITESSE = 0.45;         // en « distances caméra » par seconde à inclinaison maximale
const DELAI_CAPTEUR_MS = 1500; // sans mesure après ce délai, on considère le capteur indisponible
const LIMITE_X = 180;
const LIMITE_Z = 90;

export function capteurOrientationPresent() {
    return 'DeviceOrientationEvent' in window;
}

export function creerControleInclinaison(camera, controls) {
    let actif = false;
    let neutre = null;
    let derniereMesure = null;
    const inclinaison = { x: 0, y: 0 };
    const avant = new THREE.Vector3();
    const droite = new THREE.Vector3();
    const deplacement = new THREE.Vector3();

    // beta = avant/arrière, gamma = gauche/droite, dans le repère du téléphone tenu en portrait :
    // on les permute selon la rotation de l'écran pour que « droite » reste la droite de l'écran.
    function lireInclinaison(e) {
        const angle = screen.orientation?.angle ?? window.orientation ?? 0;
        if (angle === 90) return { x: e.beta, y: -e.gamma };
        if (angle === 270 || angle === -90) return { x: -e.beta, y: e.gamma };
        return { x: e.gamma, y: e.beta };
    }

    function surOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        const mesure = lireInclinaison(e);
        derniereMesure = performance.now();
        if (!neutre) neutre = mesure;
        inclinaison.x = mesure.x - neutre.x;
        inclinaison.y = mesure.y - neutre.y;
    }

    // Doit être appelée depuis un clic : iOS n'accorde la permission que sur un geste de l'utilisateur
    async function activer() {
        if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
            const reponse = await DeviceOrientationEvent.requestPermission();
            if (reponse !== 'granted') throw new Error('Permission refusée pour le capteur d\'orientation.');
        }
        neutre = null;
        derniereMesure = null;
        inclinaison.x = inclinaison.y = 0;
        window.addEventListener('deviceorientation', surOrientation);
        actif = true;

        // Chrome n'envoie aucune mesure hors HTTPS (ou sur un PC sans capteur) : on le détecte
        await new Promise((r) => setTimeout(r, DELAI_CAPTEUR_MS));
        if (actif && derniereMesure === null) {
            desactiver();
            throw new Error('Aucune mesure du capteur. Il faut un smartphone et une page en HTTPS (ex. GitHub Pages).');
        }
    }

    function desactiver() {
        window.removeEventListener('deviceorientation', surOrientation);
        actif = false;
    }

    // Courbe de réponse : 0 dans la zone morte, puis au carré jusqu'à 1 (lent quand on penche peu, pour viser)
    const reponse = (deg) => {
        const a = Math.abs(deg) - ZONE_MORTE_DEG;
        return a <= 0 ? 0 : Math.sign(deg) * Math.min(a / (INCLINAISON_MAX_DEG - ZONE_MORTE_DEG), 1) ** 2;
    };

    // Appelé à chaque image avec le temps écoulé (s)
    function maj(dt) {
        if (!actif) return;
        const vx = reponse(inclinaison.x);
        const vy = reponse(inclinaison.y);
        if (vx === 0 && vy === 0) return;

        // Directions « avant » et « droite » de la caméra, ramenées sur le plateau
        avant.subVectors(controls.target, camera.position).setY(0).normalize();
        droite.crossVectors(avant, camera.up).normalize();
        const vitesse = camera.position.distanceTo(controls.target) * VITESSE * dt;
        // Pencher le haut du téléphone vers l'avant (beta diminue) fait avancer vers le haut de l'écran
        deplacement.copy(droite).multiplyScalar(vx * vitesse).addScaledVector(avant, -vy * vitesse);

        const ancienne = controls.target.clone();
        controls.target.add(deplacement);
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -LIMITE_X, LIMITE_X);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -LIMITE_Z, LIMITE_Z);
        camera.position.add(controls.target.clone().sub(ancienne));
    }

    return {
        activer,
        desactiver,
        recentrer: () => { neutre = null; },
        maj,
        get actif() { return actif; },
    };
}
