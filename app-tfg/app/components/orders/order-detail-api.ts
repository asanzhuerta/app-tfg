import {
	getClientErrorMessage,
	jsonRequestOptions,
	requestJson,
} from "@/lib/api/client";
import type { OrderDetail } from "@/lib/contracts/order";

function patchOrderDetail(
	updateApiPath: string,
	body: unknown,
	fallbackMessage: string,
) {
	return requestJson<OrderDetail>(updateApiPath, {
		...jsonRequestOptions("PATCH", body, fallbackMessage),
	});
}

export function updateOrderStatus(updateApiPath: string, statusId: number) {
	return patchOrderDetail(
		updateApiPath,
		{ statusId },
		"No se ha podido actualizar el estado del pedido.",
	);
}

export function updateOrderPaymentStatus(
	updateApiPath: string,
	input: {
		paymentStatusId: number;
		paymentMethod: string | null;
		paymentNotes: string | null;
	},
) {
	return patchOrderDetail(
		updateApiPath,
		input,
		"No se ha podido actualizar el estado del cobro.",
	);
}

export function registerOrderPayment(
	paymentApiPath: string,
	input: {
		amount: string;
		paymentMethod: string;
		paymentNotes: string;
	},
) {
	return requestJson<OrderDetail>(paymentApiPath, {
		...jsonRequestOptions(
			"POST",
			input,
			"No se ha podido registrar el pago del pedido.",
		),
	});
}

export const getOrderDetailRequestErrorMessage = getClientErrorMessage;
