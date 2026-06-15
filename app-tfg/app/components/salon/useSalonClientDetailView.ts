"use client";

import {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useState,
} from "react";
import { useSessionStorageState } from "@/app/hooks/useSessionStorageState";
import type {
	SalonClientDetail,
	SalonProductOption,
	SalonServiceSummary,
	SalonServiceTemplateSummary,
} from "@/lib/contracts/salon";
import { formatDateShort } from "@/lib/utils/user-utils";
import {
	deleteSalonResultImage,
	deleteSalonService,
	deleteSalonServiceTemplate,
	getSalonRequestErrorMessage,
	saveSalonService,
	saveSalonServiceTemplate,
	updateSalonClientProfile,
	uploadSalonResultImage,
} from "./salon-client-api";
import {
	useSalonTechnicalEmailDraft,
	type SalonFeedbackState,
} from "./useSalonTechnicalEmailDraft";
import {
	buildServiceSearchValue,
	cleanupTransientResultImages,
	createEditableResultImage,
	createEmptyProductUsage,
	createProductUsageFromService,
	createProductUsageFromTemplate,
	type EditableProductUsage,
	type EditableResultImage,
} from "./salon-client-detail-utils";

type UseSalonClientDetailViewParams = {
	initialDetail: SalonClientDetail;
	initialTemplates: SalonServiceTemplateSummary[];
	productOptions: SalonProductOption[];
};

export function useSalonClientDetailView({
	initialDetail,
	initialTemplates,
	productOptions,
}: UseSalonClientDetailViewParams) {
	const productOptionsBySelectionId = new Map(
		productOptions.map((productOption) => [productOption.id, productOption]),
	);
	const [detail, setDetail] = useState(initialDetail);
	const [templates, setTemplates] =
		useState<SalonServiceTemplateSummary[]>(initialTemplates);
	const [name, setName] = useState(initialDetail.salonClient.name);
	const [phone, setPhone] = useState(initialDetail.salonClient.phone ?? "");
	const [email, setEmail] = useState(initialDetail.salonClient.email ?? "");
	const [notes, setNotes] = useState(initialDetail.salonClient.notes ?? "");
	const [serviceDate, setServiceDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [serviceType, setServiceType] = useState("");
	const [serviceNotes, setServiceNotes] = useState("");
	const [serviceResult, setServiceResult] = useState("");
	const [technicalDescription, setTechnicalDescription] = useState("");
	const [formula, setFormula] = useState("");
	const [technicalNotes, setTechnicalNotes] = useState("");
	const [productUsages, setProductUsages] = useState<EditableProductUsage[]>([
		createEmptyProductUsage("usage-1"),
	]);
	const [resultImages, setResultImages] = useState<EditableResultImage[]>([]);
	const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
	const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
	const {
		technicalEmailDraftServiceId,
		technicalEmailDraft,
		technicalEmailSubject,
		setTechnicalEmailSubject,
		technicalEmailBody,
		setTechnicalEmailBody,
		isLoadingTechnicalEmail,
		technicalEmailFeedback,
		technicalEmailMailtoHref,
		handleOpenTechnicalEmailDraft,
		handleCopyTechnicalEmailDraft,
		resetTechnicalEmailDraft,
	} = useSalonTechnicalEmailDraft({
		salonClientId: detail.salonClient.id,
		services: detail.services,
	});
	const salonHistoryFilterKey = `salon-client-history:${initialDetail.salonClient.id}`;
	const [historySearch, setHistorySearch] = useSessionStorageState(
		`${salonHistoryFilterKey}:search`,
		"",
	);
	const [historyServiceType, setHistoryServiceType] = useSessionStorageState(
		`${salonHistoryFilterKey}:service-type`,
		"",
	);
	const [historyDateFrom, setHistoryDateFrom] = useSessionStorageState(
		`${salonHistoryFilterKey}:date-from`,
		"",
	);
	const [historyDateTo, setHistoryDateTo] = useSessionStorageState(
		`${salonHistoryFilterKey}:date-to`,
		"",
	);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isSavingService, setIsSavingService] = useState(false);
	const [templateName, setTemplateName] = useState("");
	const [selectedTemplateId, setSelectedTemplateId] = useState("");
	const [isTemplateSaveOpen, setIsTemplateSaveOpen] = useState(false);
	const [isSavingTemplate, setIsSavingTemplate] = useState(false);
	const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
	const [profileFeedback, setProfileFeedback] = useState<SalonFeedbackState>(null);
	const [serviceFeedback, setServiceFeedback] = useState<SalonFeedbackState>(null);
	const [templateFeedback, setTemplateFeedback] =
		useState<SalonFeedbackState>(null);
	const [isUploadingResultImages, setIsUploadingResultImages] = useState(false);

	useEffect(() => {
		setName(detail.salonClient.name);
		setPhone(detail.salonClient.phone ?? "");
		setEmail(detail.salonClient.email ?? "");
		setNotes(detail.salonClient.notes ?? "");
	}, [detail.salonClient]);

	useEffect(() => {
		if (!editingServiceId) {
			return;
		}

		const editingServiceStillExists = detail.services.some(
			(service) => service.id === editingServiceId,
		);

		if (!editingServiceStillExists) {
			void cleanupTransientResultImages(resultImages);
			setEditingServiceId(null);
			setServiceDate(new Date().toISOString().slice(0, 10));
			setServiceType("");
			setServiceNotes("");
			setServiceResult("");
			setTechnicalDescription("");
			setFormula("");
			setTechnicalNotes("");
			setProductUsages([createEmptyProductUsage("usage-1")]);
			setResultImages([]);
		}
	}, [detail.services, editingServiceId, resultImages]);

	function resetServiceForm(options: { cleanupTransient?: boolean } = {}) {
		if (options.cleanupTransient !== false) {
			void cleanupTransientResultImages(resultImages);
		}

		setEditingServiceId(null);
		setServiceDate(new Date().toISOString().slice(0, 10));
		setServiceType("");
		setServiceNotes("");
		setServiceResult("");
		setTechnicalDescription("");
		setFormula("");
		setTechnicalNotes("");
		setProductUsages([createEmptyProductUsage("usage-1")]);
		setResultImages([]);
		setSelectedTemplateId("");
		setTemplateName("");
		setIsTemplateSaveOpen(false);
	}

	function populateServiceForm(service: SalonServiceSummary) {
		void cleanupTransientResultImages(resultImages);
		setEditingServiceId(service.id);
		setServiceDate(service.service_date.slice(0, 10));
		setServiceType(service.service_type);
		setServiceNotes(service.notes ?? "");
		setServiceResult(service.result ?? "");
		setTechnicalDescription(service.technical_description ?? "");
		setFormula(service.formula ?? "");
		setTechnicalNotes(service.technical_notes ?? "");
		setSelectedTemplateId("");
		setIsTemplateSaveOpen(false);
		setProductUsages(
			service.product_usages.length > 0
				? service.product_usages.map((_, index) =>
						createProductUsageFromService(service, index),
					)
				: [createEmptyProductUsage(`usage-${service.id}-1`)],
		);
		setResultImages(
			service.result_images.map((resultImage, index) =>
				createEditableResultImage(
					resultImage.image_url,
					true,
					`result-image-${service.id}-${index}`,
				),
			),
		);
	}

	function applyTemplateToServiceForm(template: SalonServiceTemplateSummary) {
		void cleanupTransientResultImages(resultImages);
		setEditingServiceId(null);
		setSelectedTemplateId(template.id);
		setIsTemplateSaveOpen(false);
		setServiceType(template.service_type);
		setServiceNotes(template.notes ?? "");
		setServiceResult(template.result ?? "");
		setTechnicalDescription(template.technical_description ?? "");
		setFormula(template.formula ?? "");
		setTechnicalNotes(template.technical_notes ?? "");
		setProductUsages(
			template.product_usages.length > 0
				? template.product_usages.map((_, index) =>
						createProductUsageFromTemplate(template, index),
					)
				: [createEmptyProductUsage(`template-usage-${template.id}-1`)],
		);
		setResultImages([]);
	}

	function updateProductUsage(
		localId: string,
		field: keyof EditableProductUsage,
		value: string,
	) {
		setProductUsages((current) =>
			current.map((productUsage) =>
				productUsage.localId === localId
					? {
							...productUsage,
							[field]: value,
						}
					: productUsage,
			),
		);
	}

	function addProductUsageRow() {
		setProductUsages((current) => [
			...current,
			createEmptyProductUsage(`usage-${Date.now()}-${current.length + 1}`),
		]);
	}

	function removeProductUsageRow(localId: string) {
		setProductUsages((current) => {
			if (current.length === 1) {
				return [createEmptyProductUsage("usage-1")];
			}

			return current.filter((productUsage) => productUsage.localId !== localId);
		});
	}

	function buildProductUsagePayload() {
		return productUsages.map((productUsage) => {
			const selectedProduct =
				productOptionsBySelectionId.get(productUsage.selectionId) ?? null;

			return {
				productId: selectedProduct?.productId ?? "",
				colorReferenceId: selectedProduct?.colorReferenceId ?? null,
				quantityUsed: productUsage.quantityUsed,
				notes: productUsage.notes,
			};
		});
	}

	async function handleResultImagesUpload(
		event: ChangeEvent<HTMLInputElement>,
	) {
		const files = Array.from(event.target.files ?? []);

		if (files.length === 0) {
			return;
		}

		setServiceFeedback(null);
		setIsUploadingResultImages(true);

		try {
			const uploadedImages = await Promise.all(
				files.map(async (file) => {
					const uploadFormData = new FormData();
					uploadFormData.append("file", file);

					const payload = await uploadSalonResultImage(uploadFormData);

					return createEditableResultImage(payload.imageUrl, false);
				}),
			);

			setResultImages((current) => [...current, ...uploadedImages]);
			setServiceFeedback({
				type: "success",
				message:
					files.length === 1
						? "Imagen de resultado subida correctamente."
						: "Imágenes de resultado subidas correctamente.",
			});
		} catch (error) {
			setServiceFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido subir la imagen del resultado final.",
				),
			});
		} finally {
			setIsUploadingResultImages(false);
			event.target.value = "";
		}
	}

	async function handleRemoveResultImage(image: EditableResultImage) {
		if (!image.persisted) {
			try {
				await deleteSalonResultImage(image.imageUrl);
			} catch (error) {
				setServiceFeedback({
					type: "error",
					message: getSalonRequestErrorMessage(
						error,
						"No se ha podido eliminar la imagen del resultado final.",
					),
				});
				return;
			}
		}

		setResultImages((current) =>
			current.filter((currentImage) => currentImage.localId !== image.localId),
		);
	}

	function startServiceEditing(service: SalonServiceSummary) {
		setServiceFeedback(null);
		populateServiceForm(service);
	}

	function handleApplyTemplate(template: SalonServiceTemplateSummary) {
		setTemplateFeedback(null);
		setServiceFeedback({
			type: "success",
			message: `Plantilla "${template.name}" aplicada al formulario.`,
		});
		applyTemplateToServiceForm(template);
	}

	function handleTemplateSelection(templateId: string) {
		setSelectedTemplateId(templateId);

		if (!templateId) {
			return;
		}

		const selectedTemplate = templates.find(
			(template) => template.id === templateId,
		);

		if (selectedTemplate) {
			handleApplyTemplate(selectedTemplate);
		}
	}

	async function handleSaveCurrentFormAsTemplate() {
		setTemplateFeedback(null);
		setIsSavingTemplate(true);

		try {
			const data = await saveSalonServiceTemplate({
				name: templateName,
				serviceType,
				notes: serviceNotes,
				result: serviceResult,
				technicalDescription,
				formula,
				technicalNotes,
				productUsages: buildProductUsagePayload(),
			});

			setTemplates((current) => [data, ...current]);
			setTemplateName("");
			setIsTemplateSaveOpen(false);
			setTemplateFeedback({
				type: "success",
				message: "Plantilla técnica guardada correctamente.",
			});
		} catch (error) {
			setTemplateFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido guardar la plantilla técnica.",
				),
			});
		} finally {
			setIsSavingTemplate(false);
		}
	}

	async function handleDeleteTemplate(template: SalonServiceTemplateSummary) {
		const confirmed = window.confirm(
			`Se eliminará la plantilla "${template.name}". Esta acción no se puede deshacer.`,
		);

		if (!confirmed) {
			return;
		}

		setTemplateFeedback(null);
		setDeletingTemplateId(template.id);

		try {
			await deleteSalonServiceTemplate(template.id);

			setTemplates((current) =>
				current.filter((currentTemplate) => currentTemplate.id !== template.id),
			);
			setSelectedTemplateId((currentTemplateId) =>
				currentTemplateId === template.id ? "" : currentTemplateId,
			);
			setTemplateFeedback({
				type: "success",
				message: "Plantilla técnica eliminada correctamente.",
			});
		} catch (error) {
			setTemplateFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido eliminar la plantilla técnica.",
				),
			});
		} finally {
			setDeletingTemplateId(null);
		}
	}

	const serviceTypeOptions = [...new Set(detail.services.map((service) => service.service_type))]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

	const normalizedHistorySearch = historySearch.trim().toLocaleLowerCase("es");
	const filteredServices = detail.services.filter((service) => {
		const serviceDateKey = service.service_date.slice(0, 10);

		if (historyServiceType && service.service_type !== historyServiceType) {
			return false;
		}

		if (historyDateFrom && serviceDateKey < historyDateFrom) {
			return false;
		}

		if (historyDateTo && serviceDateKey > historyDateTo) {
			return false;
		}

		if (!normalizedHistorySearch) {
			return true;
		}

		return buildServiceSearchValue(service).includes(normalizedHistorySearch);
	});

	async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setProfileFeedback(null);
		setIsSavingProfile(true);

		try {
			const data = await updateSalonClientProfile(detail.salonClient.id, {
				name,
				phone,
				email,
				notes,
			});

			setDetail((current) => ({
				...current,
				salonClient: data,
			}));
			resetTechnicalEmailDraft();
			setProfileFeedback({
				type: "success",
				message: "Ficha técnica actualizada correctamente.",
			});
		} catch (error) {
			setProfileFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido guardar la ficha técnica.",
				),
			});
		} finally {
			setIsSavingProfile(false);
		}
	}

	async function handleServiceSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setServiceFeedback(null);
		setIsSavingService(true);

		const isEditingService = Boolean(editingServiceId);

		try {
			const data = await saveSalonService(
				detail.salonClient.id,
				{
					serviceDate,
					serviceType,
					notes: serviceNotes,
					result: serviceResult,
					technicalDescription,
					formula,
					technicalNotes,
					productUsages: buildProductUsagePayload(),
					resultImages: resultImages.map((resultImage) => resultImage.imageUrl),
				},
				editingServiceId,
			);

			setDetail(data);
			resetServiceForm({ cleanupTransient: false });
			resetTechnicalEmailDraft();
			setServiceFeedback({
				type: "success",
				message: isEditingService
					? "Servicio técnico actualizado correctamente."
					: "Servicio técnico registrado correctamente.",
			});
		} catch (error) {
			setServiceFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					isEditingService
						? "No se ha podido actualizar el servicio técnico."
						: "No se ha podido registrar el servicio técnico.",
				),
			});
		} finally {
			setIsSavingService(false);
		}
	}

	async function handleDeleteService(service: SalonServiceSummary) {
		const confirmed = window.confirm(
			`Se eliminará el servicio "${service.service_type}" del ${formatDateShort(
				service.service_date,
			)}. Esta acción no se puede deshacer.`,
		);

		if (!confirmed) {
			return;
		}

		setServiceFeedback(null);
		setDeletingServiceId(service.id);

		try {
			const data = await deleteSalonService(detail.salonClient.id, service.id);

			setDetail(data);

			if (editingServiceId === service.id) {
				resetServiceForm();
			}

			if (technicalEmailDraftServiceId === service.id) {
				resetTechnicalEmailDraft();
			}

			setServiceFeedback({
				type: "success",
				message: "Servicio técnico eliminado correctamente.",
			});
		} catch (error) {
			setServiceFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido eliminar el servicio técnico.",
				),
			});
		} finally {
			setDeletingServiceId(null);
		}
	}

	const historyCounterLabel =
		filteredServices.length === detail.services.length
			? String(detail.services.length)
			: `${filteredServices.length} / ${detail.services.length}`;
	const selectedTemplate =
		templates.find((template) => template.id === selectedTemplateId) ?? null;

	return {
		detail,
		templates,
		name,
		setName,
		phone,
		setPhone,
		email,
		setEmail,
		notes,
		setNotes,
		serviceDate,
		setServiceDate,
		serviceType,
		setServiceType,
		serviceNotes,
		setServiceNotes,
		serviceResult,
		setServiceResult,
		technicalDescription,
		setTechnicalDescription,
		formula,
		setFormula,
		technicalNotes,
		setTechnicalNotes,
		productUsages,
		resultImages,
		editingServiceId,
		deletingServiceId,
		technicalEmailDraftServiceId,
		technicalEmailDraft,
		technicalEmailSubject,
		setTechnicalEmailSubject,
		technicalEmailBody,
		setTechnicalEmailBody,
		isLoadingTechnicalEmail,
		technicalEmailFeedback,
		technicalEmailMailtoHref,
		handleOpenTechnicalEmailDraft,
		handleCopyTechnicalEmailDraft,
		resetTechnicalEmailDraft,
		historySearch,
		setHistorySearch,
		historyServiceType,
		setHistoryServiceType,
		historyDateFrom,
		setHistoryDateFrom,
		historyDateTo,
		setHistoryDateTo,
		isSavingProfile,
		isSavingService,
		templateName,
		setTemplateName,
		selectedTemplateId,
		isTemplateSaveOpen,
		setIsTemplateSaveOpen,
		isSavingTemplate,
		deletingTemplateId,
		profileFeedback,
		serviceFeedback,
		templateFeedback,
		isUploadingResultImages,
		resetServiceForm,
		updateProductUsage,
		addProductUsageRow,
		removeProductUsageRow,
		handleResultImagesUpload,
		handleRemoveResultImage,
		startServiceEditing,
		handleApplyTemplate,
		handleTemplateSelection,
		handleSaveCurrentFormAsTemplate,
		handleDeleteTemplate,
		serviceTypeOptions,
		filteredServices,
		handleProfileSubmit,
		handleServiceSubmit,
		handleDeleteService,
		historyCounterLabel,
		selectedTemplate,
	};
}
