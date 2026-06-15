import { getTodayRangeInMadrid } from "@/lib/commercial/daily-route-planning";
import {
	COMMERCIAL_VISIT_STATUS_IDS,
	COMMERCIAL_VISIT_TYPE_IDS,
	ORDER_PAYMENT_STATUS_IDS,
	ORDER_STATUS_IDS,
} from "@/lib/typeorm/constants/catalog-ids";
import { getDataSource } from "@/lib/typeorm/data-source";
import { ClientCommercialAssignment } from "@/lib/typeorm/entities/ClientCommercialAssignment";
import { CommercialVisit } from "@/lib/typeorm/entities/CommercialVisit";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderDelivery } from "@/lib/typeorm/entities/OrderDelivery";
import { OrderPayment } from "@/lib/typeorm/entities/OrderPayment";
import {
	createCommercialVisit,
	updateCommercialVisit,
} from "@/lib/typeorm/services/commercial/commercial-visit";
import {
	createOrderForCommercialUser,
	getOrderDetailForCommercialUser,
	registerOrderPaymentForCommercialUser,
	updateOrderStatusForCommercialUser,
} from "@/lib/typeorm/services/orders/order";
import { prepareOrderDeliveryForCommercialUser } from "@/lib/typeorm/services/orders/order-delivery";

type CandidateContext = {
	clientId: string;
	clientName: string;
	commercialUserId: string;
	commercialName: string;
};

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

async function expectFailure(
	label: string,
	callback: () => Promise<unknown>,
	validator: (error: unknown) => boolean,
	message: string,
) {
	try {
		await callback();
		throw new Error(message);
	} catch (error) {
		if (!validator(error)) {
			throw error;
		}

		console.log(`PASS ${label}`);
	}
}

function moneyToCents(value: string | number | null | undefined) {
	const parsed = Number(value ?? 0);

	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function formatCents(cents: number) {
	return (Math.max(0, cents) / 100).toFixed(2);
}

async function countOpenUnpaidOrders(clientId: string) {
	const ds = await getDataSource();

	return ds
		.getRepository(Order)
		.createQueryBuilder("order")
		.where("order.client_id = :clientId", { clientId })
		.andWhere("order.status_id NOT IN (:...excludedStatusIds)", {
			excludedStatusIds: [ORDER_STATUS_IDS.DRAFT, ORDER_STATUS_IDS.CANCELLED],
		})
		.andWhere("order.payment_status_id != :paidStatusId", {
			paidStatusId: ORDER_PAYMENT_STATUS_IDS.PAID,
		})
		.getCount();
}

async function findCandidateContext(): Promise<CandidateContext> {
	const ds = await getDataSource();
	const assignments = await ds
		.getRepository(ClientCommercialAssignment)
		.createQueryBuilder("assignment")
		.leftJoinAndSelect("assignment.client", "client")
		.leftJoinAndSelect("assignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.where("assignment.unassigned_at IS NULL")
		.orderBy("assignment.assigned_at", "DESC")
		.getMany();

	for (const assignment of assignments) {
		const clientId = assignment.client?.id ?? "";
		const commercialUserId = assignment.commercial?.id ?? "";

		if (!clientId || !commercialUserId) {
			continue;
		}

		const openUnpaidOrders = await countOpenUnpaidOrders(clientId);

		if (openUnpaidOrders >= 2) {
			continue;
		}

		return {
			clientId,
			clientName: assignment.client?.name ?? "Cliente",
			commercialUserId,
			commercialName: assignment.commercial?.user?.name ?? "Comercial",
		};
	}

	throw new Error(
		"No se ha encontrado un cliente asignado con margen para un pedido temporal de cobro parcial",
	);
}

async function loadTemplateLines() {
	const ds = await getDataSource();
	const order = await ds
		.getRepository(Order)
		.createQueryBuilder("order")
		.leftJoinAndSelect("order.lines", "lines")
		.where("order.status_id != :draftStatusId", {
			draftStatusId: ORDER_STATUS_IDS.DRAFT,
		})
		.orderBy("order.created_at", "DESC")
		.getOne();

	assertCondition(
		order && Array.isArray(order.lines) && order.lines.length > 0,
		"No hay un pedido base con lineas para reutilizar en el smoke de pagos parciales",
	);

	return order.lines.map((line) => ({
		productId: line.product_id,
		colorReferenceId: line.color_reference_id ?? null,
		quantity: Number(line.quantity ?? 0),
	}));
}

async function cleanupTemporaryData(input: {
	orderIds: string[];
	deliveryIds: string[];
	visitIds: string[];
}) {
	const ds = await getDataSource();

	if (input.deliveryIds.length > 0) {
		await ds.getRepository(OrderDelivery).delete(input.deliveryIds);
	}

	if (input.visitIds.length > 0) {
		await ds.getRepository(CommercialVisit).delete(input.visitIds);
	}

	if (input.orderIds.length > 0) {
		await ds.getRepository(OrderPayment).delete({ order_id: input.orderIds[0] });
		await ds.getRepository(Order).delete(input.orderIds);
	}
}

async function main() {
	const createdOrderIds: string[] = [];
	const createdDeliveryIds: string[] = [];
	const createdVisitIds: string[] = [];
	const { dateFrom: today } = getTodayRangeInMadrid(new Date());
	const tag = `M4 partial payment smoke ${Date.now()}`;
	const candidate = await findCandidateContext();
	const templateLines = await loadTemplateLines();

	try {
		const createdOrder = await createOrderForCommercialUser(
			candidate.commercialUserId,
			{
				clientId: candidate.clientId,
				notes: tag,
				lines: templateLines,
			},
		);
		createdOrderIds.push(createdOrder.id);

		await updateOrderStatusForCommercialUser(candidate.commercialUserId, {
			orderId: createdOrder.id,
			statusId: ORDER_STATUS_IDS.CONFIRMED,
		});
		console.log(`PASS pedido confirmado para ${candidate.clientName}`);

		const confirmedOrder = await getOrderDetailForCommercialUser(
			candidate.commercialUserId,
			createdOrder.id,
		);
		const delivery = await prepareOrderDeliveryForCommercialUser(
			candidate.commercialUserId,
			{
				orderId: createdOrder.id,
				packageCount: 1,
				notes: tag,
				lines: confirmedOrder.order.lines.map((line) => ({
					orderLineId: line.id,
					quantity: line.quantity,
				})),
			},
		);
		createdDeliveryIds.push(delivery.id);
		assertCondition(delivery.status === "prepared", "El reparto debe quedar preparado");
		console.log("PASS reparto preparado con todas las lineas del pedido");

		const visit = await createCommercialVisit({
			clientId: candidate.clientId,
			commercialId: candidate.commercialUserId,
			scheduledForDate: today,
			visitTypeId: COMMERCIAL_VISIT_TYPE_IDS.DELIVERY,
			notes: tag,
			deliveryIds: [delivery.id],
		});
		createdVisitIds.push(visit.id);

		await updateCommercialVisit({
			visitId: visit.id,
			commercialId: candidate.commercialUserId,
			statusId: COMMERCIAL_VISIT_STATUS_IDS.COMPLETED,
			result: "Entrega de prueba para cobro parcial",
			deliveredDeliveryQrs: [delivery.id],
		});

		const deliveredOrder = await getOrderDetailForCommercialUser(
			candidate.commercialUserId,
			createdOrder.id,
		);
		assertCondition(
			deliveredOrder.order.status_code === "delivered",
			"El pedido debe quedar entregado al completar todos sus repartos",
		);
		console.log("PASS pedido entregado mediante QR de reparto");

		const totalCents = moneyToCents(deliveredOrder.order.total_amount);
		assertCondition(totalCents > 1, "El total del pedido debe permitir dos pagos");
		const firstPaymentCents = Math.max(1, Math.floor(totalCents / 2));
		const secondPaymentCents = totalCents - firstPaymentCents;

		const partialPayment = await registerOrderPaymentForCommercialUser(
			candidate.commercialUserId,
			{
				orderId: createdOrder.id,
				amount: formatCents(firstPaymentCents),
				paymentMethod: "cash",
				paymentNotes: `${tag} primer pago`,
			},
		);

		assertCondition(
			partialPayment.order.payment_status_code === "pending",
			"Un primer pago parcial no debe cerrar el cobro",
		);
		assertCondition(
			moneyToCents(partialPayment.order.paid_amount) === firstPaymentCents,
			"El importe pagado parcial no coincide",
		);
		assertCondition(
			moneyToCents(partialPayment.order.pending_amount) === secondPaymentCents,
			"El pendiente tras el primer pago no coincide",
		);
		assertCondition(
			partialPayment.order.payments.length === 1,
			"El historial debe contener el primer pago",
		);
		console.log("PASS primer cobro parcial mantiene el pedido pendiente");

		const paidOrder = await registerOrderPaymentForCommercialUser(
			candidate.commercialUserId,
			{
				orderId: createdOrder.id,
				amount: formatCents(secondPaymentCents),
				paymentMethod: "transfer",
				paymentNotes: `${tag} segundo pago`,
			},
		);

		assertCondition(
			paidOrder.order.payment_status_code === "paid",
			"El segundo pago debe cerrar el cobro",
		);
		assertCondition(
			moneyToCents(paidOrder.order.pending_amount) === 0,
			"El pendiente debe quedar a cero",
		);
		assertCondition(
			paidOrder.order.payments.length === 2,
			"El historial debe conservar los dos pagos",
		);
		console.log("PASS segundo cobro completa el pedido y conserva historial");

		await expectFailure(
			"rechazo de cobro sobre pedido ya pagado",
			() =>
				registerOrderPaymentForCommercialUser(candidate.commercialUserId, {
					orderId: createdOrder.id,
					amount: "1.00",
					paymentMethod: "cash",
					paymentNotes: `${tag} cobro extra`,
				}),
			(error) =>
				error instanceof Error &&
				String(error.message).includes("cobrado por completo"),
			"Se ha permitido registrar un cobro extra sobre un pedido pagado",
		);

		console.log(`M4 partial payment smoke OK (${candidate.commercialName})`);
	} finally {
		await cleanupTemporaryData({
			orderIds: createdOrderIds,
			deliveryIds: createdDeliveryIds,
			visitIds: createdVisitIds,
		});
		const ds = await getDataSource();
		await ds.destroy();
	}
}

void main().catch((error) => {
	console.error("M4 partial payment smoke FAILED");
	console.error(error);
	process.exitCode = 1;
});
