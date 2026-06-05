"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PageTransition from "./components/animations/PageTransition";

const workflowItems = [
	"Cliente profesional",
	"Catalogo y coloracion",
	"Pedido con promocion",
	"Ruta y entrega QR",
];

export default function Home() {
	const [leaving, setLeaving] = useState(false);

	return (
		<main className="app-bg relative min-h-screen overflow-hidden text-slate-950">
			<div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.92),rgba(255,255,255,0.55)_36%,rgba(15,23,42,0.28)_100%)]" />
			<div className="fixed inset-0 -z-10 bg-gradient-to-br from-white/80 via-white/35 to-slate-950/35" />

			<section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
				<header className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/60 bg-white/58 px-4 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
					<div className="flex items-center gap-3">
						<div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-950/10 ring-1 ring-slate-200/80">
							<Image
								src="/icons/icon-192.png"
								alt="Kinestilistas"
								width={42}
								height={42}
								className="h-10 w-10 object-contain"
								priority
							/>
						</div>
						<div>
							<p className="text-sm font-black uppercase tracking-[0.22em]">
								Kinestilistas
							</p>
							<p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
								Alta peluqueria & estetica
							</p>
						</div>
					</div>

					<Link
						href="/login"
						onClick={() => setLeaving(true)}
						className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex"
					>
						Entrar
					</Link>
				</header>

				<PageTransition
					isLeaving={leaving}
					durationMs={420}
					className="grid flex-1 items-center gap-9 pt-20 pb-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10"
				>
					<div className="max-w-3xl">
						<h1 className="text-balance text-5xl font-black leading-[0.94] tracking-[-0.07em] text-slate-950 sm:text-6xl lg:text-7xl">
							La gestion diaria de tu salon, con mirada profesional.
						</h1>

						<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
							Kinestilistas centraliza catalogo, coloracion, clientes,
							pedidos, rutas, promociones y seguimiento comercial para que el
							equipo trabaje con menos ruido y mas contexto.
						</p>

						<div className="mt-7 flex flex-col gap-3 sm:flex-row">
							<Link
								href="/login"
								onClick={() => setLeaving(true)}
								className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-2xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95"
							>
								Acceder a mi espacio
							</Link>
							<Link
								href="/register"
								onClick={() => setLeaving(true)}
								className="inline-flex items-center justify-center rounded-full border border-slate-950/15 bg-white/68 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-white/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
							>
								Solicitar acceso
							</Link>
						</div>
					</div>

					<aside className="relative">
						<div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-white/70 blur-2xl lg:block" />
						<div className="rounded-[2.25rem] border border-white/70 bg-white/58 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
							<div className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-slate-950 text-white">
								<div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5">
									<p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
										Panel operativo
									</p>
									<h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
										De la visita al pedido, sin perder el hilo.
									</h2>
								</div>

								<div className="space-y-3 bg-white p-4 text-slate-950">
									{workflowItems.map((item, index) => (
										<div
											key={item}
											className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
										>
											<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">
												{index + 1}
											</span>
											<div>
												<p className="text-sm font-black text-slate-950">
													{item}
												</p>
												<p className="text-xs font-medium text-slate-500">
													{index === 0
														? "Perfil, nivel y datos comerciales"
														: index === 1
															? "Productos, tonos y soporte tecnico"
															: index === 2
																? "Descuentos activos y borrador"
																: "Reparto validado y trazabilidad"}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</aside>
				</PageTransition>
			</section>
		</main>
	);
}
