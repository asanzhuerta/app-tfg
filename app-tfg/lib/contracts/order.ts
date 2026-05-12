export type OrderStatusCode =
	| "created"
	| "confirmed"
	| "delivered"
	| "cancelled";

export type OrderProductOption = {
	id: string;
	name: string;
	reference: string;
	productCategoryName: string | null;
	productLineName: string | null;
	format: string | null;
	packing: number | null;
};

export type OrderSummaryLine = {
	id: string;
	product_id: string;
	product_name: string;
	product_reference: string;
	product_line_name: string | null;
	quantity: number;
};

export type OrderSummary = {
	id: string;
	client_id: string;
	client_name: string;
	client_contact_name: string | null;
	created_by_user_id: string;
	created_by_user_name: string;
	status_id: number;
	status_code: OrderStatusCode | string;
	status_name: string;
	total_amount: string;
	notes: string | null;
	created_at: string;
	updated_at: string;
	line_count: number;
	lines: OrderSummaryLine[];
};

export type CreateOrderLineBody = {
	productId?: string;
	quantity?: number | string | null;
};

export type CreateClientOrderBody = {
	notes?: string | null;
	lines?: CreateOrderLineBody[];
};

export type CreateCommercialOrderBody = {
	clientId?: string;
	notes?: string | null;
	lines?: CreateOrderLineBody[];
};

export function buildCreateClientOrderInput(body: CreateClientOrderBody) {
	return {
		notes: body.notes,
		lines: body.lines,
	};
}

export function buildCreateCommercialOrderInput(body: CreateCommercialOrderBody) {
	return {
		clientId: body.clientId,
		notes: body.notes,
		lines: body.lines,
	};
}
