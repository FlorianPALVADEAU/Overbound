/**
 * How participants reach the venue and what they find there, as told to participants by email.
 * Confirmed by the organizer on 2026-10-30 as unchanged for the 2027 edition (same site, same
 * parking fee, same bag drop hours). Not confirmed yet: bib pickup place and hours, the bus line to
 * the entrance (only the train station is confirmed), village opening time. Do not add them here before the organizer announces them.
 */
export const VENUE_ACCESS = {
  entrance: 'Entrée par le parking du rond-point Éric Tabarly, à Trappes, derrière l’Île aux enfants.',
  walk: 'Va tout au bout du parking : des panneaux te guident jusqu’à l’accueil.',
  parkingFee: 'Parking payant : 6 € par véhicule. Le covoiturage est recommandé.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.78369,1.99372',
  publicTransport:
    'En transports : descends à la gare de Saint-Quentin-en-Yvelines (RER C, trains N et U), puis finis en bus ou en taxi. Calcule le dernier tronçon avec l’appli Île-de-France Mobilités en cherchant « Île de loisirs de Saint-Quentin-en-Yvelines ».',
  bagDrop: 'Consigne gratuite et surveillée, ouverte de 7h30 à 19h. Récupère ton sac avant la fermeture.',
  noChangingRooms: 'Il y a des toilettes, mais ni vestiaires ni douches : prévois des vêtements de rechange dans ta voiture.',
  arriveBeforeDeparture: '1 h',
} as const
