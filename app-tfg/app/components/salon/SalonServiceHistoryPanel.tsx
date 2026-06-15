"use client";

import Image from "next/image";
import FeedbackMessage from "@/app/components/ui/FeedbackMessage";
import type {
	SalonServiceSummary,
	SalonTechnicalEmailDraft,
} from "@/lib/contracts/salon";
import { formatDateShort } from "@/lib/utils/user-utils";
import {
	buildSalonColorToneLabel,
	formatSalonQuantity,
} from "./salon-ui";
import {
	inputClassName,
	textareaClassName,
} from "./salon-client-detail-utils";
import type { SalonFeedbackState } from "./useSalonTechnicalEmailDraft";

type SalonServiceHistoryPanelProps = {
	historyCounterLabel: string;
	historySearch: string;
	setHistorySearch: (value: string) => void;
	historyServiceType: string;
	setHistoryServiceType: (value: string) => void;
	historyDateFrom: string;
	setHistoryDateFrom: (value: string) => void;
	historyDateTo: string;
	setHistoryDateTo: (value: string) => void;
	serviceTypeOptions: string[];
	filteredServices: SalonServiceSummary[];
	totalServiceCount: number;
	editingServiceId: string | null;
	deletingServiceId: string | null;
	isSavingService: boolean;
	handleOpenTechnicalEmailDraft: (
		service: SalonServiceSummary,
	) => void | Promise<void>;
	startServiceEditing: (service: SalonServiceSummary) => void;
	handleDeleteService: (service: SalonServiceSummary) => void | Promise<void>;
	technicalEmailDraftServiceId: string | null;
	isLoadingTechnicalEmail: boolean;
	resetTechnicalEmailDraft: () => void;
	technicalEmailDraft: SalonTechnicalEmailDraft | null;
	technicalEmailSubject: string;
	setTechnicalEmailSubject: (value: string) => void;
	technicalEmailBody: string;
	setTechnicalEmailBody: (value: string) => void;
	technicalEmailMailtoHref: string | null;
	handleCopyTechnicalEmailDraft: () => void | Promise<void>;
	technicalEmailFeedback: SalonFeedbackState;
};

export default function SalonServiceHistoryPanel({
	historyCounterLabel,
	historySearch,
	setHistorySearch,
	historyServiceType,
	setHistoryServiceType,
	historyDateFrom,
	setHistoryDateFrom,
	historyDateTo,
	setHistoryDateTo,
	serviceTypeOptions,
	filteredServices,
	totalServiceCount,
	editingServiceId,
	deletingServiceId,
	isSavingService,
	handleOpenTechnicalEmailDraft,
	startServiceEditing,
	handleDeleteService,
	technicalEmailDraftServiceId,
	isLoadingTechnicalEmail,
	resetTechnicalEmailDraft,
	technicalEmailDraft,
	technicalEmailSubject,
	setTechnicalEmailSubject,
	technicalEmailBody,
	setTechnicalEmailBody,
	technicalEmailMailtoHref,
	handleCopyTechnicalEmailDraft,
	technicalEmailFeedback,
}: SalonServiceHistoryPanelProps) {
	return (
		<section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
			<div className="mb-5 flex items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						Historial técnico
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						Consulta, filtra y corrige todos los trabajos ya registrados
						para este cliente.
					</p>
				</div>
				<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
					{historyCounterLabel}
				</span>
			</div>

			<div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
				<input
					value={historySearch}
					onChange={(event) => setHistorySearch(event.target.value)}
					className={inputClassName}
					placeholder="Buscar por técnica, formula o producto"
				/>
				<select
					value={historyServiceType}
					onChange={(event) => setHistoryServiceType(event.target.value)}
					className={inputClassName}
				>
					<option value="">Todos los tipos</option>
					{serviceTypeOptions.map((serviceTypeOption) => (
						<option key={serviceTypeOption} value={serviceTypeOption}>
							{serviceTypeOption}
						</option>
					))}
				</select>
				<input
					type="date"
					value={historyDateFrom}
					onChange={(event) => setHistoryDateFrom(event.target.value)}
					className={inputClassName}
				/>
				<input
					type="date"
					value={historyDateTo}
					onChange={(event) => setHistoryDateTo(event.target.value)}
					className={inputClassName}
				/>
				<button
					type="button"
					onClick={() => {
						setHistorySearch("");
						setHistoryServiceType("");
						setHistoryDateFrom("");
						setHistoryDateTo("");
					}}
					className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:col-span-2 xl:col-span-4"
				>
					Limpiar filtros
				</button>
			</div>

			{filteredServices.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
					{totalServiceCount === 0
						? "Aún no hay servicios registrados para esta ficha."
						: "No hay servicios que coincidan con los filtros actuales."}
				</div>
			) : (
				<div className="space-y-4">
					{filteredServices.map((service) => (
						<article
							key={service.id}
							className={`rounded-3xl border p-5 ${
								editingServiceId === service.id
									? "border-slate-900 bg-white shadow-sm"
									: "border-slate-200 bg-slate-50/80"
							}`}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
										{formatDateShort(service.service_date)}
									</p>
									<h3 className="mt-1 text-lg font-semibold text-slate-900">
										{service.service_type}
									</h3>
								</div>
								<div className="flex flex-wrap items-center justify-end gap-2">
									<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
										{service.product_usages.length} productos
									</span>
									<button
										type="button"
										onClick={() => handleOpenTechnicalEmailDraft(service)}
										disabled={
											isSavingService || deletingServiceId === service.id
										}
										className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{technicalEmailDraftServiceId === service.id &&
										!isLoadingTechnicalEmail
											? "Ocultar correo"
											: isLoadingTechnicalEmail &&
													technicalEmailDraftServiceId === service.id
												? "Preparando..."
												: "Correo técnico"}
									</button>
									<button
										type="button"
										onClick={() => startServiceEditing(service)}
										disabled={
											isSavingService || deletingServiceId === service.id
										}
										className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										Editar
									</button>
									<button
										type="button"
										onClick={() => handleDeleteService(service)}
										disabled={
											isSavingService || deletingServiceId === service.id
										}
										className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{deletingServiceId === service.id
											? "Eliminando..."
											: "Eliminar"}
									</button>
								</div>
							</div>

							{technicalEmailDraftServiceId === service.id ? (
								<div className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
												Correo técnico
											</p>
											<p className="mt-1 text-sm text-slate-500">
												Prepara un borrador editable para compartir este
												seguimiento con el cliente.
											</p>
										</div>
										<button
											type="button"
											onClick={resetTechnicalEmailDraft}
											className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
										>
											Cerrar
										</button>
									</div>

									{isLoadingTechnicalEmail ? (
										<div className="mt-4 rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
											Preparando borrador técnico...
										</div>
									) : technicalEmailDraft ? (
										<div className="mt-4 space-y-4">
											<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
												<div>
													<label className="mb-2 block text-sm font-medium text-slate-700">
														Destinataria
													</label>
													<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
														<p className="font-semibold text-slate-900">
															{technicalEmailDraft.recipient_name}
														</p>
														<p className="mt-1 text-slate-500">
															{technicalEmailDraft.recipient_email ||
																"Sin correo en la ficha"}
														</p>
													</div>
												</div>
												<div>
													<label className="mb-2 block text-sm font-medium text-slate-700">
														Generado
													</label>
													<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
														{formatDateShort(technicalEmailDraft.generated_at)}
													</div>
												</div>
											</div>

											<div>
												<label className="mb-2 block text-sm font-medium text-slate-700">
													Asunto
												</label>
												<input
													value={technicalEmailSubject}
													onChange={(event) =>
														setTechnicalEmailSubject(event.target.value)
													}
													className={inputClassName}
												/>
											</div>

											<div>
												<label className="mb-2 block text-sm font-medium text-slate-700">
													Cuerpo del correo
												</label>
												<textarea
													value={technicalEmailBody}
													onChange={(event) =>
														setTechnicalEmailBody(event.target.value)
													}
													className={`${textareaClassName} min-h-72`}
												/>
											</div>

											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													onClick={handleCopyTechnicalEmailDraft}
													className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
												>
													Copiar borrador
												</button>
												{technicalEmailMailtoHref ? (
													<a
														href={technicalEmailMailtoHref}
														className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
													>
														Abrir en correo
													</a>
												) : (
													<span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
														Anade un correo en la ficha para abrir el cliente
													</span>
												)}
											</div>

											{technicalEmailFeedback ? (
												<FeedbackMessage {...technicalEmailFeedback} />
											) : null}
										</div>
									) : (
										<div className="mt-4 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
											{technicalEmailFeedback?.message ||
												"No se ha podido preparar el borrador técnico."}
										</div>
									)}
								</div>
							) : null}

							<div className="mt-4 grid gap-4 lg:grid-cols-2">
								<div className="rounded-2xl bg-white px-4 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Resumen del resultado
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{service.result || "Sin resumen descrito"}
									</p>
								</div>
								<div className="rounded-2xl bg-white px-4 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Formula
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{service.formula || "Sin formula registrada"}
									</p>
								</div>
							</div>

							<div className="mt-4 rounded-2xl bg-white px-4 py-4">
								<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
									Resultado final
								</p>

								{service.result_images.length === 0 ? (
									<p className="mt-2 text-sm text-slate-500">
										No se han subido imágenes del resultado final.
									</p>
								) : (
									<div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
										{service.result_images.map((resultImage, index) => (
											<div
												key={resultImage.id}
												className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
											>
												<div className="relative aspect-square bg-slate-100">
													<Image
														src={resultImage.image_url}
														alt={`Resultado final ${index + 1}`}
														fill
														className="object-cover"
														sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 240px"
													/>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							<div className="mt-4 grid gap-4 lg:grid-cols-2">
								<div className="rounded-2xl bg-white px-4 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Descripción técnica
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{service.technical_description ||
											"Sin descripción técnica"}
									</p>
								</div>
								<div className="rounded-2xl bg-white px-4 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Notas técnicas
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{service.technical_notes || "Sin notas técnicas"}
									</p>
								</div>
							</div>

							{service.notes ? (
								<div className="mt-4 rounded-2xl bg-white px-4 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
										Notas del servicio
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-700">
										{service.notes}
									</p>
								</div>
							) : null}

							<div className="mt-4 rounded-2xl bg-white px-4 py-4">
								<p className="text-xs uppercase tracking-[0.18em] text-slate-400">
									Productos usados
								</p>

								{service.product_usages.length === 0 ? (
									<p className="mt-2 text-sm text-slate-500">
										No se registraron productos concretos en este
										servicio.
									</p>
								) : (
									<div className="mt-3 space-y-3">
										{service.product_usages.map((productUsage) => (
											<div
												key={productUsage.id}
												className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
											>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div>
														<p className="text-sm font-semibold text-slate-900">
															{productUsage.product_name}
															{productUsage.product_reference
																? ` · ${productUsage.product_reference}`
																: ""}
														</p>
														<p className="mt-1 text-sm text-slate-500">
															{productUsage.product_line_name || "Sin línea"}
														</p>
														{productUsage.color_reference_code ||
														productUsage.color_reference_name ? (
															<p className="mt-1 text-sm text-slate-500">
																{buildSalonColorToneLabel({
																	colorReferenceCode:
																		productUsage.color_reference_code,
																	colorReferenceName:
																		productUsage.color_reference_name,
																})}
															</p>
														) : null}
													</div>
													{productUsage.quantity_used ? (
														<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
															{formatSalonQuantity(productUsage.quantity_used)} uds
														</span>
													) : null}
												</div>
												{productUsage.notes ? (
													<p className="mt-3 text-sm leading-6 text-slate-600">
														{productUsage.notes}
													</p>
												) : null}
											</div>
										))}
									</div>
								)}
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
