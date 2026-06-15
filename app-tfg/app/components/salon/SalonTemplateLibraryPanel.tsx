"use client";

import FeedbackMessage from "@/app/components/ui/FeedbackMessage";
import type { SalonServiceTemplateSummary } from "@/lib/contracts/salon";
import type { SalonFeedbackState } from "./useSalonTechnicalEmailDraft";
import { inputClassName } from "./salon-client-detail-utils";

type SalonTemplateLibraryPanelProps = {
	templates: SalonServiceTemplateSummary[];
	templateName: string;
	isSavingTemplate: boolean;
	isSavingService: boolean;
	deletingTemplateId: string | null;
	templateFeedback: SalonFeedbackState;
	onTemplateNameChange: (value: string) => void;
	onSaveCurrentFormAsTemplate: () => void | Promise<void>;
	onApplyTemplate: (template: SalonServiceTemplateSummary) => void;
	onDeleteTemplate: (
		template: SalonServiceTemplateSummary,
	) => void | Promise<void>;
};

export default function SalonTemplateLibraryPanel({
	templates,
	templateName,
	isSavingTemplate,
	isSavingService,
	deletingTemplateId,
	templateFeedback,
	onTemplateNameChange,
	onSaveCurrentFormAsTemplate,
	onApplyTemplate,
	onDeleteTemplate,
}: SalonTemplateLibraryPanelProps) {
	return (
		<section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						Plantillas técnicas
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						Guarda técnicas recurrentes del salón y reutilízalas antes de
						registrar un nuevo servicio.
					</p>
				</div>
				<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
					{templates.length}
				</span>
			</div>

			<div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
				<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Nombre de la plantilla
						</label>
						<input
							value={templateName}
							onChange={(event) => onTemplateNameChange(event.target.value)}
							className={inputClassName}
							placeholder="Ej. Matiz beige habitual"
							disabled={isSavingTemplate}
						/>
					</div>
					<div className="flex items-end">
						<button
							type="button"
							onClick={onSaveCurrentFormAsTemplate}
							disabled={isSavingTemplate}
							className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
						>
							{isSavingTemplate ? "Guardando..." : "Guardar formulario actual"}
						</button>
					</div>
				</div>
				<p className="mt-3 text-sm text-slate-500">
					Se guardan el tipo de servicio, el resultado, la descripción técnica,
					la formula, las notas y los productos usados que haya ahora mismo en
					el formulario.
				</p>
			</div>

			{templateFeedback ? (
				<FeedbackMessage {...templateFeedback} className="mt-4" />
			) : null}

			{templates.length === 0 ? (
				<div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
					Aún no hay plantillas guardadas. Puedes preparar un servicio en el
					formulario y guardarlo para reutilizarlo después.
				</div>
			) : (
				<div className="mt-5 grid gap-4 xl:grid-cols-2">
					{templates.map((template) => (
						<article
							key={template.id}
							className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
										Plantilla
									</p>
									<h3 className="mt-1 text-base font-semibold text-slate-900">
										{template.name}
									</h3>
									<p className="mt-1 text-sm text-slate-500">
										{template.service_type}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
										{template.product_usages.length} productos
									</span>
									<button
										type="button"
										onClick={() => onApplyTemplate(template)}
										disabled={
											isSavingService ||
											isSavingTemplate ||
											deletingTemplateId === template.id
										}
										className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										Aplicar
									</button>
									<button
										type="button"
										onClick={() => onDeleteTemplate(template)}
										disabled={
											isSavingTemplate || deletingTemplateId === template.id
										}
										className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{deletingTemplateId === template.id
											? "Eliminando..."
											: "Eliminar"}
									</button>
								</div>
							</div>

							<div className="mt-4 grid gap-3 md:grid-cols-2">
								<div className="rounded-2xl bg-white px-4 py-3">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Formula
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{template.formula || "Sin formula registrada"}
									</p>
								</div>
								<div className="rounded-2xl bg-white px-4 py-3">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Resumen del resultado
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{template.result || "Sin resumen descrito"}
									</p>
								</div>
							</div>

							{template.technical_description ? (
								<p className="mt-4 text-sm leading-6 text-slate-600">
									{template.technical_description}
								</p>
							) : null}
						</article>
					))}
				</div>
			)}
		</section>
	);
}
