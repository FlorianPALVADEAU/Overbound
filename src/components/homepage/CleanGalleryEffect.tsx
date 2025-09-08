/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useRef, useState } from 'react'
import Headings from '../globals/Headings'
import Lenis from '@studio-freight/lenis'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const images = [
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
                    title="Quelques obstacles"
                    description="Découvre une sélection d'obstacles emblématiques qui te mettront au défi lors de l'Overbound."
                />

                {/* slider d'image */}
                <div ref={gallery} className='w-full flex flex-col items-start'>
                    <div className="h-[175vh] overflow-hidden bg-[rgb(45, 45, 45)]">
                        <div className="relative -top-[12.5vh] h-[200vh] flex gap-[2vw] p-[2vw]">
                            <Column y={y} images={[images[0], images[1], images[2]]} isClient={isClient} columnIndex={0}/>
                            <Column y={y2} images={[images[3], images[4],images[4], images[5]]} isClient={isClient} columnIndex={1}/>
                            <Column y={y3} images={[images[6], images[7], images[8]]} isClient={isClient} columnIndex={2}/>
                            <Column y={y4} images={[images[9], images[10], images[11]]} isClient={isClient} columnIndex={3}/>
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
                    <div key={i} className="relative h-1/3 w-full rounded-md overflow-hidden">
                        <img 
                            className="object-cover w-full h-full"
                            src={src}
                            alt='image'
                        />
                    </div>
                )
            })
        }
    </motion.div>
  )
}

export default ObstaclesOverview