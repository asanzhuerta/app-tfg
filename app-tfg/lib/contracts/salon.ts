export type SalonProductOption = {
	id: string;
	productId: string;
	colorReferenceId: string | null;
	name: string;
	reference: string | null;
	productLineName: string | null;
	format: string | null;
	packing: number | null;
	colorReferenceCode: string | null;
	colorReferenceName: string | null;
};

export type SalonClientSummary = {
	id: string;
	client_id: string;
	name: string;
	phone: string | null;
	email: string | null;
	notes: string | null;
	service_count: number;
	last_service_at: string | null;
	created_at: string;
	updated_at: string;
};

export type SalonServiceProductUsageSummary = {
	id: string;
	product_id: string;
	color_reference_id: string | null;
	color_reference_code: string | null;
	color_reference_name: string | null;
	product_name: string;
	product_reference: string | null;
	product_line_name: string | null;
	quantity_used: string | null;
	notes: string | null;
};

export type SalonServiceResultImageSummary = {
	id: string;
	service_id: string;
	image_url: string;
	display_order: number;
	created_at: string;
};

export type SalonServiceSummary = {
	id: string;
	salon_client_id: string;
	client_id: string;
	recorded_by_user_id: string;
	service_date: string;
	service_type: string;
	notes: string | null;
	result: string | null;
	technical_description: string | null;
	formula: string | null;
	technical_notes: string | null;
	product_usages: SalonServiceProductUsageSummary[];
	result_images: SalonServiceResultImageSummary[];
	created_at: string;
	updated_at: string;
};

export type SalonProductSuggestionSummary = {
	id: string;
	salon_client_id: string;
	product_id: string;
	product_name: string;
	product_reference: string | null;
	product_line_name: string | null;
	reason: string;
	generated_at: string;
};

export type SalonTechnicalEmailDraft = {
	salon_client_id: string;
	service_id: string;
	recipient_name: string;
	recipient_email: string | null;
	service_type: string;
	service_date: string;
	subject: string;
	body: string;
	generated_at: string;
};

export type SalonServiceTemplateProductUsageSummary = {
	id: string;
	template_id: string;
	product_id: string;
	color_reference_id: string | null;
	color_reference_code: string | null;
	color_reference_name: string | null;
	product_name: string;
	product_reference: string | null;
	product_line_name: string | null;
	quantity_used: string | null;
	notes: string | null;
};

export type SalonServiceTemplateSummary = {
	id: string;
	client_id: string;
	created_by_user_id: string;
	name: string;
	service_type: string;
	notes: string | null;
	result: string | null;
	technical_description: string | null;
	formula: string | null;
	technical_notes: string | null;
	product_usages: SalonServiceTemplateProductUsageSummary[];
	created_at: string;
	updated_at: string;
};

export type SalonClientDetail = {
	salonClient: SalonClientSummary;
	services: SalonServiceSummary[];
	suggestions: SalonProductSuggestionSummary[];
};

export type CreateSalonClientBody = {
	name?: string | null;
	phone?: string | null;
	email?: string | null;
	notes?: string | null;
};

export type UpdateSalonClientBody = CreateSalonClientBody;

export type CreateSalonServiceProductUsageBody = {
	productId?: string | null;
	colorReferenceId?: string | null;
	quantityUsed?: number | string | null;
	notes?: string | null;
};

export type CreateSalonServiceBody = {
	serviceDate?: string | null;
	serviceType?: string | null;
	notes?: string | null;
	result?: string | null;
	technicalDescription?: string | null;
	formula?: string | null;
	technicalNotes?: string | null;
	productUsages?: CreateSalonServiceProductUsageBody[] | null;
	resultImages?: string[] | null;
};

export type UpdateSalonServiceBody = CreateSalonServiceBody;

export type CreateSalonServiceTemplateBody = {
	name?: string | null;
	serviceType?: string | null;
	notes?: string | null;
	result?: string | null;
	technicalDescription?: string | null;
	formula?: string | null;
	technicalNotes?: string | null;
	productUsages?: CreateSalonServiceProductUsageBody[] | null;
};

export function buildCreateSalonClientInput(body: CreateSalonClientBody) {
	return {
		name: body.name,
		phone: body.phone,
		email: body.email,
		notes: body.notes,
	};
}

export function buildUpdateSalonClientInput(body: UpdateSalonClientBody) {
	return {
		name: body.name,
		phone: body.phone,
		email: body.email,
		notes: body.notes,
	};
}

export function buildCreateSalonServiceInput(body: CreateSalonServiceBody) {
	return {
		serviceDate: body.serviceDate,
		serviceType: body.serviceType,
		notes: body.notes,
		result: body.result,
		technicalDescription: body.technicalDescription,
		formula: body.formula,
		technicalNotes: body.technicalNotes,
		productUsages: body.productUsages,
		resultImages: body.resultImages,
	};
}

export function buildUpdateSalonServiceInput(body: UpdateSalonServiceBody) {
	return {
		serviceDate: body.serviceDate,
		serviceType: body.serviceType,
		notes: body.notes,
		result: body.result,
		technicalDescription: body.technicalDescription,
		formula: body.formula,
		technicalNotes: body.technicalNotes,
		productUsages: body.productUsages,
		resultImages: body.resultImages,
	};
}

export function buildCreateSalonServiceTemplateInput(
	body: CreateSalonServiceTemplateBody,
) {
	return {
		name: body.name,
		serviceType: body.serviceType,
		notes: body.notes,
		result: body.result,
		technicalDescription: body.technicalDescription,
		formula: body.formula,
		technicalNotes: body.technicalNotes,
		productUsages: body.productUsages,
	};
}
