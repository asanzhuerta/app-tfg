import type {
	OrderDetail,
	OrderPaymentStatusOption,
	OrderStatusOption,
} from "@/lib/contracts/order";
import type { Repository } from "typeorm";
import { getDataSource } from "@/lib/typeorm/data-source";
import { ORDER_STATUS_IDS } from "@/lib/typeorm/constants/catalog-ids";
import { ClientCommercialAssignment } from "@/lib/typeorm/entities/ClientCommercialAssignment";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderPaymentStatus } from "@/lib/typeorm/entities/OrderPaymentStatus";
import { OrderStatus } from "@/lib/typeorm/entities/OrderStatus";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import {
	mapOrderPaymentStatusToOption,
	mapOrderStatusToOption,
	mapOrderToSummary,
} from "@/lib/typeorm/services/orders/order-mappers";
import {
	getAllowedOrderPaymentTransitionIds,
	getAllowedOrderTransitionIds,
} from "@/lib/typeorm/services/orders/order-transitions";

async function listOrderStatusOptionsByIds(statusIds: number[]) {
	if (statusIds.length === 0) {
		return [] as OrderStatusOption[];
	}

	const ds = await getDataSource();
	const statuses = await ds
		.getRepository(OrderStatus)
		.createQueryBuilder("status")
		.where("status.id IN (:...statusIds)", { statusIds })
		.getMany();
	const statusMap = new Map(statuses.map((status) => [status.id, status]));

	return statusIds
		.map((statusId) => statusMap.get(statusId))
		.filter((status): status is OrderStatus => Boolean(status))
		.map(mapOrderStatusToOption);
}

async function listOrderPaymentStatusOptionsByIds(statusIds: number[]) {
	if (statusIds.length === 0) {
		return [] as OrderPaymentStatusOption[];
	}

	const ds = await getDataSource();
	const statuses = await ds
		.getRepository(OrderPaymentStatus)
		.createQueryBuilder("status")
		.where("status.id IN (:...statusIds)", { statusIds })
		.getMany();
	const statusMap = new Map(statuses.map((status) => [status.id, status]));

	return statusIds
		.map((statusId) => statusMap.get(statusId))
		.filter((status): status is OrderPaymentStatus => Boolean(status))
		.map(mapOrderPaymentStatusToOption);
}

export async function buildOrderDetail(order: Order): Promise<OrderDetail> {
	const availableStatusTransitions = await listOrderStatusOptionsByIds(
		getAllowedOrderTransitionIds(order.status?.code),
	);
	const availablePaymentTransitions = await listOrderPaymentStatusOptionsByIds(
		getAllowedOrderPaymentTransitionIds(order),
	);

	return {
		order: mapOrderToSummary(order),
		availableStatusTransitions,
		availablePaymentTransitions,
	};
}

export function createOrdersBaseQuery(repo: Repository<Order>) {
	return repo
		.createQueryBuilder("order")
		.leftJoinAndSelect("order.client", "client")
		.leftJoinAndSelect("order.createdByUser", "createdByUser")
		.leftJoinAndSelect("createdByUser.role", "createdByUserRole")
		.leftJoinAndSelect("order.status", "status")
		.leftJoinAndSelect("order.paymentStatus", "paymentStatus")
		.leftJoinAndSelect("order.paidByUser", "paidByUser")
		.leftJoinAndSelect("order.payments", "payments")
		.leftJoinAndSelect("payments.registeredByUser", "paymentRegisteredByUser")
		.leftJoinAndSelect("order.deliveries", "deliveries")
		.leftJoinAndSelect("deliveries.commercial", "deliveryCommercial")
		.leftJoinAndSelect("deliveryCommercial.user", "deliveryCommercialUser")
		.leftJoinAndSelect("deliveries.deliveryVisit", "deliveryVisitForReparto")
		.leftJoinAndSelect(
			"deliveryVisitForReparto.status",
			"deliveryVisitForRepartoStatus",
		)
		.leftJoinAndSelect("deliveries.lines", "deliveryLines")
		.leftJoinAndSelect("deliveryLines.orderLine", "deliveryOrderLine")
		.leftJoinAndSelect("deliveryOrderLine.product", "deliveryLineProduct")
		.leftJoinAndSelect(
			"deliveryLineProduct.productLine",
			"deliveryLineProductLine",
		)
		.leftJoinAndSelect(
			"deliveryOrderLine.colorReference",
			"deliveryLineColorReference",
		)
		.leftJoinAndSelect("order.deliveryVisit", "deliveryVisit")
		.leftJoinAndSelect("deliveryVisit.status", "deliveryVisitStatus")
		.leftJoinAndSelect("order.lines", "lines")
		.leftJoinAndSelect("lines.product", "product")
		.leftJoinAndSelect("lines.colorReference", "colorReference")
		.leftJoinAndSelect("product.productLine", "productLine");
}

export function createCommercialOrdersBaseQuery(
	repo: Repository<Order>,
	commercialId: string,
) {
	return createOrdersBaseQuery(repo)
		.innerJoin(
			ClientCommercialAssignment,
			"assignment",
			[
				"assignment.client_id = order.client_id",
				"assignment.commercial_id = :commercialId",
				"assignment.unassigned_at IS NULL",
			].join(" AND "),
			{ commercialId },
		)
		.andWhere("order.status_id != :draftStatusId", {
			draftStatusId: ORDER_STATUS_IDS.DRAFT,
		});
}

export async function getOrderById(orderId: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Order);

	return createOrdersBaseQuery(repo)
		.where("order.id = :orderId", { orderId })
		.orderBy("order.created_at", "DESC")
		.addOrderBy("lines.order_reference_snapshot", "ASC")
		.addOrderBy("product.name", "ASC")
		.getOne();
}

export async function getRequiredOrderById(orderId: string) {
	const order = await getOrderById(orderId);

	if (!order) {
		throw new OrderServiceError(
			"El pedido solicitado no existe",
			404,
			"ORDER_NOT_FOUND",
		);
	}

	return order;
}
