"use client";
import React from "react";


export const BrandBanner = () => {
    return (
        <div className="w-full py-6">
            <div className="w-full mx-auto px-4 flex items-center justify-center space-x-40 overflow-x-hidden">
                {['Brand1', 'Brand2', 'Brand3', 'Brand4', 'Brand5', 'Brand6', 'Brand7'].map((brand, index) => (
                    <div key={index} className="flex-shrink-0">
                        {/* Replace with actual brand logos */}
                        <div className="h-12 w-32 bg-gray-300 flex items-center justify-center rounded-lg">
                            {brand}
                        </div>
                    </div>
                ))}
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

                    <div className="relative z-10 flex flex-col items-start justify-center gap-8 h-full text-center text-white px-32">
                        <div>
                            <h1 className="text-4xl md:text-7xl font-bold mb-4">
                                Relève le défi ultime.
                            </h1>
                            <p className="text-lg md:text-2xl max-w-2xl mb-6 text-left">
                                Inspirée des rites tribaux et de l'esprit collectif. Prépare-toi à une
                                expérience unique.
                            </p>
                        </div>
                        <div className="flex flex-col items-start gap-2">
                            <button className="flex items-center justify-center lg:w-64 lg:h-16 md:w-48 md:h-12 xs:w-48 xs:h-12 bg-red-600 hover:bg-red-700 rounded-xl text-xl font-semibold transition">
                                Je me lance !
                            </button>
                            <p className="text-sm text-gray-300 italic">Déjà 50+ avis positifs récoltés !</p>
                        </div>
                    </div>
            </section>
            <BrandBanner />
        </>
    );
}

export default HeroHeader;