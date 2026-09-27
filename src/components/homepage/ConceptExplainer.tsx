'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

const LOOP_STEPS = [
  { label: 'Départ', description: 'Tu pars pour un tour de boucle, seul ou avec ta tribu.' },
  { label: '10+ obstacles', description: 'Grip, portage, agilité, force : chaque tour teste un peu tout.' },
  { label: 'Retour', description: 'Tu boucles ton tour, tu décides si tu repars pour un autre.' },
]

export function ConceptExplainer() {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section id="concept" className="w-full bg-neutral-950 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 xl:px-32">
        <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-primary">
          Le concept en 3 temps
        </p>
        <h2 className="mt-3 text-balance break-words text-center text-3xl font-black sm:text-4xl">
          Une boucle de 2 km, autant de tours que tu veux
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-300 sm:text-base">
          La première organisation OCR où tu choisis ton niveau de défi sur le même parcours.
          Notre mot d'ordre : dépassement de soi.
        </p>

        {/* Animated loop schema */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {LOOP_STEPS.map((step, index) => (
            <div
              key={step.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <svg
                viewBox="0 0 100 100"
                className="mx-auto h-20 w-20 motion-safe:animate-[spin_12s_linear_infinite] motion-reduce:animate-none"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="text-primary"
                />
                <circle cx="50" cy="10" r="5" fill="currentColor" className="text-primary" />
              </svg>
              <p className="mt-4 text-sm font-black uppercase tracking-wide text-primary">
                {index + 1}. {step.label}
              </p>
              <p className="mt-2 text-sm text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Video slot — click to play, never autoplay */}
        <div className="mx-auto mt-10 max-w-3xl">
          {showVideo ? (
            <video
              controls
              autoPlay
              className="w-full rounded-2xl"
              poster="/images/hero_header_poster.avif"
            >
              <source src="/videos/concept-explainer.mp4" type="video/mp4" />
            </video>
          ) : (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="group relative flex min-h-11 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10"
              aria-label="Lire la vidéo qui explique le concept Overbound"
            >
              <img
                src="/images/hero_header_poster.avif"
                alt="Aperçu du concept Overbound"
                className="h-56 w-full object-cover opacity-70 transition group-hover:opacity-90 sm:h-72"
              />
              <span className="absolute inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <Play className="h-6 w-6" fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
