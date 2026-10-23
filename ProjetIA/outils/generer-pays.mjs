// Génère data/pays.json : les 196 pays (193 membres de l'ONU + Vatican, Palestine, Kosovo)
// Usage, depuis le dossier ProjetIA : node outils/generer-pays.mjs
//
// Sources :
//  - world-countries : codes ISO, noms français, centre du pays
//  - Natural Earth (populated places) : coordonnées des capitales
//  - Wikidata : noms des capitales en français
// Si la capitale est introuvable, le cube est posé au centre du pays (surCapitale: false).
import { writeFile } from 'node:fs/promises';

const URL_PAYS = 'https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json';
const URL_VILLES = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson';
const URL_WIKIDATA = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(
    'SELECT ?iso ?capLabel WHERE { ?pays wdt:P297 ?iso; wdt:P36 ?cap. ?cap rdfs:label ?capLabel. FILTER(LANG(?capLabel)="fr") }');

// Pays hors ONU retenus en plus des membres (le Vatican est déjà marqué membre dans world-countries)
const HORS_ONU = ['PS', 'XK'];

// Noms français plus courts ou plus courants que ceux de world-countries
const NOMS = {
    CD: 'RD Congo', CG: 'Congo', KP: 'Corée du Nord', KR: 'Corée du Sud',
    VA: 'Vatican', MK: 'Macédoine du Nord', CZ: 'Tchéquie', FM: 'Micronésie',
    VN: 'Viêt Nam', GB: 'Royaume-Uni', US: 'États-Unis', PW: 'Palaos', SZ: 'Eswatini',
    MU: 'Maurice', CV: 'Cap-Vert', SA: 'Arabie saoudite',
};

// Pays « connus » de la difficulté Facile (la sélection de la première version, bien espacée sur la carte)
const CONNUS = new Set(('fr es pt gb ie it de pl se no fi gr tr ua ru ro is ch at hu rs nl dk cz ma dz tn ly eg sn ml '
    + 'ci gh ng cm cd ao sd et ke tz za mg sa il iq ir af pk kz in np bd mn cn kr jp th vn ph id us ca mx cu jm '
    + 'co ve ec pe br cl ar au nz pg').split(' '));

// Noms français de capitales absents ou mal choisis dans Wikidata
const CAPITALES_FR = { CY: 'Nicosie', PY: 'Asuncion' };

// Capitale choisie quand il y en a plusieurs (nom anglais, comme dans Natural Earth)
const CAPITALES = { ZA: 'Pretoria', CI: 'Yamoussoukro', BO: 'Sucre', TZ: 'Dodoma', BJ: 'Porto-Novo' };

const normaliser = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const arrondir = (x) => Math.round(x * 100) / 100;

async function telecharger(url, entetes = {}) {
    const reponse = await fetch(url, { headers: { 'User-Agent': 'Drapocube/1.0 (projet etudiant)', ...entetes } });
    if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
    return reponse.json();
}

const [mondial, villes, wikidata] = await Promise.all([
    telecharger(URL_PAYS),
    telecharger(URL_VILLES),
    telecharger(URL_WIKIDATA, { Accept: 'application/sparql-results+json' }),
]);

// Capitales Natural Earth, regroupées par code ISO
const capitalesNE = {};
for (const f of villes.features) {
    const p = f.properties;
    if (!/Admin-0 capital/.test(p.featurecla)) continue;
    (capitalesNE[p.iso_a2] ??= []).push({ nom: p.name, lat: p.latitude, lng: p.longitude, principale: p.featurecla === 'Admin-0 capital' });
}

// Noms français des capitales, regroupés par code ISO
const capitalesFR = {};
for (const b of wikidata.results.bindings) (capitalesFR[b.iso.value] ??= []).push(b.capLabel.value);

const retenus = mondial.filter((c) => c.unMember || HORS_ONU.includes(c.cca2));
const pays = [];
const auCentre = [];

for (const c of retenus) {
    const nomCapitale = CAPITALES[c.cca2] ?? c.capital?.[0] ?? '';
    const candidates = capitalesNE[c.cca2] ?? [];
    const capitale = candidates.find((v) => normaliser(v.nom) === normaliser(nomCapitale))
        ?? candidates.find((v) => v.principale);

    const nomsFR = capitalesFR[c.cca2] ?? [];
    const capitaleFR = CAPITALES_FR[c.cca2] ?? nomsFR.find((n) => normaliser(n) === normaliser(capitale?.nom ?? nomCapitale))
        ?? (nomsFR.length === 1 ? nomsFR[0] : nomCapitale);

    const [latCentre, lngCentre] = c.latlng;
    if (!capitale) auCentre.push(c.cca2);
    pays.push({
        code: c.cca2.toLowerCase(),
        nom: NOMS[c.cca2] ?? c.translations.fra.common,
        capitale: capitaleFR,
        lat: arrondir(capitale ? capitale.lat : latCentre),
        lng: arrondir(capitale ? capitale.lng : lngCentre),
        surCapitale: Boolean(capitale),
        superficie: Math.round(c.area), // en km², sert à écarter les petits pays du tirage en Normal
        connu: CONNUS.has(c.cca2.toLowerCase()),
    });
}

pays.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
await writeFile(new URL('../data/pays.json', import.meta.url), JSON.stringify({ mode: 'monde', pays }, null, 2) + '\n');
console.log(`${pays.length} pays écrits dans data/pays.json`);
console.log(`Cube au centre du pays (capitale introuvable) : ${auCentre.join(', ') || 'aucun'}`);
