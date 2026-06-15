"use client";

import {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import type {
	ClientSegmentAssignmentView,
	ProductOptionView,
	PromotionView,
	PromotionDiscountTypeView,
	SegmentView,
	TrainingEventView,
} from "./communication-view-types";
import { findProductOptionLabel } from "./ProductSearchField";
import {
	getErrorMessage,
	toDateTimeLocal,
} from "./admin-communication-utils";
import {
	defaultDeliveryChannels,
	emptyAssignmentForm,
	emptyPromotionForm,
	emptySegmentForm,
	emptyTrainingForm,
	type AdminTab,
} from "./admin-communication-forms";
import { buildAdminCommunicationSummaryByTab } from "./admin-communication-summary";
import {
	createAdminClientSegmentAssignment,
	deleteAdminClientSegmentAssignment,
	deleteAdminPromotion,
	deleteAdminSegment,
	deleteAdminTraining,
	saveAdminPromotion,
	saveAdminSegment,
	saveAdminTraining,
	updateAdminPromotionStatus,
	updateAdminTrainingStatus,
	uploadPromotionAttachment,
} from "./admin-communications-api";

type UseAdminCommunicationsWorkspaceParams = {
	initialSegments: SegmentView[];
	initialAssignments: ClientSegmentAssignmentView[];
	products: ProductOptionView[];
	promotionDiscountTypes: PromotionDiscountTypeView[];
	initialPromotions: PromotionView[];
	initialTrainings: TrainingEventView[];
};

export function useAdminCommunicationsWorkspace({
	initialSegments,
	initialAssignments,
	products,
	promotionDiscountTypes,
	initialPromotions,
	initialTrainings,
}: UseAdminCommunicationsWorkspaceParams) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<AdminTab>("promotions");
	const [openForm, setOpenForm] = useState<AdminTab | null>(null);
	const [segments, setSegments] = useState(initialSegments);
	const [assignments, setAssignments] = useState(initialAssignments);
	const [promotions, setPromotions] = useState(initialPromotions);
	const [trainings, setTrainings] = useState(initialTrainings);
	const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
	const [promotionGiftProductQuery, setPromotionGiftProductQuery] =
		useState("");
	const [promotionProductQuery, setPromotionProductQuery] = useState("");
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
	const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(
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
		setPromotionGiftProductQuery("");
		setPromotionProductQuery("");
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
			"max-h-[calc(100svh-2rem)] w-[min(44rem,calc(100dvw-2rem))] overflow-y-auto overflow-x-hidden",
			"[&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full [&_textarea]:min-w-0 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:overflow-x-hidden",
			openForm === tab ? "app-modal-dialog-centered z-[90]" : "hidden",
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
		setPromotionGiftProductQuery(
			findProductOptionLabel(products, promotion.giftProductId ?? ""),
		);
		setPromotionProductQuery(
			findProductOptionLabel(products, promotion.productId ?? ""),
		);
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

			const upload = await uploadPromotionAttachment(formData);

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
			await saveAdminPromotion(editingPromotionId, buildPromotionPayload());
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
			await updateAdminPromotionStatus(id, status);
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
			await deleteAdminPromotion(id);
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
			await saveAdminTraining(editingTrainingId, buildTrainingPayload());
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
			await updateAdminTrainingStatus(id, status);
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
			await deleteAdminTraining(id);
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
			await saveAdminSegment(editingSegmentId, segmentForm);
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
			await deleteAdminSegment(id);
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
			await createAdminClientSegmentAssignment(assignmentForm);
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
			await deleteAdminClientSegmentAssignment(id);
			refreshAfter("Asignación eliminada");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo quitar la asignación"));
		} finally {
			setPendingAction(null);
		}
	}

	function toggleTrainingEnrollmentList(trainingId: string) {
		setExpandedTrainingId((current) =>
			current === trainingId ? null : trainingId,
		);
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
	const assignmentSubmitPending = pendingAction === "create-assignment";
	const activePromotionsCount = promotions.filter(
		(promotion) => promotion.status === "active",
	).length;
	const publishedTrainingsCount = trainings.filter(
		(training) => training.status === "published",
	).length;
	const summaryByTab = buildAdminCommunicationSummaryByTab({
		activePromotionsCount,
		publishedTrainingsCount,
		segmentCount: segments.length,
		assignmentCount: assignments.length,
	});

	return {
		activeTab,
		setActiveTab,
		openForm,
		segments,
		assignments,
		promotions,
		trainings,
		promotionForm,
		setPromotionForm,
		promotionGiftProductQuery,
		setPromotionGiftProductQuery,
		promotionProductQuery,
		setPromotionProductQuery,
		trainingForm,
		setTrainingForm,
		segmentForm,
		setSegmentForm,
		assignmentForm,
		setAssignmentForm,
		editingPromotionId,
		editingTrainingId,
		editingSegmentId,
		message,
		error,
		pendingAction,
		confirmDeleteAction,
		expandedTrainingId,
		promotionSubmitPending,
		trainingSubmitPending,
		segmentSubmitPending,
		assignmentSubmitPending,
		activeSummary: summaryByTab[activeTab],
		closeCommunicationForm,
		openCommunicationForm,
		getFormDialogClass,
		handlePromotionAttachmentUpload,
		handleSubmitPromotion,
		patchPromotionStatus,
		deletePromotion,
		handleSubmitTraining,
		patchTrainingStatus,
		deleteTraining,
		handleSubmitSegment,
		deleteSegment,
		handleCreateAssignment,
		deleteAssignment,
		startEditingPromotion,
		startEditingTraining,
		startEditingSegment,
		toggleTrainingEnrollmentList,
	};
}
