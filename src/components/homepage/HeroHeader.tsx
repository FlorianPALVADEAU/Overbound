"use client";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

export const BrandBanner = () => {
    return (
        <div className="w-full py-6">
            {/* Version desktop : ton design original */}
            <div className="hidden lg:shown w-full mx-auto px-4 lg:flex items-center justify-center space-x-40 overflow-x-hidden">
                {['Brand1', 'Brand2', 'Brand3', 'Brand4', 'Brand5', 'Brand6', 'Brand7'].map((brand, index) => (
                    <div key={index} className="flex-shrink-0">
                        <div className="h-12 w-32 bg-gray-300 flex items-center justify-center rounded-lg">
                            {brand}
                        </div>
                    </div>
                ))}
            </div>

            {/* Version mobile/tablette : scroll horizontal */}
            <div className="lg:hidden w-full mx-auto px-4">
                <div className="flex items-center space-x-6 overflow-x-auto pb-2 scrollbar-hide">
                    {['Brand1', 'Brand2', 'Brand3', 'Brand4', 'Brand5'].map((brand, index) => (
                        <div key={index} className="flex-shrink-0">
                            <div className="h-10 w-24 sm:h-12 sm:w-32 bg-gray-300 flex items-center justify-center rounded-lg text-sm">
                                {brand}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const HeroHeader = () => {
    return (
        <>
            <section className="relative w-full h-[80vh] overflow-hidden">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster="/images/hero_header_poster.jpg"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                >
                    <source src="/videos/hero_header_video.webm" type="video/webm" />
                    <source src="/videos/hero_header_video.mp4" type="video/mp4" />
                    Ton navigateur ne supporte pas les vidéos HTML5.
                </video>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Container responsive qui garde ton design desktop */}
                <div className="relative z-10 flex flex-col items-start justify-center gap-8 h-full text-center text-white px-4 sm:px-6 md:px-8 lg:px-32">
                    <div>
                        <h1 className="text-4xl md:text-7xl font-bold mb-4 text-left">
                            Relève le défi ultime.
                        </h1>
                        <p className="text-lg md:text-2xl max-w-2xl mb-6 text-left">
                            Inspirée des rites tribaux et de l'esprit collectif. Prépare-toi à une
                            expérience unique.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <Button className="w-full sm:w-48 md:w-48 lg:w-64 h-12 sm:h-12 md:h-12 lg:h-16 bg-red-600 hover:bg-red-700 text-lg sm:text-xl font-semibold">
                            <Link href="/events" className="w-full h-full flex items-center justify-center">Je m'inscris maintenant</Link>
                        </Button>
                        <p className="text-sm text-gray-300 italic">Déjà 50+ avis positifs récoltés !</p>
                    </div>
                </div>
            </section>
            <BrandBanner />
        </>
    );
}

export default HeroHeader;