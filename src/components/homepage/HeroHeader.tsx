"use client";
import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import AnimatedBanner from "./AnimatedBanner";
import { PARTNERS_DATA } from "@/datas/Partners";
import { Container, DISPLAY_TITLE } from "@/components/ds";
import { cn } from "@/lib/utils";
import { useFeaturedEvent } from "@/app/api/events/featured/featuredEventQueries";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export const HeroHeader = () => {
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
    const [videoPaused, setVideoPaused] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const { data: featured } = useFeaturedEvent();
    const registerHref = featured?.event
        ? `/events/${featured.event.slug}/register`
        : "/events/ultra-arena-2026/register";

    useEffect(() => {
        const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
        const connection = (navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
        }).connection;

        const isConstrainedNetwork = Boolean(
            connection?.saveData ||
            connection?.effectiveType === "slow-2g" ||
            connection?.effectiveType === "2g" ||
            connection?.effectiveType === "3g"
        );

        // Reduced motion: the still poster replaces the looping video.
        if (isMobileViewport || isConstrainedNetwork || prefersReducedMotion) {
            setShouldLoadVideo(false);
            return;
        }

        const requestIdle = globalThis.requestIdleCallback;
        const cancelIdle = globalThis.cancelIdleCallback;

        if (typeof requestIdle === "function" && typeof cancelIdle === "function") {
            const idleHandle = requestIdle(
                () => setShouldLoadVideo(true),
                { timeout: 2500 }
            );

            return () => {
                cancelIdle(idleHandle);
            };
        }

        const timeoutHandle = globalThis.setTimeout(() => setShouldLoadVideo(true), 1800);
        return () => {
            globalThis.clearTimeout(timeoutHandle);
        };
    }, [prefersReducedMotion]);

    const toggleVideo = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            void video.play();
            setVideoPaused(false);
        } else {
            video.pause();
            setVideoPaused(true);
        }
    };

    return (
        <>
            <section className="relative h-[75vh] min-h-[28rem] w-full overflow-hidden">
                {/* LCP element: a real image, preloaded with high priority (a CSS
                    background is invisible to the preload scanner). It stays under
                    the video, which has no poster: no second download of the frame. */}
                <Image
                    src="/images/hero_header_poster.avif"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                {shouldLoadVideo ? (
                    <video
                        ref={videoRef}
                        aria-hidden="true"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute left-0 top-0 h-full w-full object-cover"
                    >
                        <source src="/videos/hero_header_video.webm" type="video/webm" />
                        <source src="/videos/hero_header_video.mp4" type="video/mp4" />
                    </video>
                ) : null}

                <div className="absolute inset-0 bg-surface-deep/40" />

                {/* WCAG 2.2.2: looping background video can be paused. */}
                {shouldLoadVideo ? (
                    <button
                        type="button"
                        onClick={toggleVideo}
                        aria-label={videoPaused ? "Relancer la vidéo de fond" : "Mettre en pause la vidéo de fond"}
                        className="absolute bottom-4 right-4 z-20 flex size-11 items-center justify-center rounded-full bg-surface-deep/60 text-foreground transition-colors duration-200 hover:bg-surface-deep/80"
                    >
                        {videoPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                    </button>
                ) : null}

                <Container className="relative z-10 flex h-full flex-col items-start justify-center gap-8">
                    <div>
                        <h1 className={cn(DISPLAY_TITLE, "mb-4 text-display-xl")}>Relève le défi ultime.</h1>
                        <p className="mb-6 max-w-2xl text-lead text-foreground/90">
                            La première course d&apos;obstacles format backyard au monde. La limite, c&apos;est toi.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                        <Button asChild size="hero" className="w-full sm:w-auto">
                            <Link href={registerHref}>Je m&apos;inscris maintenant</Link>
                        </Button>
                        <p className="text-sm italic text-muted-foreground">
                            Des centaines de coureurs ont déjà testé et adoré l&apos;expérience !
                        </p>
                    </div>
                </Container>
            </section>
            <AnimatedBanner
                images={PARTNERS_DATA.map(partner => partner.logo)}
                imageAltPrefix="Logo partenaire Overbound"
            />
        </>
    );
}

export default HeroHeader;
