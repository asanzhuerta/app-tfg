import type {
	CreateOrderLineBody,
	OrderFulfillmentMethod,
} from "@/lib/contracts/order";
import { getDataSource } from "@/lib/typeorm/data-source";
import {
	COMMERCIAL_VISIT_STATUS_IDS,
	ORDER_PAYMENT_STATUS_IDS,
	ORDER_STATUS_IDS,
} from "@/lib/typeorm/constants/catalog-ids";
import { Order } from "@/lib/typeorm/entities/Order";
import { getClientByUserId } from "@/lib/typeorm/services/commercial/client";
import {
	canCommercialAccessClient,
} from "@/lib/typeorm/services/commercial/client-commercial-assignment";
import { requireCommercialByUserId } from "@/lib/typeorm/services/commercial/commercial";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import {
	normalizeRequestedOrderLines,
} from "@/lib/typeorm/services/orders/order-lines";
import {
	mapOrderToSummary,
} from "@/lib/typeorm/services/orders/order-mappers";
import {
	buildOrderDetail,
	createCommercialOrdersBaseQuery,
	createOrdersBaseQuery,
	getOrderById,
	getRequiredOrderById,
} from "@/lib/typeorm/services/orders/order-queries";
import { persistOrderRecord } from "@/lib/typeorm/services/orders/order-persistence";
import {
	type RegisterOrderPaymentInput,
	type UpdateOrderManagementInput,
	registerOrderPaymentRecord,
	updateOrderManagementRecord,
} from "@/lib/typeorm/services/orders/order-payments";
import {
	ensureManageableOrder,
	normalizeOptionalFilterId,
} from "@/lib/typeorm/services/orders/order-transitions";

export { OrderServiceError };
export {
	listOrderProductOptions,
	listOrderProductOptionsForClientUser,
	listOrderProductOptionsForCommercialUser,
} from "@/lib/typeorm/services/orders/order-product-options";

type CreateOrderInput = {
	clientId: string;
	createdByUserId: string;
	fulfillmentMethod?: OrderFulfillmentMethod | string | null;
	notes?: string | null;
	lines?: CreateOrderLineBody[];
};

type AddDraftOrderLineInput = {
	clientId: string;
	createdByUserId: string;
	productId: string;
	colorReferenceId?: string | null;
	quantity?: number | string | null;
};

type SaveDraftInput = {
	clientId: string;
	createdByUserId: string;
	fulfillmentMethod?: OrderFulfillmentMethod | string | null;
	notes?: string | null;
	lines?: CreateOrderLineBody[];
};

type ListOrdersForCommercialUserInput = {
	clientId?: string | null;
	paymentStatusId?: number | string | null;
	pendingDeliveryOnly?: boolean;
	statusId?: number | string | null;
};

type ListOrdersForAdminInput = {
	clientId?: string | null;
	paymentStatusId?: number | string | null;
	statusId?: number | string | null;
};

const MAX_OPEN_UNPAID_ORDERS_PER_CLIENT = 2;

async function findDraftOrderId(
	manager: Awaited<ReturnType<typeof getDataSource>>["manager"],
	clientId: string,
	createdByUserId: string,
) {
	const draftOrder = await manager.getRepository(Order).findOne({
		where: {
			client_id: clientId,
			created_by_user_id: createdByUserId,
			status_id: ORDER_STATUS_IDS.DRAFT,
		},
		order: {
			updated_at: "DESC",
		},
	});

	return draftOrder?.id ?? null;
}

async function countOpenUnpaidOrdersForClient(
	manager: Awaited<ReturnType<typeof getDataSource>>["manager"],
	clientId: string,
) {
	return manager
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

async function ensureClientCanRegisterOrder(
	manager: Awaited<ReturnType<typeof getDataSource>>["manager"],
	clientId: string,
) {
	const openUnpaidOrdersCount = await countOpenUnpaidOrdersForClient(
		manager,
		clientId,
	);

	if (openUnpaidOrdersCount >= MAX_OPEN_UNPAID_ORDERS_PER_CLIENT) {
		throw new OrderServiceError(
			`Este cliente ya tiene ${MAX_OPEN_UNPAID_ORDERS_PER_CLIENT} pedidos registrados pendientes de cobro. No se pueden registrar más pedidos hasta cerrar al menos uno.`,
			409,
			"ORDER_OPEN_LIMIT_REACHED",
		);
	}
}

async function loadDraftOrderSummary(
	clientId: string,
	createdByUserId: string,
) {
	const ds = await getDataSource();
	const refreshedDraftId = await ds.transaction(async (manager) => {
		const repo = manager.getRepository(Order);
		const draftOrder = await createOrdersBaseQuery(repo)
			.where("order.client_id = :clientId", { clientId })
			.andWhere("order.created_by_user_id = :createdByUserId", {
				createdByUserId,
			})
			.andWhere("order.status_id = :statusId", {
				statusId: ORDER_STATUS_IDS.DRAFT,
			})
			.orderBy("order.updated_at", "DESC")
			.addOrderBy("lines.order_reference_snapshot", "ASC")
			.addOrderBy("product.name", "ASC")
			.getOne();

		if (!draftOrder) {
			return null;
		}

		const currentLines = normalizeRequestedOrderLines(
			draftOrder.lines.map((line) => ({
				productId: line.product_id,
				colorReferenceId: line.color_reference_id,
				quantity: line.quantity,
			})),
			{ allowEmpty: true },
		);

		if (currentLines.length === 0) {
			await manager.getRepository(Order).delete({ id: draftOrder.id });
			return null;
		}

		return persistOrderRecord(manager, {
			existingOrderId: draftOrder.id,
			clientId,
			createdByUserId,
			fulfillmentMethod: draftOrder.fulfillment_method,
			statusId: ORDER_STATUS_IDS.DRAFT,
			notes: draftOrder.notes,
			lines: currentLines,
		});
	});

	if (!refreshedDraftId) {
		return null;
	}

	const refreshedDraft = await getOrderById(refreshedDraftId);
	return refreshedDraft ? mapOrderToSummary(refreshedDraft) : null;
}

async function saveDraftRecord(input: SaveDraftInput) {
	const ds = await getDataSource();
	const normalizedLines = normalizeRequestedOrderLines(input.lines, {
		allowEmpty: true,
	});

	return ds.transaction(async (manager) => {
		const existingDraftId = await findDraftOrderId(
			manager,
			input.clientId,
			input.createdByUserId,
		);

		if (normalizedLines.length === 0) {
			if (existingDraftId) {
				await manager.getRepository(Order).delete({
					id: existingDraftId,
				});
			}

			return null;
		}

		const draftOrderId = await persistOrderRecord(manager, {
			existingOrderId: existingDraftId,
			clientId: input.clientId,
			createdByUserId: input.createdByUserId,
			fulfillmentMethod: input.fulfillmentMethod,
			statusId: ORDER_STATUS_IDS.DRAFT,
			notes: input.notes,
			lines: normalizedLines,
		});

		return draftOrderId;
	}).then((draftOrderId) =>
		draftOrderId ? getOrderById(draftOrderId).then((order) => (order ? mapOrderToSummary(order) : null)) : null,
	);
}

async function addLineToDraftRecord(input: AddDraftOrderLineInput) {
	const currentDraft = await loadDraftOrderSummary(
		input.clientId,
		input.createdByUserId,
	);

	const nextLines: CreateOrderLineBody[] = [
		...(currentDraft?.lines.map((line) => ({
			productId: line.product_id,
			colorReferenceId: line.color_reference_id,
			quantity: line.quantity,
		})) ?? []),
		{
			productId: input.productId,
			colorReferenceId: input.colorReferenceId ?? null,
			quantity: input.quantity ?? 1,
		},
	];

	return saveDraftRecord({
		clientId: input.clientId,
		createdByUserId: input.createdByUserId,
		fulfillmentMethod: currentDraft?.fulfillment_method ?? "commercial",
		notes: currentDraft?.notes ?? null,
		lines: nextLines,
	});
}

async function submitOrderRecord(input: CreateOrderInput) {
	const ds = await getDataSource();
	const normalizedLines = normalizeRequestedOrderLines(input.lines);

	const createdOrderId = await ds.transaction(async (manager) => {
		await ensureClientCanRegisterOrder(manager, input.clientId);

		const existingDraftId = await findDraftOrderId(
			manager,
			input.clientId,
			input.createdByUserId,
		);

		return persistOrderRecord(manager, {
			existingOrderId: existingDraftId,
			clientId: input.clientId,
			createdByUserId: input.createdByUserId,
			fulfillmentMethod: input.fulfillmentMethod,
			statusId: ORDER_STATUS_IDS.CREATED,
			notes: input.notes,
			lines: normalizedLines,
		});
	});

	const createdOrder = await getOrderById(createdOrderId);

	if (!createdOrder) {
		throw new OrderServiceError(
			"No se pudo recuperar el pedido creado",
			500,
			"ORDER_CREATED_NOT_RECOVERED",
		);
	}

	return mapOrderToSummary(createdOrder);
}

export async function listOrdersByClientId(
	clientId: string,
	input: {
		includeDraft?: boolean;
	} = {},
) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);
	const query = createOrdersBaseQuery(repo)
		.where("order.client_id = :clientId", { clientId })
		.orderBy("order.created_at", "DESC")
		.addOrderBy("lines.order_reference_snapshot", "ASC")
		.addOrderBy("product.name", "ASC");

	if (!input.includeDraft) {
		query.andWhere("order.status_id != :draftStatusId", {
			draftStatusId: ORDER_STATUS_IDS.DRAFT,
		});
	}

	const orders = await query.getMany();
	return orders.map(mapOrderToSummary);
}

export async function getDraftOrderForClientUser(userId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return loadDraftOrderSummary(client.id, userId);
}

export async function getDraftOrderForCommercialUser(
	userId: string,
	input: {
		clientId?: string | null;
	} = {},
) {
	const clientId = String(input.clientId ?? "").trim();

	if (!clientId) {
		return null;
	}

	const commercial = await requireCommercialByUserId(userId);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		clientId,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente indicado no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return loadDraftOrderSummary(clientId, userId);
}

export async function listOrdersForClientUser(userId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return listOrdersByClientId(client.id);
}

export async function listOrdersForCommercialUser(
	userId: string,
	input: ListOrdersForCommercialUserInput = {},
) {
	const commercial = await requireCommercialByUserId(userId);
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);
	const query = createCommercialOrdersBaseQuery(repo, commercial.id)
		.orderBy("order.created_at", "DESC")
		.addOrderBy("lines.order_reference_snapshot", "ASC")
		.addOrderBy("product.name", "ASC");

	const clientId = String(input.clientId ?? "").trim();

	if (clientId) {
		query.andWhere("order.client_id = :clientId", { clientId });
	}

	const statusId = normalizeOptionalFilterId(input.statusId);

	if (statusId !== null) {
		query.andWhere("order.status_id = :statusId", { statusId });
	}

	const paymentStatusId = normalizeOptionalFilterId(input.paymentStatusId);

	if (paymentStatusId !== null) {
		query.andWhere("order.payment_status_id = :paymentStatusId", {
			paymentStatusId,
		});
	}

	if (input.pendingDeliveryOnly) {
		query
			.andWhere("order.status_id = :confirmedStatusId", {
				confirmedStatusId: ORDER_STATUS_IDS.CONFIRMED,
			})
			.andWhere(
				"(order.delivery_visit_id IS NULL OR deliveryVisit.status_id = :postponedVisitStatusId)",
				{
					postponedVisitStatusId: COMMERCIAL_VISIT_STATUS_IDS.POSTPONED,
				},
			);
	}

	const orders = await query.getMany();
	return orders.map(mapOrderToSummary);
}

export async function listOrdersForAdmin(
	input: ListOrdersForAdminInput = {},
) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);
	const query = createOrdersBaseQuery(repo)
		.where("order.status_id != :draftStatusId", {
			draftStatusId: ORDER_STATUS_IDS.DRAFT,
		})
		.orderBy("order.created_at", "DESC")
		.addOrderBy("lines.order_reference_snapshot", "ASC")
		.addOrderBy("product.name", "ASC");
	const clientId = String(input.clientId ?? "").trim();

	if (clientId) {
		query.andWhere("order.client_id = :clientId", { clientId });
	}

	const statusId = normalizeOptionalFilterId(input.statusId);

	if (statusId !== null) {
		query.andWhere("order.status_id = :statusId", { statusId });
	}

	const paymentStatusId = normalizeOptionalFilterId(input.paymentStatusId);

	if (paymentStatusId !== null) {
		query.andWhere("order.payment_status_id = :paymentStatusId", {
			paymentStatusId,
		});
	}

	const orders = await query.getMany();
	return orders.map(mapOrderToSummary);
}

export async function getOrderDetailForClientUser(userId: string, orderId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	const order = await getRequiredOrderById(orderId);
	ensureManageableOrder(order);

	if (order.client_id !== client.id) {
		throw new OrderServiceError(
			"El pedido solicitado no existe",
			404,
			"ORDER_NOT_FOUND",
		);
	}

	return buildOrderDetail(order);
}

export async function getOrderDetailForCommercialUser(
	userId: string,
	orderId: string,
) {
	const commercial = await requireCommercialByUserId(userId);
	const order = await getRequiredOrderById(orderId);
	ensureManageableOrder(order);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		order.client_id,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente de este pedido no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return buildOrderDetail(order);
}

export async function getOrderDetailForAdmin(orderId: string) {
	const order = await getRequiredOrderById(orderId);
	ensureManageableOrder(order);
	return buildOrderDetail(order);
}

export async function updateOrderStatusForCommercialUser(
	userId: string,
	input: UpdateOrderManagementInput,
) {
	const commercial = await requireCommercialByUserId(userId);
	const order = await getRequiredOrderById(input.orderId);
	ensureManageableOrder(order);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		order.client_id,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente de este pedido no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return updateOrderManagementRecord(order, {
		actedByUserId: userId,
		paymentMethod: input.paymentMethod,
		paymentNotes: input.paymentNotes,
		paymentStatusId: input.paymentStatusId,
		statusId: input.statusId,
	});
}

export async function registerOrderPaymentForCommercialUser(
	userId: string,
	input: Omit<RegisterOrderPaymentInput, "actedByUserId">,
) {
	const commercial = await requireCommercialByUserId(userId);
	const order = await getRequiredOrderById(input.orderId);
	ensureManageableOrder(order);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		order.client_id,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente de este pedido no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return registerOrderPaymentRecord(order, {
		actedByUserId: userId,
		amount: input.amount,
		paymentMethod: input.paymentMethod,
		paymentNotes: input.paymentNotes,
	});
}

export async function updateOrderStatusForAdmin(input: UpdateOrderManagementInput) {
	const order = await getRequiredOrderById(input.orderId);
	ensureManageableOrder(order);
	return updateOrderManagementRecord(order, {
		actedByUserId: input.actedByUserId,
		paymentMethod: input.paymentMethod,
		paymentNotes: input.paymentNotes,
		paymentStatusId: input.paymentStatusId,
		statusId: input.statusId,
	});
}

export async function registerOrderPaymentForAdmin(
	input: RegisterOrderPaymentInput,
) {
	const order = await getRequiredOrderById(input.orderId);
	ensureManageableOrder(order);

	return registerOrderPaymentRecord(order, {
		actedByUserId: input.actedByUserId,
		amount: input.amount,
		paymentMethod: input.paymentMethod,
		paymentNotes: input.paymentNotes,
	});
}

export async function saveDraftForClientUser(
	userId: string,
	input: Omit<SaveDraftInput, "clientId" | "createdByUserId">,
) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return saveDraftRecord({
		clientId: client.id,
		createdByUserId: userId,
		fulfillmentMethod: input.fulfillmentMethod,
		notes: input.notes,
		lines: input.lines,
	});
}

export async function saveDraftForCommercialUser(
	userId: string,
	input: Omit<SaveDraftInput, "createdByUserId">,
) {
	const commercial = await requireCommercialByUserId(userId);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		input.clientId,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente indicado no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return saveDraftRecord({
		clientId: input.clientId,
		createdByUserId: userId,
		fulfillmentMethod: input.fulfillmentMethod,
		notes: input.notes,
		lines: input.lines,
	});
}

export async function clearDraftForClientUser(userId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return saveDraftRecord({
		clientId: client.id,
		createdByUserId: userId,
		lines: [],
	});
}

export async function clearDraftForCommercialUser(
	userId: string,
	input: {
		clientId: string;
	},
) {
	const commercial = await requireCommercialByUserId(userId);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		input.clientId,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente indicado no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return saveDraftRecord({
		clientId: input.clientId,
		createdByUserId: userId,
		lines: [],
	});
}

export async function addLineToDraftForClientUser(
	userId: string,
	input: Omit<AddDraftOrderLineInput, "clientId" | "createdByUserId">,
) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return addLineToDraftRecord({
		clientId: client.id,
		createdByUserId: userId,
		productId: input.productId,
		colorReferenceId: input.colorReferenceId ?? null,
		quantity: input.quantity ?? 1,
	});
}

export async function addLineToDraftForCommercialUser(
	userId: string,
	input: Omit<AddDraftOrderLineInput, "createdByUserId">,
) {
	const commercial = await requireCommercialByUserId(userId);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		input.clientId,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente indicado no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return addLineToDraftRecord({
		clientId: input.clientId,
		createdByUserId: userId,
		productId: input.productId,
		colorReferenceId: input.colorReferenceId ?? null,
		quantity: input.quantity ?? 1,
	});
}

export async function createOrderForClientUser(
	userId: string,
	input: Omit<CreateOrderInput, "clientId" | "createdByUserId">,
) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return submitOrderRecord({
		clientId: client.id,
		createdByUserId: userId,
		fulfillmentMethod: input.fulfillmentMethod,
		notes: input.notes,
		lines: input.lines,
	});
}

export async function createOrderForCommercialUser(
	userId: string,
	input: Omit<CreateOrderInput, "createdByUserId">,
) {
	const commercial = await requireCommercialByUserId(userId);
	const canAccessClient = await canCommercialAccessClient(
		commercial.id,
		input.clientId,
	);

	if (!canAccessClient) {
		throw new OrderServiceError(
			"El cliente indicado no está asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return submitOrderRecord({
		clientId: input.clientId,
		createdByUserId: userId,
		fulfillmentMethod: input.fulfillmentMethod,
		notes: input.notes,
		lines: input.lines,
	});
}
