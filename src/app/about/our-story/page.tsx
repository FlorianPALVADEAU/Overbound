'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, Zap, Users, Globe, Sparkles, Mountain, Heart, Trophy } from 'lucide-react'

const heroImageSrc = 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1400&auto=format&fit=crop'

export default function OurStoryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={heroImageSrc}
            alt='Notre histoire Overbound'
            fill
            sizes='100vw'
            className='object-cover object-center'
            priority
          />
          <div className='pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Notre Histoire
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Réinventer l'obstacle course racing
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              L'histoire d'Overbound, c'est celle d'une volonté de créer quelque chose d'unique dans l'univers de l'OCR :
              une organisation 100% européenne qui place l'athlète au cœur de l'expérience.
            </p>
          </div>
        </div>
        <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
          <Image
            src='/images/mountain-vector.svg'
            alt='Décor montagne'
            width={1600}
            height={800}
            className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
            priority
          />
        </div>
      </section>

      {/* Histoire Section */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center mb-16">
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary border-primary/40">
                <Sparkles className="h-4 w-4 mr-2" />
                Les origines
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Tout commence par une vision
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <span className="text-foreground font-semibold">En 2024, l'OCR en Europe est dominé par des organisations américaines</span> qui
                  exportent leur format sans adaptation au public européen. Les courses sont souvent standardisées, sans personnalisation,
                  et le niveau de difficulté est figé.
                </p>
                <p>
                  <span className="text-primary font-semibold">Overbound naît de cette frustration.</span> Nous voulions créer une organisation
                  qui respecte les codes de l'OCR tout en apportant quelque chose de radicalement nouveau : la liberté de choisir son niveau
                  de difficulté sur un même parcours.
                </p>
                <p>
                  Notre ambition ? Devenir <span className="text-foreground font-semibold">la référence OCR en Europe</span>, avec une identité
                  forte, des innovations mondiales et une communauté soudée autour de valeurs communes.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1400&auto=format&fit=crop"
                alt="Vision Overbound"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-8 mb-16">
            <div className="text-center space-y-4">
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/40">
                <Mountain className="h-4 w-4 mr-2" />
                Notre parcours
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Les étapes clés
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-primary/10 text-primary border-primary/40 mb-4">
                    2024
                  </Badge>
                  <CardTitle className="text-xl">La genèse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Création d'Overbound avec une ambition claire : révolutionner l'OCR en Europe avec le premier système
                    de difficulté modulaire au monde.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/40 mb-4">
                    2025
                  </Badge>
                  <CardTitle className="text-xl">Les premières courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lancement des premiers événements Overbound avec les formats Rite du Guerrier et Voie du Héros.
                    La communauté commence à se former.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/40 mb-4">
                    2025
                  </Badge>
                  <CardTitle className="text-xl">Tribal Royale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Première mondiale : lancement du format Tribal Royale, premier backyard OCR au monde.
                    L'innovation qui marque les esprits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Les innovations */}
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/40">
                <Globe className="h-4 w-4 mr-2" />
                Innovations mondiales
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ce qui nous rend unique
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Overbound ne se contente pas de suivre les tendances : nous créons de nouvelles façons de pratiquer l'OCR.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-2xl bg-primary/10 p-4">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <Badge className="bg-amber-500 text-white font-bold">
                      PREMIÈRE MONDIALE
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    Système de difficulté modulaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Pour la première fois au monde, les participants peuvent choisir leur niveau de difficulté
                    (Standard, Guerrier, Légende) sur un même parcours. Chacun vit sa propre expérience.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/40">
                      Standard
                    </Badge>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                      Guerrier
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/40">
                      Légende
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-2xl bg-amber-500/10 p-4">
                      <Zap className="h-8 w-8 text-amber-600" />
                    </div>
                    <Badge className="bg-amber-500 text-white font-bold">
                      PREMIÈRE MONDIALE
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    Tribal Royale - Backyard OCR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Inspiré du <a href="https://www.mattmahoney.net/barkley/" target='_blank' className='underline'>Barkley Marathons</a>, le Tribal Royale est le premier format backyard appliqué à l'OCR.
                    Un concept d'élimination progressive inédit qui repousse les limites du mental et du physique.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                      ∞ km
                    </Badge>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                      Élimination progressive
                    </Badge>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                      Format élite
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="relative bg-accent-foreground py-16 sm:py-50">
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute -top-10 lg:top-[-1%] rotate-180 left-1/2 w-screen max-w-none -translate-x-1/2'
        />
        <Image
          src="/images/wall-texture.png"
          alt="Wall texture decoration"
          width={600}
          height={400}
          className="w-full h-full absolute top-0 left-0 object-cover opacity-80"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-background/80 text-foreground border-border">
              <Heart className="h-4 w-4 mr-2" />
              Nos valeurs
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl text-background">
              Ce qui nous anime
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/50 bg-background/90 backdrop-blur hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="rounded-2xl bg-primary/10 p-4 w-fit mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Communauté</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Overbound, c'est avant tout une tribu. Chaque participant, chaque bénévole, chaque partenaire fait partie
                  d'une communauté soudée par la passion du dépassement de soi.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-background/90 backdrop-blur hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="rounded-2xl bg-amber-500/10 p-4 w-fit mb-4">
                  <Sparkles className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nous ne suivons pas les tendances, nous les créons. Chaque format, chaque concept est pensé
                  pour repousser les limites de ce qui existe déjà.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-background/90 backdrop-blur hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="rounded-2xl bg-emerald-500/10 p-4 w-fit mb-4">
                  <Trophy className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chaque événement Overbound est conçu pour offrir la meilleure expérience possible :
                  parcours exigeants, organisation irréprochable, ambiance unique.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute bottom-[-1%] left-1/2 w-screen max-w-none -translate-x-1/2'
        />
      </section>

      {/* Vision Future */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary border-primary/40">
                <Mountain className="h-4 w-4 mr-2" />
                Notre vision
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                L'avenir de l'OCR en Europe
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <span className="text-foreground font-semibold">Notre ambition est claire :</span> faire d'Overbound
                  la référence OCR en Europe d'ici 5 ans. Pas en copiant ce qui existe, mais en créant quelque chose
                  de radicalement différent.
                </p>
                <p>
                  Nous voulons <span className="text-primary font-semibold">multiplier les événements à travers l'Europe</span>,
                  développer de nouveaux formats innovants, et construire une communauté de plusieurs dizaines de milliers
                  d'athlètes passionnés.
                </p>
                <p>
                  <span className="text-foreground font-semibold">Overbound ne sera jamais juste une course.</span>&nbsp;
                  C'est une expérience complète exprimée par une tribu qui partage la même passion du dépassement de soi, et de l'esprit collectif.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/events">Rejoindre l'aventure</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about/concept">Découvrir le concept</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1400&auto=format&fit=crop"
                alt="Vision future Overbound"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
