'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Mountain,
  Trophy,
  Users,
  Globe,
  Crown,
  Award,
  Flame,
  ArrowRight,
  Heart,
  Zap,
  Target,
  Clock
} from 'lucide-react'

export default function ConceptPage() {
  return (
    <main className="w-full bg-background">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-neutral-200">
        <div className="absolute inset-0">
          <Image
            src="/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif"
            alt="Jeune homme portant des troncs d'arbres sur les épaules lors d'une course d'obstacles, criant vers la caméra de manière énergique"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:py-28 lg:py-32">
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/40 text-sm font-bold uppercase tracking-wider px-4 py-2">
            <Globe className="h-4 w-4 mr-2 inline" />
            Première mondiale
          </Badge>

          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl max-w-4xl">
            Le premier Backyard OCR{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                AU MONDE
              </span>
              <div className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
            </span>
          </h1>

          <p className="max-w-3xl text-lg text-white/90 sm:text-xl leading-relaxed">
            Overbound inaugure une nouvelle ère de l'obstacle course racing avec un format inédit :
            la Ultra Arena. Une expérience d'endurance et de dépassement de soi jamais vue auparavant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
              asChild
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-xl shadow-red-600/30"
            >
              <Link href="/events/ultra-arena-2026/register">
                S'inscrire maintenant
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
          src="/images/decorations/mountain-vector.svg"
          alt="Background"
          className="object-cover object-center absolute w-full -bottom-3 sm:-bottom-4 md:-bottom-5 pointer-events-none opacity-30"
          height={600}
          width={600}
          priority
        />
      </section>

      {/* Ultra Arena - Main Section */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-amber-500 text-white text-sm font-bold uppercase tracking-wider px-4 py-2 mb-6">
              <Crown className="h-4 w-4 mr-2 inline" />
              Format exclusif Overbound
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Une révolution dans le monde de l'OCR
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Inspirée du légendaire Barkley Marathons, la Ultra Arena est le tout premier format
              backyard appliqué à l'obstacle course racing. Une création mondiale signée Overbound.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
              <CardHeader className="pb-2">
                <div className="rounded-xl bg-amber-500/20 p-3 w-fit mb-2">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Tours de 20min</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Chaque boucle doit être complétée en moins de 20min. Pas de retour à temps = élimination.
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
              <CardHeader className="pb-2">
                <div className="rounded-xl bg-amber-500/20 p-3 w-fit mb-2">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">2km par tour</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Un parcours technique de 2km avec 10+ obstacles à franchir à chaque boucle.
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
              <CardHeader className="pb-2">
                <div className="rounded-xl bg-amber-500/20 p-3 w-fit mb-2">
                  <Flame className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Élimination progressive</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Le nombre de participants diminue tour après tour. Seuls les plus endurants restent.
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
              <CardHeader className="pb-2">
                <div className="rounded-xl bg-amber-500/20 p-3 w-fit mb-2">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Le dernier debout gagne</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pas de temps limite. La course continue jusqu'à ce qu'il ne reste qu'un seul concurrent.
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-background to-amber-500/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <CardContent className="relative z-10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <Badge className="bg-rose-500 text-white font-bold">
                    PREMIÈRE ÉDITION 2026
                  </Badge>
                  <h3 className="text-3xl font-bold">
                    Fais partie de l'histoire
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La première Ultra Arena au monde se déroulera cette année. Tu as l'opportunité
                    unique d'être parmi les pionniers de ce nouveau format révolutionnaire.
                    Une expérience que tu n'oublieras jamais.
                  </p>
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 rounded-full">
                    <Link href="/events/ultra-arena-2026/register">
                      Réserver ma place
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="bg-amber-500/10 rounded-2xl p-6 space-y-4">
                  <p className="text-sm uppercase tracking-wider text-amber-600 font-semibold">Ce qui t'attend</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-1 mt-0.5">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm">Obstacles extrêmes : grip, portés lourds, techniques</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-1 mt-0.5">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm">Test mental et physique ultime</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-1 mt-0.5">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm">Ambiance électrique de compétition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-500/20 p-1 mt-0.5">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm">Fierté d'être pionnier d'un nouveau format</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inclusivity & Values Section */}
      <section className="w-full bg-neutral-900 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-primary/20 text-primary border-primary/40 text-sm font-semibold uppercase tracking-wider px-4 py-2 mb-6">
              <Heart className="h-4 w-4 mr-2 inline" />
              Nos valeurs
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Accessible à tous, exigeant pour chacun
            </h2>
            <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
              L'Ultra Arena n'est pas réservée à une élite. C'est un défi personnel où chacun
              repousse ses propres limites, quel que soit son point de départ.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">Inclusivité totale</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Homme, femme, débutant ou confirmé : la Ultra Arena accueille tous ceux qui
                ont le courage de se lancer. Le seul adversaire, c'est toi-même.
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Mountain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">Dépassement de soi</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Chaque tour complété est une victoire. L'objectif n'est pas de gagner contre
                les autres, mais de découvrir de quoi tu es vraiment capable.
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="rounded-xl bg-primary/20 p-3 w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-white">Esprit de tribu</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-300">
                Même dans la compétition, l'entraide prime. Les spectateurs encouragent,
                les concurrents se respectent. Une communauté soudée par l'effort.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="w-full bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/40">
                Le défi ultime
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold">
                Repousse tes limites comme jamais
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                La Ultra Arena est conçue pour tester tes limites physiques et mentales.
                Chaque tour devient plus difficile à mesure que la fatigue s'accumule.
                C'est là que tu découvres qui tu es vraiment.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-rose-500/20 p-2">
                    <Flame className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Mental d'acier</p>
                    <p className="text-sm text-muted-foreground">
                      Quand ton corps dit stop, ton mental prend le relais
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-rose-500/20 p-2">
                    <Flame className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Gestion de l'effort</p>
                    <p className="text-sm text-muted-foreground">
                      Stratégie et endurance sont les clés de la réussite
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-rose-500/20 p-2">
                    <Flame className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Transformation personnelle</p>
                    <p className="text-sm text-muted-foreground">
                      Tu ne seras plus la même personne après avoir participé
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-3xl blur-3xl" />
              <Card className="relative border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <p className="text-6xl font-black text-amber-500">∞</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground mt-2">
                      Aucune limite de tours
                    </p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold">2km</p>
                      <p className="text-xs text-muted-foreground">par tour</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">10+</p>
                      <p className="text-xs text-muted-foreground">obstacles</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">20min max</p>
                    <p className="text-xs text-muted-foreground">pour boucler chaque tour</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full bg-gradient-to-br from-amber-600 via-amber-500 to-rose-500 py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center">
          <Badge className="bg-white/20 text-white border-white/40 text-sm font-bold uppercase tracking-wider px-4 py-2 mb-6">
            <Globe className="h-4 w-4 mr-2 inline" />
            Première mondiale
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Sois parmi les premiers
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            La première Ultra Arena de l'histoire se prépare. Inscris-toi maintenant
            et deviens un pionnier de ce nouveau format révolutionnaire.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-amber-600 hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-full shadow-2xl"
            >
              <Link href="/events/ultra-arena-2026/register">
                S'inscrire à la Ultra Arena
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-amber-600 px-8 py-6 text-lg font-semibold rounded-full"
            >
              <Link href="/volunteers">
                Devenir bénévole
              </Link>
            </Button>
          </div>
        </div>

        <Image
          src="/images/decorations/mountain-vector.svg"
          alt="Background"
          className="object-cover object-center absolute w-full -bottom-3 pointer-events-none opacity-20"
          height={600}
          width={600}
        />
      </section>
    </main>
  )
}
