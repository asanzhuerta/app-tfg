"use client";

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import FeedbackMessage from "@/app/components/ui/FeedbackMessage";
import type {
	SalonProductOption,
	SalonServiceTemplateSummary,
} from "@/lib/contracts/salon";
import { buildSalonProductLabel } from "./salon-ui";
import {
	inputClassName,
	textareaClassName,
	type EditableProductUsage,
	type EditableResultImage,
} from "./salon-client-detail-utils";
import type { SalonFeedbackState } from "./useSalonTechnicalEmailDraft";

type SalonServiceFormPanelProps = {
	historyHref?: string;
	editingServiceId: string | null;
	isSavingService: boolean;
	isUploadingResultImages: boolean;
	resetServiceForm: () => void;
	handleServiceSubmit: (
		event: FormEvent<HTMLFormElement>,
	) => void | Promise<void>;
	templates: SalonServiceTemplateSummary[];
	selectedTemplateId: string;
	selectedTemplate: SalonServiceTemplateSummary | null;
	handleTemplateSelection: (templateId: string) => void;
	isSavingTemplate: boolean;
	deletingTemplateId: string | null;
	handleDeleteTemplate: (
		template: SalonServiceTemplateSummary,
	) => void | Promise<void>;
	serviceDate: string;
	setServiceDate: (value: string) => void;
	serviceType: string;
	setServiceType: (value: string) => void;
	serviceResult: string;
	setServiceResult: (value: string) => void;
	resultImages: EditableResultImage[];
	handleResultImagesUpload: (
		event: ChangeEvent<HTMLInputElement>,
	) => void | Promise<void>;
	handleRemoveResultImage: (
		image: EditableResultImage,
	) => void | Promise<void>;
	serviceNotes: string;
	setServiceNotes: (value: string) => void;
	technicalDescription: string;
	setTechnicalDescription: (value: string) => void;
	formula: string;
	setFormula: (value: string) => void;
	technicalNotes: string;
	setTechnicalNotes: (value: string) => void;
	productUsages: EditableProductUsage[];
	addProductUsageRow: () => void;
	removeProductUsageRow: (localId: string) => void;
	updateProductUsage: (
		localId: string,
		field: keyof EditableProductUsage,
		value: string,
	) => void;
	productOptions: SalonProductOption[];
	serviceFeedback: SalonFeedbackState;
	templateName: string;
	setTemplateName: (value: string) => void;
	isTemplateSaveOpen: boolean;
	setIsTemplateSaveOpen: Dispatch<SetStateAction<boolean>>;
	handleSaveCurrentFormAsTemplate: () => void | Promise<void>;
	templateFeedback: SalonFeedbackState;
};

export default function SalonServiceFormPanel({
	historyHref,
	editingServiceId,
	isSavingService,
	isUploadingResultImages,
	resetServiceForm,
	handleServiceSubmit,
	templates,
	selectedTemplateId,
	selectedTemplate,
	handleTemplateSelection,
	isSavingTemplate,
	deletingTemplateId,
	handleDeleteTemplate,
	serviceDate,
	setServiceDate,
	serviceType,
	setServiceType,
	serviceResult,
	setServiceResult,
	resultImages,
	handleResultImagesUpload,
	handleRemoveResultImage,
	serviceNotes,
	setServiceNotes,
	technicalDescription,
	setTechnicalDescription,
	formula,
	setFormula,
	technicalNotes,
	setTechnicalNotes,
	productUsages,
	addProductUsageRow,
	removeProductUsageRow,
	updateProductUsage,
	productOptions,
	serviceFeedback,
	templateName,
	setTemplateName,
	isTemplateSaveOpen,
	setIsTemplateSaveOpen,
	handleSaveCurrentFormAsTemplate,
	templateFeedback,
}: SalonServiceFormPanelProps) {
	return (
		<section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						{editingServiceId
							? "Editar servicio técnico"
							: "Registrar servicio técnico"}
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						{editingServiceId
							? "Corrige la ficha técnica y vuelve a recalcular las sugerencias."
							: "Documenta el trabajo realizado, la formula y el producto usado."}
					</p>
				</div>
				{historyHref ? (
					<Link
						href={historyHref}
						className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
					>
						Ver historial técnico
					</Link>
				) : null}
				{editingServiceId ? (
					<button
						type="button"
						onClick={() => resetServiceForm()}
						disabled={isSavingService || isUploadingResultImages}
						className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Cancelar edición
					</button>
				) : null}
			</div>

			<form className="mt-5 space-y-4" onSubmit={handleServiceSubmit}>
				{!editingServiceId ? (
					<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 className="text-base font-semibold text-slate-900">
									¿Desea reutilizar una plantilla?
								</h3>
								<p className="mt-1 text-sm leading-6 text-slate-500">
									Una plantilla técnica es una receta reutilizable del
									servicio: guarda tipo, resultado, fórmula, notas y
									productos para cargarlos sin repetirlos a mano.
								</p>
							</div>
							<span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
								{templates.length} plantillas
							</span>
						</div>

						{templates.length === 0 ? (
							<div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
								Aún no hay plantillas guardadas para reutilizar.
							</div>
						) : (
							<div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
								<select
									value={selectedTemplateId}
									onChange={(event) =>
										handleTemplateSelection(event.target.value)
									}
									className={inputClassName}
									disabled={isSavingService}
								>
									<option value="">No reutilizar plantilla</option>
									{templates.map((template) => (
										<option key={template.id} value={template.id}>
											{template.name} - {template.service_type}
										</option>
									))}
								</select>
								{selectedTemplate ? (
									<button
										type="button"
										onClick={() => handleDeleteTemplate(selectedTemplate)}
										disabled={
											isSavingTemplate ||
											deletingTemplateId === selectedTemplate.id
										}
										className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{deletingTemplateId === selectedTemplate.id
											? "Eliminando..."
											: "Eliminar plantilla"}
									</button>
								) : null}
							</div>
						)}
					</div>
				) : null}

				{editingServiceId ? (
					<div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
						Estás editando un servicio ya registrado. Al guardar, se
						actualizara también la sugerencia de producto asociada al
						historial.
					</div>
				) : null}

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Fecha del servicio
						</label>
						<input
							type="date"
							value={serviceDate}
							onChange={(event) => setServiceDate(event.target.value)}
							className={inputClassName}
							disabled={isSavingService}
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Tipo de servicio
						</label>
						<input
							value={serviceType}
							onChange={(event) => setServiceType(event.target.value)}
							className={inputClassName}
							placeholder="Coloración, matiz, tratamiento..."
							disabled={isSavingService}
						/>
					</div>
				</div>

				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<div className="space-y-4">
						<div>
							<label className="mb-2 block text-sm font-medium text-slate-700">
								Resumen del resultado
							</label>
							<textarea
								value={serviceResult}
								onChange={(event) => setServiceResult(event.target.value)}
								className={textareaClassName}
								placeholder="Acabado, matiz conseguido, brillo, cobertura..."
								disabled={isSavingService}
							/>
						</div>

						<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h3 className="text-base font-semibold text-slate-900">
										Resultado final
									</h3>
									<p className="mt-1 text-sm text-slate-500">
										Sube tantas imágenes como necesites para documentar
										como ha quedado el trabajo.
									</p>
								</div>
								<label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
									<input
										type="file"
										accept="image/*"
										multiple
										onChange={handleResultImagesUpload}
										className="hidden"
										disabled={isSavingService || isUploadingResultImages}
									/>
									{isUploadingResultImages
										? "Subiendo..."
										: "Añadir imágenes"}
								</label>
							</div>

							{resultImages.length === 0 ? (
								<div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
									Aún no has subido imágenes del resultado final.
								</div>
							) : (
								<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
									{resultImages.map((resultImage, index) => (
										<div
											key={resultImage.localId}
											className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
										>
											<div className="relative aspect-square bg-slate-100">
												<Image
													src={resultImage.imageUrl}
													alt={`Resultado final ${index + 1}`}
													fill
													className="object-cover"
													sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 240px"
												/>
											</div>
											<div className="flex items-center justify-between gap-3 px-4 py-3">
												<span className="text-sm text-slate-500">
													Imagen {index + 1}
												</span>
												<button
													type="button"
													onClick={() =>
														handleRemoveResultImage(resultImage)
													}
													className="text-sm font-medium text-rose-600 transition hover:text-rose-500"
													disabled={
														isSavingService || isUploadingResultImages
													}
												>
													Quitar
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Notas del servicio
						</label>
						<textarea
							value={serviceNotes}
							onChange={(event) => setServiceNotes(event.target.value)}
							className={textareaClassName}
							placeholder="Incidencias, observaciones generales..."
							disabled={isSavingService}
						/>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<div className="md:col-span-2">
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Descripción técnica
						</label>
						<textarea
							value={technicalDescription}
							onChange={(event) =>
								setTechnicalDescription(event.target.value)
							}
							className={textareaClassName}
							placeholder="Diagnóstico, técnica aplicada, particiones..."
							disabled={isSavingService}
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Formula
						</label>
						<textarea
							value={formula}
							onChange={(event) => setFormula(event.target.value)}
							className={textareaClassName}
							placeholder="Ej. 7.34 + 20 vol + corrector..."
							disabled={isSavingService}
						/>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium text-slate-700">
						Notas técnicas
					</label>
					<textarea
						value={technicalNotes}
						onChange={(event) => setTechnicalNotes(event.target.value)}
						className={textareaClassName}
						placeholder="Tiempos de exposicion, mezcla, observaciones de mantenimiento..."
						disabled={isSavingService}
					/>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div>
							<h3 className="text-base font-semibold text-slate-900">
								Productos usados
							</h3>
							<p className="mt-1 text-sm text-slate-500">
								Anade solo los productos realmente aplicados.
							</p>
						</div>
						<button
							type="button"
							onClick={addProductUsageRow}
							className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
						>
							Añadir producto
						</button>
					</div>

					<div className="space-y-3">
						{productUsages.map((productUsage, index) => (
							<div
								key={productUsage.localId}
								className="rounded-2xl border border-slate-200 bg-white p-4"
							>
								<div className="mb-3 flex items-center justify-between gap-3">
									<p className="text-sm font-semibold text-slate-900">
										Producto {index + 1}
									</p>
									<button
										type="button"
										onClick={() => removeProductUsageRow(productUsage.localId)}
										className="text-sm font-medium text-rose-600 transition hover:text-rose-500"
									>
										Quitar
									</button>
								</div>

								<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
									<select
										value={productUsage.selectionId}
										onChange={(event) =>
											updateProductUsage(
												productUsage.localId,
												"selectionId",
												event.target.value,
											)
										}
										className={inputClassName}
										disabled={isSavingService}
									>
										<option value="">Selecciona un producto</option>
										{productOptions.map((productOption) => (
											<option key={productOption.id} value={productOption.id}>
												{buildSalonProductLabel(productOption)}
											</option>
										))}
									</select>

									<input
										value={productUsage.quantityUsed}
										onChange={(event) =>
											updateProductUsage(
												productUsage.localId,
												"quantityUsed",
												event.target.value,
											)
										}
										className={inputClassName}
										placeholder="Cantidad"
										disabled={isSavingService}
									/>
								</div>

								<textarea
									value={productUsage.notes}
									onChange={(event) =>
										updateProductUsage(
											productUsage.localId,
											"notes",
											event.target.value,
										)
									}
									className={`${textareaClassName} mt-3 min-h-20`}
									placeholder="Notas del uso de este producto"
									disabled={isSavingService}
								/>
							</div>
						))}
					</div>
				</div>

				{serviceFeedback ? (
					<FeedbackMessage {...serviceFeedback} />
				) : null}

				<button
					type="submit"
					disabled={isSavingService || isUploadingResultImages}
					className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
				>
					{isUploadingResultImages
						? "Subiendo imágenes..."
						: isSavingService
						? editingServiceId
							? "Actualizando..."
							: "Registrando..."
						: editingServiceId
							? "Guardar cambios"
							: "Registrar servicio"}
				</button>

				{!editingServiceId ? (
					<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 className="text-base font-semibold text-slate-900">
									¿Guardar como plantilla?
								</h3>
								<p className="mt-1 text-sm text-slate-500">
									Guarda los datos actuales para reutilizarlos en próximos
									servicios técnicos.
								</p>
							</div>
							<button
								type="button"
								onClick={() =>
									setIsTemplateSaveOpen((currentValue) => !currentValue)
								}
								disabled={isSavingService || isSavingTemplate}
								className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isTemplateSaveOpen ? "Ocultar" : "¿Guardar como plantilla?"}
							</button>
						</div>

						{isTemplateSaveOpen ? (
							<div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
								<div>
									<label className="mb-2 block text-sm font-medium text-slate-700">
										Nombre de la plantilla
									</label>
									<input
										value={templateName}
										onChange={(event) =>
											setTemplateName(event.target.value)
										}
										className={inputClassName}
										placeholder="Ej. Matiz beige habitual"
										disabled={isSavingTemplate}
									/>
								</div>
								<div className="flex items-end">
									<button
										type="button"
										onClick={handleSaveCurrentFormAsTemplate}
										disabled={isSavingTemplate}
										className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
									>
										{isSavingTemplate
											? "Guardando..."
											: "Guardar plantilla"}
									</button>
								</div>
							</div>
						) : null}

						{templateFeedback ? (
							<FeedbackMessage {...templateFeedback} className="mt-4" />
						) : null}
					</div>
				) : null}
			</form>
		</section>
	);
}
