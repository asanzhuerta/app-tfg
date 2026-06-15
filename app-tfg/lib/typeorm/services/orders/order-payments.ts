import {
	COMMERCIAL_VISIT_STATUS_IDS,
	COMMERCIAL_VISIT_TYPE_IDS,
	ORDER_PAYMENT_STATUS_IDS,
	ORDER_STATUS_IDS,
} from "@/lib/typeorm/constants/catalog-ids";
import { getDataSource } from "@/lib/typeorm/data-source";
import { CommercialVisit } from "@/lib/typeorm/entities/CommercialVisit";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderPayment } from "@/lib/typeorm/entities/OrderPayment";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import { getOrderPaymentTotals } from "@/lib/typeorm/services/orders/order-mappers";
import {
	formatCents,
	normalizePaymentAmountToCents,
} from "@/lib/typeorm/services/orders/order-money";
import {
	buildOrderDetail,
	getRequiredOrderById,
} from "@/lib/typeorm/services/orders/order-queries";
import {
	ensureManageableOrder,
	ensureOrderPaymentTransitionAllowed,
	ensureOrderTransitionAllowed,
	isOrderFullyDeliveredByDeliveries,
	normalizeOrderPaymentStatusId,
	normalizeOrderStatusId,
	normalizePaymentMethod,
} from "@/lib/typeorm/services/orders/order-transitions";
import { normalizeText } from "@/lib/utils/text";

export type UpdateOrderManagementInput = {
	actedByUserId?: string | null;
	orderId: string;
	paymentMethod?: string | null;
	paymentNotes?: string | null;
	paymentStatusId?: number | string | null;
	statusId?: number | string | null;
};

export type RegisterOrderPaymentInput = {
	actedByUserId: string;
	amount?: number | string | null;
	orderId: string;
	paymentMethod?: string | null;
	paymentNotes?: string | null;
};

export async function updateOrderManagementRecord(
	order: Order,
	input: Omit<UpdateOrderManagementInput, "orderId">,
) {
	ensureManageableOrder(order);
	const hasStatusUpdate = input.statusId !== undefined;
	const hasPaymentUpdate = input.paymentStatusId !== undefined;

	if (
		!hasStatusUpdate &&
		!hasPaymentUpdate &&
		input.paymentMethod === undefined &&
		input.paymentNotes === undefined
	) {
		throw new OrderServiceError(
			"Debes indicar al menos un cambio válido para el pedido",
			400,
			"ORDER_UPDATE_EMPTY",
		);
	}

	if (
		input.paymentStatusId === undefined &&
		(input.paymentMethod !== undefined || input.paymentNotes !== undefined)
	) {
		throw new OrderServiceError(
			"Para registrar un cobro debes indicar también el estado de cobro",
			400,
			"ORDER_PAYMENT_STATUS_REQUIRED",
		);
	}

	const nextStatusId = hasStatusUpdate
		? normalizeOrderStatusId(input.statusId)
		: order.status_id;

	if (hasStatusUpdate) {
		ensureOrderTransitionAllowed(order, nextStatusId);

		if (
			nextStatusId === ORDER_STATUS_IDS.DELIVERED &&
			!isOrderFullyDeliveredByDeliveries(order)
		) {
			throw new OrderServiceError(
				"No se puede marcar el pedido como entregado hasta completar todos sus repartos",
				409,
				"ORDER_DELIVERIES_PENDING",
			);
		}
	}

	let nextPaymentStatusId = order.payment_status_id;
	let nextPaymentMethod = order.payment_method ?? null;
	let nextPaymentNotes = order.payment_notes ?? null;
	let nextPaidAt = order.paid_at ?? null;
	let nextPaidByUserId = order.paid_by_user_id ?? null;

	if (hasPaymentUpdate) {
		nextPaymentStatusId = normalizeOrderPaymentStatusId(input.paymentStatusId);
		ensureOrderPaymentTransitionAllowed(order, nextPaymentStatusId);
		nextPaymentNotes =
			input.paymentNotes === undefined
				? order.payment_notes ?? null
				: normalizeText(input.paymentNotes) || null;

		if (nextPaymentStatusId === ORDER_PAYMENT_STATUS_IDS.PAID) {
			nextPaymentMethod = normalizePaymentMethod(input.paymentMethod, {
				required: true,
			});
			nextPaidAt = new Date();
			nextPaidByUserId = String(input.actedByUserId ?? "").trim() || null;

			if (!nextPaidByUserId) {
				throw new OrderServiceError(
					"No se ha podido identificar el usuario que registra el cobro",
					500,
					"ORDER_PAYMENT_ACTOR_REQUIRED",
				);
			}
		} else {
			if ((order.payments ?? []).length > 0) {
				throw new OrderServiceError(
					"No se puede marcar como pendiente un pedido con pagos registrados",
					409,
					"ORDER_PAYMENT_HISTORY_EXISTS",
				);
			}

			nextPaymentMethod = null;
			nextPaidAt = null;
			nextPaidByUserId = null;
		}
	}
	const paymentTotals = getOrderPaymentTotals(order);
	const shouldCreateLegacyPayment =
		hasPaymentUpdate &&
		nextPaymentStatusId === ORDER_PAYMENT_STATUS_IDS.PAID &&
		paymentTotals.pendingCents > 0;

	const shouldUpdate =
		order.status_id !== nextStatusId ||
		order.delivery_visit_id !==
			(nextStatusId === ORDER_STATUS_IDS.CANCELLED
				? null
				: order.delivery_visit_id ?? null) ||
		order.payment_status_id !== nextPaymentStatusId ||
		(order.payment_method ?? null) !== nextPaymentMethod ||
		(order.payment_notes ?? null) !== nextPaymentNotes ||
		String(order.paid_at?.toISOString?.() ?? order.paid_at ?? "") !==
			String(nextPaidAt?.toISOString?.() ?? nextPaidAt ?? "") ||
		(order.paid_by_user_id ?? null) !== nextPaidByUserId;

	if (shouldUpdate) {
		const ds = await getDataSource();
		const nextDeliveryVisitId =
			nextStatusId === ORDER_STATUS_IDS.CANCELLED
				? null
				: order.delivery_visit_id ?? null;

		await ds.transaction(async (manager) => {
			const orderRepo = manager.getRepository(Order);

			if (shouldCreateLegacyPayment) {
				await manager.getRepository(OrderPayment).save(
					manager.getRepository(OrderPayment).create({
						order_id: order.id,
						amount: formatCents(paymentTotals.pendingCents),
						payment_method: nextPaymentMethod ?? "other",
						notes: nextPaymentNotes,
						paid_at: nextPaidAt ?? new Date(),
						registered_by_user_id: nextPaidByUserId,
					}),
				);
			}

			await orderRepo.save(
				orderRepo.create({
					id: order.id,
					status_id: nextStatusId,
					delivery_visit_id: nextDeliveryVisitId,
					payment_status_id: nextPaymentStatusId,
					payment_method: nextPaymentMethod,
					payment_notes: nextPaymentNotes,
					paid_at: nextPaidAt,
					paid_by_user_id: nextPaidByUserId,
				}),
			);

			if (
				nextStatusId === ORDER_STATUS_IDS.CANCELLED &&
				order.delivery_visit_id
			) {
				const visitRepo = manager.getRepository(CommercialVisit);
				const linkedVisit = await visitRepo.findOne({
					where: { id: order.delivery_visit_id },
				});

				if (
					linkedVisit &&
					linkedVisit.visit_type_id === COMMERCIAL_VISIT_TYPE_IDS.DELIVERY &&
					(linkedVisit.status_id === COMMERCIAL_VISIT_STATUS_IDS.PLANNED ||
						linkedVisit.status_id === COMMERCIAL_VISIT_STATUS_IDS.POSTPONED)
				) {
					const remainingConfirmedOrders = await orderRepo.count({
						where: {
							delivery_visit_id: order.delivery_visit_id,
							status_id: ORDER_STATUS_IDS.CONFIRMED,
						},
					});

					if (remainingConfirmedOrders === 0) {
						await visitRepo.update(
							{ id: order.delivery_visit_id },
							{ status_id: COMMERCIAL_VISIT_STATUS_IDS.CANCELLED },
						);
					}
				}
			}
		});
	}

	const updatedOrder = await getRequiredOrderById(order.id);
	return buildOrderDetail(updatedOrder);
}

export async function registerOrderPaymentRecord(
	order: Order,
	input: Omit<RegisterOrderPaymentInput, "orderId">,
) {
	ensureManageableOrder(order);

	if (order.status?.code !== "delivered") {
		throw new OrderServiceError(
			"Solo se puede registrar un cobro cuando el pedido ya consta como entregado",
			400,
			"ORDER_PAYMENT_REQUIRES_DELIVERED",
		);
	}

	const paymentTotals = getOrderPaymentTotals(order);

	if (paymentTotals.pendingCents <= 0) {
		throw new OrderServiceError(
			"Este pedido ya está cobrado por completo",
			409,
			"ORDER_ALREADY_PAID",
		);
	}

	const paymentAmountCents = normalizePaymentAmountToCents(input.amount);

	if (paymentAmountCents > paymentTotals.pendingCents) {
		throw new OrderServiceError(
			"El importe indicado supera el pendiente de cobro del pedido",
			400,
			"ORDER_PAYMENT_AMOUNT_EXCEEDS_PENDING",
		);
	}

	const paymentMethod = normalizePaymentMethod(input.paymentMethod, {
		required: true,
	});

	if (!paymentMethod) {
		throw new OrderServiceError(
			"Debes indicar el método de cobro del pedido",
			400,
			"ORDER_PAYMENT_METHOD_REQUIRED",
		);
	}

	const paymentNotes = normalizeText(input.paymentNotes) || null;
	const actedByUserId = String(input.actedByUserId ?? "").trim();

	if (!actedByUserId) {
		throw new OrderServiceError(
			"No se ha podido identificar el usuario que registra el cobro",
			500,
			"ORDER_PAYMENT_ACTOR_REQUIRED",
		);
	}

	const paidAt = new Date();
	const nextPaidCents = paymentTotals.paidCents + paymentAmountCents;
	const isFullyPaid = nextPaidCents >= paymentTotals.totalCents;
	const ds = await getDataSource();

	await ds.transaction(async (manager) => {
		await manager.getRepository(OrderPayment).save(
			manager.getRepository(OrderPayment).create({
				order_id: order.id,
				amount: formatCents(paymentAmountCents),
				payment_method: paymentMethod,
				notes: paymentNotes,
				paid_at: paidAt,
				registered_by_user_id: actedByUserId,
			}),
		);

		const orderRepo = manager.getRepository(Order);

		await orderRepo.save(
			orderRepo.create({
				id: order.id,
				payment_status_id: isFullyPaid
					? ORDER_PAYMENT_STATUS_IDS.PAID
					: ORDER_PAYMENT_STATUS_IDS.PENDING,
				payment_method: paymentMethod,
				payment_notes: paymentNotes,
				paid_at: isFullyPaid ? paidAt : null,
				paid_by_user_id: isFullyPaid ? actedByUserId : null,
			}),
		);
	});

	const updatedOrder = await getRequiredOrderById(order.id);
	return buildOrderDetail(updatedOrder);
}
