'use client'
import React, { useState } from 'react'
import { Star, Play, Pause } from 'lucide-react'
import Headings from '../globals/Headings'
import { BrandBanner } from './HeroHeader'
import SubHeadings from '../globals/SubHeadings'
import { Button } from '../ui/button'
import { UUID } from '@/types/base.type'
import { v4 as randomUUID } from 'uuid'

enum TestimonialTypeEnum {
  VIDEO = 'video',
  COMMENT = 'comment'
}

type TestimonialType = {
  id: UUID
  name: string
  age: number
  rating: number
  comment: string
  mediaUrl: string
  location: string
  type: TestimonialTypeEnum
}

const testimonials: TestimonialType[] = [
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

const SocialProof = () => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(21) // Nombre initial d'éléments à afficher
  const [isLoading, setIsLoading] = useState(false)

  const toggleVideo = (id: string) => {
    setPlayingVideo(playingVideo === id ? null : id)
  }

  const loadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 15, testimonials.length))
      setIsLoading(false)
    }, 500)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  // Fonction pour rendre un témoignage vidéo
  const renderVideoTestimonial = (testimonial: TestimonialType) => (
    <div
      key={testimonial.id}
      className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-gray-900"
    >
      {/* Video */}
      <div 
        className="relative w-full aspect-[9/16] sm:aspect-[3/4] lg:aspect-[2/3] overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={() => toggleVideo(testimonial.id.toString())}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={testimonial.mediaUrl}
          loop
          muted
          playsInline
          ref={(video) => {
            if (video) {
              if (playingVideo === testimonial.id.toString()) {
                video.play()
              } else {
                video.pause()
              }
            }
          }}
        />
        <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-all duration-300"></div>

        <Button
          onClick={() => toggleVideo(testimonial.id.toString())}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
        >
          {playingVideo === testimonial.id.toString() ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Details */}
      <div className="absolute left-[6%] bottom-6 w-7/8 h-min-2/5 bg-white/95 rounded-lg p-4 sm:p-5">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2 sm:mb-3">
          {renderStars(testimonial.rating)}
          <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
            {testimonial.rating}/5
          </span>
        </div>

        {/* Comment */}
        <p className="text-gray-800 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-4">
          "{testimonial.comment}"
        </p>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
              {testimonial.name}
            </h4>
            <p className="text-gray-500 text-xs">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
            ✓ Vérifié
          </div>
        </div>
      </div>
    </div>
  )

  // Fonction pour rendre un témoignage commentaire
  const renderCommentTestimonial = (testimonial: TestimonialType) => (
    <div
      key={testimonial.id}
      className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-white border border-gray-100"
    >
      <div className="p-4 sm:p-6">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3 sm:mb-4">
          {renderStars(testimonial.rating)}
          <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
            {testimonial.rating}/5
          </span>
        </div>

        {/* Comment */}
        <blockquote className="text-gray-800 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 italic">
          "{testimonial.comment}"
        </blockquote>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {testimonial.name}
            </h4>
            <p className="text-gray-500 text-xs sm:text-sm">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
            ✓ Vérifié
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="w-full items-center justify-center gap-12 py-16 pt-24 px-4 sm:px-6 lg:px-8 xl:px-32 bg-gradient-to-b from-gray-50 to-white">
      <Headings
        title="Ils ont relevé le défi"
        description="Découvrez les témoignages de nos participants qui ont vécu l'expérience Overbound"
      />

      <div className="w-full h-full flex flex-col justify-center items-center gap-16 lg:gap-32 my-8 lg:my-12">
        {/* Testimonials Masonry Grid */}
        <div className="w-full">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
            {testimonials.slice(0, visibleCount).map((testimonial: TestimonialType) => (
              testimonial.type === TestimonialTypeEnum.VIDEO 
                ? renderVideoTestimonial(testimonial)
                : renderCommentTestimonial(testimonial)
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < testimonials.length && (
            <div className="flex justify-center mt-8 sm:mt-12">
              <Button
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Chargement...
                  </div>
                ) : (
                  `Voir plus de témoignages (${testimonials.length - visibleCount} restants)`
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Brand Banner Section */}
        <div className="w-full flex flex-col gap-2">
          <SubHeadings title="Ils nous font confiance" />
          <BrandBanner />
        </div>

        {/* Stats Section */}
        <div className="w-full flex flex-col items-start justify-start gap-4">
          <SubHeadings title="Overbound, en chiffres" />
          <div className="w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center ">
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-2">1</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Tribu en or</div>
            </div>
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 mb-2">4.8/5</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Note moyenne</div>
            </div>
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Recommandent l'expérience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialProof