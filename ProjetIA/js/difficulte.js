// Niveaux de difficulté : quels cubes sont sur la carte, quels pays peuvent être tirés, durée du chrono
const SUPERFICIE_MIN_NORMAL_KM2 = 10000;

export const DIFFICULTES = {
    facile: {
        nom: 'Facile',
        description: '76 pays connus, seuls leurs cubes sont sur la carte. 40 s par manche.',
        duree: 40,
        surLaCarte: (p) => p.connu,
        tirable: (p) => p.connu,
    },
    normal: {
        nom: 'Normal',
        description: 'Les 196 pays sont sur la carte, mais on ne tire pas les micro-États ni les petites îles. 30 s par manche.',
        duree: 30,
        surLaCarte: () => true,
        tirable: (p) => p.superficie >= SUPERFICIE_MIN_NORMAL_KM2,
    },
    difficile: {
        nom: 'Difficile',
        description: 'Les 196 pays, micro-États compris. 20 s par manche.',
        duree: 20,
        surLaCarte: () => true,
        tirable: () => true,
    },
};

export const DIFFICULTE_PAR_DEFAUT = 'normal';
