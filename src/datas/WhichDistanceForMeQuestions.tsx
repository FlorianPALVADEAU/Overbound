
export interface QuestionOption {
  label: string
  next: string
}

export interface Question {
  id: string
  question: string
  options: QuestionOption[]
}

export interface Result {
  name: string
  description: string
  icon: string
}

export interface QuestionnaireData {
  questions: Question[]
  results: Record<string, Result>
}

export interface SubHeadingsProps {
  title: string
  description: string
}

export interface FinalResult {
  format: Result
  difficulty: Result
}

export type QuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'd1' | 'd2' | 'd3'
export type ResultId = 'format_initiation' | 'format_folie' | 'format_royale' | 'difficulty_standard' | 'difficulty_guerrier' | 'difficulty_legende'

export const questionsData: QuestionnaireData = {
    "questions": [
        {
            "id": "q1",
            "question": "As-tu déjà participé à une course ou un événement sportif d'endurance ?",
            "options": [
                { "label": "Jamais", "next": "q2" },
                { "label": "Oui, une ou deux fois", "next": "q2" },
                { "label": "Oui, régulièrement", "next": "q3" },
                { "label": "Je suis habitué aux longues distances", "next": "q4" }
            ]
        },
        {
            "id": "q2",
            "question": "Combien de temps aimerais-tu que ton effort dure ?",
            "options": [
                { "label": "Moins d'1h30", "next": "format_initiation" },
                { "label": "1h30 à 3h", "next": "q3" },
                { "label": "Je suis prêt à aller plus loin", "next": "q4" }
            ]
        },
        {
            "id": "q3",
            "question": "Quel type de défi recherches-tu ?",
            "options": [
                { "label": "Accessible, fun et motivant", "next": "format_initiation" },
                { "label": "Un vrai challenge physique et mental", "next": "format_folie" },
                { "label": "L'extrême, au-delà de mes limites", "next": "q4" }
            ]
        },
        {
            "id": "q4",
            "question": "Te sens-tu prêt à tenir plusieurs heures, avec une succession d'obstacles parfois très exigeants ?",
            "options": [
                { "label": "Oui, je veux vivre l'aventure ultime", "next": "format_royale" },
                { "label": "Pas encore, je préfère une distance plus raisonnable", "next": "format_folie" }
            ]
        },
        {
            "id": "d1",
            "question": "Quelle est ta motivation principale pour cette course ?",
            "options": [
                { "label": "Découvrir l'expérience et m'amuser", "next": "difficulty_standard" },
                { "label": "Me challenger sérieusement", "next": "d2" },
                { "label": "Prouver que je peux repousser mes limites", "next": "d3" }
            ]
        },
        {
            "id": "d2",
            "question": "Veux-tu que les obstacles soient plus exigeants et parfois obligatoires ?",
            "options": [
                { "label": "Oui, je veux un vrai test", "next": "difficulty_guerrier" },
                { "label": "Non, je préfère rester flexible", "next": "difficulty_standard" }
            ]
        },
        {
            "id": "d3",
            "question": "Es-tu prêt à risquer l'échec si tu ne passes pas certains obstacles ?",
            "options": [
                { "label": "Oui, je veux l'expérience la plus dure possible", "next": "difficulty_legende" },
                { "label": "Pas forcément, mais je veux un vrai challenge", "next": "difficulty_guerrier" }
            ]
        }
    ],
    "results": {
        "format_initiation": {
            "name": "Initiation Tribale",
            "description": "6 km et une vingtaine d'obstacles accessibles. Idéal pour découvrir l'esprit Overbound et s'amuser tout en se testant.",
            "icon": "🌱"
        },
        "format_folie": {
            "name": "La Folie Tribale",
            "description": "12 km intenses avec une belle variété d'obstacles. Un vrai défi physique et mental, parfait pour se dépasser sans aller dans l'extrême.",
            "icon": "🔥"
        },
        "format_royale": {
            "name": "Tribale Royale",
            "description": "75 km et plus de 400 obstacles. Le défi ultime, réservé à ceux qui veulent repousser leurs limites et vivre une aventure hors norme.",
            "icon": "👑"
        },
        "difficulty_standard": {
            "name": "Standard",
            "description": "Une expérience accessible où les obstacles sont franchissables ou adaptables. Parfait pour découvrir la course en toute sérénité.",
            "icon": "⭐"
        },
        "difficulty_guerrier": {
            "name": "Guerrier",
            "description": "Un défi relevé : obstacles plus exigeants, parfois obligatoires, avec une intensité accrue. Pour les compétiteurs motivés.",
            "icon": "⚔️"
        },
        "difficulty_legende": {
            "name": "Légende",
            "description": "L'épreuve ultime : tous les obstacles sont obligatoires, aucun compromis. Réservé à ceux qui veulent prouver leur détermination totale.",
            "icon": "🏆"
        }
    }
};