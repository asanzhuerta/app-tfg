import type { EntityManager } from "typeorm";
import { Client } from "@/lib/typeorm/entities/Client";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { Product } from "@/lib/typeorm/entities/Product";
import { ProductLine } from "@/lib/typeorm/entities/ProductLine";
import { PromotionDiscountType } from "@/lib/typeorm/entities/PromotionDiscountType";
import type { PromotionDiscountTypeCode } from "@/lib/typeorm/entities/PromotionDiscountType";
import { DEFAULT_PROMOTION_DISCOUNT_TYPE_CODE } from "./communication-constants";
import { CommunicationsServiceError } from "./communication-errors";
import {
	normalizeOptionalId,
	parseDiscountPercentageFromBenefit,
	normalizePromotionDiscountTypeCode,
} from "./communication-normalizers";

export function assertPromotionDateRange(startDate: string, endDate: string) {
	if (endDate < startDate) {
		throw new CommunicationsServiceError(
			"La fecha fin debe ser igual o posterior a la fecha de inicio",
			400,
			"INVALID_PROMOTION_DATE_RANGE",
		);
	}
}

export function assertPromotionTarget(input: {
	clientId: string | null;
	customerSegmentId: string | null;
}) {
	if (input.clientId && input.customerSegmentId) {
		throw new CommunicationsServiceError(
			"Una promoción no puede estar dirigida simultáneamente a un cliente y a un rango",
			400,
			"INVALID_PROMOTION_TARGET",
		);
	}
}

export async function requireEntityById<T extends { id: string }>(
	manager: EntityManager,
	entity: new () => T,
	id: string,
	message: string,
	code: string,
) {
	const found = await manager.getRepository(entity).findOne({
		where: { id } as object,
	});

	if (!found) {
		throw new CommunicationsServiceError(message, 404, code);
	}

	return found;
}

export async function ensurePromotionRelations(
	manager: EntityManager,
	input: {
		productId: string | null;
		productLineId: string | null;
		giftProductId?: string | null;
		clientId: string | null;
		customerSegmentId: string | null;
	},
) {
	if (input.productId) {
		await requireEntityById(
			manager,
			Product,
			input.productId,
			"Producto no encontrado",
			"PRODUCT_NOT_FOUND",
		);
	}

	if (input.giftProductId) {
		await requireEntityById(
			manager,
			Product,
			input.giftProductId,
			"Producto de regalo no encontrado",
			"GIFT_PRODUCT_NOT_FOUND",
		);
	}

	if (input.productLineId) {
		await requireEntityById(
			manager,
			ProductLine,
			input.productLineId,
			"Línea comercial no encontrada",
			"PRODUCT_LINE_NOT_FOUND",
		);
	}

	if (input.clientId) {
		await requireEntityById(
			manager,
			Client,
			input.clientId,
			"Cliente no encontrado",
			"CLIENT_NOT_FOUND",
		);
	}

	if (input.customerSegmentId) {
		await requireEntityById(
			manager,
			CustomerSegment,
			input.customerSegmentId,
			"Rango no encontrado",
			"CUSTOMER_SEGMENT_NOT_FOUND",
		);
	}
}

export async function resolvePromotionDiscountType(
	manager: EntityManager,
	input: {
		discountTypeId?: string | null;
		discountTypeCode?: PromotionDiscountTypeCode | string | null;
		fallbackDiscountTypeId?: string | null;
	},
) {
	const repo = manager.getRepository(PromotionDiscountType);
	const normalizedDiscountTypeId = normalizeOptionalId(input.discountTypeId);
	const normalizedDiscountTypeCode = normalizePromotionDiscountTypeCode(
		input.discountTypeCode,
	);

	const discountType =
		normalizedDiscountTypeId !== undefined
			? normalizedDiscountTypeId
				? await repo.findOne({ where: { id: normalizedDiscountTypeId } })
				: null
			: normalizedDiscountTypeCode
				? await repo.findOne({ where: { code: normalizedDiscountTypeCode } })
				: input.fallbackDiscountTypeId
					? await repo.findOne({
							where: { id: input.fallbackDiscountTypeId },
						})
					: await repo.findOne({
							where: { code: DEFAULT_PROMOTION_DISCOUNT_TYPE_CODE },
						});

	if (!discountType) {
		throw new CommunicationsServiceError(
			"Tipo de descuento no encontrado",
			404,
			"PROMOTION_DISCOUNT_TYPE_NOT_FOUND",
		);
	}

	if (!discountType.is_active) {
		throw new CommunicationsServiceError(
			"El tipo de descuento no está activo",
			400,
			"PROMOTION_DISCOUNT_TYPE_INACTIVE",
		);
	}

	return discountType;
}

export function normalizePromotionSpecificValues(input: {
	discountTypeCode: string;
	benefit?: string | null;
	discountPercentage?: string | null | undefined;
	minimumOrderAmount?: string | null | undefined;
	giftProductId?: string | null | undefined;
	giftDescription?: string | null | undefined;
	existing?: {
		discountPercentage: string | null;
		minimumOrderAmount: string | null;
		giftProductId: string | null;
		giftDescription: string | null;
	};
}) {
	let discountPercentage =
		input.discountPercentage !== undefined
			? input.discountPercentage
			: input.existing?.discountPercentage ?? null;
	let minimumOrderAmount =
		input.minimumOrderAmount !== undefined
			? input.minimumOrderAmount
			: input.existing?.minimumOrderAmount ?? null;
	let giftProductId =
		input.giftProductId !== undefined
			? input.giftProductId
			: input.existing?.giftProductId ?? null;
	let giftDescription =
		input.giftDescription !== undefined
			? input.giftDescription
			: input.existing?.giftDescription ?? null;

	if (
		(input.discountTypeCode === "percentage_discount" ||
			input.discountTypeCode === "volume_percentage_discount") &&
		!discountPercentage
	) {
		discountPercentage = parseDiscountPercentageFromBenefit(input.benefit);
	}

	if (
		input.discountTypeCode === "percentage_discount" &&
		!discountPercentage
	) {
		throw new CommunicationsServiceError(
			"Indica el porcentaje de descuento",
			400,
			"PROMOTION_PERCENTAGE_REQUIRED",
		);
	}

	if (
		input.discountTypeCode === "volume_percentage_discount" &&
		(!discountPercentage || !minimumOrderAmount)
	) {
		throw new CommunicationsServiceError(
			"Indica el porcentaje y el importe mínimo del descuento por volumen",
			400,
			"PROMOTION_VOLUME_RULE_REQUIRED",
		);
	}

	if (input.discountTypeCode === "gift_product") {
		discountPercentage = null;
		minimumOrderAmount = minimumOrderAmount ?? null;

		if (!giftProductId && !giftDescription) {
			throw new CommunicationsServiceError(
				"Indica un producto de regalo o una descripción del regalo",
				400,
				"PROMOTION_GIFT_REQUIRED",
			);
		}
	}

	if (input.discountTypeCode !== "gift_product") {
		giftProductId = null;
		giftDescription = null;
	}

	if (input.discountTypeCode !== "volume_percentage_discount") {
		minimumOrderAmount = null;
	}

	return {
		discountPercentage,
		minimumOrderAmount,
		giftProductId,
		giftDescription,
	};
}
