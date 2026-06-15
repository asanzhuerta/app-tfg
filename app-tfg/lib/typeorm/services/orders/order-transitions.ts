import type {
	OrderPaymentMethodCode,
} from "@/lib/contracts/order";
import {
	ORDER_PAYMENT_STATUS_IDS,
	ORDER_STATUS_IDS,
} from "@/lib/typeorm/constants/catalog-ids";
import type { Order } from "@/lib/typeorm/entities/Order";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import { normalizeText } from "@/lib/utils/text";

const ORDER_STATUS_TRANSITION_IDS_BY_CODE: Record<string, number[]> = {
	created: [ORDER_STATUS_IDS.CONFIRMED, ORDER_STATUS_IDS.CANCELLED],
	confirmed: [ORDER_STATUS_IDS.CANCELLED],
	delivered: [],
	cancelled: [],
	draft: [],
};

const ORDER_PAYMENT_TRANSITION_IDS_BY_CODE: Record<string, number[]> = {
	pending: [ORDER_PAYMENT_STATUS_IDS.PAID],
	paid: [ORDER_PAYMENT_STATUS_IDS.PENDING],
};

const ORDER_PAYMENT_METHOD_CODES = new Set<OrderPaymentMethodCode>([
	"cash",
	"card",
	"transfer",
	"other",
]);

export function getAllowedOrderTransitionIds(
	statusCode: string | null | undefined,
) {
	return ORDER_STATUS_TRANSITION_IDS_BY_CODE[String(statusCode ?? "").trim()] ?? [];
}

export function getAllowedOrderPaymentTransitionIds(order: Order) {
	if (order.status?.code !== "delivered") {
		return [] as number[];
	}

	return (
		ORDER_PAYMENT_TRANSITION_IDS_BY_CODE[
			String(order.paymentStatus?.code ?? "").trim()
		] ?? []
	);
}

export function normalizeOrderStatusId(
	statusId: number | string | null | undefined,
) {
	const parsed = Number(statusId);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new OrderServiceError(
			"Debes indicar un estado de pedido válido",
			400,
			"ORDER_STATUS_ID_INVALID",
		);
	}

	return parsed;
}

export function normalizeOrderPaymentStatusId(
	statusId: number | string | null | undefined,
) {
	const parsed = Number(statusId);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new OrderServiceError(
			"Debes indicar un estado de cobro válido",
			400,
			"ORDER_PAYMENT_STATUS_ID_INVALID",
		);
	}

	return parsed;
}

export function normalizeOptionalFilterId(
	value: number | string | null | undefined,
) {
	if (value === null || value === undefined || String(value).trim() === "") {
		return null;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new OrderServiceError(
			"El filtro indicado no es válido",
			400,
			"ORDER_FILTER_ID_INVALID",
		);
	}

	return parsed;
}

export function normalizePaymentMethod(
	paymentMethod: string | null | undefined,
	options: {
		required?: boolean;
	} = {},
) {
	const normalized = normalizeText(paymentMethod)?.toLowerCase() ?? "";

	if (!normalized) {
		if (options.required) {
			throw new OrderServiceError(
				"Debes indicar el método de cobro del pedido",
				400,
				"ORDER_PAYMENT_METHOD_REQUIRED",
			);
		}

		return null;
	}

	if (!ORDER_PAYMENT_METHOD_CODES.has(normalized as OrderPaymentMethodCode)) {
		throw new OrderServiceError(
			"El método de cobro indicado no es válido",
			400,
			"ORDER_PAYMENT_METHOD_INVALID",
		);
	}

	return normalized as OrderPaymentMethodCode;
}

export function ensureManageableOrder(order: Order) {
	if (order.status_id === ORDER_STATUS_IDS.DRAFT) {
		throw new OrderServiceError(
			"El pedido solicitado no existe",
			404,
			"ORDER_NOT_FOUND",
		);
	}
}

export function ensureOrderTransitionAllowed(order: Order, nextStatusId: number) {
	if (order.status_id === nextStatusId) {
		return;
	}

	const allowedStatusIds = getAllowedOrderTransitionIds(order.status?.code);

	if (!allowedStatusIds.includes(nextStatusId)) {
		throw new OrderServiceError(
			`No se puede cambiar un pedido en estado ${order.status?.name ?? "actual"} al estado solicitado`,
			400,
			"ORDER_STATUS_TRANSITION_NOT_ALLOWED",
		);
	}
}

export function isOrderFullyDeliveredByDeliveries(order: Order) {
	const activeDeliveries = (order.deliveries ?? []).filter(
		(delivery) => delivery.status !== "cancelled",
	);

	if (activeDeliveries.length === 0) {
		return true;
	}

	const deliveredByLineId = new Map<string, number>();

	for (const delivery of activeDeliveries) {
		if (delivery.status !== "delivered") {
			continue;
		}

		for (const deliveryLine of delivery.lines ?? []) {
			deliveredByLineId.set(
				deliveryLine.order_line_id,
				(deliveredByLineId.get(deliveryLine.order_line_id) ?? 0) +
					Number(deliveryLine.quantity ?? 0),
			);
		}
	}

	return (order.lines ?? []).every(
		(line) =>
			(deliveredByLineId.get(line.id) ?? 0) >= Number(line.quantity ?? 0),
	);
}

export function ensureOrderPaymentTransitionAllowed(
	order: Order,
	nextPaymentStatusId: number,
) {
	if (order.status?.code !== "delivered") {
		throw new OrderServiceError(
			"Solo se puede registrar el cobro cuando el pedido ya consta como entregado",
			400,
			"ORDER_PAYMENT_REQUIRES_DELIVERED",
		);
	}

	if (order.payment_status_id === nextPaymentStatusId) {
		return;
	}

	const allowedPaymentStatusIds = getAllowedOrderPaymentTransitionIds(order);

	if (!allowedPaymentStatusIds.includes(nextPaymentStatusId)) {
		throw new OrderServiceError(
			`No se puede cambiar el cobro de un pedido en estado ${order.paymentStatus?.name ?? "actual"} al estado solicitado`,
			400,
			"ORDER_PAYMENT_STATUS_TRANSITION_NOT_ALLOWED",
		);
	}
}
