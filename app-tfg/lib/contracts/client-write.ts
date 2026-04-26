export type CreateClientRequestBody = {
	name?: string;
	contactName?: string | null;
	taxId?: string | null;
	address?: string;
	city?: string;
	postalCode?: string | null;
	province?: string | null;
	userId?: string;
	notes?: string | null;
};

export type UpdateClientRequestBody = {
	name?: string;
	contactName?: string | null;
	taxId?: string | null;
	address?: string;
	city?: string;
	postalCode?: string | null;
	province?: string | null;
	lat?: number | string | null;
	lng?: number | string | null;
	visitWindowStartTime?: string | null;
	visitWindowEndTime?: string | null;
	notes?: string | null;
};

export type ClientAccessTarget = {
	user?: {
		id?: string | null;
	} | null;
	linkedUser?: {
		id?: string | null;
	} | null;
};

export type ClientMutableSnapshot = ClientAccessTarget & {
	name: string;
	contact_name: string | null;
	tax_id: string | null;
	address: string;
	city: string;
	postal_code: string | null;
	province: string | null;
	lat: number | string | null;
	lng: number | string | null;
	visit_window_start_time: string | null;
	visit_window_end_time: string | null;
	notes: string | null;
};

export function buildCreateClientInput(body: CreateClientRequestBody) {
	return {
		name: String(body.name ?? ""),
		contactName: body.contactName ?? null,
		taxId: body.taxId ?? null,
		address: String(body.address ?? ""),
		city: String(body.city ?? ""),
		postalCode: body.postalCode ?? null,
		province: body.province ?? null,
		userId: String(body.userId ?? ""),
		notes: body.notes ?? null,
	};
}

export function buildUpdateClientInput(
	clientId: string,
	body: UpdateClientRequestBody,
	existingClient: ClientMutableSnapshot,
) {
	return {
		clientId,
		name: String(body.name ?? existingClient.name),
		contactName: body.contactName ?? existingClient.contact_name,
		taxId: body.taxId ?? existingClient.tax_id,
		address: String(body.address ?? existingClient.address),
		city: String(body.city ?? existingClient.city),
		postalCode: body.postalCode ?? existingClient.postal_code,
		province: body.province ?? existingClient.province,
		lat: body.lat ?? existingClient.lat,
		lng: body.lng ?? existingClient.lng,
		visitWindowStartTime:
			body.visitWindowStartTime ?? existingClient.visit_window_start_time,
		visitWindowEndTime:
			body.visitWindowEndTime ?? existingClient.visit_window_end_time,
		notes: body.notes ?? existingClient.notes,
	};
}
