// Détection d'une secousse du téléphone (DeviceMotionEvent), utilisée pour demander un indice
const SEUIL_MS2 = 14;          // accélération (hors gravité) au-delà de laquelle on compte un « pic »
const NB_PICS = 3;             // pics nécessaires pour une secousse (un aller-retour franc)
const FENETRE_MS = 900;        // les pics doivent tomber dans cette fenêtre
const ECART_PICS_MS = 90;      // deux mesures trop rapprochées comptent pour un seul pic
const PAUSE_APRES_MS = 1500;   // évite de déclencher deux fois pour la même secousse
const GRAVITE_MS2 = 9.81;

export function capteurMouvementPresent() {
    return 'DeviceMotionEvent' in window;
}

export function creerDetecteurSecousse(surSecousse) {
    let pics = [];
    let derniereSecousse = 0;
    let actif = false;

    // Certains téléphones ne fournissent que l'accélération avec la gravité : on retire alors ~9,81
    function intensite(e) {
        const a = e.acceleration;
        if (a && a.x !== null) return Math.hypot(a.x, a.y, a.z);
        const g = e.accelerationIncludingGravity;
        if (!g || g.x === null) return 0;
        return Math.abs(Math.hypot(g.x, g.y, g.z) - GRAVITE_MS2);
    }

    function surMouvement(e) {
        if (intensite(e) < SEUIL_MS2) return;
        const maintenant = performance.now();
        if (maintenant - derniereSecousse < PAUSE_APRES_MS) return;
        pics = pics.filter((t) => maintenant - t < FENETRE_MS);
        if (pics.length && maintenant - pics.at(-1) < ECART_PICS_MS) return;
        pics.push(maintenant);
        if (pics.length >= NB_PICS) {
            pics = [];
            derniereSecousse = maintenant;
            surSecousse();
        }
    }

    // Doit être appelée depuis un clic : iOS n'accorde la permission que sur un geste de l'utilisateur
    async function activer() {
        if (actif) return true;
        if (typeof DeviceMotionEvent?.requestPermission === 'function') {
            try {
                if (await DeviceMotionEvent.requestPermission() !== 'granted') return false;
            } catch {
                return false;
            }
        }
        window.addEventListener('devicemotion', surMouvement);
        actif = true;
        return true;
    }

    return { activer };
}
