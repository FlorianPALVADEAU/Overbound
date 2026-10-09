import {
  OPEN_FORMAT_RULES,
  RANKED_FORMAT_RULES,
  RANKED_LAP_TIME_LIMITS,
  SHARED_FORMAT_RULES,
} from '@/constants/raceFormatRules'

export type FormatKey = 'open' | 'ranked'

export interface CompareRow {
  label: string
  open: string
  ranked: string
}

export const COMPARE_ROWS: CompareRow[] = [
  {
    label: 'Départ',
    open: `SAS toutes les ${OPEN_FORMAT_RULES.sasIntervalMinutes} min, de ${OPEN_FORMAT_RULES.firstSasDeparture} à ${OPEN_FORMAT_RULES.lastSasDeparture}. Tu choisis ton SAS à l'inscription.`,
    ranked: `Départ unique à ${RANKED_FORMAT_RULES.departure}, pour tout le monde.`,
  },
  {
    label: 'Durée',
    open: `Jusqu'à ${OPEN_FORMAT_RULES.windowHours} h pour courir à ton rythme. Le parcours ferme à ${OPEN_FORMAT_RULES.courseClosing} : plus ton SAS est tardif, moins tu as de temps.`,
    ranked: 'Jusqu\'à ce qu\'il ne reste plus personne, ou la finale de 11h30.',
  },
  {
    label: 'Nombre de tours',
    open: `Autant que tu veux. Dernier départ de tour à ${OPEN_FORMAT_RULES.lastLapStart}.`,
    ranked: 'Autant que tu peux en tenir.',
  },
  {
    label: 'Pauses',
    open: 'Libres : tu décides quand t\'arrêter et quand repartir.',
    ranked: 'Ton repos, c\'est le temps qu\'il te reste avant le prochain départ.',
  },
  {
    label: 'Obstacle raté',
    open: 'Aucune pénalité.',
    ranked: `${RANKED_FORMAT_RULES.failedObstacleBurpees} burpees par obstacle échoué.`,
  },
  {
    label: 'Élimination',
    open: 'Non.',
    ranked: 'Oui : un tour hors temps et tu es éliminé.',
  },
  {
    label: 'Chrono et résultats',
    open: 'Chrono individuel, classement individuel, par équipe et inter-équipes.',
    ranked: `Podium : ${RANKED_FORMAT_RULES.podiumPerGender} premiers hommes et ${RANKED_FORMAT_RULES.podiumPerGender} premières femmes.`,
  },
  {
    label: 'L\'esprit',
    open: 'Découvrir, passer un bon moment en groupe ou repousser tes limites sans pression.',
    ranked: 'Duel mental et physique. Le dernier debout gagne.',
  },
]

export interface JourneyStep {
  time: string
  title: string
  text: string
}

export const OPEN_JOURNEY: JourneyStep[] = [
  {
    time: 'À l\'inscription',
    title: 'Tu choisis ton SAS',
    text: `Un départ entre ${OPEN_FORMAT_RULES.firstSasDeparture} et ${OPEN_FORMAT_RULES.lastSasDeparture}. En groupe, inscrivez-vous ensemble pour partir ensemble.`,
  },
  {
    time: 'Ton départ',
    title: 'Tu lances ton premier tour',
    text: `Une boucle de ${SHARED_FORMAT_RULES.loopKm} km et plus de 10 obstacles. Aucune pénalité si tu rates un obstacle.`,
  },
  {
    time: `Jusqu'à ${OPEN_FORMAT_RULES.windowHours} h`,
    title: 'Tu gères tout',
    text: 'Rythme, pauses, nombre de tours. Tu t\'arrêtes quand tu veux, tu repars quand tu veux.',
  },
  {
    time: OPEN_FORMAT_RULES.lastLapStart,
    title: 'Dernier départ de tour',
    text: `Le parcours ferme à ${OPEN_FORMAT_RULES.courseClosing}, quel que soit ton SAS. À ${OPEN_FORMAT_RULES.courseClosing}, tout le monde est rentré.`,
  },
]

export const RANKED_JOURNEY: JourneyStep[] = [
  {
    time: RANKED_FORMAT_RULES.departure,
    title: 'Départ unique',
    text: `Tout le monde part en même temps sur la boucle de ${SHARED_FORMAT_RULES.loopKm} km.`,
  },
  {
    time: 'Chaque tour',
    title: 'Le temps diminue',
    text: `${RANKED_LAP_TIME_LIMITS.firstLapMinutes} min pour le 1er tour, ${RANKED_LAP_TIME_LIMITS.midLapsMinutes} min pour les tours 2 à ${RANKED_LAP_TIME_LIMITS.lateLapStartsAt - 1}, ${RANKED_LAP_TIME_LIMITS.lateLapMinutes} min ensuite. Le repos, c'est le temps restant.`,
  },
  {
    time: 'Sur le parcours',
    title: 'Les obstacles comptent',
    text: `Obstacle échoué : ${RANKED_FORMAT_RULES.failedObstacleBurpees} burpees. Certains obstacles sont obligatoires.`,
  },
  {
    time: RANKED_FORMAT_RULES.finalLapCutoff,
    title: 'Finale si besoin',
    text: `S'il reste plus de ${RANKED_FORMAT_RULES.podiumPerGender} hommes ou ${RANKED_FORMAT_RULES.podiumPerGender} femmes, un tour final les départage à l'ordre d'arrivée.`,
  },
]

export const PRACTICAL_INFOS = [
  { title: 'Même parcours', text: `Une boucle de ${SHARED_FORMAT_RULES.loopKm} km, plus de 10 obstacles, identique en OPEN et en RANKED.` },
  { title: 'Obstacles adaptés', text: 'Les obstacles de port et de soulèvement sont adaptés aux femmes comme aux hommes.' },
  { title: 'Âge minimum', text: `${SHARED_FORMAT_RULES.minAge} ans révolus.` },
  { title: 'Matériel', text: 'Aucun matériel obligatoire.' },
  { title: 'Ravitaillement', text: 'Un ravitaillement est prévu pour les deux formats, sur le site.' },
]

export interface PickerQuestion {
  id: string
  question: string
  open: string
  ranked: string
}

export const PICKER_QUESTIONS: PickerQuestion[] = [
  {
    id: 'goal',
    question: 'Ton objectif ?',
    open: 'Me faire plaisir et progresser',
    ranked: 'Me mesurer aux autres',
  },
  {
    id: 'pressure',
    question: 'Face au chrono ?',
    open: 'Je préfère gérer mon rythme',
    ranked: 'La pression me motive',
  },
  {
    id: 'penalty',
    question: 'Un obstacle raté ?',
    open: 'J\'aimerais pouvoir réessayer sans sanction',
    ranked: 'Je suis prêt à faire des burpees',
  },
]

export const pickFormat = (answers: Partial<Record<string, FormatKey>>): FormatKey | null => {
  const values = Object.values(answers)
  if (values.length < PICKER_QUESTIONS.length) return null
  const ranked = values.filter((v) => v === 'ranked').length
  return ranked > values.length / 2 ? 'ranked' : 'open'
}

export const FORMAT_FAQS = [
  {
    id: 'difference',
    question: 'Quelle est la vraie différence entre OPEN et RANKED ?',
    answer: `Le parcours est identique. En OPEN tu as jusqu'à ${OPEN_FORMAT_RULES.windowHours} h (parcours fermé à ${OPEN_FORMAT_RULES.courseClosing}) pour faire autant de tours que tu veux, sans pénalité. En RANKED, tout le monde part à ${RANKED_FORMAT_RULES.departure}, le temps par tour diminue et un tour hors temps t'élimine.`,
  },
  {
    id: 'beginner',
    question: 'Je débute, quel format choisir ?',
    answer: 'OPEN. Aucune pénalité, aucune élimination, et tu choisis ton rythme.',
  },
  {
    id: 'open-laps',
    question: 'Combien de tours puis-je faire en OPEN ?',
    answer: `Autant que tu veux. Tu gères ton rythme, tes pauses et le moment où tu t'arrêtes. Le dernier départ de tour est à ${OPEN_FORMAT_RULES.lastLapStart} et le parcours ferme à ${OPEN_FORMAT_RULES.courseClosing}.`,
  },
  {
    id: 'open-sas',
    question: 'Comment fonctionne le choix du SAS en OPEN ?',
    answer: `Tu choisis ton SAS à l'inscription, entre ${OPEN_FORMAT_RULES.firstSasDeparture} et ${OPEN_FORMAT_RULES.lastSasDeparture} (un SAS toutes les ${OPEN_FORMAT_RULES.sasIntervalMinutes} min). Tu as jusqu'à ${OPEN_FORMAT_RULES.windowHours} h pour courir, mais le parcours ferme à ${OPEN_FORMAT_RULES.courseClosing} pour tout le monde : plus ton SAS est tardif, moins tu as de temps.`,
  },
  {
    id: 'ranked-backyard',
    question: 'Comment fonctionne le RANKED ?',
    answer: `C'est un backyard : départ unique à ${RANKED_FORMAT_RULES.departure}, puis un nouveau tour part à intervalles réguliers. Tu as ${RANKED_LAP_TIME_LIMITS.firstLapMinutes} min pour le 1er tour, ${RANKED_LAP_TIME_LIMITS.midLapsMinutes} min pour les tours 2 à ${RANKED_LAP_TIME_LIMITS.lateLapStartsAt - 1}, ${RANKED_LAP_TIME_LIMITS.lateLapMinutes} min ensuite. Ton repos, c'est le temps qu'il te reste avant le prochain départ. Un tour hors temps t'élimine.`,
  },
  {
    id: 'penalty',
    question: 'Que se passe-t-il si je rate un obstacle ?',
    answer: `En OPEN, rien. En RANKED, ${RANKED_FORMAT_RULES.failedObstacleBurpees} burpees par obstacle échoué. Certains obstacles sont obligatoires.`,
  },
  {
    id: 'ranked-podium',
    question: 'Comment est établi le podium en RANKED ?',
    answer: `Le podium réunit les ${RANKED_FORMAT_RULES.podiumPerGender} derniers hommes et les ${RANKED_FORMAT_RULES.podiumPerGender} dernières femmes en course, toutes catégories confondues. Si, à ${RANKED_FORMAT_RULES.finalLapCutoff}, il en reste davantage, un tour final les départage selon l'ordre d'arrivée.`,
  },
  {
    id: 'ranking',
    question: 'Y a-t-il un classement ?',
    answer: 'Oui. Le chrono est individuel, avec un classement individuel, par équipe et inter-équipes.',
  },
  {
    id: 'group',
    question: 'Puis-je partir avec des amis ou des collègues ?',
    answer: 'Oui. Inscrivez-vous dans la même commande pour partir dans le même SAS en OPEN. Le RANKED a un départ unique pour tout le monde.',
  },
  {
    id: 'women',
    question: 'Les obstacles sont-ils adaptés aux femmes ?',
    answer: 'Oui. Les obstacles de port et de soulèvement sont adaptés aux femmes comme aux hommes.',
  },
  {
    id: 'age',
    question: 'Y a-t-il un âge minimum ?',
    answer: `Oui, ${SHARED_FORMAT_RULES.minAge} ans révolus pour les deux formats.`,
  },
  {
    id: 'gear',
    question: 'Faut-il du matériel particulier ?',
    answer: 'Non, aucun matériel obligatoire. Un ravitaillement est prévu sur le site pour les deux formats.',
  },
]
