import type { Product } from "@/lib/typeorm/entities/Product";
import type { Promotion } from "@/lib/typeorm/entities/Promotion";
import type { PromotionDiscountTypeCode } from "@/lib/typeorm/entities/PromotionDiscountType";
import { normalizeText } from "@/lib/utils/text";

export type ActivePromotionDiscount = {
	id: string;
	title: string;
	benefit: string;
	typeCode: PromotionDiscountTypeCode | string;
	discountPercentage: number;
	minimumOrderAmountCents: number | null;
	endDate: string;
	productId: string | null;
	productLineId: string | null;
	clientId: string | null;
	customerSegmentId: string | null;
};

export function parsePromotionDiscountPercentage(promotion: Promotion) {
	const structuredDiscount = Number(promotion.discount_percentage);

	if (
		Number.isFinite(structuredDiscount) &&
		structuredDiscount > 0 &&
		structuredDiscount <= 100
	) {
		return structuredDiscount;
	}

	const normalizedType = normalizeText(promotion.promotion_type).toLowerCase();

	if (!normalizedType.includes("descuento") && !normalizedType.includes("discount")) {
		return null;
	}

	const match = normalizeText(promotion.benefit)
		.replace(",", ".")
		.match(/(\d+(?:\.\d+)?)/);
	const parsed = Number(match?.[1]);

	if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
		return null;
	}

	return parsed;
}

export function parsePromotionMinimumOrderAmountCents(promotion: Promotion) {
	const parsed = Number(promotion.minimum_order_amount);

	return Number.isFinite(parsed) && parsed > 0
		? Math.round(parsed * 100)
		: null;
}

export function getPromotionDiscountTypeCode(promotion: Promotion) {
	return (
		promotion.discountType?.code ??
		(promotion.minimum_order_amount
			? "volume_percentage_discount"
			: "percentage_discount")
	);
}

export function formatDiscountPercentage(discountPercentage: number) {
	return discountPercentage.toFixed(2);
}

function getPromotionSpecificityScore(promotion: ActivePromotionDiscount) {
	return (
		(promotion.clientId ? 8 : 0) +
		(promotion.customerSegmentId ? 4 : 0) +
		(promotion.productId ? 2 : 0) +
		(promotion.productLineId ? 1 : 0)
	);
}

function isPromotionDiscountBetter(
	candidate: ActivePromotionDiscount,
	current: ActivePromotionDiscount | null,
) {
	if (!current) {
		return true;
	}

	if (candidate.discountPercentage !== current.discountPercentage) {
		return candidate.discountPercentage > current.discountPercentage;
	}

	const candidateSpecificity = getPromotionSpecificityScore(candidate);
	const currentSpecificity = getPromotionSpecificityScore(current);

	if (candidateSpecificity !== currentSpecificity) {
		return candidateSpecificity > currentSpecificity;
	}

	return candidate.endDate < current.endDate;
}

function promotionAppliesToProduct(
	promotion: ActivePromotionDiscount,
	product: Product,
) {
	const targetsProduct = Boolean(promotion.productId);
	const targetsProductLine = Boolean(promotion.productLineId);

	if (!targetsProduct && !targetsProductLine) {
		return true;
	}

	return (
		promotion.productId === product.id ||
		promotion.productLineId === product.product_line_id
	);
}

export function findBestPromotionDiscountForProduct(
	promotions: ActivePromotionDiscount[],
	product: Product,
	orderSubtotalCents = 0,
) {
	return promotions.reduce<ActivePromotionDiscount | null>(
		(bestPromotion, promotion) => {
			if (
				promotion.typeCode === "volume_percentage_discount" &&
				(promotion.minimumOrderAmountCents === null ||
					orderSubtotalCents < promotion.minimumOrderAmountCents)
			) {
				return bestPromotion;
			}

			if (!promotionAppliesToProduct(promotion, product)) {
				return bestPromotion;
			}

			return isPromotionDiscountBetter(promotion, bestPromotion)
				? promotion
				: bestPromotion;
		},
		null,
	);
}
