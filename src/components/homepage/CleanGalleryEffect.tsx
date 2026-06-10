'use client'
import React, { useEffect, useRef, useState } from 'react'
import Headings from '../globals/Headings'
import Lenis from '@studio-freight/lenis'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const images = [
    // Column 1 images
    "/images/images/a-big-tire-is falling-upside-down-thanks-to-a-young-man-pt2.avif",
    "/images/images/a-big-tire-is falling-upside-down-thanks-to-a-young-man.avif",
    "/images/images/a-big-tire-is-falling-upside-down-thanks-to-a-middle-aged-man.avif",
    "/images/images/a-group-of-friend-celebrating-after-a-race.avif",
    "/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle-pt2.avif",
    "/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle.avif",
    "/images/images/a-man-flipping-a-tire-with-overbound-headband.avif",
    "/images/images/a-man-shouting-of-happiness-very-happy.avif",
    "/images/images/a-man-smiling-in-a-field.avif",
    "/images/images/a-middle-aged-man-rolling-a-tire-over.avif",
    "/images/images/a-photograph-in-action.avif",
    "/images/images/a-smiling-running-man-black-weared-sport.avif",
    "/images/images/a-smiling-young-man-in-the-sun.avif",
    "/images/images/a-sporty-man-laughing-facing-forward-and-looking-to-the-left.avif",
    "/images/images/a-sunny-mood-with-runners-ready-to-go.avif",
    // Column 2 images
    "/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif",
    "/images/images/a-young-man-lifting-a-tire-from-the-ground.avif",
    "/images/images/a-young-men-carrying-a-wooden-log-on-his-shoulder-staring-at-the-camera.avif",
    "/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif",
    "/images/images/an-armed-crossed-man-talking-in-a-middle-of-a-circle-of-people.avif",
    "/images/images/blond-lady-carrying-chains.avif",
    "/images/images/blond-lady-running-sideview.avif",
    "/images/images/blond-lady-with-a-log-on-her-shoulder.avif",
    "/images/images/determined-look-of-a-young-man-lifting-a-tire.avif",
    "/images/images/kids-carrying-a-chain.avif",
    "/images/images/ladies-with-logs-on-their-shoulders.avif",
    "/images/images/lady-carrying-log.avif",
    "/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif",
    "/images/images/man-looking-determined-staring-at-the-floor.avif",
    "/images/images/middle-aged-lady-ramping-below-barbed-wires.avif",
    // Column 3 images
    "/images/images/middle-aged-man-running-towards-a-tire.avif",
    "/images/images/old-lady-ramping-below-barbed-wires.avif",
    "/images/images/old-man-carrying-chains.avif",
    "/images/images/osteopath-practicing-pt2.avif",
    "/images/images/osteopath-practicing.avif",
    "/images/images/overbound-headband-on-chains-with-grass-in-background.avif",
    "/images/images/participants-carrying-wooden-logs-going-uphill.avif",
    "/images/images/runner-wearing-glasses-astonished.avif",
    "/images/images/some-runners-carrying-logs-on-their-shoulders-running-uphill.avif",
    "/images/images/speaker-talking-in-microphone.avif",
    "/images/images/sport-coach-warming-up-participant.avif",
    "/images/images/tree-participants-running.avif",
    "/images/images/two-ladies-running.avif",
    "/images/images/two-mens-talking-to-each-other-with-wood-chops-on-their-shoulders.avif",
    "/images/images/two-ramping-mens-below-barbed-wires.avif",
    // Column 4 images
    "/images/images/two-runners-going-downhill-with-chains-on-their-backs.avif",
    "/images/images/two-runners-going-uphill-with-chains-on-their-backs.avif",
    "/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif",
    "/images/images/warm-up-of-many-participants-in-the-grass.avif",
    "/images/images/young-lady-carrying-log.avif",
    "/images/images/young-lady-ramping-below-barbed-wires.avif",
    "/images/images/young-lady-running-fast-blurry-effect.avif",
    "/images/images/young-lady-running.avif",
    "/images/images/young-lady-smiling-below-barbed-wires.avif",
    "/images/images/young-lady-smiling-in-the-grass.avif",
    "/images/images/young-man-carrying-a-log-on-his-shoulder.avif",
    "/images/images/young-man-carrying-a-swingy-chain-to-his-neck.avif",
    "/images/images/young-man-carrying-wooden-logs.avif",
    "/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif",
    "/images/images/young-man-ramping-under-barbed-wires-with-overbound-headband.avif",
]

const ObstaclesOverview = () => {
    const gallery = useRef<HTMLDivElement>(null);
    const [dimension, setDimension] = useState({width:0, height:0});
    const [isClient, setIsClient] = useState(false);
    
    // Initialize scroll progress with a ref to avoid SSR issues
    const { scrollYProgress } = useScroll({
        target: gallery,
        offset: ['start end', 'end start']
    })

    const { height } = dimension;

    // Always call hooks unconditionally, use fallback value for SSR
    const y = useTransform(scrollYProgress, [0, 1], [0, height * 2]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 4]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.5]);
    const y4 = useTransform(scrollYProgress, [0, 1], [0, height * 3]);

    useEffect( () => {
        // Set client flag to enable motion after hydration
        setIsClient(true);
        
        const lenis = new Lenis()

        const raf = (time: number): void => {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        const resize = () => {
            setDimension({width: window.innerWidth, height: window.innerHeight})
        }

        window.addEventListener("resize", resize)
        requestAnimationFrame(raf);
        resize();

        return () => {
            window.removeEventListener("resize", resize);
        }
    }, [])

    return (
        <section className="w-full items-center justify-center gap-24 py-20 pt-40 px-4 sm:px-6 xl:px-32">
            <div className='w-auto h-full flex flex-col justify-center items-center gap-6 mb-8'>
                <Headings
                    title="L'ambiance Overbound"
                    description="Découvre l'énergie et l'esprit de communauté qui animent chaque édition."
                />

                {/* slider d'image */}
                <div ref={gallery} className='w-full flex flex-col items-start'>
                    <div className="h-[175vh] overflow-hidden bg-[rgb(45, 45, 45)]">
                        <div className="relative -top-[12.5vh] h-[200vh] flex gap-[2vw] p-[2vw]">
                            <Column y={y} images={images.slice(0, 15)} isClient={isClient} columnIndex={0}/>
                            <Column y={y2} images={images.slice(15, 30)} isClient={isClient} columnIndex={1}/>
                            <Column y={y3} images={images.slice(30, 45)} isClient={isClient} columnIndex={2}/>
                            <Column y={y4} images={images.slice(45, 60)} isClient={isClient} columnIndex={3}/>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

interface ColumnProps {
  images: string[];
  y: MotionValue<number> | number;
  isClient: boolean;
}

const Column: React.FC<ColumnProps & { columnIndex?: number }> = ({ images, y, isClient, columnIndex = 0 }) => {
  // Define top offset per column
  const topOffsets = ["-45%", "-95%", "-45%", "-75%"];
  const top = topOffsets[columnIndex] || "0%";

  return (
    <motion.div 
        className="relative h-full w-1/4 min-w-[250px] flex flex-col gap-[2vw] whitespace-nowrap"
        style={{ 
            y: isClient ? y : 0,
            top: top,
        }}
        suppressHydrationWarning={true}
    >
        {
            images.map( (src, i) => {
                return (
                    <div key={i} className="relative w-full aspect-[3/4] rounded-md overflow-hidden">
                        <img
                            className="object-cover w-full h-full"
                            src={src}
                            alt='Overbound - course à obstacles'
                        />
                    </div>
                )
            })
        }
    </motion.div>
  )
}

export default ObstaclesOverview