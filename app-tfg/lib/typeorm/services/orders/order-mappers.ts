import type {
	OrderFulfillmentMethod,
	OrderPaymentStatusOption,
	OrderPaymentSummary,
	OrderStatusOption,
	OrderSummary,
	OrderSummaryLine,
} from "@/lib/contracts/order";
import { getVisibleProductReference } from "@/lib/catalog/product-reference";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderLine } from "@/lib/typeorm/entities/OrderLine";
import { OrderPayment } from "@/lib/typeorm/entities/OrderPayment";
import { OrderPaymentStatus } from "@/lib/typeorm/entities/OrderPaymentStatus";
import { OrderStatus } from "@/lib/typeorm/entities/OrderStatus";
import { mapOrderDeliveryToSummary } from "@/lib/typeorm/services/orders/order-delivery";
import {
	formatCents,
	parseStoredMoneyToCents,
} from "@/lib/typeorm/services/orders/order-money";
import { toIsoString } from "@/lib/utils/date-serialization";
export { toIsoString };

export function normalizeFulfillmentMethod(
	value: OrderFulfillmentMethod | string | null | undefined,
): OrderFulfillmentMethod {
	return value === "agency" ? "agency" : "commercial";
}

export function buildOrderSummaryLine(line: OrderLine): OrderSummaryLine {
	return {
		id: line.id,
		product_id: line.product_id,
		color_reference_id: line.color_reference_id ?? null,
		product_name: line.product?.name ?? "Producto",
		product_reference: getVisibleProductReference(line.product?.reference),
		order_reference: line.order_reference_snapshot,
		color_reference_code: line.variant_code_snapshot ?? null,
		color_reference_name: line.variant_name_snapshot ?? null,
		product_line_name: line.product?.productLine?.name ?? null,
		quantity: Number(line.quantity ?? 0),
		unit_price_snapshot: String(line.unit_price_snapshot ?? "0.00"),
		discount_percentage: String(line.discount_percentage ?? "0.00"),
		line_total: String(line.line_total ?? "0.00"),
	};
}

function buildOrderPaymentSummary(payment: OrderPayment): OrderPaymentSummary {
	return {
		id: payment.id,
		order_id: payment.order_id,
		amount: String(payment.amount ?? "0.00"),
		payment_method: payment.payment_method,
		notes: payment.notes ?? null,
		paid_at: toIsoString(payment.paid_at),
		registered_by_user_id: payment.registered_by_user_id ?? null,
		registered_by_user_name: payment.registeredByUser?.name ?? null,
		created_at: toIsoString(payment.created_at),
	};
}

export function getOrderPaymentTotals(order: Order) {
	const totalCents = parseStoredMoneyToCents(order.total_amount);
	const paidCents = (order.payments ?? []).reduce(
		(total, payment) => total + parseStoredMoneyToCents(payment.amount),
		0,
	);
	const pendingCents = Math.max(0, totalCents - paidCents);

	return {
		totalCents,
		paidCents,
		pendingCents,
	};
}

export function mapOrderToSummary(order: Order): OrderSummary {
	const sortedLines = [...(order.lines ?? [])].sort((a, b) => {
		const referenceCompare = String(a.order_reference_snapshot ?? "").localeCompare(
			String(b.order_reference_snapshot ?? ""),
			"es",
			{ sensitivity: "base" },
		);

		if (referenceCompare !== 0) {
			return referenceCompare;
		}

		return String(a.product?.name ?? "").localeCompare(
			String(b.product?.name ?? ""),
			"es",
			{ sensitivity: "base" },
		);
	});
	const sortedPayments = [...(order.payments ?? [])].sort((a, b) => {
		const paidAtCompare = String(a.paid_at ?? "").localeCompare(
			String(b.paid_at ?? ""),
		);

		if (paidAtCompare !== 0) {
			return paidAtCompare;
		}

		return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
	});
	const sortedDeliveries = [...(order.deliveries ?? [])].sort((a, b) =>
		String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
	);
	const paymentTotals = getOrderPaymentTotals(order);

	return {
		id: order.id,
		client_id: order.client_id,
		client_name: order.client?.name ?? "Cliente",
		client_contact_name: order.client?.contact_name ?? null,
		fulfillment_method: normalizeFulfillmentMethod(order.fulfillment_method),
		agency_delivery_fee: String(order.agency_delivery_fee ?? "0.00"),
		created_by_user_id: order.created_by_user_id,
		created_by_user_name: order.createdByUser?.name ?? "Usuario",
		created_by_user_role_id: order.createdByUser?.role_id ?? null,
		created_by_user_role_code: order.createdByUser?.role?.code ?? null,
		status_id: order.status_id,
		status_code: order.status?.code ?? "",
		status_name: order.status?.name ?? "Sin estado",
		total_amount: String(order.total_amount ?? "0.00"),
		paid_amount: formatCents(paymentTotals.paidCents),
		pending_amount: formatCents(paymentTotals.pendingCents),
		notes: order.notes ?? null,
		payment_status_id: order.payment_status_id,
		payment_status_code: order.paymentStatus?.code ?? "",
		payment_status_name: order.paymentStatus?.name ?? "Sin estado de cobro",
		payment_method: order.payment_method ?? null,
		payment_notes: order.payment_notes ?? null,
		paid_at: toIsoString(order.paid_at) || null,
		paid_by_user_id: order.paid_by_user_id ?? null,
		paid_by_user_name: order.paidByUser?.name ?? null,
		created_at: toIsoString(order.created_at),
		updated_at: toIsoString(order.updated_at),
		delivery_visit_id: order.delivery_visit_id ?? null,
		delivery_visit_scheduled_for_date:
			order.deliveryVisit?.scheduled_for_date ?? null,
		delivery_visit_status_id: order.deliveryVisit?.status_id ?? null,
		delivery_visit_status_name: order.deliveryVisit?.status?.name ?? null,
		line_count: sortedLines.reduce(
			(total, line) => total + Number(line.quantity ?? 0),
			0,
		),
		lines: sortedLines.map(buildOrderSummaryLine),
		payments: sortedPayments.map(buildOrderPaymentSummary),
		deliveries: sortedDeliveries.map((delivery) => {
			delivery.order = order;
			return mapOrderDeliveryToSummary(delivery);
		}),
	};
}

export function mapOrderStatusToOption(status: OrderStatus): OrderStatusOption {
	return {
		id: status.id,
		code: status.code,
		name: status.name,
	};
}

export function mapOrderPaymentStatusToOption(
	status: OrderPaymentStatus,
): OrderPaymentStatusOption {
	return {
		id: status.id,
		code: status.code,
		name: status.name,
	};
}
