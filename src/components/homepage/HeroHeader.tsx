"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import AnimatedBanner from "./AnimatedBanner";
import { PARTNERS_DATA } from "@/datas/Partners";
import { Container, DISPLAY_TITLE } from "@/components/ds";
import { cn } from "@/lib/utils";

export const HeroHeader = () => {
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

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

        if (isMobileViewport || isConstrainedNetwork) {
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
    }, []);

    return (
        <>
            <section className="relative h-[75vh] min-h-[28rem] w-full overflow-hidden">
                {shouldLoadVideo ? (
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/images/hero_header_poster.avif"
                        className="absolute left-0 top-0 h-full w-full object-cover"
                    >
                        <source src="/videos/hero_header_video.webm" type="video/webm" />
                        <source src="/videos/hero_header_video.mp4" type="video/mp4" />
                        Ton navigateur ne supporte pas les vidéos HTML5.
                    </video>
                ) : (
                    <div
                        className="absolute left-0 top-0 h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: "url(/images/hero_header_poster.avif)" }}
                    />
                )}

                <div className="absolute inset-0 bg-surface-deep/40" />

                <Container className="relative z-10 flex h-full flex-col items-start justify-center gap-8">
                    <div>
                        <h1 className={cn(DISPLAY_TITLE, "mb-4 text-display-xl")}>Relève le défi ultime.</h1>
                        <p className="mb-6 max-w-2xl text-lead text-foreground/90">
                            La première course d&apos;obstacles format backyard au monde. La limite, c&apos;est toi.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                        <Button asChild size="hero" className="w-full sm:w-auto">
                            <Link href="/events/ultra-arena-2026/register">Je m&apos;inscris maintenant</Link>
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
