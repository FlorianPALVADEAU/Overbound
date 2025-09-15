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
  comment: string
  mediaUrl: string
  location: string
  type: TestimonialTypeEnum
}

export const testimonials: TestimonialType[] = [
  {
    id: randomUUID(),
    name: "Quentin Lambert",
    age: 30,
    rating: 5,
    comment: "L'Overbound a dépassé toutes mes attentes ! Une journée inoubliable remplie d'émotions fortes.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Metz",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Marie Dubois",
    age: 28,
    rating: 5,
    comment: "L'Overbound a complètement changé ma vie ! J'ai découvert des limites que je ne pensais pas pouvoir dépasser.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Paris",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Quentin Lambert",
    age: 30,
    rating: 5,
    comment: "L'Overbound a dépassé toutes mes attentes ! Une journée inoubliable remplie d'émotions fortes.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Metz",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },  
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },  
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },  
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Hugo Bertrand",
    age: 28,
    rating: 5,
    comment: "L'Overbound, c'est l'aventure ultime ! Parfait pour tester ses limites en s'amusant.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Grenoble",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Thomas Martin",
    age: 34,
    rating: 5,
    comment: "Une expérience incroyable ! L'équipe est fantastique et les obstacles sont vraiment bien pensés. Chaque défi était unique et parfaitement adapté à notre niveau.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    location: "Lyon",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Sophie Laurent",
    age: 25,
    rating: 4,
    comment: "Défi relevé ! C'était intense mais tellement gratifiant. Je recommande à 100%.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    location: "Marseille",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
    {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Hugo Bertrand",
    age: 28,
    rating: 5,
    comment: "L'Overbound, c'est l'aventure ultime ! Parfait pour tester ses limites en s'amusant.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Grenoble",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Valentin Fournier",
    age: 27,
    rating: 5,
    comment: "Sensationnel ! Une expérience qui marque et qui donne envie de se dépasser encore plus.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Angers",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Kevin Rousseau", 
    age: 31,
    rating: 5,
    comment: "L'adrénaline pure ! J'ai adoré chaque seconde et j'ai hâte de revenir pour la prochaine édition. Une aventure inoubliable qui m'a poussé à me dépasser.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    location: "Toulouse",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Hugo Bertrand",
    age: 28,
    rating: 5,
    comment: "L'Overbound, c'est l'aventure ultime ! Parfait pour tester ses limites en s'amusant.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Grenoble",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Amélie Bernard",
    age: 29,
    rating: 5,
    comment: "Fantastique ! Une organisation parfaite et des défis qui nous font vraiment sortir de notre zone de confort.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    location: "Nice",
    type: TestimonialTypeEnum.VIDEO
  },
    {
    id: randomUUID(),
    name: "Hugo Bertrand",
    age: 28,
    rating: 5,
    comment: "L'Overbound, c'est l'aventure ultime ! Parfait pour tester ses limites en s'amusant.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Grenoble",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Lucas Moreau",
    age: 26,
    rating: 5,
    comment: "Wow ! Une expérience qui dépasse toutes mes attentes. L'équipe d'encadrement est top !",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Bordeaux",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Emma Leroy", 
    age: 32,
    rating: 4,
    comment: "Très belle découverte ! J'ai pu me dépasser et vivre des moments intenses avec d'autres passionnés.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    location: "Lille",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Alexandre Petit",
    age: 27,
    rating: 5,
    comment: "Incroyable ! Chaque obstacle était un nouveau défi. L'ambiance était fantastique du début à la fin.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    location: "Nantes",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Camille Roux",
    age: 30,
    rating: 5,
    comment: "L'Overbound m'a permis de sortir totalement de ma zone de confort. Une aventure inoubliable !",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    location: "Strasbourg",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Julien Fabre",
    age: 35,
    rating: 5,
    comment: "Parfait pour les amateurs de sensations fortes ! L'organisation était impeccable.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Montpellier",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Léa Girard",
    age: 24,
    rating: 4,
    comment: "Super expérience ! Même si j'étais débutante, j'ai réussi à relever tous les défis.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    location: "Rennes",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Maxime Blanc",
    age: 29,
    rating: 5,
    comment: "Une journée mémorable ! L'adrénaline, les défis, l'équipe... tout était parfait. Je reviens l'année prochaine !",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    location: "Marseille",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Sarah Dubois",
    age: 25,
    rating: 5,
    comment: "Incroyable aventure ! Chaque moment était intense et parfaitement orchestré. Bravo à toute l'équipe !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Tours",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Chloé Simon",
    age: 26,
    rating: 5,
    comment: "Fantastique ! J'ai découvert des capacités que je ne soupçonnais pas avoir.",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Toulouse",
    type: TestimonialTypeEnum.VIDEO
  },

  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "hhttps://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Nancy",
    type: TestimonialTypeEnum.COMMENT
  },

  {
    id: randomUUID(),
    name: "Sarah Dubois",
    age: 25,
    rating: 5,
    comment: "Incroyable aventure ! Chaque moment était intense et parfaitement orchestré. Bravo à toute l'équipe !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Tours",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Quentin Lambert",
    age: 30,
    rating: 5,
    comment: "L'Overbound a dépassé toutes mes attentes ! Une journée inoubliable remplie d'émotions fortes.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Metz",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Clara Morel",
    age: 31,
    rating: 4,
    comment: "Très bien organisé ! Les défis étaient variés et l'encadrement parfait.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Dijon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Valentin Fournier",
    age: 27,
    rating: 5,
    comment: "Sensationnel ! Une expérience qui marque et qui donne envie de se dépasser encore plus.",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Angers",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Manon Robert",
    age: 22,
    rating: 5,
    comment: "Expérience unique ! J'ai ri, j'ai eu peur, j'ai triomphé. Que demander de plus ?",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    location: "Nancy",
    type: TestimonialTypeEnum.VIDEO
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
  {
    id: randomUUID(),
    name: "Antoine Durand",
    age: 33,
    rating: 4,
    comment: "Très bonne organisation et des obstacles vraiment créatifs. Une belle aventure !",
    mediaUrl: "https://imgs.search.brave.com/dZdpbogNh8mudIRhimLEsXDq6Z1k_9dZV_i_20CkhzM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvNS9Vc2Vy/LVByb2ZpbGUtUE5H/LnBuZw",
    location: "Lyon",
    type: TestimonialTypeEnum.COMMENT
  },
]
