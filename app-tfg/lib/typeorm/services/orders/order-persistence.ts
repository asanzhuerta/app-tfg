import type { EntityManager } from "typeorm";
import type { OrderFulfillmentMethod } from "@/lib/contracts/order";
import { isSyntheticProductReference } from "@/lib/catalog/product-reference";
import { PRODUCT_STATUS_IDS } from "@/lib/typeorm/constants/catalog-ids";
import { Client } from "@/lib/typeorm/entities/Client";
import { ColorReference } from "@/lib/typeorm/entities/ColorReference";
import { Order } from "@/lib/typeorm/entities/Order";
import { OrderLine } from "@/lib/typeorm/entities/OrderLine";
import { Product } from "@/lib/typeorm/entities/Product";
import { User } from "@/lib/typeorm/entities/User";
import { getAgencyDeliveryFeeCents } from "@/lib/typeorm/services/orders/order-settings";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import {
	type NormalizedOrderLineInput,
	type PreparedOrderLineRecord,
} from "@/lib/typeorm/services/orders/order-lines";
import { normalizeFulfillmentMethod } from "@/lib/typeorm/services/orders/order-mappers";
import {
	applyPercentageDiscountToCents,
	formatCents,
	parseMoneyToCents,
} from "@/lib/typeorm/services/orders/order-money";
import { listActivePromotionDiscountsForClient } from "@/lib/typeorm/services/orders/order-promotion-discounts";
import {
	findBestPromotionDiscountForProduct,
	formatDiscountPercentage,
} from "@/lib/typeorm/services/orders/order-promotions";
import { normalizeText } from "@/lib/utils/text";

type PersistOrderRecordInput = {
	existingOrderId?: string | null;
	clientId: string;
	createdByUserId: string;
	fulfillmentMethod?: OrderFulfillmentMethod | string | null;
	statusId: number;
	notes?: string | null;
	lines: NormalizedOrderLineInput[];
};

async function ensureOrderActors(
	manager: EntityManager,
	input: {
		clientId: string;
		createdByUserId: string;
	},
) {
	const clientRepo = manager.getRepository(Client);
	const userRepo = manager.getRepository(User);

	const client = await clientRepo.findOne({
		where: { id: input.clientId },
	});
	const createdByUser = await userRepo.findOne({
		where: { id: input.createdByUserId },
	});

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
}

async function prepareOrderLineRecords(
	manager: EntityManager,
	clientId: string,
	lines: NormalizedOrderLineInput[],
) {
	if (lines.length === 0) {
		return {
			totalAmountCents: 0,
			lineRecords: [] as PreparedOrderLineRecord[],
		};
	}

	const productRepo = manager.getRepository(Product);
	const colorReferenceRepo = manager.getRepository(ColorReference);
	const productIds = Array.from(new Set(lines.map((line) => line.productId)));
	const colorReferenceIds = Array.from(
		new Set(
			lines
				.map((line) => String(line.colorReferenceId ?? "").trim())
				.filter(Boolean),
		),
	);

	const products = await productRepo
		.createQueryBuilder("product")
		.leftJoinAndSelect("product.productLine", "productLine")
		.where("product.id IN (:...productIds)", { productIds })
		.andWhere("product.status_id = :statusId", {
			statusId: PRODUCT_STATUS_IDS.ACTIVE,
		})
		.getMany();
	const colorReferences =
		colorReferenceIds.length > 0
			? await colorReferenceRepo
					.createQueryBuilder("colorReference")
					.where("colorReference.id IN (:...colorReferenceIds)", {
						colorReferenceIds,
					})
					.andWhere("colorReference.is_orderable = true")
					.getMany()
			: ([] as ColorReference[]);
	const productVariantCounts = await colorReferenceRepo
		.createQueryBuilder("colorReference")
		.select("colorReference.product_id", "productId")
		.addSelect("COUNT(*)", "count")
		.where("colorReference.product_id IN (:...productIds)", { productIds })
		.andWhere("colorReference.is_orderable = true")
		.groupBy("colorReference.product_id")
		.getRawMany<{ productId: string; count: string }>();

	if (products.length !== productIds.length) {
		throw new OrderServiceError(
			"Uno o varios productos del pedido ya no están disponibles",
			400,
			"ORDER_PRODUCTS_NOT_AVAILABLE",
		);
	}

	const productMap = new Map(products.map((product) => [product.id, product]));
	const colorReferenceMap = new Map(
		colorReferences.map((colorReference) => [colorReference.id, colorReference]),
	);
	const productVariantCountMap = new Map(
		productVariantCounts.map((row) => [row.productId, Number(row.count ?? 0)]),
	);
	const activePromotionDiscounts =
		await listActivePromotionDiscountsForClient(manager, clientId);

	const preparedLines = lines.map((line) => {
		const product = productMap.get(line.productId);

		if (!product) {
			throw new OrderServiceError(
				"Producto de pedido no encontrado",
				400,
				"ORDER_PRODUCT_NOT_FOUND",
			);
		}

		const orderableVariantCount = productVariantCountMap.get(product.id) ?? 0;
		const selectedColorReference = line.colorReferenceId
			? colorReferenceMap.get(line.colorReferenceId)
			: null;

		if (line.colorReferenceId && !selectedColorReference) {
			throw new OrderServiceError(
				"La referencia de color indicada ya no está disponible",
				400,
				"ORDER_COLOR_REFERENCE_NOT_AVAILABLE",
			);
		}

		if (
			selectedColorReference &&
			selectedColorReference.product_id !== product.id
		) {
			throw new OrderServiceError(
				"La referencia de color no pertenece al producto seleccionado",
				400,
				"ORDER_COLOR_REFERENCE_PRODUCT_MISMATCH",
			);
		}

		if (orderableVariantCount > 0 && !selectedColorReference) {
			throw new OrderServiceError(
				"Debes indicar el tono o referencia exacta para este producto de coloración",
				400,
				"ORDER_COLOR_REFERENCE_REQUIRED",
			);
		}

		if (
			orderableVariantCount === 0 &&
			selectedColorReference &&
			isSyntheticProductReference(product.reference)
		) {
			throw new OrderServiceError(
				"El producto seleccionado no admite esa referencia de color",
				400,
				"ORDER_COLOR_REFERENCE_NOT_ALLOWED",
			);
		}

		const unitPriceCents = parseMoneyToCents(product.base_price);
		const lineSubtotalCents = unitPriceCents * line.quantity;

		return {
			line,
			product,
			selectedColorReference,
			unitPriceCents,
			lineSubtotalCents,
		};
	});
	const orderSubtotalCents = preparedLines.reduce(
		(total, preparedLine) => total + preparedLine.lineSubtotalCents,
		0,
	);
	let totalAmountCents = 0;
	const lineRecords = preparedLines.map((preparedLine) => {
		const promotionDiscount = findBestPromotionDiscountForProduct(
			activePromotionDiscounts,
			preparedLine.product,
			orderSubtotalCents,
		);
		const discountPercentage = promotionDiscount?.discountPercentage ?? 0;
		const lineTotalCents =
			discountPercentage > 0
				? applyPercentageDiscountToCents(
						preparedLine.lineSubtotalCents,
						discountPercentage,
					)
				: preparedLine.lineSubtotalCents;
		totalAmountCents += lineTotalCents;

		return {
			productId: preparedLine.product.id,
			colorReferenceId: preparedLine.selectedColorReference?.id ?? null,
			quantity: preparedLine.line.quantity,
			unitPriceSnapshot: formatCents(preparedLine.unitPriceCents),
			discountPercentage: formatDiscountPercentage(discountPercentage),
			lineTotal: formatCents(lineTotalCents),
			orderReferenceSnapshot:
				preparedLine.selectedColorReference?.erp_reference ||
				preparedLine.selectedColorReference?.code ||
				preparedLine.product.reference,
			variantCodeSnapshot: preparedLine.selectedColorReference?.code ?? null,
			variantNameSnapshot: preparedLine.selectedColorReference?.name ?? null,
		};
	});

	return {
		totalAmountCents,
		lineRecords,
	};
}

export async function persistOrderRecord(
	manager: EntityManager,
	input: PersistOrderRecordInput,
) {
	await ensureOrderActors(manager, input);

	const orderRepo = manager.getRepository(Order);
	const orderLineRepo = manager.getRepository(OrderLine);
	const { totalAmountCents, lineRecords } = await prepareOrderLineRecords(
		manager,
		input.clientId,
		input.lines,
	);
	const fulfillmentMethod = normalizeFulfillmentMethod(input.fulfillmentMethod);
	const agencyDeliveryFeeCents =
		fulfillmentMethod === "agency"
			? await getAgencyDeliveryFeeCents(manager)
			: 0;
	const finalTotalAmountCents = totalAmountCents + agencyDeliveryFeeCents;

	const currentOrder =
		input.existingOrderId
			? await orderRepo.findOne({
					where: { id: input.existingOrderId },
				})
			: null;

	const savedOrder = await orderRepo.save(
		orderRepo.create({
			id: currentOrder?.id,
			client_id: input.clientId,
			created_by_user_id: input.createdByUserId,
			status_id: input.statusId,
			delivery_visit_id: currentOrder?.delivery_visit_id ?? null,
			total_amount: formatCents(finalTotalAmountCents),
			fulfillment_method: fulfillmentMethod,
			agency_delivery_fee: formatCents(agencyDeliveryFeeCents),
			notes: normalizeText(input.notes) || null,
		}),
	);

	await orderLineRepo.delete({
		order_id: savedOrder.id,
	});

	if (lineRecords.length > 0) {
		await orderLineRepo.save(
			lineRecords.map((line) =>
				orderLineRepo.create({
					order_id: savedOrder.id,
					product_id: line.productId,
					color_reference_id: line.colorReferenceId,
					quantity: line.quantity,
					unit_price_snapshot: line.unitPriceSnapshot,
					discount_percentage: line.discountPercentage,
					line_total: line.lineTotal,
					order_reference_snapshot: line.orderReferenceSnapshot,
					variant_code_snapshot: line.variantCodeSnapshot,
					variant_name_snapshot: line.variantNameSnapshot,
				}),
			),
		);
	}

	return savedOrder.id;
}
