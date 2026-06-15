import type { EntityManager } from "typeorm";
import { Promotion } from "@/lib/typeorm/entities/Promotion";
import { listApplicableCustomerSegmentIdsForClient } from "@/lib/typeorm/services/clients/client-tier";
import {
	type ActivePromotionDiscount,
	getPromotionDiscountTypeCode,
	parsePromotionDiscountPercentage,
	parsePromotionMinimumOrderAmountCents,
} from "@/lib/typeorm/services/orders/order-promotions";

export async function listActivePromotionDiscountsForClient(
	manager: EntityManager,
	clientId: string,
) {
	const today = new Date().toISOString().slice(0, 10);
	const applicableSegmentIds = await listApplicableCustomerSegmentIdsForClient(
		manager,
		clientId,
	);
	const segmentPromotionPredicate = applicableSegmentIds.length
		? "OR promotion.customer_segment_id IN (:...applicableSegmentIds)"
		: "";
	const queryParameters = applicableSegmentIds.length
		? { clientId, applicableSegmentIds }
		: { clientId };
	const promotions = await manager
		.getRepository(Promotion)
		.createQueryBuilder("promotion")
		.leftJoinAndSelect("promotion.discountType", "discountType")
		.where("promotion.status = :status", { status: "active" })
		.andWhere("promotion.start_date <= :today", { today })
		.andWhere("promotion.end_date >= :today", { today })
		.andWhere(
			[
				"(",
				"(promotion.client_id IS NULL AND promotion.customer_segment_id IS NULL)",
				"OR promotion.client_id = :clientId",
				segmentPromotionPredicate,
				")",
			].join(" "),
			queryParameters,
		)
		.getMany();

	return promotions
		.map((promotion) => {
			const discountPercentage = parsePromotionDiscountPercentage(promotion);
			const typeCode = getPromotionDiscountTypeCode(promotion);

			if (
				discountPercentage === null ||
				(typeCode !== "percentage_discount" &&
					typeCode !== "volume_percentage_discount")
			) {
				return null;
			}

			return {
				id: promotion.id,
				title: promotion.title,
				benefit: promotion.benefit,
				typeCode,
				discountPercentage,
				minimumOrderAmountCents:
					typeCode === "volume_percentage_discount"
						? parsePromotionMinimumOrderAmountCents(promotion)
						: null,
				endDate: promotion.end_date,
				productId: promotion.product_id,
				productLineId: promotion.product_line_id,
				clientId: promotion.client_id,
				customerSegmentId: promotion.customer_segment_id,
			} satisfies ActivePromotionDiscount;
		})
		.filter(
			(promotion): promotion is ActivePromotionDiscount => promotion !== null,
		);
}
