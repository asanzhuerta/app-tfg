import type {
	CreateOrderLineBody,
	OrderProductOption,
	OrderSummary,
	OrderSummaryLine,
} from "@/lib/contracts/order";
import { normalizeText } from "@/lib/utils/text";
import { getDataSource } from "@/lib/typeorm/data-source";
import {
	ORDER_STATUS_IDS,
	PRODUCT_STATUS_IDS,
} from "@/lib/typeorm/constants/catalog-ids";
import { Product } from "@/lib/typeorm/entities/Product";
import { Client } from "@/lib/typeorm/entities/Client";
import { User } from "@/lib/typeorm/entities/User";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderLine } from "@/lib/typeorm/entities/OrderLine";
import { ClientCommercialAssignment } from "@/lib/typeorm/entities/ClientCommercialAssignment";
import { getClientByUserId } from "@/lib/typeorm/services/commercial/client";
import {
	canCommercialAccessClient,
} from "@/lib/typeorm/services/commercial/client-commercial-assignment";
import { requireCommercialByUserId } from "@/lib/typeorm/services/commercial/commercial";
import { listProducts } from "@/lib/typeorm/services/catalog/product";

type CreateOrderInput = {
	clientId: string;
	createdByUserId: string;
	notes?: string | null;
	lines?: CreateOrderLineBody[];
};

type NormalizedOrderLineInput = {
	productId: string;
	quantity: number;
};

function toIsoString(value: Date | string | null | undefined) {
	if (!value) {
		return "";
	}

	return value instanceof Date ? value.toISOString() : String(value);
}

function parseMoneyToCents(value: string | number) {
	const parsed = Number(value);

	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new OrderServiceError(
			"Importe de producto no valido",
			500,
			"INVALID_PRODUCT_PRICE",
		);
	}

	return Math.round(parsed * 100);
}

function formatCents(cents: number) {
	return (cents / 100).toFixed(2);
}

function normalizeRequestedOrderLines(
	lines: CreateOrderLineBody[] | null | undefined,
) {
	const sanitized = Array.isArray(lines) ? lines : [];

	if (sanitized.length === 0) {
		throw new OrderServiceError(
			"Debes indicar al menos un producto para el pedido",
			400,
			"ORDER_LINES_REQUIRED",
		);
	}

	const merged = new Map<string, number>();

	for (const line of sanitized) {
		const productId = String(line?.productId ?? "").trim();
		const quantity = Number(line?.quantity);

		if (!productId) {
			throw new OrderServiceError(
				"Cada linea del pedido debe indicar un producto",
				400,
				"ORDER_LINE_PRODUCT_REQUIRED",
			);
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new OrderServiceError(
				"La cantidad de cada linea debe ser un entero positivo",
				400,
				"ORDER_LINE_QUANTITY_INVALID",
			);
		}

		merged.set(productId, (merged.get(productId) ?? 0) + quantity);
	}

	return Array.from(merged.entries()).map(
		([productId, quantity]): NormalizedOrderLineInput => ({
			productId,
			quantity,
		}),
	);
}

function buildOrderSummaryLine(line: OrderLine): OrderSummaryLine {
	return {
		id: line.id,
		product_id: line.product_id,
		product_name: line.product?.name ?? "Producto",
		product_reference: line.product?.reference ?? "",
		product_line_name: line.product?.productLine?.name ?? null,
		quantity: Number(line.quantity ?? 0),
	};
}

function mapOrderToSummary(order: Order): OrderSummary {
	const sortedLines = [...(order.lines ?? [])].sort((a, b) => {
		const nameA = a.product?.name ?? "";
		const nameB = b.product?.name ?? "";

		return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
	});

	return {
		id: order.id,
		client_id: order.client_id,
		client_name: order.client?.name ?? "Cliente",
		client_contact_name: order.client?.contact_name ?? null,
		created_by_user_id: order.created_by_user_id,
		created_by_user_name: order.createdByUser?.name ?? "Usuario",
		status_id: order.status_id,
		status_code: order.status?.code ?? "",
		status_name: order.status?.name ?? "Sin estado",
		total_amount: String(order.total_amount ?? "0.00"),
		notes: order.notes ?? null,
		created_at: toIsoString(order.created_at),
		updated_at: toIsoString(order.updated_at),
		line_count: sortedLines.length,
		lines: sortedLines.map(buildOrderSummaryLine),
	};
}

async function getOrderById(orderId: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);

	return repo
		.createQueryBuilder("order")
		.leftJoinAndSelect("order.client", "client")
		.leftJoinAndSelect("order.createdByUser", "createdByUser")
		.leftJoinAndSelect("order.status", "status")
		.leftJoinAndSelect("order.lines", "lines")
		.leftJoinAndSelect("lines.product", "product")
		.leftJoinAndSelect("product.productLine", "productLine")
		.where("order.id = :orderId", { orderId })
		.orderBy("order.created_at", "DESC")
		.addOrderBy("product.name", "ASC")
		.getOne();
}

async function createOrderRecord(input: CreateOrderInput) {
	const ds = await getDataSource();
	const normalizedLines = normalizeRequestedOrderLines(input.lines);

	const createdOrderId = await ds.transaction(async (manager) => {
		const clientRepo = manager.getRepository(Client);
		const userRepo = manager.getRepository(User);
		const productRepo = manager.getRepository(Product);
		const orderRepo = manager.getRepository(Order);
		const orderLineRepo = manager.getRepository(OrderLine);

		const [client, createdByUser] = await Promise.all([
			clientRepo.findOne({
				where: { id: input.clientId },
			}),
			userRepo.findOne({
				where: { id: input.createdByUserId },
			}),
		]);

		if (!client) {
			throw new OrderServiceError(
				"Cliente no encontrado",
				404,
				"ORDER_CLIENT_NOT_FOUND",
			);
		}

		if (!createdByUser) {
			throw new OrderServiceError(
				"Usuario creador no encontrado",
				404,
				"ORDER_CREATED_BY_NOT_FOUND",
			);
		}

		const productIds = normalizedLines.map((line) => line.productId);
		const products = await productRepo
			.createQueryBuilder("product")
			.where("product.id IN (:...productIds)", { productIds })
			.andWhere("product.status_id = :statusId", {
				statusId: PRODUCT_STATUS_IDS.ACTIVE,
			})
			.getMany();

		if (products.length !== productIds.length) {
			throw new OrderServiceError(
				"Uno o varios productos del pedido ya no estan disponibles",
				400,
				"ORDER_PRODUCTS_NOT_AVAILABLE",
			);
		}

		const productMap = new Map(products.map((product) => [product.id, product]));
		let totalAmountCents = 0;

		const lineRecords = normalizedLines.map((line) => {
			const product = productMap.get(line.productId);

			if (!product) {
				throw new OrderServiceError(
					"Producto de pedido no encontrado",
					400,
					"ORDER_PRODUCT_NOT_FOUND",
				);
			}

			const unitPriceCents = parseMoneyToCents(product.base_price);
			const lineTotalCents = unitPriceCents * line.quantity;
			totalAmountCents += lineTotalCents;

			return {
				productId: product.id,
				quantity: line.quantity,
				unitPriceSnapshot: formatCents(unitPriceCents),
				discountPercentage: "0.00",
				lineTotal: formatCents(lineTotalCents),
			};
		});

		const createdOrder = await orderRepo.save(
			orderRepo.create({
				client_id: input.clientId,
				created_by_user_id: input.createdByUserId,
				status_id: ORDER_STATUS_IDS.CREATED,
				total_amount: formatCents(totalAmountCents),
				notes: normalizeText(input.notes) || null,
			}),
		);

		await orderLineRepo.save(
			lineRecords.map((line) =>
				orderLineRepo.create({
					order_id: createdOrder.id,
					product_id: line.productId,
					quantity: line.quantity,
					unit_price_snapshot: line.unitPriceSnapshot,
					discount_percentage: line.discountPercentage,
					line_total: line.lineTotal,
				}),
			),
		);

		return createdOrder.id;
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

export class OrderServiceError extends Error {
	status: number;
	code: string;

	constructor(message: string, status = 400, code = "ORDER_SERVICE_ERROR") {
		super(message);
		this.name = "OrderServiceError";
		this.status = status;
		this.code = code;
	}
}

export async function listOrderProductOptions(): Promise<OrderProductOption[]> {
	const products = await listProducts({
		statusId: PRODUCT_STATUS_IDS.ACTIVE,
	});

	return products
		.map((product) => ({
			id: product.id,
			name: product.name,
			reference: product.reference,
			productCategoryName: product.productCategory?.name ?? null,
			productLineName: product.productLine?.name ?? null,
			format: product.format ?? null,
			packing: product.packing ?? null,
		}))
		.sort((a, b) => {
			const categoryCompare = String(a.productCategoryName ?? "").localeCompare(
				String(b.productCategoryName ?? ""),
				"es",
				{ sensitivity: "base" },
			);

			if (categoryCompare !== 0) {
				return categoryCompare;
			}

			const lineCompare = String(a.productLineName ?? "").localeCompare(
				String(b.productLineName ?? ""),
				"es",
				{ sensitivity: "base" },
			);

			if (lineCompare !== 0) {
				return lineCompare;
			}

			return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
		});
}

export async function listOrdersByClientId(clientId: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);
	const orders = await repo
		.createQueryBuilder("order")
		.leftJoinAndSelect("order.client", "client")
		.leftJoinAndSelect("order.createdByUser", "createdByUser")
		.leftJoinAndSelect("order.status", "status")
		.leftJoinAndSelect("order.lines", "lines")
		.leftJoinAndSelect("lines.product", "product")
		.leftJoinAndSelect("product.productLine", "productLine")
		.where("order.client_id = :clientId", { clientId })
		.orderBy("order.created_at", "DESC")
		.addOrderBy("product.name", "ASC")
		.getMany();

	return orders.map(mapOrderToSummary);
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
	input: {
		clientId?: string | null;
	} = {},
) {
	const commercial = await requireCommercialByUserId(userId);
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);
	const query = repo
		.createQueryBuilder("order")
		.innerJoin(
			ClientCommercialAssignment,
			"assignment",
			[
				"assignment.client_id = order.client_id",
				"assignment.commercial_id = :commercialId",
				"assignment.unassigned_at IS NULL",
			].join(" AND "),
			{ commercialId: commercial.id },
		)
		.leftJoinAndSelect("order.client", "client")
		.leftJoinAndSelect("order.createdByUser", "createdByUser")
		.leftJoinAndSelect("order.status", "status")
		.leftJoinAndSelect("order.lines", "lines")
		.leftJoinAndSelect("lines.product", "product")
		.leftJoinAndSelect("product.productLine", "productLine")
		.orderBy("order.created_at", "DESC")
		.addOrderBy("product.name", "ASC");

	const clientId = String(input.clientId ?? "").trim();

	if (clientId) {
		query.andWhere("order.client_id = :clientId", { clientId });
	}

	const orders = await query.getMany();
	return orders.map(mapOrderToSummary);
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

	return createOrderRecord({
		clientId: client.id,
		createdByUserId: userId,
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
			"El cliente indicado no esta asignado a este comercial",
			403,
			"ORDER_CLIENT_NOT_ASSIGNED",
		);
	}

	return createOrderRecord({
		clientId: input.clientId,
		createdByUserId: userId,
		notes: input.notes,
		lines: input.lines,
	});
}
