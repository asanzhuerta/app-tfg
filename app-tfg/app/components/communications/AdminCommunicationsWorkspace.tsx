"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, requestJson } from "@/lib/api/client";
import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";
import type {
	ClientOptionView,
	ClientSegmentAssignmentView,
	ProductLineOptionView,
	ProductOptionView,
	PromotionView,
	PromotionDiscountTypeView,
	SegmentView,
	TrainingEventView,
} from "./communication-view-types";

type AdminTab = "promotions" | "trainings" | "segments" | "assignments";
type DeliveryFormState = {
	deliveryChannels: NotificationDeliveryChannel[];
};

type PromotionAttachmentUploadResponse = {
	url: string;
	name: string;
	mimeType: string;
	kind: "image" | "pdf";
};

type Props = {
	segments: SegmentView[];
	assignments: ClientSegmentAssignmentView[];
	clients: ClientOptionView[];
	products: ProductOptionView[];
	productLines: ProductLineOptionView[];
	promotionDiscountTypes: PromotionDiscountTypeView[];
	promotions: PromotionView[];
	trainings: TrainingEventView[];
};

const tabs: Array<{ key: AdminTab; label: string }> = [
	{ key: "promotions", label: "Promociones" },
	{ key: "trainings", label: "Formaciones" },
	{ key: "segments", label: "Rangos" },
	{ key: "assignments", label: "Asignaciones" },
];
const defaultDeliveryChannels: NotificationDeliveryChannel[] = ["in_app"];

const emptyPromotionForm = {
	title: "",
	description: "",
	promotionType: "",
	promotionDiscountTypeCode: "percentage_discount",
	benefit: "",
	discountPercentage: "",
	minimumOrderAmount: "",
	giftProductId: "",
	giftDescription: "",
	imageUrl: "",
	attachmentUrl: "",
	attachmentName: "",
	attachmentMimeType: "",
	startDate: "",
	endDate: "",
	status: "draft",
	productId: "",
	productLineId: "",
	clientId: "",
	customerSegmentId: "",
	deliveryChannels: [...defaultDeliveryChannels],
};

const emptyTrainingForm = {
	title: "",
	description: "",
	startsAt: "",
	location: "",
	modality: "in_person",
	content: "",
	status: "draft",
	capacity: "",
	deliveryChannels: [...defaultDeliveryChannels],
};

const emptySegmentForm = {
	code: "",
	name: "",
	description: "",
	criteria: "",
};

const emptyAssignmentForm = {
	clientId: "",
	segmentId: "",
	notes: "",
};

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof ApiClientError ? error.message : fallback;
}

function formatDate(value: string) {
	const parsed = new Date(`${value}T00:00:00`);

	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(parsed);
}

function formatDateTime(value: string) {
	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(parsed);
}

function toDateTimeLocal(value: string) {
	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return value.slice(0, 16);
	}

	const localTime = new Date(
		parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
	);

	return localTime.toISOString().slice(0, 16);
}

function StatusBadge({ status }: { status: string }) {
	return (
		<span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
			{status}
		</span>
	);
}

function hasDeliveryChannel(
	form: DeliveryFormState,
	channel: NotificationDeliveryChannel,
) {
	return form.deliveryChannels.includes(channel);
}

function updateDeliveryChannels(
	currentChannels: NotificationDeliveryChannel[],
	channel: NotificationDeliveryChannel,
	checked: boolean,
) {
	if (channel === "in_app") {
		return ["in_app"] as NotificationDeliveryChannel[];
	}

	const nextChannels = new Set<NotificationDeliveryChannel>([
		"in_app",
		...currentChannels,
	]);

	if (checked) {
		nextChannels.add(channel);
	} else {
		nextChannels.delete(channel);
	}

	return [...nextChannels];
}

export default function AdminCommunicationsWorkspace({
	segments: initialSegments,
	assignments: initialAssignments,
	clients,
	products,
	productLines,
	promotionDiscountTypes,
	promotions: initialPromotions,
	trainings: initialTrainings,
}: Props) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<AdminTab>("promotions");
	const [openForm, setOpenForm] = useState<AdminTab | null>(null);
	const [segments, setSegments] = useState(initialSegments);
	const [assignments, setAssignments] = useState(initialAssignments);
	const [promotions, setPromotions] = useState(initialPromotions);
	const [trainings, setTrainings] = useState(initialTrainings);
	const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
	const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);
	const [segmentForm, setSegmentForm] = useState(emptySegmentForm);
	const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
	const [editingPromotionId, setEditingPromotionId] = useState<string | null>(
		null,
	);
	const [editingTrainingId, setEditingTrainingId] = useState<string | null>(
		null,
	);
	const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const [confirmDeleteAction, setConfirmDeleteAction] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setSegments(initialSegments);
		setAssignments(initialAssignments);
		setPromotions(initialPromotions);
		setTrainings(initialTrainings);
	}, [initialSegments, initialAssignments, initialPromotions, initialTrainings]);

	function clearFeedback() {
		setMessage("");
		setError("");
	}

	function confirmDelete(actionKey: string, messageText: string) {
		clearFeedback();

		if (confirmDeleteAction !== actionKey) {
			setConfirmDeleteAction(actionKey);
			setMessage(messageText);
			return false;
		}

		setConfirmDeleteAction(null);
		return true;
	}

	function refreshAfter(messageText: string) {
		setMessage(messageText);
		router.refresh();
	}

	function resetPromotionForm() {
		setPromotionForm(emptyPromotionForm);
		setEditingPromotionId(null);
	}

	function resetTrainingForm() {
		setTrainingForm(emptyTrainingForm);
		setEditingTrainingId(null);
	}

	function resetSegmentForm() {
		setSegmentForm(emptySegmentForm);
		setEditingSegmentId(null);
	}

	function openCommunicationForm(tab: AdminTab) {
		clearFeedback();
		setActiveTab(tab);
		setOpenForm(tab);

		if (tab === "promotions") {
			resetPromotionForm();
		}

		if (tab === "trainings") {
			resetTrainingForm();
		}

		if (tab === "segments") {
			resetSegmentForm();
		}

		if (tab === "assignments") {
			setAssignmentForm(emptyAssignmentForm);
		}
	}

	function closeCommunicationForm() {
		if (openForm === "promotions") {
			resetPromotionForm();
		}

		if (openForm === "trainings") {
			resetTrainingForm();
		}

		if (openForm === "segments") {
			resetSegmentForm();
		}

		if (openForm === "assignments") {
			setAssignmentForm(emptyAssignmentForm);
		}

		setOpenForm(null);
	}

	function getFormDialogClass(tab: AdminTab) {
		return [
			"space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl",
			"max-h-[calc(100svh-2rem)] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto",
			"[&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full [&_textarea]:min-w-0 [&_textarea]:w-full",
			openForm === tab
				? "app-modal-dialog-centered z-[90]"
				: "hidden",
		].join(" ");
	}

	function buildPromotionPayload() {
		const selectedDiscountType = promotionDiscountTypes.find(
			(discountType) =>
				discountType.code === promotionForm.promotionDiscountTypeCode,
		);

		return {
			...promotionForm,
			promotionType:
				promotionForm.promotionType || selectedDiscountType?.name || "",
			discountPercentage: promotionForm.discountPercentage || null,
			minimumOrderAmount: promotionForm.minimumOrderAmount || null,
			giftProductId: promotionForm.giftProductId || null,
			giftDescription: promotionForm.giftDescription || null,
			imageUrl: promotionForm.imageUrl || null,
			attachmentUrl: promotionForm.attachmentUrl || null,
			attachmentName: promotionForm.attachmentName || null,
			attachmentMimeType: promotionForm.attachmentMimeType || null,
			productId: promotionForm.productId || null,
			productLineId: promotionForm.productLineId || null,
			clientId: promotionForm.clientId || null,
			customerSegmentId: promotionForm.customerSegmentId || null,
		};
	}

	function buildTrainingPayload() {
		return {
			...trainingForm,
			capacity: trainingForm.capacity || null,
		};
	}

	function startEditingPromotion(promotion: PromotionView) {
		clearFeedback();
		setActiveTab("promotions");
		setOpenForm("promotions");
		setEditingPromotionId(promotion.id);
		setPromotionForm({
			title: promotion.title,
			description: promotion.description,
			promotionType: promotion.promotionType,
			promotionDiscountTypeCode: promotion.promotionDiscountTypeCode,
			benefit: promotion.benefit,
			discountPercentage: promotion.discountPercentage ?? "",
			minimumOrderAmount: promotion.minimumOrderAmount ?? "",
			giftProductId: promotion.giftProductId ?? "",
			giftDescription: promotion.giftDescription ?? "",
			imageUrl: promotion.imageUrl ?? "",
			attachmentUrl: promotion.attachmentUrl ?? "",
			attachmentName: promotion.attachmentName ?? "",
			attachmentMimeType: promotion.attachmentMimeType ?? "",
			startDate: promotion.startDate,
			endDate: promotion.endDate,
			status: promotion.status,
			productId: promotion.productId ?? "",
			productLineId: promotion.productLineId ?? "",
			clientId: promotion.clientId ?? "",
			customerSegmentId: promotion.customerSegmentId ?? "",
			deliveryChannels: [...defaultDeliveryChannels],
		});
	}

	function startEditingTraining(training: TrainingEventView) {
		clearFeedback();
		setActiveTab("trainings");
		setOpenForm("trainings");
		setEditingTrainingId(training.id);
		setTrainingForm({
			title: training.title,
			description: training.description,
			startsAt: toDateTimeLocal(training.startsAt),
			location: training.location ?? "",
			modality: training.modality,
			content: training.content ?? "",
			status: training.status,
			capacity: training.capacity ? String(training.capacity) : "",
			deliveryChannels: [...defaultDeliveryChannels],
		});
	}

	function startEditingSegment(segment: SegmentView) {
		clearFeedback();
		setActiveTab("segments");
		setOpenForm("segments");
		setEditingSegmentId(segment.id);
		setSegmentForm({
			code: segment.code,
			name: segment.name,
			description: segment.description ?? "",
			criteria: segment.criteria ?? "",
		});
	}

	async function handlePromotionAttachmentUpload(
		event: ChangeEvent<HTMLInputElement>,
		kind: "image" | "pdf",
	) {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		clearFeedback();
		setPendingAction(`promotion-upload-${kind}`);

		try {
			const formData = new FormData();
			formData.append("file", file);

			if (kind === "image" && promotionForm.imageUrl) {
				formData.append("previousUrl", promotionForm.imageUrl);
			}

			if (kind === "pdf" && promotionForm.attachmentUrl) {
				formData.append("previousUrl", promotionForm.attachmentUrl);
				formData.append(
					"previousMimeType",
					promotionForm.attachmentMimeType || "application/pdf",
				);
			}

			const upload = await requestJson<PromotionAttachmentUploadResponse>(
				"/api/admin/communications/promotions/upload-attachment",
				{
					method: "POST",
					body: formData,
					fallbackMessage: "No se pudo subir el adjunto",
				},
			);

			if (kind === "image") {
				setPromotionForm((current) => ({
					...current,
					imageUrl: upload.url,
				}));
			} else {
				setPromotionForm((current) => ({
					...current,
					attachmentUrl: upload.url,
					attachmentName: upload.name,
					attachmentMimeType: upload.mimeType,
				}));
			}
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo subir el adjunto"));
		} finally {
			setPendingAction(null);
		}
	}

	async function handleSubmitPromotion(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearFeedback();

		const isEditing = Boolean(editingPromotionId);
		const actionKey = isEditing
			? `promotion-save-${editingPromotionId}`
			: "create-promotion";
		setPendingAction(actionKey);

		try {
			await requestJson(
				isEditing
					? `/api/admin/communications/promotions/${editingPromotionId}`
					: "/api/admin/communications/promotions",
				{
					method: isEditing ? "PATCH" : "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(buildPromotionPayload()),
					fallbackMessage: isEditing
						? "No se pudo actualizar la promoción"
						: "No se pudo crear la promoción",
				},
			);
			resetPromotionForm();
			setOpenForm(null);
			refreshAfter(
				isEditing
					? "Promoción actualizada correctamente"
					: "Promoción creada correctamente",
			);
		} catch (error) {
			setError(
				getErrorMessage(
					error,
					isEditing
						? "No se pudo actualizar la promoción"
						: "No se pudo crear la promoción",
				),
			);
		} finally {
			setPendingAction(null);
		}
	}

	async function patchPromotionStatus(id: string, status: string) {
		clearFeedback();
		setPendingAction(`promotion-${id}`);

		try {
			await requestJson(`/api/admin/communications/promotions/${id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ status }),
				fallbackMessage: "No se pudo actualizar la promoción",
			});
			refreshAfter("Promoción actualizada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo actualizar la promoción"));
		} finally {
			setPendingAction(null);
		}
	}

	async function deletePromotion(id: string) {
		if (
			!confirmDelete(
				`promotion-delete-${id}`,
				"Pulsa de nuevo en eliminar para confirmar la promoción.",
			)
		) {
			return;
		}

		setPendingAction(`promotion-delete-${id}`);

		try {
			await requestJson(`/api/admin/communications/promotions/${id}`, {
				method: "DELETE",
				fallbackMessage: "No se pudo eliminar la promoción",
			});
			if (editingPromotionId === id) {
				resetPromotionForm();
			}
			refreshAfter("Promoción eliminada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo eliminar la promoción"));
		} finally {
			setPendingAction(null);
		}
	}

	async function handleSubmitTraining(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearFeedback();

		const isEditing = Boolean(editingTrainingId);
		const actionKey = isEditing
			? `training-save-${editingTrainingId}`
			: "create-training";
		setPendingAction(actionKey);

		try {
			await requestJson(
				isEditing
					? `/api/admin/communications/trainings/${editingTrainingId}`
					: "/api/admin/communications/trainings",
				{
					method: isEditing ? "PATCH" : "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(buildTrainingPayload()),
					fallbackMessage: isEditing
						? "No se pudo actualizar la formación"
						: "No se pudo crear la formación",
				},
			);
			resetTrainingForm();
			setOpenForm(null);
			refreshAfter(
				isEditing
					? "Formación actualizada correctamente"
					: "Formación creada correctamente",
			);
		} catch (error) {
			setError(
				getErrorMessage(
					error,
					isEditing
						? "No se pudo actualizar la formación"
						: "No se pudo crear la formación",
				),
			);
		} finally {
			setPendingAction(null);
		}
	}

	async function patchTrainingStatus(id: string, status: string) {
		clearFeedback();
		setPendingAction(`training-${id}`);

		try {
			await requestJson(`/api/admin/communications/trainings/${id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ status }),
				fallbackMessage: "No se pudo actualizar la formación",
			});
			refreshAfter("Formación actualizada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo actualizar la formación"));
		} finally {
			setPendingAction(null);
		}
	}

	async function deleteTraining(id: string) {
		if (
			!confirmDelete(
				`training-delete-${id}`,
				"Pulsa de nuevo en eliminar para confirmar la formación.",
			)
		) {
			return;
		}

		setPendingAction(`training-delete-${id}`);

		try {
			await requestJson(`/api/admin/communications/trainings/${id}`, {
				method: "DELETE",
				fallbackMessage: "No se pudo eliminar la formación",
			});
			if (editingTrainingId === id) {
				resetTrainingForm();
			}
			refreshAfter("Formación eliminada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo eliminar la formación"));
		} finally {
			setPendingAction(null);
		}
	}

	async function handleSubmitSegment(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearFeedback();

		const isEditing = Boolean(editingSegmentId);
		const actionKey = isEditing
			? `segment-save-${editingSegmentId}`
			: "create-segment";
		setPendingAction(actionKey);

		try {
			await requestJson(
				isEditing
					? `/api/admin/communications/segments/${editingSegmentId}`
					: "/api/admin/communications/segments",
				{
					method: isEditing ? "PATCH" : "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(segmentForm),
					fallbackMessage: isEditing
						? "No se pudo actualizar el rango"
						: "No se pudo crear el rango",
				},
			);
			resetSegmentForm();
			setOpenForm(null);
			refreshAfter(
				isEditing
					? "Rango actualizado correctamente"
					: "Rango creado correctamente",
			);
		} catch (error) {
			setError(
				getErrorMessage(
					error,
					isEditing
						? "No se pudo actualizar el rango"
						: "No se pudo crear el rango",
				),
			);
		} finally {
			setPendingAction(null);
		}
	}

	async function deleteSegment(id: string) {
		if (
			!confirmDelete(
				`segment-${id}`,
				"Pulsa de nuevo en eliminar para confirmar el rango.",
			)
		) {
			return;
		}

		setPendingAction(`segment-${id}`);

		try {
			await requestJson(`/api/admin/communications/segments/${id}`, {
				method: "DELETE",
				fallbackMessage: "No se pudo eliminar el rango",
			});
			if (editingSegmentId === id) {
				resetSegmentForm();
			}
			refreshAfter("Rango eliminado");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo eliminar el rango"));
		} finally {
			setPendingAction(null);
		}
	}

	async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearFeedback();
		setPendingAction("create-assignment");

		try {
			await requestJson("/api/admin/communications/client-segments", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(assignmentForm),
				fallbackMessage: "No se pudo asignar el rango",
			});
			setAssignmentForm(emptyAssignmentForm);
			setOpenForm(null);
			refreshAfter("Cliente asignado al rango");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo asignar el rango"));
		} finally {
			setPendingAction(null);
		}
	}

	async function deleteAssignment(id: string) {
		if (
			!confirmDelete(
				`assignment-${id}`,
				"Pulsa de nuevo en quitar para confirmar la asignación.",
			)
		) {
			return;
		}

		setPendingAction(`assignment-${id}`);

		try {
			await requestJson(`/api/admin/communications/client-segments/${id}`, {
				method: "DELETE",
				fallbackMessage: "No se pudo quitar la asignación",
			});
			refreshAfter("Asignación eliminada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo quitar la asignación"));
		} finally {
			setPendingAction(null);
		}
	}

	const promotionSubmitPending =
		pendingAction === "create-promotion" ||
		pendingAction === `promotion-save-${editingPromotionId}`;
	const trainingSubmitPending =
		pendingAction === "create-training" ||
		pendingAction === `training-save-${editingTrainingId}`;
	const segmentSubmitPending =
		pendingAction === "create-segment" ||
		pendingAction === `segment-save-${editingSegmentId}`;
	const activePromotionsCount = promotions.filter(
		(promotion) => promotion.status === "active",
	).length;
	const publishedTrainingsCount = trainings.filter(
		(training) => training.status === "published",
	).length;
	const summaryByTab: Record<
		AdminTab,
		{
			eyebrow: string;
			title: string;
			description: string;
			actionLabel: string;
		}
	> = {
		promotions: {
			eyebrow: "Promociones",
			title: `${activePromotionsCount} ${
				activePromotionsCount === 1
					? "promoción activa"
					: "promociones activas"
			}`,
			description:
				"Crea y mantiene descuentos globales, por rango, por cliente o por producto.",
			actionLabel: "Crear nueva promoción",
		},
		trainings: {
			eyebrow: "Formaciones",
			title: `${publishedTrainingsCount} ${
				publishedTrainingsCount === 1
					? "formación publicada"
					: "formaciones publicadas"
			}`,
			description:
				"Gestiona convocatorias presenciales, online o mixtas para clientes profesionales.",
			actionLabel: "Crear nueva formación",
		},
		segments: {
			eyebrow: "Rangos",
			title: `${segments.length} ${
				segments.length === 1 ? "rango definido" : "rangos definidos"
			}`,
			description:
				"Define Plata, Oro, Platino u otros rangos comerciales para segmentar ventajas.",
			actionLabel: "Crear nuevo rango",
		},
		assignments: {
			eyebrow: "Asignaciones",
			title: `${assignments.length} ${
				assignments.length === 1
					? "cliente con rango"
					: "clientes con rango"
			}`,
			description:
				"Asocia clientes profesionales a un rango para que reciban las ventajas correctas.",
			actionLabel: "Asignar rango",
		},
	};
	const activeSummary = summaryByTab[activeTab];

	return (
		<div className="space-y-6">
			{openForm ? (
				<button
					type="button"
					aria-label="Cerrar formulario"
					onClick={closeCommunicationForm}
					className="app-modal-overlay z-[80]"
				/>
			) : null}

			<div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/75 p-2">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
							activeTab === tab.key
								? "bg-slate-900 text-white"
								: "text-slate-600 hover:bg-slate-100"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						{activeSummary.eyebrow}
					</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
						{activeSummary.title}
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-slate-600">
						{activeSummary.description}
					</p>
				</div>
				<button
					type="button"
					onClick={() => openCommunicationForm(activeTab)}
					className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
				>
					{activeSummary.actionLabel}
				</button>
			</section>

			{message ? (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{message}
				</div>
			) : null}

			{error ? (
				<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{error}
				</div>
			) : null}

			{activeTab === "promotions" ? (
				<section className="grid gap-5">
					<form
						onSubmit={handleSubmitPromotion}
						role="dialog"
						aria-modal={openForm === "promotions"}
						className={getFormDialogClass("promotions")}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-slate-900">
									{editingPromotionId ? "Editar promoción" : "Nueva promoción"}
								</h2>
								<p className="text-sm text-slate-500">
									Define campañas globales, por rango o por cliente.
								</p>
							</div>
							<button
								type="button"
								onClick={closeCommunicationForm}
								className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
							>
								Cerrar
							</button>
						</div>

						<input
							required
							placeholder="Título"
							value={promotionForm.title}
							onChange={(event) =>
								setPromotionForm((current) => ({
									...current,
									title: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<textarea
							required
							placeholder="Descripción"
							value={promotionForm.description}
							onChange={(event) =>
								setPromotionForm((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<div className="grid gap-3 md:grid-cols-2">
							<select
								value={promotionForm.promotionDiscountTypeCode}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										promotionDiscountTypeCode: event.target.value,
										promotionType:
											promotionDiscountTypes.find(
												(discountType) =>
													discountType.code === event.target.value,
											)?.name ?? "",
										discountPercentage:
											event.target.value === "gift_product"
												? ""
												: current.discountPercentage,
										minimumOrderAmount:
											event.target.value === "volume_percentage_discount"
												? current.minimumOrderAmount
												: "",
										giftProductId:
											event.target.value === "gift_product"
												? current.giftProductId
												: "",
										giftDescription:
											event.target.value === "gift_product"
												? current.giftDescription
												: "",
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								{promotionDiscountTypes.map((discountType) => (
									<option key={discountType.id} value={discountType.code}>
										{discountType.name}
									</option>
								))}
							</select>
							<input
								placeholder="Beneficio visible (opcional)"
								value={promotionForm.benefit}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										benefit: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
							{promotionForm.promotionDiscountTypeCode !== "gift_product" ? (
								<input
									required
									type="number"
									min="0.01"
									max="100"
									step="0.01"
									placeholder="Porcentaje de descuento"
									value={promotionForm.discountPercentage}
									onChange={(event) =>
										setPromotionForm((current) => ({
											...current,
											discountPercentage: event.target.value,
										}))
									}
									className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
								/>
							) : null}
							{promotionForm.promotionDiscountTypeCode ===
							"volume_percentage_discount" ? (
								<input
									required
									type="number"
									min="0"
									step="0.01"
									placeholder="Importe mínimo del pedido"
									value={promotionForm.minimumOrderAmount}
									onChange={(event) =>
										setPromotionForm((current) => ({
											...current,
											minimumOrderAmount: event.target.value,
										}))
									}
									className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
								/>
							) : null}
							{promotionForm.promotionDiscountTypeCode === "gift_product" ? (
								<>
									<select
										value={promotionForm.giftProductId}
										onChange={(event) =>
											setPromotionForm((current) => ({
												...current,
												giftProductId: event.target.value,
											}))
										}
										className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
									>
										<option value="">Producto de regalo opcional</option>
										{products.map((product) => (
											<option key={product.id} value={product.id}>
												{product.reference ? `${product.reference} - ` : ""}
												{product.name}
											</option>
										))}
									</select>
									<input
										placeholder="Regalo externo o merchandising"
										value={promotionForm.giftDescription}
										onChange={(event) =>
											setPromotionForm((current) => ({
												...current,
												giftDescription: event.target.value,
											}))
										}
										className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
									/>
								</>
							) : null}
							<input
								required
								type="date"
								value={promotionForm.startDate}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										startDate: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
							<input
								required
								type="date"
								value={promotionForm.endDate}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										endDate: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
							<select
								value={promotionForm.status}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										status: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="draft">Borrador</option>
								<option value="active">Activa</option>
								<option value="archived">Archivada</option>
							</select>
							<select
								value={promotionForm.productLineId}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										productLineId: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="">Línea opcional</option>
								{productLines.map((productLine) => (
									<option key={productLine.id} value={productLine.id}>
										{productLine.name}
									</option>
								))}
							</select>
							<select
								value={promotionForm.productId}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										productId: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="">Producto opcional</option>
								{products.map((product) => (
									<option key={product.id} value={product.id}>
										{product.reference ? `${product.reference} - ` : ""}
										{product.name}
									</option>
								))}
							</select>
							<select
								value={promotionForm.clientId}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										clientId: event.target.value,
										customerSegmentId: "",
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="">Cliente opcional</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{client.name}
									</option>
								))}
							</select>
							<select
								value={promotionForm.customerSegmentId}
								onChange={(event) =>
									setPromotionForm((current) => ({
										...current,
										customerSegmentId: event.target.value,
										clientId: "",
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="">Rango opcional</option>
								{segments.map((segment) => (
									<option key={segment.id} value={segment.id}>
										{segment.name}
									</option>
								))}
							</select>
						</div>
						<div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
							<div>
								<p className="text-sm font-semibold text-slate-900">
									Imagen de la promoción
								</p>
								<p className="mt-1 text-xs text-slate-500">
									Se muestra junto al texto en el listado de promociones.
								</p>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									<label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
										{pendingAction === "promotion-upload-image"
											? "Subiendo..."
											: promotionForm.imageUrl
												? "Cambiar imagen"
												: "Adjuntar imagen"}
										<input
											type="file"
											accept="image/*"
											onChange={(event) =>
												handlePromotionAttachmentUpload(event, "image")
											}
											className="sr-only"
										/>
									</label>
									{promotionForm.imageUrl ? (
										<button
											type="button"
											onClick={() =>
												setPromotionForm((current) => ({
													...current,
													imageUrl: "",
												}))
											}
											className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
										>
											Quitar
										</button>
									) : null}
								</div>
								{promotionForm.imageUrl ? (
									<Image
										src={promotionForm.imageUrl}
										alt="Imagen de la promoción"
										width={640}
										height={240}
										unoptimized
										className="mt-3 h-28 w-full rounded-2xl object-cover"
									/>
								) : null}
							</div>
							<div>
								<p className="text-sm font-semibold text-slate-900">
									PDF adjunto
								</p>
								<p className="mt-1 text-xs text-slate-500">
									Permite conservar bases, folleto o documento comercial.
								</p>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									<label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
										{pendingAction === "promotion-upload-pdf"
											? "Subiendo..."
											: promotionForm.attachmentUrl
												? "Cambiar PDF"
												: "Adjuntar PDF"}
										<input
											type="file"
											accept="application/pdf"
											onChange={(event) =>
												handlePromotionAttachmentUpload(event, "pdf")
											}
											className="sr-only"
										/>
									</label>
									{promotionForm.attachmentUrl ? (
										<>
											<a
												href={promotionForm.attachmentUrl}
												target="_blank"
												rel="noreferrer"
												className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
											>
												Ver PDF
											</a>
											<button
												type="button"
												onClick={() =>
													setPromotionForm((current) => ({
														...current,
														attachmentUrl: "",
														attachmentName: "",
														attachmentMimeType: "",
													}))
												}
												className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
											>
												Quitar
											</button>
										</>
									) : null}
								</div>
								{promotionForm.attachmentName ? (
									<p className="mt-3 truncate text-xs font-medium text-slate-600">
										{promotionForm.attachmentName}
									</p>
								) : null}
							</div>
						</div>
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm font-semibold text-slate-900">
								Canales de aviso
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked
										disabled
										className="h-4 w-4 rounded border-slate-300"
									/>
									Interna
								</label>
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={hasDeliveryChannel(promotionForm, "email")}
										onChange={(event) =>
											setPromotionForm((current) => ({
												...current,
												deliveryChannels: updateDeliveryChannels(
													current.deliveryChannels,
													"email",
													event.target.checked,
												),
											}))
										}
										className="h-4 w-4 rounded border-slate-300"
									/>
									Correo electronico
								</label>
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={hasDeliveryChannel(promotionForm, "push")}
										onChange={(event) =>
											setPromotionForm((current) => ({
												...current,
												deliveryChannels: updateDeliveryChannels(
													current.deliveryChannels,
													"push",
													event.target.checked,
												),
											}))
										}
										className="h-4 w-4 rounded border-slate-300"
									/>
									Push PWA
								</label>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								type="submit"
								disabled={promotionSubmitPending}
								className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
							>
								{editingPromotionId ? "Guardar cambios" : "Crear promoción"}
							</button>
							{editingPromotionId ? (
								<button
									type="button"
									onClick={closeCommunicationForm}
									className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
								>
									Cancelar edición
								</button>
							) : null}
						</div>
					</form>

					<div className="space-y-3">
						{promotions.length ? (
							promotions.map((promotion) => (
								<article
									key={promotion.id}
									className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h3 className="font-semibold text-slate-900">
												{promotion.title}
											</h3>
											<p className="mt-1 text-sm text-slate-600">
												{promotion.description}
											</p>
										</div>
										{promotion.imageUrl ? (
											<Image
												src={promotion.imageUrl}
												alt="Imagen de la promoción"
												width={180}
												height={120}
												unoptimized
												className="h-24 w-36 rounded-2xl object-cover"
											/>
										) : null}
										<StatusBadge status={promotion.status} />
									</div>
									<p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
										{promotion.promotionDiscountTypeName}
									</p>
									<p className="mt-3 text-sm font-medium text-slate-800">
										{promotion.benefit}
									</p>
									{promotion.attachmentUrl ? (
										<a
											href={promotion.attachmentUrl}
											target="_blank"
											rel="noreferrer"
											className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
										>
											{promotion.attachmentName || "Ver PDF adjunto"}
										</a>
									) : null}
									<p className="mt-2 text-xs text-slate-500">
										{formatDate(promotion.startDate)} -{" "}
										{formatDate(promotion.endDate)}
									</p>
									<p className="mt-2 text-xs text-slate-500">
										Ámbito:{" "}
										{promotion.clientName ??
											promotion.customerSegmentName ??
											"Global"}
										{promotion.productName
											? ` - Producto: ${promotion.productName}`
											: ""}
										{promotion.productLineName
											? ` - Línea: ${promotion.productLineName}`
											: ""}
									</p>
									<div className="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() =>
												patchPromotionStatus(promotion.id, "active")
											}
											disabled={pendingAction === `promotion-${promotion.id}`}
											className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
										>
											Activar
										</button>
										<button
											type="button"
											onClick={() =>
												patchPromotionStatus(promotion.id, "archived")
											}
											disabled={pendingAction === `promotion-${promotion.id}`}
											className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
										>
											Archivar
										</button>
										<button
											type="button"
											onClick={() => startEditingPromotion(promotion)}
											className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
										>
											Editar
										</button>
										<button
											type="button"
											onClick={() => deletePromotion(promotion.id)}
											disabled={
												pendingAction === `promotion-delete-${promotion.id}`
											}
											className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
										>
											{confirmDeleteAction ===
											`promotion-delete-${promotion.id}`
												? "Confirmar eliminar"
												: "Eliminar"}
										</button>
									</div>
								</article>
							))
						) : (
							<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
								Sin promociones registradas.
							</p>
						)}
					</div>
				</section>
			) : null}

			{activeTab === "trainings" ? (
				<section className="grid gap-5">
					<form
						onSubmit={handleSubmitTraining}
						role="dialog"
						aria-modal={openForm === "trainings"}
						className={getFormDialogClass("trainings")}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-slate-900">
									{editingTrainingId ? "Editar formación" : "Nueva formación"}
								</h2>
								<p className="text-sm text-slate-500">
									Pública sesiones presenciales, online o mixtas.
								</p>
							</div>
							<button
								type="button"
								onClick={closeCommunicationForm}
								className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
							>
								Cerrar
							</button>
						</div>
						<input
							required
							placeholder="Título"
							value={trainingForm.title}
							onChange={(event) =>
								setTrainingForm((current) => ({
									...current,
									title: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<textarea
							required
							placeholder="Descripción"
							value={trainingForm.description}
							onChange={(event) =>
								setTrainingForm((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<div className="grid gap-3 md:grid-cols-2">
							<input
								required
								type="datetime-local"
								value={trainingForm.startsAt}
								onChange={(event) =>
									setTrainingForm((current) => ({
										...current,
										startsAt: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
							<input
								placeholder="Ubicación o enlace"
								value={trainingForm.location}
								onChange={(event) =>
									setTrainingForm((current) => ({
										...current,
										location: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
							<select
								value={trainingForm.modality}
								onChange={(event) =>
									setTrainingForm((current) => ({
										...current,
										modality: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="in_person">Presencial</option>
								<option value="online">Online</option>
								<option value="hybrid">Mixta</option>
							</select>
							<select
								value={trainingForm.status}
								onChange={(event) =>
									setTrainingForm((current) => ({
										...current,
										status: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							>
								<option value="draft">Borrador</option>
								<option value="published">Publicada</option>
								<option value="cancelled">Cancelada</option>
								<option value="completed">Completada</option>
							</select>
							<input
								type="number"
								min="1"
								placeholder="Capacidad opcional"
								value={trainingForm.capacity}
								onChange={(event) =>
									setTrainingForm((current) => ({
										...current,
										capacity: event.target.value,
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
							/>
						</div>
						<textarea
							placeholder="Contenido / temario"
							value={trainingForm.content}
							onChange={(event) =>
								setTrainingForm((current) => ({
									...current,
									content: event.target.value,
								}))
							}
							className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm font-semibold text-slate-900">
								Canales de aviso
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked
										disabled
										className="h-4 w-4 rounded border-slate-300"
									/>
									Interna
								</label>
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={hasDeliveryChannel(trainingForm, "email")}
										onChange={(event) =>
											setTrainingForm((current) => ({
												...current,
												deliveryChannels: updateDeliveryChannels(
													current.deliveryChannels,
													"email",
													event.target.checked,
												),
											}))
										}
										className="h-4 w-4 rounded border-slate-300"
									/>
									Correo electronico
								</label>
								<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={hasDeliveryChannel(trainingForm, "push")}
										onChange={(event) =>
											setTrainingForm((current) => ({
												...current,
												deliveryChannels: updateDeliveryChannels(
													current.deliveryChannels,
													"push",
													event.target.checked,
												),
											}))
										}
										className="h-4 w-4 rounded border-slate-300"
									/>
									Push PWA
								</label>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								type="submit"
								disabled={trainingSubmitPending}
								className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
							>
								{editingTrainingId ? "Guardar cambios" : "Crear formación"}
							</button>
							{editingTrainingId ? (
								<button
									type="button"
									onClick={closeCommunicationForm}
									className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
								>
									Cancelar edición
								</button>
							) : null}
						</div>
					</form>

					<div className="space-y-3">
						{trainings.length ? (
							trainings.map((training) => (
								<article
									key={training.id}
									className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold text-slate-900">
												{training.title}
											</h3>
											<p className="mt-1 text-sm text-slate-600">
												{training.description}
											</p>
										</div>
										<StatusBadge status={training.status} />
									</div>
									<p className="mt-3 text-xs text-slate-500">
										{formatDateTime(training.startsAt)} - {training.modality}
										{training.location ? ` - ${training.location}` : ""}
									</p>
									<p className="mt-2 text-xs text-slate-500">
										Inscripciones activas: {training.activeEnrollmentsCount}
										{training.capacity ? ` / ${training.capacity}` : ""}
									</p>
									<div className="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() =>
												patchTrainingStatus(training.id, "published")
											}
											disabled={pendingAction === `training-${training.id}`}
											className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
										>
											Publicar
										</button>
										<button
											type="button"
											onClick={() =>
												patchTrainingStatus(training.id, "completed")
											}
											disabled={pendingAction === `training-${training.id}`}
											className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
										>
											Completar
										</button>
										<button
											type="button"
											onClick={() =>
												patchTrainingStatus(training.id, "cancelled")
											}
											disabled={pendingAction === `training-${training.id}`}
											className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
										>
											Cancelar
										</button>
										<button
											type="button"
											onClick={() => startEditingTraining(training)}
											className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
										>
											Editar
										</button>
										<button
											type="button"
											onClick={() => deleteTraining(training.id)}
											disabled={pendingAction === `training-delete-${training.id}`}
											className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
										>
											{confirmDeleteAction === `training-delete-${training.id}`
												? "Confirmar eliminar"
												: "Eliminar"}
										</button>
									</div>
								</article>
							))
						) : (
							<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
								Sin formaciones registradas.
							</p>
						)}
					</div>
				</section>
			) : null}

			{activeTab === "segments" ? (
				<section className="grid gap-5">
					<form
						onSubmit={handleSubmitSegment}
						role="dialog"
						aria-modal={openForm === "segments"}
						className={getFormDialogClass("segments")}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-slate-900">
									{editingSegmentId ? "Editar rango" : "Nuevo rango"}
								</h2>
								<p className="text-sm text-slate-500">
									Crea rangos comerciales para dirigir promociones.
								</p>
							</div>
							<button
								type="button"
								onClick={closeCommunicationForm}
								className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
							>
								Cerrar
							</button>
						</div>
						<input
							required
							placeholder="Código interno"
							value={segmentForm.code}
							onChange={(event) =>
								setSegmentForm((current) => ({
									...current,
									code: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<input
							required
							placeholder="Nombre"
							value={segmentForm.name}
							onChange={(event) =>
								setSegmentForm((current) => ({
									...current,
									name: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<textarea
							placeholder="Descripción"
							value={segmentForm.description}
							onChange={(event) =>
								setSegmentForm((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<textarea
							placeholder="Criterios comerciales"
							value={segmentForm.criteria}
							onChange={(event) =>
								setSegmentForm((current) => ({
									...current,
									criteria: event.target.value,
								}))
							}
							className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<div className="flex flex-wrap gap-2">
							<button
								type="submit"
								disabled={segmentSubmitPending}
								className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
							>
								{editingSegmentId ? "Guardar cambios" : "Crear rango"}
							</button>
							{editingSegmentId ? (
								<button
									type="button"
									onClick={closeCommunicationForm}
									className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
								>
									Cancelar edición
								</button>
							) : null}
						</div>
					</form>

					<div className="grid gap-3 md:grid-cols-2">
						{segments.length ? (
							segments.map((segment) => (
								<article
									key={segment.id}
									className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
								>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
										{segment.code}
									</p>
									<h3 className="mt-1 font-semibold text-slate-900">
										{segment.name}
									</h3>
									<p className="mt-2 text-sm text-slate-600">
										{segment.description ?? "Sin descripción"}
									</p>
									{segment.criteria ? (
										<p className="mt-2 text-xs text-slate-500">
											Criterios: {segment.criteria}
										</p>
									) : null}
									<div className="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() => startEditingSegment(segment)}
											className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
										>
											Editar
										</button>
										<button
											type="button"
											onClick={() => deleteSegment(segment.id)}
											disabled={pendingAction === `segment-${segment.id}`}
											className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
										>
											{confirmDeleteAction === `segment-${segment.id}`
												? "Confirmar eliminar"
												: "Eliminar"}
										</button>
									</div>
								</article>
							))
						) : (
							<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
								Sin rangos registrados.
							</p>
						)}
					</div>
				</section>
			) : null}

			{activeTab === "assignments" ? (
				<section className="grid gap-5">
					<form
						onSubmit={handleCreateAssignment}
						role="dialog"
						aria-modal={openForm === "assignments"}
						className={getFormDialogClass("assignments")}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-slate-900">
									Asignar cliente a rango
								</h2>
								<p className="text-sm text-slate-500">
									El rango controla qué promociones ve cada salón.
								</p>
							</div>
							<button
								type="button"
								onClick={closeCommunicationForm}
								className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
							>
								Cerrar
							</button>
						</div>
						<select
							required
							value={assignmentForm.clientId}
							onChange={(event) =>
								setAssignmentForm((current) => ({
									...current,
									clientId: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						>
							<option value="">Selecciona cliente</option>
							{clients.map((client) => (
								<option key={client.id} value={client.id}>
									{client.name}
									{client.email ? ` - ${client.email}` : ""}
								</option>
							))}
						</select>
						<select
							required
							value={assignmentForm.segmentId}
							onChange={(event) =>
								setAssignmentForm((current) => ({
									...current,
									segmentId: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						>
							<option value="">Selecciona rango</option>
							{segments.map((segment) => (
								<option key={segment.id} value={segment.id}>
									{segment.name}
								</option>
							))}
						</select>
						<textarea
							placeholder="Notas internas"
							value={assignmentForm.notes}
							onChange={(event) =>
								setAssignmentForm((current) => ({
									...current,
									notes: event.target.value,
								}))
							}
							className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
						<button
							type="submit"
							disabled={pendingAction === "create-assignment"}
							className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
						>
							Asignar rango
						</button>
					</form>

					<div className="space-y-3">
						{assignments.length ? (
							assignments.map((assignment) => (
								<article
									key={assignment.id}
									className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold text-slate-900">
												{assignment.clientName}
											</h3>
											<p className="text-sm text-slate-500">
												{assignment.clientEmail ?? "Sin email"} -{" "}
												{assignment.segmentName}
											</p>
										</div>
										<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
											{assignment.segmentCode}
										</span>
									</div>
									{assignment.notes ? (
										<p className="mt-2 text-sm text-slate-600">
											{assignment.notes}
										</p>
									) : null}
									<button
										type="button"
										onClick={() => deleteAssignment(assignment.id)}
										disabled={pendingAction === `assignment-${assignment.id}`}
										className="mt-3 rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
									>
										{confirmDeleteAction === `assignment-${assignment.id}`
											? "Confirmar quitar"
											: "Quitar asignación"}
									</button>
								</article>
							))
						) : (
							<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
								Sin asignaciones registradas.
							</p>
						)}
					</div>
				</section>
			) : null}
		</div>
	);
}
