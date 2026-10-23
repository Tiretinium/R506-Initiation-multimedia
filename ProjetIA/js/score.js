// Calcul des distances et des points (voir section 6 du cahier des charges)

const RAYON_TERRE_KM = 6371;
export const DUREE_MANCHE_S = 30;
const POINTS_POSITION_MAX = 500;
const POINTS_TEMPS_MAX = 500;
// Plus elle est grande, moins on perd de points avec la distance
const ECHELLE_DISTANCE_KM = 1500;

const versRadians = (deg) => deg * Math.PI / 180;

// Distance en km entre deux points GPS (formule de Haversine)
export function distanceKm(lat1, lng1, lat2, lng2) {
    const dLat = versRadians(lat2 - lat1);
    const dLng = versRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(versRadians(lat1)) * Math.cos(versRadians(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * RAYON_TERRE_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Points d'une manche, sur 1000 : position (500) + rapidité (500).
// choix = pays cliqué (ou null si temps écoulé), cible = pays à trouver.
// Les points de rapidité sont multipliés par la précision : cliquer vite au hasard ne rapporte presque rien.
export function pointsManche(choix, cible, secondesRestantes) {
    if (!choix) return { position: 0, temps: 0, total: 0 };
    const d = choix.code === cible.code ? 0 : distanceKm(choix.lat, choix.lng, cible.lat, cible.lng);
    const precision = Math.exp(-d / ECHELLE_DISTANCE_KM);
    const position = Math.round(POINTS_POSITION_MAX * precision);
    const temps = Math.round(POINTS_TEMPS_MAX * (secondesRestantes / DUREE_MANCHE_S) * precision);
    return { position, temps, total: position + temps };
}
