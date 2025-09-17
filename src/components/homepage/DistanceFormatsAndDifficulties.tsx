import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Headings from "../globals/Headings";
import SubHeadings from "../globals/SubHeadings";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

const steps = [
	{
		title: "Étape 1",
		text: "Choisis un format qui te plaît et qui semble adapté à ton niveau physique. Si tu ne sais pas par où commencer, nous recommandons le format 6km ou 12km.",
		image: "https://images.unsplash.com/photo-1492337384533-a211c15b6d64?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 2",
		text: "🟢 Standard : Obstacles classiques, pas de contraintes.\n🟡 Guerrier : Obstacles plus exigeants, pas de contraintes.\n🔴 Légende : Obstacles plus exigeants, chevilles & mains lestées.",
		image: "https://images.unsplash.com/photo-1602389569471-5df5bde61968?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 3",
		text: "Remplis un formulaire simple et 100% sécurisé, ajoute les extras de ton choix, effectue le paiement et ta place sera réservée.",
		image: "https://images.unsplash.com/photo-1498581444814-7e44d2fbe0e2?q=80&w=1098&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 4",
		text: "Je reçois un mail de confirmation, mon guide d'entraînement et mon kit athlète pour le jour J.",
		image: "https://images.unsplash.com/photo-1558734918-dfc4fe470147?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
];

type FormatCardProps = {
	title: string;
	distance: string;
	buttonText: string;
	doubleHeight?: boolean;
};

const FormatCard: React.FC<FormatCardProps> = ({ title, distance, buttonText, doubleHeight = false }) => {
	return (
		<Card
			className={`
				flex flex-col justify-between relative
				${
					doubleHeight ? "row-span-2" : "row-span-1"
				}
			`}
			style={{
				backgroundImage: 'url("https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			<CardHeader>
				<CardTitle>
					<div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/30 to-transparent" />
					<SubHeadings title={distance} description={title} sx="relative z-10" />
				</CardTitle>
			</CardHeader>
			<CardContent className="flex justify-end z-1">
				<Link href="/events">
					<Button className="w-58 h-14 bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] text-white border-0">{buttonText}</Button>
				</Link>
			</CardContent>
		</Card>
	);
};

export default function DistanceFormatsAndDifficulties() {
	const timelineRef = useRef<HTMLDivElement | null>(null);
	const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
	const firstPointRef = useRef<HTMLDivElement | null>(null);
	const lastPointRef = useRef<HTMLDivElement | null>(null);
	const [lineBounds, setLineBounds] = useState({ top: 0, height: 0 });
	const [activeStep, setActiveStep] = useState(0);

	const progress = useMotionValue(0);
	const lineProgress = useSpring(progress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001,
	});

	useEffect(() => {
		const target = steps.length > 1 ? activeStep / (steps.length - 1) : 1;
		progress.set(target);
	}, [activeStep, progress]);

	useEffect(() => {
		const observers = stepRefs.current.map((ref, index) => {
			if (!ref) return null;

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							setActiveStep(index);
						}
					});
				},
				{
					threshold: 0.3,
					rootMargin: "-30% 0px -50% 0px",
				}
			);

			observer.observe(ref);
			return observer;
		});

		return () => {
			observers.forEach((observer) => {
				if (observer) observer.disconnect();
			});
		};
	}, []);

	useEffect(() => {
		function compute() {
			const container = timelineRef.current;
			const first = firstPointRef.current;
			const last = lastPointRef.current;
			if (!container || !first || !last) return;

			const containerRect = container.getBoundingClientRect();
			const firstRect = first.getBoundingClientRect();
			const lastRect = last.getBoundingClientRect();

			const top = firstRect.top - containerRect.top + firstRect.height / 2;
			const end = lastRect.top - containerRect.top + lastRect.height / 2;

			setLineBounds({
				top: Math.max(0, Math.round(top)),
				height: Math.max(0, Math.round(end - top)),
			});
		}

		const id = requestAnimationFrame(compute);
		window.addEventListener("resize", compute);
		return () => {
			cancelAnimationFrame(id);
			window.removeEventListener("resize", compute);
		};
	}, [stepRefs.current.length]);

	return (
		<section 
			className="w-full items-center justify-center gap-24 py-20 pt-40 px-4 sm:px-6 xl:px-32"
			style={{backgroundColor: '#141414'}}
		>
			<div className="flex flex-col gap-8 sm:gap-10 xl:gap-12 h-full">
				<Headings
					title="Distances, Formats & Difficulté"
					description="Choisissez votre parcours et préparez-vous à relever le défi."
				/>

				{/* Grille des courses */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 auto-rows-[350px]">
					<FormatCard title="Le rite du Guerrier" distance="6km" buttonText="Je découvre le rite" />
					<FormatCard title="La voie du Héros" distance="12km" buttonText="Je deviens un Héros" />
					<FormatCard title="Tribal Royale" distance="24km" buttonText="Je relève le défi" />
					<FormatCard
						title="Volontaires"
						distance="1 course gratuite !"
						buttonText="J'aide la tribu Overbound"
						doubleHeight={true}
					/>
					<FormatCard title="Tribal Kids" distance="1km, 2km & 3km" buttonText="Mon enfant est un guerrier" />
				</div>


				<SubHeadings 
					title="Peu importe ton niveau, il y a un format rien que pour toi" 
					sx="mt-12 text-white"
				/>
				{/* === TIMELINE === */}
				<div className="relative flex flex-col lg:flex-row w-full gap-12">
					{/* Image à gauche avec position sticky améliorée */}
					<div className="w-full lg:w-1/2 lg:sticky lg:top-24 lg:self-start flex items-start justify-center">
						<div className="w-full lg:flex lg:items-start lg:pt-8">
							<div className="relative w-full h-[300px] lg:h-[500px] rounded-xl overflow-hidden shadow-xl">
								<AnimatePresence mode="wait">
									<motion.img
										key={activeStep}
										src={steps[activeStep].image}
										alt={steps[activeStep].title}
										className="absolute inset-0 w-full h-full object-cover"
										initial={{
											opacity: 0.8,
											scale: 1,
										}}
										animate={{
											opacity: 1,
											scale: 1,
											filter: "blur(0px)",
										}}
										exit={{
											opacity: 0.8,
											filter: "blur(5px)",
										}}
										transition={{
											duration: 0.3,
											ease: [0.25, 0.46, 0.45, 0.94],
										}}
									/>
								</AnimatePresence>

								{/* Overlay avec le titre de l'étape */}
								<motion.div
									className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									key={`title-${activeStep}`}
									transition={{ duration: 0.6, delay: 0.3 }}
								>
									<h3 className="text-white text-xl lg:text-2xl font-bold">
										{steps[activeStep].title}
									</h3>
								</motion.div>
							</div>
						</div>
					</div>

					{/* Timeline avec espacement amélioré */}
					<div ref={timelineRef} className="relative w-full lg:w-1/2">
						{/* Ligne de fond */}
						<div
							className="absolute left-6 bg-gray-200 rounded-full transition-all duration-300"
							style={{ top: lineBounds.top, height: lineBounds.height, width: 6 }}
						/>

						{/* Ligne progressive avec animation fluide */}
						<motion.div
							style={{
								scaleY: lineProgress,
								transformOrigin: "top",
								top: lineBounds.top,
								height: lineBounds.height,
								width: 6,
							}}
							className="absolute left-6 bg-gradient-to-b from-[#26AA26] via-[#26AA26] to-[#1e8a1e] rounded-full shadow-sm"
						/>

						<div className="flex flex-col gap-16 lg:gap-20">
							{steps.map((step, index) => (
								<div
									key={index}
									ref={(el) => {
										stepRefs.current[index] = el;
									}}
									className="relative pl-16 min-h-[140px] py-6"
								>
									{/* Point avec animation améliorée */}
									<motion.div
										ref={
											index === 0
												? firstPointRef
												: index === steps.length - 1
												? lastPointRef
												: null
										}
										className={`absolute left-[17px] top-8 w-5 h-5 rounded-full border-3 transition-all duration-700 ease-out ${
											activeStep >= index
												? "bg-[#26AA26] border-[#1e8a1e] shadow-lg shadow-[#26AA26]/30"
												: "bg-white border-gray-300"
										}`}
										animate={{
											scale: activeStep === index ? 1.4 : activeStep > index ? 1.1 : 1,
											boxShadow:
												activeStep === index
													? "0 0 20px rgba(38, 170, 38, 0.4)"
													: activeStep > index
													? "0 0 10px rgba(38, 170, 38, 0.2)"
													: "0 2px 4px rgba(0, 0, 0, 0.1)",
										}}
										transition={{ duration: 0.5, ease: "easeOut" }}
									/>

									{/* Pulse effect pour l'étape active */}
									{activeStep === index && (
										<motion.div
											className="absolute left-[15px] top-[30px] w-6 h-6 rounded-full bg-[#26AA26] opacity-30"
											animate={{
												scale: [1, 1.8, 1],
												opacity: [0.3, 0, 0.3],
											}}
											transition={{
												duration: 2,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										/>
									)}

									<motion.div
										initial={{ opacity: 0, x: -30 }}
										whileInView={{ opacity: 1, x: 0 }}
										transition={{
											duration: 0.8,
											delay: index * 0.15,
											ease: [0.25, 0.46, 0.45, 0.94],
										}}
										viewport={{ once: true, margin: "-10%" }}
									>
										<Card
											className={`transition-all duration-700 ease-out transform bg-gray-200  ${
												activeStep !== index
													? "shadow-xl border-[#26AA26]/50 scale-[1.02] bg-[#26AA26]/5"
													: "shadow-md hover:shadow-lg"
											}`}
										>
											<CardHeader>
												<CardTitle
													className={`transition-all duration-500 ${
														activeStep !== index ? "text-[#26AA26]" : "text-gray-800"
													}`}
												>
													{step.title}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<motion.p
													className={`whitespace-pre-line transition-colors duration-500 ${
														activeStep !== index ? "text-gray-700" : "text-gray-600"
													}`}
													animate={{
														color: activeStep !== index ? "#374151" : "#6B7280",
													}}
												>
													{step.text}
												</motion.p>
											</CardContent>
										</Card>
									</motion.div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}