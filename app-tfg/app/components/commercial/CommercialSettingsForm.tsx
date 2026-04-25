"use client";

import { useEffect, useState } from "react";
import H1Title from "@/app/components/H1Title";
import PageTransition from "@/app/components/animations/PageTransition";
import SafeForm from "@/app/components/forms/SafeForm";
import SubmitButton from "@/app/components/forms/SubmitButton";
import { useCommercialProfile } from "@/app/hooks/api/useCommercialProfile";
import { normalizeTimeForInput } from "@/lib/utils/time";

export default function CommercialSettingsForm() {
	const { data, loading, error, save } = useCommercialProfile();
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState("");

	const [workdayStartTime, setWorkdayStartTime] = useState("");
	const [workdayEndTime, setWorkdayEndTime] = useState("");
	const [deliveryVisitDurationMinutes, setDeliveryVisitDurationMinutes] =
		useState("10");
	const [routineVisitDurationMinutes, setRoutineVisitDurationMinutes] =
		useState("35");

	useEffect(() => {
		if (!data) {
			return;
		}

		setWorkdayStartTime(normalizeTimeForInput(data.workday_start_time));
		setWorkdayEndTime(normalizeTimeForInput(data.workday_end_time));
		setDeliveryVisitDurationMinutes(
			String(data.delivery_visit_duration_minutes ?? 10),
		);
		setRoutineVisitDurationMinutes(
			String(data.routine_visit_duration_minutes ?? 35),
		);
	}, [data]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setSuccess("");

		const savedProfile = await save({
			workdayStartTime: workdayStartTime || null,
			workdayEndTime: workdayEndTime || null,
			deliveryVisitDurationMinutes: Number(deliveryVisitDurationMinutes),
			routineVisitDurationMinutes: Number(routineVisitDurationMinutes),
		});

		if (savedProfile) {
			setSuccess("Configuracion guardada correctamente.");
		}

		setSaving(false);
	}

	return (
		<PageTransition>
			<div className="space-y-6">
				<H1Title
					title="Ajustes comerciales"
					subtitle="Define la jornada base y los tiempos operativos que usara el modulo 2."
				/>

				<section className="glass-card rounded-3xl border border-white/30 bg-white/75 p-6 shadow-xl backdrop-blur">
					<div className="max-w-3xl space-y-3">
						<h2 className="text-xl font-semibold text-slate-900">
							Planificacion diaria
						</h2>
						<p className="text-sm text-slate-600">
							Esta configuracion servira como base para calcular el tiempo
							disponible en ruta segun tu jornada habitual.
						</p>
					</div>
				</section>

				{loading ? (
					<section className="glass-card rounded-3xl border border-white/30 bg-white/75 p-6 shadow-xl backdrop-blur">
						<p className="text-sm text-slate-600">
							Cargando configuracion comercial...
						</p>
					</section>
				) : null}

				{!loading ? (
					<section className="glass-card rounded-3xl border border-white/30 bg-white/75 p-6 shadow-xl backdrop-blur">
						<SafeForm
							onSubmit={handleSubmit}
							className="grid gap-4 md:grid-cols-2"
						>
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Inicio de jornada
								</label>
								<input
									type="time"
									value={workdayStartTime}
									onChange={(event) => setWorkdayStartTime(event.target.value)}
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Fin de jornada
								</label>
								<input
									type="time"
									value={workdayEndTime}
									onChange={(event) => setWorkdayEndTime(event.target.value)}
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Duracion visita de reparto (min)
								</label>
								<input
									type="number"
									min="1"
									step="1"
									value={deliveryVisitDurationMinutes}
									onChange={(event) =>
										setDeliveryVisitDurationMinutes(event.target.value)
									}
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
									required
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Duracion visita rutinaria (min)
								</label>
								<input
									type="number"
									min="1"
									step="1"
									value={routineVisitDurationMinutes}
									onChange={(event) =>
										setRoutineVisitDurationMinutes(event.target.value)
									}
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
									required
								/>
							</div>

							<div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
								El horario especifico de cada peluqueria se aplicara despues
								sobre esta base diaria para decidir el encaje real de visitas.
							</div>

							<div className="md:col-span-2 flex flex-wrap items-center gap-3">
								<SubmitButton
									isSubmitting={saving}
									submittingText="Guardando..."
									className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
								>
									Guardar ajustes
								</SubmitButton>

								{success ? (
									<p className="text-sm font-medium text-emerald-700">
										{success}
									</p>
								) : null}

								{error ? (
									<p className="text-sm font-medium text-red-600">{error}</p>
								) : null}
							</div>
						</SafeForm>
					</section>
				) : null}
			</div>
		</PageTransition>
	);
}
