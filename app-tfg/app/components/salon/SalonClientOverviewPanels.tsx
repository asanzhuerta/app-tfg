"use client";

import type { FormEvent } from "react";
import FeedbackMessage from "@/app/components/ui/FeedbackMessage";
import type { SalonClientDetail } from "@/lib/contracts/salon";
import { formatDateShort } from "@/lib/utils/user-utils";
import type { SalonFeedbackState } from "./useSalonTechnicalEmailDraft";
import {
	inputClassName,
	textareaClassName,
} from "./salon-client-detail-utils";

type SalonClientOverviewPanelsProps = {
	detail: SalonClientDetail;
	name: string;
	phone: string;
	email: string;
	notes: string;
	isSavingProfile: boolean;
	profileFeedback: SalonFeedbackState;
	onNameChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onNotesChange: (value: string) => void;
	onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export default function SalonClientOverviewPanels({
	detail,
	name,
	phone,
	email,
	notes,
	isSavingProfile,
	profileFeedback,
	onNameChange,
	onPhoneChange,
	onEmailChange,
	onNotesChange,
	onProfileSubmit,
}: SalonClientOverviewPanelsProps) {
	return (
		<div className="space-y-6">
			<section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
				<h2 className="text-lg font-semibold text-slate-900">
					Ficha técnica base
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					Actualiza los datos permanentes del historial del salón.
				</p>

				<form className="mt-5 space-y-4" onSubmit={onProfileSubmit}>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Nombre
						</label>
						<input
							value={name}
							onChange={(event) => onNameChange(event.target.value)}
							className={inputClassName}
							disabled={isSavingProfile}
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Teléfono
						</label>
						<input
							value={phone}
							onChange={(event) => onPhoneChange(event.target.value)}
							className={inputClassName}
							disabled={isSavingProfile}
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Correo
						</label>
						<input
							type="email"
							value={email}
							onChange={(event) => onEmailChange(event.target.value)}
							className={inputClassName}
							disabled={isSavingProfile}
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Notas generales
						</label>
						<textarea
							value={notes}
							onChange={(event) => onNotesChange(event.target.value)}
							className={textareaClassName}
							disabled={isSavingProfile}
						/>
					</div>

					<div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
						<div className="rounded-2xl bg-slate-50 px-4 py-3">
							<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
								Ultimo servicio
							</p>
							<p className="mt-1 text-base font-semibold text-slate-900">
								{detail.salonClient.last_service_at
									? formatDateShort(detail.salonClient.last_service_at)
									: "Sin historial"}
							</p>
						</div>
						<div className="rounded-2xl bg-slate-50 px-4 py-3">
							<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
								Sugerencias
							</p>
							<p className="mt-1 text-base font-semibold text-slate-900">
								{detail.suggestions.length}
							</p>
						</div>
					</div>

					{profileFeedback ? (
						<FeedbackMessage {...profileFeedback} />
					) : null}

					<button
						type="submit"
						disabled={isSavingProfile}
						className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
					>
						{isSavingProfile ? "Guardando..." : "Guardar ficha"}
					</button>
				</form>
			</section>

			<section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
				<h2 className="text-lg font-semibold text-slate-900">
					Sugerencias de producto
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					Se recalculan automáticamente a partir del historial técnico ya
					registrado.
				</p>

				{detail.suggestions.length === 0 ? (
					<div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
						Aún no hay suficientes usos de producto como para proponer
						referencias.
					</div>
				) : (
					<div className="mt-5 space-y-3">
						{detail.suggestions.map((suggestion) => (
							<div
								key={suggestion.id}
								className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
							>
								<p className="text-sm font-semibold text-slate-900">
									{suggestion.product_name}
									{suggestion.product_reference
										? ` · ${suggestion.product_reference}`
										: ""}
								</p>
								<p className="mt-1 text-sm text-slate-500">
									{suggestion.product_line_name || "Sin línea"}
								</p>
								<p className="mt-3 text-sm leading-6 text-slate-600">
									{suggestion.reason}
								</p>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
