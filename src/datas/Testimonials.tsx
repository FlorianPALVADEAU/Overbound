import { UUID } from '@/types/base.type'
import { v4 as randomUUID } from 'uuid'

export enum TestimonialTypeEnum {
  VIDEO = 'video',
  COMMENT = 'comment'
}

export type TestimonialType = {
  id: UUID
  name: string
  age: number
  rating: number
  comment?: string
  mediaUrl: string
  location: string
  type: TestimonialTypeEnum
}

export const testimonials: TestimonialType[] = [
  {
    id: randomUUID(),
    name: "Thomas",
    age: 22,
    rating: 5,
    comment: "Une réelle ambiance d'entre-aide et de compétition, c'était très sympa... à refaire !",
    mediaUrl: "/videos/feedbacks/feedback-thomas.webm",
    location: "Neauphle-Le-Château",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Marie et Ines",
    age: 22,
    rating: 5,
    comment: "Épuisant, mais super sympa !",
    mediaUrl: "/videos/feedbacks/feedback-marie-et-ines.webm",
    location: "Neauphle-Le-Vieux",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Romain",
    age: 20,
    rating: 5,
    comment: "C'est une grande première pour moi, c'est super divesifié, on va au rythme qu'on veut et on s'ennuie jamais sur le parcours.",
    mediaUrl: "/videos/feedbacks/feedback-romain.webm",
    location: "Jouars",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Hugues",
    age: 51,
    rating: 5,
    comment: "J'ai tout donné ! Je suis super content de l'avoir fait.",
    mediaUrl: "/videos/feedbacks/feedback-hugues.webm",
    location: "Beynes",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Sabrina",
    age: 48,
    rating: 5,
    comment: "Je recommande à n'importe qui de venir sans problème, tout âge, n'importe quelle condition physique à condition d'avoir la guache et de le prendre avec le sourire et la bonne humeur.",
    mediaUrl: "/videos/feedbacks/feedback-sabrina.webm",
    location: "Élancourt",
    type: TestimonialTypeEnum.VIDEO
  },
]
