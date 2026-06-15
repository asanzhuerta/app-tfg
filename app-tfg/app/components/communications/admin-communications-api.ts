import { jsonRequestOptions, requestJson } from "@/lib/api/client";

export type PromotionAttachmentUploadResponse = {
	url: string;
	downloadUrl?: string;
	name: string;
	mimeType: string;
	kind: "image" | "pdf";
};

export function uploadPromotionAttachment(formData: FormData) {
	return requestJson<PromotionAttachmentUploadResponse>(
		"/api/admin/communications/promotions/upload-attachment",
		{
			method: "POST",
			body: formData,
			fallbackMessage: "No se pudo subir el adjunto",
		},
	);
}

export function saveAdminPromotion(
	promotionId: string | null,
	payload: unknown,
) {
	const isEditing = Boolean(promotionId);

	return requestJson(
		isEditing
			? `/api/admin/communications/promotions/${promotionId}`
			: "/api/admin/communications/promotions",
		jsonRequestOptions(
			isEditing ? "PATCH" : "POST",
			payload,
			isEditing
				? "No se pudo actualizar la promoción"
				: "No se pudo crear la promoción",
		),
	);
}

export function updateAdminPromotionStatus(id: string, status: string) {
	return requestJson(
		`/api/admin/communications/promotions/${id}`,
		jsonRequestOptions("PATCH", { status }, "No se pudo actualizar la promoción"),
	);
}

export function deleteAdminPromotion(id: string) {
	return requestJson(`/api/admin/communications/promotions/${id}`, {
		method: "DELETE",
		fallbackMessage: "No se pudo eliminar la promoción",
	});
}

export function saveAdminTraining(trainingId: string | null, payload: unknown) {
	const isEditing = Boolean(trainingId);

	return requestJson(
		isEditing
			? `/api/admin/communications/trainings/${trainingId}`
			: "/api/admin/communications/trainings",
		jsonRequestOptions(
			isEditing ? "PATCH" : "POST",
			payload,
			isEditing
				? "No se pudo actualizar la formación"
				: "No se pudo crear la formación",
		),
	);
}

export function updateAdminTrainingStatus(id: string, status: string) {
	return requestJson(
		`/api/admin/communications/trainings/${id}`,
		jsonRequestOptions("PATCH", { status }, "No se pudo actualizar la formación"),
	);
}

export function deleteAdminTraining(id: string) {
	return requestJson(`/api/admin/communications/trainings/${id}`, {
		method: "DELETE",
		fallbackMessage: "No se pudo eliminar la formación",
	});
}

export function saveAdminSegment(segmentId: string | null, payload: unknown) {
	const isEditing = Boolean(segmentId);

	return requestJson(
		isEditing
			? `/api/admin/communications/segments/${segmentId}`
			: "/api/admin/communications/segments",
		jsonRequestOptions(
			isEditing ? "PATCH" : "POST",
			payload,
			isEditing
				? "No se pudo actualizar el rango"
				: "No se pudo crear el rango",
		),
	);
}

export function deleteAdminSegment(id: string) {
	return requestJson(`/api/admin/communications/segments/${id}`, {
		method: "DELETE",
		fallbackMessage: "No se pudo eliminar el rango",
	});
}

export function createAdminClientSegmentAssignment(payload: unknown) {
	return requestJson(
		"/api/admin/communications/client-segments",
		jsonRequestOptions("POST", payload, "No se pudo asignar el rango"),
	);
}

export function deleteAdminClientSegmentAssignment(id: string) {
	return requestJson(`/api/admin/communications/client-segments/${id}`, {
		method: "DELETE",
		fallbackMessage: "No se pudo quitar la asignación",
	});
}
