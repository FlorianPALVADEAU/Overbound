'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionId, FinalResult, Question, questionsData, QuestionOption, ResultId, Result } from '@/datas/WhichDistanceForMeQuestions'
import { SubHeadingsProps } from './globals/SubHeadings'
import Headings from './globals/Headings'

// Types pour le questionnaire

const WhichDistanceForMe: React.FC = () => {
    const [formStarted, setFormStarted] = useState<boolean>(false)
    const [currentQuestion, setCurrentQuestion] = useState<QuestionId>('q1')
    const [selectedFormat, setSelectedFormat] = useState<Result | null>(null)
    const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

    const SubHeadings: React.FC<SubHeadingsProps> = ({ title, description }) => (
        <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )

    const getCurrentQuestion = (): Question | undefined => {
        return questionsData.questions.find(q => q.id === currentQuestion)
    }

    const getProgressPercentage = (): number => {
        if (selectedFormat) return 85
        switch (currentQuestion) {
            case 'q1': return 25
            case 'q2': return 40
            case 'q3': return 55
            case 'q4': return 70
            default: return 25
        }
    }

    const handleAnswer = (option: QuestionOption): void => {
        setIsTransitioning(true)
        
        setTimeout(() => {
            const next = option.next as ResultId | QuestionId
            
            // Si c'est un format, on le stocke et on passe aux questions de difficulté
            if (next.startsWith('format_')) {
                const format = questionsData.results[next as ResultId]
                setSelectedFormat(format)
                setCurrentQuestion('d1')
            }
            // Si c'est une difficulté, on affiche le résultat final
            else if (next.startsWith('difficulty_')) {
                const difficulty = questionsData.results[next as ResultId]
                if (selectedFormat) {
                    setFinalResult({
                        format: selectedFormat,
                        difficulty: difficulty
                    })
                }
            }
            // Sinon, on passe à la question suivante
            else {
                setCurrentQuestion(next as QuestionId)
            }
            
            setIsTransitioning(false)
        }, 300)
    }

    const resetQuiz = (): void => {
        setFormStarted(false)
        setCurrentQuestion('q1')
        setSelectedFormat(null)
        setFinalResult(null)
        setIsTransitioning(false)
    }

    const currentQ = getCurrentQuestion()

    return (
		<section className="w-full items-center justify-center gap-24 py-20 pt-40 px-4 sm:px-6 xl:px-32">
			<div className="w-full flex flex-col gap-8 sm:gap-10 xl:gap-12 h-full">
                <Headings 
                    title="Quelle distance est faite pour moi ?" 
                    description="Si vous hésitez encore sur quel format choisir, voici un questionnaire rapide pour vous orienter vers la bonne distance."
                />

                <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
                    {!formStarted ? (
                        <div className="text-center max-w-2xl mx-auto">
                            <h3 className="text-xl font-semibold mb-4">Prêt à découvrir votre défi ?</h3>
                            <Button
                                size="lg"
                                className="w-full h-12 text-base transition-all duration-300 hover:scale-105"
                                onClick={() => setFormStarted(true)}
                            >
                                Commencer le questionnaire
                            </Button>
                        </div>
                    ) : finalResult ? (
                        // Affichage du résultat final
                        <Card className={`w-full max-w-5xl mx-auto transition-all duration-500 ${
                            isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
                        }`}>
                            <CardHeader className="text-center pb-6">
                                <div className="text-6xl mb-4">🎉</div>
                                <CardTitle className="text-2xl sm:text-3xl text-primary mb-4">
                                    Votre parcours recommandé !
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Basé sur vos réponses, voici la combinaison parfaite pour vous
                                </p>
                            </CardHeader>
                            
                            <CardContent className="space-y-6">
                                {/* Format recommandé */}
                                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-center gap-3 mb-3">
                                            <span className="text-4xl">{finalResult.format.icon}</span>
                                            <h4 className="text-xl sm:text-2xl font-bold text-primary">
                                                {finalResult.format.name}
                                            </h4>
                                        </div>
                                        <p className="text-center text-sm sm:text-base leading-relaxed">
                                            {finalResult.format.description}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Difficulté recommandée */}
                                <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-center gap-3 mb-3">
                                            <span className="text-4xl">{finalResult.difficulty.icon}</span>
                                            <h4 className="text-xl sm:text-2xl font-bold text-amber-800">
                                                Niveau {finalResult.difficulty.name}
                                            </h4>
                                        </div>
                                        <p className="text-center text-amber-700 text-sm sm:text-base leading-relaxed">
                                            {finalResult.difficulty.description}
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                                    <Button size="lg" className="px-8">
                                        S'inscrire maintenant
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="px-8"
                                        onClick={resetQuiz}
                                    >
                                        Recommencer le test
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : currentQ ? (
                        // Affichage des questions
                        <Card className={`w-full max-w-5xl mx-auto transition-all duration-500 ${
                            isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
                        }`}>
                            <CardHeader className="text-center">
                                {/* Indicateur de progression */}
                                <div className="flex justify-center mb-6">
                                    <div className="w-full max-w-md">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                            <span>Progression</span>
                                            <span>{getProgressPercentage()}%</span>
                                        </div>
                                        <div className="bg-muted rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${getProgressPercentage()}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed">
                                    {currentQ.question}
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                                {currentQ.options.map((option, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className="w-full h-auto py-4 px-6 text-left justify-start text-sm sm:text-base leading-relaxed hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                        onClick={() => handleAnswer(option)}
                                        disabled={isTransitioning}
                                    >
                                        <Badge variant="secondary" className="mr-4 min-w-[32px] h-8 flex items-center justify-center">
                                            {String.fromCharCode(65 + index)}
                                        </Badge>
                                        <span className="flex-1">{option.label}</span>
                                    </Button>
                                ))}

                                <div className="pt-4 text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={resetQuiz}
                                    >
                                        ← Recommencer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

export default WhichDistanceForMe