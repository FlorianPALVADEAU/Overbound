'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Users, Globe, Sparkles, Mountain, Heart, Trophy, Crown, Flame } from 'lucide-react'

export default function OurStoryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={"/images/images/overbound-headband-on-chains-with-grass-in-background.avif"}
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
        <div className='py-20 relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Notre Histoire
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Comment tout a commencé
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              L'histoire d'Overbound, c'est celle d'une volonté de créer quelque chose d'unique dans l'univers de l'OCR :
              une organisation 100% européenne qui repousse les limites de ce qui existe.
            </p>
          </div>
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
                  <span className="text-foreground font-semibold">En 2024, l'OCR manque d'innovation.</span> Les formats
                  se ressemblent, les courses suivent les mêmes schémas. Nous voulions créer quelque chose de radicalement différent.
                </p>
                <p>
                  <span className="text-primary font-semibold">Overbound naît de cette ambition.</span> Pourquoi ne pas
                  imaginer un format jamais vu ? Un défi d'endurance qui combine l'intensité de l'OCR avec le concept
                  du backyard ultra ?
                </p>
                <p>
                  C'est ainsi qu'est née la <span className="text-amber-600 font-semibold">Ultra Arena</span> : le premier
                  backyard OCR au monde. Une première mondiale qui marque le début d'une nouvelle ère.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/images/a-man-smiling-in-a-field.avif"
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

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-primary/10 text-primary border-primary/40 mb-4">
                    2024
                  </Badge>
                  <CardTitle className="text-xl">La genèse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Création d'Overbound avec une ambition claire : innover dans l'OCR et créer
                    un format unique au monde.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/40 mb-4">
                    2025
                  </Badge>
                  <CardTitle className="text-xl">Ultra Arena</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Première mondiale : lancement du format Ultra Arena, le tout premier backyard OCR
                    de l'histoire. L'innovation qui change tout.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5 hover:-translate-y-1 transition-all">
                <CardHeader>
                  <Badge className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/40 mb-4">
                    2025+
                  </Badge>
                  <CardTitle className="text-xl">L'expansion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Développement de la communauté Overbound et préparation des prochaines éditions.
                    L'aventure ne fait que commencer.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* L'innovation Ultra Arena */}
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Badge className="bg-amber-500 text-white">
                <Globe className="h-4 w-4 mr-2" />
                Première mondiale
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ultra Arena : notre création signature
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Overbound ne se contente pas de suivre les tendances : nous avons créé un format
                qui n'existait nulle part ailleurs dans le monde.
              </p>
            </div>

            <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-background to-amber-500/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
              <CardContent className="relative z-10 p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500/10 p-4">
                        <Crown className="h-8 w-8 text-amber-600" />
                      </div>
                      <Badge className="bg-rose-500 text-white font-bold">
                        DU JAMAIS VU
                      </Badge>
                    </div>
                    <h3 className="text-3xl font-bold">
                      Le premier Backyard OCR au monde
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Inspiré du légendaire <a href="https://www.mattmahoney.net/barkley/" target='_blank' className='underline'>Barkley Marathons</a>,
                      la Ultra Arena est le tout premier format backyard appliqué à l'obstacle course racing.
                      Un concept d'élimination progressive inédit qui repousse les limites du mental et du physique.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                        2km par tour
                      </Badge>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                        15+ obstacles
                      </Badge>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/40">
                        20min max par boucle
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 rounded-2xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                          <Flame className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Élimination progressive</p>
                          <p className="text-sm text-muted-foreground">
                            Chaque tour dure 1h. Pas de retour à temps = élimination.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                          <Trophy className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Le dernier debout gagne</p>
                          <p className="text-sm text-muted-foreground">
                            La course continue jusqu'à ce qu'il ne reste qu'un concurrent.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-500/20 p-2 mt-1">
                          <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Test ultime</p>
                          <p className="text-sm text-muted-foreground">
                            Mental et physique poussés à leurs limites absolues.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="relative bg-accent-foreground py-16 sm:py-50">
        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute -top-10 rotate-180 left-0 w-screen'
        />
        <Image
          src="/images/decorations/wall-texture.png"
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
                <CardTitle className="text-xl">Inclusivité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  La Ultra Arena est ouverte à tous ceux qui ont le courage de se lancer. Homme, femme,
                  débutant ou confirmé : chacun peut repousser ses propres limites.
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
                  Nous ne suivons pas les tendances, nous les créons. La Ultra Arena est la preuve
                  que l'OCR peut encore surprendre et se réinventer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-background/90 backdrop-blur hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="rounded-2xl bg-emerald-500/10 p-4 w-fit mb-4">
                  <Trophy className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Dépassement de soi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chaque tour complété est une victoire. L'objectif n'est pas de gagner contre les autres,
                  mais de découvrir de quoi tu es vraiment capable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute bottom-[-1%] left-0 w-screen'
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
                Sois parmi les pionniers
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <span className="text-foreground font-semibold">La première Ultra Arena au monde se prépare.</span> Tu as
                  l'opportunité unique d'être parmi les tout premiers participants de ce format révolutionnaire.
                </p>
                <p>
                  <span className="text-amber-600 font-semibold">En 2026, l'histoire s'écrit.</span> Ceux qui participeront
                  à cette première édition feront partie de la légende. Leur nom restera gravé comme les pionniers
                  d'un nouveau chapitre de l'OCR.
                </p>
                <p>
                  <span className="text-foreground font-semibold">Overbound ne sera jamais juste une course.</span>&nbsp;
                  C'est une expérience de transformation personnelle, portée par une tribu qui partage la même passion
                  du dépassement de soi.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                  <Link href="/events/ultra-arena-2026/register">S'inscrire maintenant</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about/concept">Découvrir le concept</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/images/young-man-carrying-a-swingy-chain-to-his-neck.avif"
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
