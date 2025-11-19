import React, { useState, useRef, useEffect } from "react";
import {
	motion,
	useMotionValue,
	useSpring,
	AnimatePresence,
} from "framer-motion";
import Headings from "../globals/Headings";
import SubHeadings from "../globals/SubHeadings";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import {
	Mountain,
	Sparkles,
	Star,
	Waves,
	ArrowRight,
	Crown,
	Globe,
} from "lucide-react";
import NeedHelpChoosingYourFormat from "./NeedHelpChoosingYourFormat";

const steps = [
	{
		title: "Étape 1",
		text: "Choisis un format qui te plaît et qui semble adapté à ton niveau physique. Si tu ne sais pas par où commencer, nous recommandons le format 6km ou 12km.",
		image:
			"https://images.unsplash.com/photo-1492337384533-a211c15b6d64?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 2",
		text: "INNOVATION MONDIALE : Choisis ton niveau de difficulté !\n\n🟢 STANDARD : Obstacles classiques accessibles\n🟡 GUERRIER : Obstacles exigeants, technique requise\n🔴 LÉGENDE : Obstacles extrêmes + lests obligatoires\n\nMême parcours, 3 défis différents. Personne d'autre ne fait ça.",
		image:
			"https://images.unsplash.com/photo-1602389569471-5df5bde61968?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 3",
		text: "Remplis un formulaire simple et 100% sécurisé, ajoute les extras de ton choix, effectue le paiement et ta place sera réservée.",
		image:
			"https://images.unsplash.com/photo-1498581444814-7e44d2fbe0e2?q=80&w=1098&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		title: "Étape 4",
		text: "Reçois un mail de confirmation, ton guide d'entraînement et ton kit athlète pour le jour J.",
		image:
			"https://images.unsplash.com/photo-1558734918-dfc4fe470147?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
];

type FormatCardProps = {
	title: string;
	distance: string;
	buttonText: string;
	doubleHeight?: boolean;
};

const FormatCard: React.FC<FormatCardProps> = ({
	title,
	distance,
	buttonText,
	doubleHeight = false,
}) => {
	return (
		<Card
			className={`
				flex flex-col justify-between relative
				${doubleHeight ? "row-span-2" : "row-span-1"}
			`}
			style={{
				backgroundImage:
					'url("https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			<CardHeader>
				<CardTitle>
					<div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/30 to-transparent" />
					<SubHeadings
						title={distance}
						description={title}
						sx="relative z-10"
					/>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex justify-end z-1">
				<Link href="/events">
					<Button className="w-58 h-14 bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] text-white border-0">
						{buttonText}
					</Button>
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
			className="w-full items-center justify-center gap-30 py-20 pt-40"
			// style={{ backgroundColor: "#141414" }}
		>
			<div className="w-full flex flex-col gap-8 sm:gap-10 xl:gap-50 h-full ">
				<div className="relative w-full bg-[#101010] flex flex-col items-center text-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 px-4 sm:px-6 xl:px-32 py-20">
					<Headings
						title="Choisis ta distance ET ton niveau de difficulté"
						description="Innovation mondiale : 3 couleurs, 3 niveaux de difficulté sur le même parcours."
					/>

					<div className="relative z-10 mx-auto flex w-full flex-col gap-10">
						{/* Badge "Première Mondiale" */}
							<div className="text-center">
								<Badge className="bg-amber-500/20 text-amber-600 border-amber-500/40 font-bold px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-normal text-center">
									<Globe className="h-4 w-4" />
									<span className="leading-snug">Première mondiale — système de difficulté modulaire</span>
								</Badge>
							</div>

						<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
							<Card className="group hover:-translate-y-1 transition-all border-border/60">
								<CardHeader className="space-y-3">
									<Badge className="bg-green-500/20 text-green-600 w-fit">
										<Mountain className="h-4 w-4 mr-1" />
										Sprint
									</Badge>
									<CardTitle className="text-2xl">Le Rite du Guerrier</CardTitle>
									<p className="text-sm font-medium text-muted-foreground">
										6 km · 20 obstacles
									</p>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col justify-between space-y-4">
									<p className="text-sm text-muted-foreground leading-relaxed">
										Idéal pour découvrir les courses à obstacles. Un cocktail d'endurance et de fun.
									</p>
									<Button
										asChild
										variant="outline"
										className="w-full rounded-full"
										size="sm"
									>
										<Link href="/races/rite-du-guerrier">
											Découvrir
											<ArrowRight className="ml-2 h-3 w-3 transition group-hover:translate-x-1" />
										</Link>
									</Button>
								</CardContent>
							</Card>

							<Card className="group hover:-translate-y-1 transition-all border-border/60">
								<CardHeader className="space-y-3">
									<Badge className="bg-blue-500/20 text-blue-600 w-fit">
										<Sparkles className="h-4 w-4 mr-1" />
										Intermédiaire
									</Badge>
									<CardTitle className="text-2xl">La Voie du Héros</CardTitle>
									<p className="text-sm font-medium text-muted-foreground">
										12 km · 35 obstacles
									</p>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col justify-between space-y-4">
									<p className="text-sm text-muted-foreground leading-relaxed">
										Un véritable défi d'endurance et de technique qui saura te mettre à l'épreuve. La mission parfaite pour les coureurs réguliers.
									</p>
									<Button
										asChild
										variant="outline"
										className="w-full rounded-full"
										size="sm"
									>
										<Link href="/races/voie-du-heros">
											Découvrir
											<ArrowRight className="ml-2 h-3 w-3 transition group-hover:translate-x-1" />
										</Link>
									</Button>
								</CardContent>
							</Card>

							<Card className="group hover:-translate-y-1 transition-all border-amber-500/40 bg-gradient-to-br from-background to-amber-500/5">
								<CardHeader className="space-y-3">
									<Badge className="bg-amber-500 text-white w-fit">
										<Crown className="h-4 w-4 mr-1" />
										Mental
									</Badge>
									<CardTitle className="text-2xl">Tribal Royale</CardTitle>
									<p className="text-sm font-medium text-muted-foreground">
										∞ km · ∞ obstacles
									</p>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col justify-between space-y-4">
									<p className="text-sm text-muted-foreground leading-relaxed">
										<span className="text-amber-600 font-semibold">
											Format backyard inédit.
										</span>{" "}
										Élimination progressive. Le dernier debout gagne (qui aura le meilleur mental ?).
									</p>
									<Button
										asChild
										className="w-full rounded-full bg-amber-600 hover:bg-amber-700"
										size="sm"
									>
										<Link href="/races/tribale-royale">
											En savoir plus
											<ArrowRight className="ml-2 h-3 w-3" />
										</Link>
									</Button>
								</CardContent>
							</Card>

							<Card className="group hover:-translate-y-1 transition-all border-border/60">
								<CardHeader className="space-y-3">
									<Badge className="bg-purple-500/20 text-purple-600 w-fit">
										<Waves className="h-4 w-4 mr-1" />
										Famille
									</Badge>
									<CardTitle className="text-2xl">Tribal Kids</CardTitle>
									<p className="text-sm font-medium text-muted-foreground">
										1 / 2 / 3 km
									</p>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col justify-between space-y-4">
									<p className="text-sm text-muted-foreground leading-relaxed">
										Pour les 6-14 ans, esprit collectif. Possibilité pour les parents d'accompagner leurs enfants. Obstacles ludiques et sécurisés.
									</p>
									<Button
										asChild
										variant="outline"
										className="w-full rounded-full"
										size="sm"
									>
										<Link href="/races/tribale-kids">
											Découvrir
											<ArrowRight className="ml-2 h-3 w-3 transition group-hover:translate-x-1" />
										</Link>
									</Button>
								</CardContent>
							</Card>
						</div>

						<NeedHelpChoosingYourFormat />
					</div>
					<Image
						src="/images/wall-texture.png"
						alt="Wall texture decoration"
						width={600}
						height={400}
						className="w-full h-full absolute top-0 left-0 object-cover opacity-40"
					/>
				</div>

				<div className="w-full flex flex-col items-center gap-6 px-4 sm:px-6 xl:px-32">
					<Headings
						title="Peu importe ton niveau, il y a un format rien que pour toi"
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
								style={{
									top: lineBounds.top,
									height: lineBounds.height,
									width: 6,
								}}
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
											className={`absolute left-[17px] top-8 w-5 h-5 rounded-full border-3 transition-all duration-700 ease-out ${activeStep >= index
													? "bg-[#26AA26] border-[#1e8a1e] shadow-lg shadow-[#26AA26]/30"
													: "bg-white border-gray-300"
												}`}
											animate={{
												scale:
													activeStep === index
														? 1.4
														: activeStep > index
															? 1.1
															: 1,
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
												className={`transition-all duration-700 ease-out transform bg-gray-200  ${activeStep !== index
														? "shadow-xl border-[#26AA26]/50 scale-[1.02] bg-[#26AA26]/5"
														: "shadow-md hover:shadow-lg"
													}`}
											>
												<CardHeader>
													<CardTitle
														className={`transition-all duration-500 ${activeStep !== index
																? "text-[#26AA26]"
																: "text-gray-800"
															}`}
													>
														{step.title}
													</CardTitle>
												</CardHeader>
											<CardContent>
													<motion.p
														className={`whitespace-pre-line transition-colors duration-500 ${activeStep !== index
																? "text-gray-700"
																: "text-gray-600"
															}`}
														animate={{
															color: activeStep !== index ? "#374151" : "#6B7280",
														}}
													>
														{step.text}
													</motion.p>
													{index === 1 ? (
														<div className="mt-4 gap-2 flex">
															<Link
																href="/trainings/what-race-for-me"
																className="inline-flex items-center gap-1 rounded-full border border-[#26AA26]/40 px-3 py-1 text-[#26AA26] text-sm underline-offset-4 hover:bg-[#26AA26]/10 hover:underline"
															>
																↗ Besoin d'aide pour choisir ?
															</Link>
															<Link
																href="/about/concept"
																className="inline-flex items-center gap-1 rounded-full border border-[#26AA26]/40 px-3 py-1 text-[#26AA26] text-sm underline-offset-4 hover:bg-[#26AA26]/10 hover:underline"
															>
																↗ Le concept
															</Link>
														</div>
													) : null}
												</CardContent>
											</Card>
										</motion.div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
