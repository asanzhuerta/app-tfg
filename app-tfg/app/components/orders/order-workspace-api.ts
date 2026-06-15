import {
	getClientErrorMessage,
	jsonRequestOptions,
	requestJson,
} from "@/lib/api/client";
import type {
	OrderFulfillmentMethod,
	OrderProductOption,
	OrderSummary,
} from "@/lib/contracts/order";

export type OrderWorkspacePayloadLine = {
	productId: string;
	colorReferenceId: string | null;
	quantity: number;
};

export type OrderWorkspaceMutationPayload = {
	clientId?: string;
	fulfillmentMethod: OrderFulfillmentMethod;
	notes: string;
	lines: OrderWorkspacePayloadLine[];
};

function buildDraftUrl(apiPath: string, clientId?: string | null) {
	const normalizedClientId = String(clientId ?? "").trim();

	if (!normalizedClientId) {
		return `${apiPath}/draft`;
	}

	return `${apiPath}/draft?clientId=${encodeURIComponent(normalizedClientId)}`;
}

export async function fetchOrderDraft(
	apiPath: string,
	clientId?: string | null,
) {
	return requestJson<OrderSummary | null>(buildDraftUrl(apiPath, clientId), {
		method: "GET",
		cache: "no-store",
		fallbackMessage: "No se ha podido cargar el pedido en curso.",
	});
}

export async function fetchOrderProductOptionsForClient(
	apiPath: string,
	clientId: string,
) {
	return requestJson<OrderProductOption[]>(
		`${apiPath}/product-options?clientId=${encodeURIComponent(clientId)}`,
		{
			method: "GET",
			cache: "no-store",
			fallbackMessage:
				"No se han podido cargar las promociones de este cliente.",
		},
	);
}

export async function saveOrderDraft(
	apiPath: string,
	payload: OrderWorkspaceMutationPayload,
) {
	return requestJson<OrderSummary | null>(
		`${apiPath}/draft`,
		jsonRequestOptions(
			"PUT",
			payload,
			"No se ha podido guardar el pedido en curso.",
		),
	);
}

export async function clearOrderDraft(
	apiPath: string,
	clientId?: string | null,
) {
	return requestJson<{ ok?: boolean }>(buildDraftUrl(apiPath, clientId), {
		method: "DELETE",
		fallbackMessage: "No se ha podido vaciar el pedido en curso.",
	});
}

export async function submitOrder(
	apiPath: string,
	payload: OrderWorkspaceMutationPayload,
) {
	return requestJson<OrderSummary>(
		apiPath,
		jsonRequestOptions(
			"POST",
			payload,
			"No se ha podido registrar el pedido.",
		),
	);
}

export async function addDraftOrderItem(
	apiPath: string,
	input: {
		clientId?: string;
		productId: string;
		colorReferenceId?: string;
		quantity: number;
	},
) {
	return requestJson<{ id?: string }>(
		`${apiPath}/draft/items`,
		jsonRequestOptions(
			"POST",
			input,
			"No se ha podido añadir la referencia al pedido en curso.",
		),
	);
}

export const getOrderRequestErrorMessage = getClientErrorMessage;
