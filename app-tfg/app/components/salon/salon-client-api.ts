import {
	getClientErrorMessage,
	jsonRequestOptions,
	requestJson,
} from "@/lib/api/client";
import type {
	CreateSalonClientBody,
	CreateSalonServiceBody,
	CreateSalonServiceTemplateBody,
	SalonClientDetail,
	SalonClientSummary,
	SalonServiceTemplateSummary,
	SalonTechnicalEmailDraft,
	UpdateSalonClientBody,
} from "@/lib/contracts/salon";

export type UploadSalonResultImageResponse = {
	imageUrl: string;
	publicId: string;
	message: string;
};

export type DeleteSalonResultImageResponse = {
	imageUrl: string;
	message: string;
};

export async function deleteSalonResultImage(imageUrl: string) {
	return requestJson<DeleteSalonResultImageResponse>(
		"/api/clients/salon-service-result-images",
		jsonRequestOptions(
			"DELETE",
			{ imageUrl },
			"No se ha podido eliminar la imagen del resultado.",
		),
	);
}

export async function uploadSalonResultImage(formData: FormData) {
	return requestJson<UploadSalonResultImageResponse>(
		"/api/clients/salon-service-result-images",
		{
			method: "POST",
			body: formData,
			fallbackMessage: "No se ha podido subir la imagen del resultado.",
		},
	);
}

export async function saveSalonServiceTemplate(
	payload: CreateSalonServiceTemplateBody,
) {
	return requestJson<SalonServiceTemplateSummary>(
		"/api/clients/salon-service-templates",
		jsonRequestOptions(
			"POST",
			payload,
			"No se ha podido guardar la plantilla técnica.",
		),
	);
}

export async function deleteSalonServiceTemplate(templateId: string) {
	return requestJson<{ id: string }>(
		`/api/clients/salon-service-templates/${templateId}`,
		{
			method: "DELETE",
			fallbackMessage: "No se ha podido eliminar la plantilla técnica.",
		},
	);
}

export async function fetchSalonTechnicalEmailDraft(
	salonClientId: string,
	serviceId: string,
) {
	return requestJson<SalonTechnicalEmailDraft>(
		`/api/clients/salon-clients/${salonClientId}/services/${serviceId}/technical-email`,
		{
			fallbackMessage: "No se ha podido preparar el correo técnico.",
		},
	);
}

export async function updateSalonClientProfile(
	salonClientId: string,
	payload: UpdateSalonClientBody,
) {
	return requestJson<SalonClientSummary>(
		`/api/clients/salon-clients/${salonClientId}`,
		jsonRequestOptions(
			"PATCH",
			payload,
			"No se ha podido guardar la ficha técnica.",
		),
	);
}

export async function createSalonClient(payload: CreateSalonClientBody) {
	return requestJson<SalonClientSummary>(
		"/api/clients/salon-clients",
		jsonRequestOptions(
			"POST",
			payload,
			"No se ha podido crear la ficha técnica.",
		),
	);
}

export async function saveSalonService(
	salonClientId: string,
	payload: CreateSalonServiceBody,
	serviceId?: string | null,
) {
	const isEditingService = Boolean(serviceId);
	const requestUrl = isEditingService
		? `/api/clients/salon-clients/${salonClientId}/services/${serviceId}`
		: `/api/clients/salon-clients/${salonClientId}/services`;

	return requestJson<SalonClientDetail>(
		requestUrl,
		jsonRequestOptions(
			isEditingService ? "PATCH" : "POST",
			payload,
			isEditingService
				? "No se ha podido actualizar el servicio técnico."
				: "No se ha podido registrar el servicio técnico.",
		),
	);
}

export async function deleteSalonService(
	salonClientId: string,
	serviceId: string,
) {
	return requestJson<SalonClientDetail>(
		`/api/clients/salon-clients/${salonClientId}/services/${serviceId}`,
		{
			method: "DELETE",
			fallbackMessage: "No se ha podido eliminar el servicio técnico.",
		},
	);
}

export const getSalonRequestErrorMessage = getClientErrorMessage;
