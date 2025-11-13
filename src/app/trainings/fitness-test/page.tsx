'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Zap, Dumbbell, CheckCircle2, ArrowRight, Trophy, Target } from 'lucide-react'

const heroImageSrc = 'https://images.unsplash.com/photo-1517832606294-5fbdc7dcd837?q=80&w=1400&auto=format&fit=crop'

type TestResults = {
  // Circuit OCR complet
  circuitTime?: number // temps total du circuit en minutes
  // Tests complémentaires
  plankTime?: number // en secondes
  pullups?: number
}

export default function FitnessTestPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState<TestResults>({})
  const [scores, setScores] = useState({ cardio: 0, force: 0, explosivite: 0 })

  // Calculer le score total
  const totalScore = scores.cardio + scores.force + scores.explosivite

  // Déterminer le format recommandé
  const getRecommendedFormat = () => {
    if (totalScore >= 18) return {
      name: 'Tribal Royale',
      color: 'amber',
      href: '/races/tribale-royale',
      description: 'Format backyard élite - Tu as le niveau pour viser le sommet'
    }
    if (totalScore >= 10) return {
      name: 'Voie du Héros',
      color: 'blue',
      href: '/races/voie-du-heros',
      description: 'Format intermédiaire 12 km - Parfait pour progresser'
    }
    return {
      name: 'Rite du Guerrier',
      color: 'emerald',
      href: '/races/rite-du-guerrier',
      description: 'Format sprint 6 km - Idéal pour débuter'
    }
  }

  // Calculer le score circuit OCR (sur 15) - Le test principal
  const calculateCircuitScore = (time?: number) => {
    if (!time) return 0
    // Circuit: 400m run + 10 burpees + 400m + 20 pompes + 400m + 1 min planche + 400m + tractions + 400m
    // Environ 2km de course + obstacles = simulation réelle OCR
    if (time <= 12) return 15  // Elite (<12 min = <6:00/km avec obstacles)
    if (time <= 14) return 14  // Excellent
    if (time <= 16) return 13  // Très bon
    if (time <= 18) return 12  // Bon
    if (time <= 20) return 11  // Correct+
    if (time <= 22) return 10  // Correct
    if (time <= 25) return 8   // Moyen+
    if (time <= 28) return 6   // Moyen
    if (time <= 32) return 4   // Débutant+
    if (time <= 36) return 2   // Débutant
    return 1
  }

  // Calculer le score grip/force (sur 10) - Tests complémentaires
  const calculateGripScore = (plank?: number, pullups?: number) => {
    let score = 0
    // Planche (max 6 points) - Crucial pour portés
    if (plank) {
      if (plank >= 180) score += 6 // 3 min = elite
      else if (plank >= 150) score += 5 // 2:30 = excellent
      else if (plank >= 120) score += 4 // 2 min = très bon
      else if (plank >= 90) score += 3 // 1:30 = bon
      else if (plank >= 60) score += 2 // 1 min = correct
      else if (plank >= 45) score += 1 // 45 sec = débutant
    }
    // Tractions (max 4 points) - Le plus difficile
    if (pullups !== undefined) {
      if (pullups >= 15) score += 4 // Elite
      else if (pullups >= 10) score += 3 // Très bon
      else if (pullups >= 5) score += 2 // Bon
      else if (pullups >= 1) score += 1 // Débutant
    }
    return Math.min(score, 10)
  }

  // Score basé sur effort perçu (sur 5) - Auto-évaluation
  const calculateEffortScore = () => {
    // Ce sera un slider dans l'interface pour évaluer comment tu t'es senti
    return 0 // On le gérera dans l'interface
  }

  const updateCircuitScore = (time: number) => {
    const score = calculateCircuitScore(time)
    setScores(prev => ({ ...prev, cardio: score }))
    setResults(prev => ({ ...prev, circuitTime: time }))
  }

  const updateGripScore = () => {
    const score = calculateGripScore(results.plankTime, results.pullups)
    setScores(prev => ({ ...prev, force: score }))
  }

  const updateExplosiviteScore = (effort: number) => {
    setScores(prev => ({ ...prev, explosivite: effort }))
  }

  const steps = [
    {
      title: 'Circuit OCR Simulation',
      subtitle: 'Le vrai test - Course + Obstacles',
      icon: Activity,
      color: 'emerald',
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl bg-emerald-500/5 p-6 ring-1 ring-emerald-500/20">
            <h3 className="text-lg font-semibold text-emerald-600 mb-3">Le Circuit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fais ce circuit en continu et chronomètre ton temps total. C'est la simulation réelle d'une course OCR!
            </p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">1.</span>
                <span>Cours 400m (1 tour de piste)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">2.</span>
                <span>10 burpees</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">3.</span>
                <span>Cours 400m</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">4.</span>
                <span>20 pompes</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">5.</span>
                <span>Cours 400m</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">6.</span>
                <span>Planche 1 minute</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">7.</span>
                <span>Cours 400m</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">8.</span>
                <span>10 tractions (ou suspension 30 sec si impossible)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-emerald-600">9.</span>
                <span>Cours 400m final</span>
              </li>
            </ol>
            <p className="text-xs text-emerald-600 mt-4 font-semibold">
              Total: 2km de course + 4 obstacles = ~15-30 min selon ton niveau
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="circuitTime" className="text-base font-semibold">
              Temps total du circuit (minutes)
            </Label>
            <Input
              id="circuitTime"
              type="number"
              step="0.5"
              placeholder="Ex: 18.5"
              value={results.circuitTime || ''}
              onChange={(e) => updateCircuitScore(parseFloat(e.target.value))}
              className="text-lg h-12"
            />
            {scores.cardio > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-600">Score: {scores.cardio}/15</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Test Grip & Gainage',
      subtitle: 'Force pour les obstacles portés',
      icon: Dumbbell,
      color: 'red',
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl bg-red-500/5 p-6 ring-1 ring-red-500/20">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Tests complémentaires</h3>
            <p className="text-sm text-muted-foreground">
              Ces tests évaluent ton grip et ta force de gainage - critiques pour les obstacles portés, murs, cordes...
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="plankTime" className="text-base font-semibold">
                Planche maximale (secondes)
              </Label>
              <p className="text-xs text-muted-foreground">Repos 5 min après le circuit, puis tiens le plus longtemps possible</p>
              <Input
                id="plankTime"
                type="number"
                placeholder="Ex: 120"
                value={results.plankTime || ''}
                onChange={(e) => {
                  setResults(prev => ({ ...prev, plankTime: parseInt(e.target.value) }))
                  updateGripScore()
                }}
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="pullups" className="text-base font-semibold">
                Tractions strictes (nombre)
              </Label>
              <p className="text-xs text-muted-foreground">Sans élan. Si impossible, mets 0</p>
              <Input
                id="pullups"
                type="number"
                placeholder="Ex: 5"
                value={results.pullups || ''}
                onChange={(e) => {
                  setResults(prev => ({ ...prev, pullups: parseInt(e.target.value) }))
                  updateGripScore()
                }}
                className="h-12"
              />
            </div>

            {scores.force > 0 && (
              <div className="flex items-center gap-2 text-sm pt-2">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-red-600">Score: {scores.force}/10</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Ressenti global',
      subtitle: 'Comment tu t\'es senti',
      icon: Zap,
      color: 'amber',
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl bg-amber-500/5 p-6 ring-1 ring-amber-500/20">
            <h3 className="text-lg font-semibold text-amber-600 mb-3">Auto-évaluation</h3>
            <p className="text-sm text-muted-foreground">
              Sur une échelle de 1 à 5, comment tu t'es senti pendant le circuit?
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => updateExplosiviteScore(value)}
                  className={`h-16 rounded-lg border-2 transition-all ${
                    scores.explosivite === value
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold'
                      : 'border-border hover:border-amber-500/50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Très difficile</span>
              <span>Facile</span>
            </div>
            {scores.explosivite > 0 && (
              <div className="flex items-center gap-2 text-sm pt-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-amber-600">Score: {scores.explosivite}/5</span>
              </div>
            )}
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0
  const progress = ((currentStep + 1) / steps.length) * 100

  const recommendedFormat = getRecommendedFormat()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={heroImageSrc}
            alt='Test de fitness Overbound'
            fill
            sizes='100vw'
            className='object-cover object-center'
            priority
          />
          <div className='pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8 text-center'>
          <Badge className="mx-auto bg-primary/10 text-primary border-primary/40">
            <Target className="h-4 w-4 mr-2" />
            Test interactif
          </Badge>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
            Test OCR Circuit
          </h1>
          <p className='text-base leading-relaxed text-muted-foreground sm:text-lg max-w-2xl mx-auto'>
            Circuit course + obstacles pour simuler une vraie course OCR et découvrir ton format idéal
          </p>
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

      {/* Test interactif */}
      {currentStep < steps.length && (
        <section className="py-16 relative z-10">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Barre de progression */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">
                  Étape {currentStep + 1} sur {steps.length}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Carte de test */}
            <Card className="border-2 border-border/40 shadow-2xl">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-4 ${
                  currentStepData.color === 'emerald' ? 'bg-emerald-500/10' :
                  currentStepData.color === 'red' ? 'bg-red-500/10' :
                  'bg-amber-500/10'
                }`}>
                  <currentStepData.icon className={`h-8 w-8 ${
                    currentStepData.color === 'emerald' ? 'text-emerald-600' :
                    currentStepData.color === 'red' ? 'text-red-600' :
                    'text-amber-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{currentStepData.subtitle}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {currentStepData.content}

              {/* Navigation */}
              <div className="flex gap-3 pt-6 border-t">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                )}
                {!isLastStep ? (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-1"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-1"
                    disabled={totalScore === 0}
                  >
                    Voir mes résultats
                    <Trophy className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résumé des scores (visible dès qu'on a un score) */}
          {totalScore > 0 && currentStep < steps.length && (
            <Card className="mt-6 border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ton score actuel</p>
                    <p className="text-3xl font-bold text-foreground">{totalScore}/30</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Format recommandé</p>
                    <Badge className={`${
                      recommendedFormat.color === 'emerald' ? 'bg-emerald-500' :
                      recommendedFormat.color === 'blue' ? 'bg-blue-500' :
                      'bg-amber-500'
                    } text-white font-bold`}>
                      {recommendedFormat.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      )}

      {/* Résultats finaux */}
      {currentStep === steps.length && totalScore > 0 && (
        <section className="py-16 relative z-10">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6 mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Tes résultats</h2>
              <div className="inline-flex items-center gap-2 text-5xl font-bold">
                <span className="text-primary">{totalScore}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">30</span>
              </div>
            </div>

            {/* Détail des scores */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
                <CardContent className="p-6 text-center">
                  <Activity className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Circuit OCR</p>
                  <p className="text-3xl font-bold text-emerald-600">{scores.cardio}/15</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-500/20 bg-gradient-to-br from-background to-red-500/5">
                <CardContent className="p-6 text-center">
                  <Dumbbell className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Grip & Gainage</p>
                  <p className="text-3xl font-bold text-red-600">{scores.force}/10</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Ressenti</p>
                  <p className="text-3xl font-bold text-amber-600">{scores.explosivite}/5</p>
                </CardContent>
              </Card>
            </div>

            {/* Format recommandé */}
            <Card className={`border-2 ${
              recommendedFormat.color === 'emerald' ? 'border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5' :
              recommendedFormat.color === 'blue' ? 'border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5' :
              'border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5'
            } shadow-2xl`}>
              <CardHeader>
                <Badge className={`w-fit ${
                  recommendedFormat.color === 'emerald' ? 'bg-emerald-500' :
                  recommendedFormat.color === 'blue' ? 'bg-blue-500' :
                  'bg-amber-500'
                } text-white font-bold text-sm mb-4`}>
                  FORMAT RECOMMANDÉ
                </Badge>
                <CardTitle className="text-3xl">{recommendedFormat.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-muted-foreground">{recommendedFormat.description}</p>
                <div className="flex gap-3">
                  <Button asChild size="lg" className="flex-1">
                    <Link href={recommendedFormat.href}>
                      Découvrir ce format
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex-1">
                    <Link href="/events">
                      Trouver un événement
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep(0)
                    setResults({})
                    setScores({ cardio: 0, force: 0, explosivite: 0 })
                  }}
                  className="w-full"
                >
                  Recommencer le test
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </main>
  )
}
