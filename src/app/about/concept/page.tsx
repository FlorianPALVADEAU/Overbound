'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Headings from '@/components/globals/Headings'
import SubHeadings from '@/components/globals/SubHeadings'
import {
  Mountain,
  Sparkles,
  Trophy,
  Users,
  Zap,
  Target,
  Globe,
  Crown,
  Award,
  Flame,
  ArrowRight
} from 'lucide-react'

export default function ConceptPage() {
  return (
    <main className="w-full bg-background">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-neutral-200">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop"
            alt="Overbound Concept"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:py-28 lg:py-32">
          <Badge className="bg-primary/20 text-primary border-primary/40 text-sm font-semibold uppercase tracking-wider px-4 py-2">
            Le Concept Overbound
          </Badge>

          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl max-w-4xl">
            Réinventer l'OCR avec des{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                innovations mondiales
              </span>
              <div className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
            </span>
          </h1>

          <p className="max-w-3xl text-lg text-white/90 sm:text-xl leading-relaxed">
            Overbound ne se contente pas de suivre les codes de l'obstacle course racing.
            Nous les réinventons avec deux concepts inédits qui changent la donne.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-xl shadow-primary/30"
            >
              <Link href="/events">
                Voir les événements
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-black px-8 py-6 text-lg font-semibold rounded-full"
            >
              <Link href="/about/faq">
                En savoir plus
              </Link>
            </Button>
          </div>
        </div>

        <Image
          src="/images/mountain-vector.svg"
          alt="Background"
          className="object-cover object-center absolute w-full -bottom-3 sm:-bottom-4 md:-bottom-5 pointer-events-none opacity-30"
          height={600}
          width={600}
          priority
        />
      </section>

      {/* Innovations Section - Highlighted */}
      <section className="relative w-full bg-gradient-to-b from-background via-primary/5 to-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/40 text-sm font-bold uppercase tracking-wider px-4 py-2 mb-6">
              <Globe className="h-4 w-4 mr-2 inline" />
              Premières mondiales
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Deux innovations qui changent tout
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Overbound introduit des concepts inédits dans l'univers de l'obstacle course racing,
              offrant une liberté et un challenge jamais vus auparavant.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Innovation 1 - Difficulty Selection */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-2xl hover:shadow-primary/20 transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <CardHeader className="relative z-10 space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <Badge className="bg-amber-500 text-white font-bold">
                    PREMIÈRE MONDIALE
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold">
                  Système de difficulté modulaire
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">Du jamais vu dans l'OCR :</span> Overbound est
                  la <span className="text-primary font-bold">première organisation au monde</span> à proposer
                  un système de difficulté personnalisable sur un même parcours.
                </p>

                <div className="space-y-3 bg-background/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">1-3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Standard</p>
                      <p className="text-xs text-muted-foreground">Obstacles classiques, accessibles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-600 font-bold text-sm">4-6</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Guerrier</p>
                      <p className="text-xs text-muted-foreground">Obstacles exigeants, technique requise</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <span className="text-rose-600 font-bold text-sm">7-10</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Légende</p>
                      <p className="text-xs text-muted-foreground">Obstacles extrêmes + lests obligatoires</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Tu choisis ton niveau de défi, on s'adapte à toi
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Plus besoin de choisir entre plusieurs courses. Un seul parcours, plusieurs niveaux de difficulté.
                  </p>
                </div>

                <Button asChild className="w-full rounded-full" size="lg">
                  <Link href="/obstacles">
                    Découvrir les obstacles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Innovation 2 - Tribal Royale */}
            <Card className="relative overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 shadow-2xl hover:shadow-amber-500/20 transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
              <CardHeader className="relative z-10 space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-amber-500/10 p-4">
                    <Crown className="h-8 w-8 text-amber-600" />
                  </div>
                  <Badge className="bg-rose-500 text-white font-bold">
                    DU JAMAIS VU
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold">
                  Tribal Royale
                  <span className="block text-lg font-normal text-muted-foreground mt-1">
                    Le premier Backyard OCR <span className="font-semibold italic">au monde</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">Une révolution dans l'endurance :</span> Inspiré
                  du légendaire <a href="https://www.mattmahoney.net/barkley/" target='_blank' className='underline'>Barkley Marathons</a>, la Tribal Royale est le{' '}
                  <span className="text-amber-600 font-bold">tout premier format backyard appliqué à l'OCR</span>.
                </p>

                <div className="space-y-4">
                  <div className="bg-background/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                        <Flame className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Format élimination progressive</p>
                        <p className="text-sm text-muted-foreground">
                          Chaque tour dure 1h. Si tu ne reviens pas à temps, tu es éliminé.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                        <Trophy className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Le dernier debout gagne</p>
                        <p className="text-sm text-muted-foreground">
                          4 km de base avec 15+ obstacles extrêmes, répétés jusqu'à ce qu'il ne reste qu'un seul concurrent.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                        <Mountain className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Mental et physique extrême</p>
                        <p className="text-sm text-muted-foreground">
                          Conçu pour tester les limites absolues : grip, portés lourds, obstacles techniques.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border-l-4 border-amber-600 rounded-r-lg p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Le format signature Overbound
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Réservé aux athlètes d'élite cherchant à repousser leurs limites absolues.
                  </p>
                </div>

                <Button asChild className="w-full rounded-full bg-amber-600 hover:bg-amber-700" size="lg">
                  <Link href="/races/tribale-royale">
                    S'inscrire à la Tribal Royale
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="w-full bg-neutral-900 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Pourquoi Overbound existe
            </h2>
            <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
              Plus qu'une course d'obstacles, c'est un rite de passage moderne
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">La force du collectif</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Dans un monde individualiste, Overbound recréer l'expérience de la tribu :
                entraide, dépassement partagé, fierté collective.
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Mountain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">Le retour à l'essentiel</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Fini le confort aseptisé. Overbound te reconnecte avec la nature brute,
                la difficulté réelle, l'authenticité du challenge.
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">La fierté de l'accomplissement</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Chaque ligne d'arrivée franchie est une victoire sur soi-même.
                Tu repars transformé, plus fort, plus confiant.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Formats Overview */}
      <section className="w-full bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <Headings
            title="Quatre formats, un seul objectif"
            description="Quel que soit ton niveau, il existe un format Overbound fait pour toi"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
            <Card className="group hover:-translate-y-1 transition-all border-border/60">
              <CardHeader className="space-y-3">
                <Badge className="bg-green-500/20 text-green-600 w-fit">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Sprint
                </Badge>
                <CardTitle className="text-2xl">Le Rite du Guerrier</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">6 km · 20 obstacles</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Format explosif pour découvrir l'OCR ou revenir après une pause.
                  Intensité maximale, défi accessible.
                </p>
                <Button asChild variant="outline" className="w-full rounded-full" size="sm">
                  <Link href="/events">
                    Découvrir
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-1 transition-all border-border/60">
              <CardHeader className="space-y-3">
                <Badge className="bg-blue-500/20 text-blue-600 w-fit">
                  <Mountain className="h-4 w-4 mr-1" />
                  Intermédiaire
                </Badge>
                <CardTitle className="text-2xl">La Voie du Héros</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">12 km · 35 obstacles</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Le format de progression. Endurance + technique.
                  Pour ceux qui veulent monter en niveau.
                </p>
                <Button asChild variant="outline" className="w-full rounded-full" size="sm">
                  <Link href="/events">
                    Découvrir
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-1 transition-all border-amber-500/40 bg-gradient-to-br from-background to-amber-500/5">
              <CardHeader className="space-y-3">
                <Badge className="bg-amber-500 text-white w-fit">
                  <Crown className="h-4 w-4 mr-1" />
                  Élite
                </Badge>
                <CardTitle className="text-2xl">Tribal Royale</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">∞ km · ∞ obstacles</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  <span className="text-amber-600 font-semibold">Format backyard inédit.</span> Élimination
                  progressive. Le dernier debout gagne.
                </p>
                <Button asChild className="w-full rounded-full bg-amber-600 hover:bg-amber-700" size="sm">
                  <Link href="/events">
                    En savoir plus
                    <Crown className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-1 transition-all border-border/60">
              <CardHeader className="space-y-3">
                <Badge className="bg-purple-500/20 text-purple-600 w-fit">
                  <Users className="h-4 w-4 mr-1" />
                  Famille
                </Badge>
                <CardTitle className="text-2xl">Tribal Kids</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">1 / 2 / 3 km</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Pour les 6-14 ans. Obstacles ludiques et sécurisés.
                  Initiation à l'esprit Overbound.
                </p>
                <Button asChild variant="outline" className="w-full rounded-full" size="sm">
                  <Link href="/events">
                    Découvrir
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full bg-gradient-to-br from-primary via-primary to-emerald-600 py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Prêt à rejoindre la révolution OCR ?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Ne manque pas les prochaines courses Overbound. Inscris-toi maintenant et
            fais partie de l'histoire de l'obstacle course racing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-full shadow-2xl"
            >
              <Link href="/events">
                Voir les événements
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-primary px-8 py-6 text-lg font-semibold rounded-full"
            >
              <Link href="/about/faq">
                Questions fréquentes
              </Link>
            </Button>
          </div>
        </div>

        <Image
          src="/images/mountain-vector.svg"
          alt="Background"
          className="object-cover object-center absolute w-full -bottom-3 pointer-events-none opacity-20"
          height={600}
          width={600}
        />
      </section>
    </main>
  )
}
