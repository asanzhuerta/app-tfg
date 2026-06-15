import type { OrderProductOption } from "@/lib/contracts/order";
import { getVisibleProductReference, isSyntheticProductReference } from "@/lib/catalog/product-reference";
import { getDataSource } from "@/lib/typeorm/data-source";
import { PRODUCT_STATUS_IDS } from "@/lib/typeorm/constants/catalog-ids";
import { getClientByUserId } from "@/lib/typeorm/services/commercial/client";
import { canCommercialAccessClient } from "@/lib/typeorm/services/commercial/client-commercial-assignment";
import { requireCommercialByUserId } from "@/lib/typeorm/services/commercial/commercial";
import { listColorReferences } from "@/lib/typeorm/services/catalog/color-chart";
import { listProducts } from "@/lib/typeorm/services/catalog/product";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import { listActivePromotionDiscountsForClient } from "@/lib/typeorm/services/orders/order-promotion-discounts";
import {
	findBestPromotionDiscountForProduct,
	formatDiscountPercentage,
} from "@/lib/typeorm/services/orders/order-promotions";

type ListOrderProductOptionsInput = {
	clientId?: string | null;
};

export async function listOrderProductOptions(
	input: ListOrderProductOptionsInput = {},
): Promise<OrderProductOption[]> {
	const [products, orderableColorReferences] = await Promise.all([
		listProducts({
			statusId: PRODUCT_STATUS_IDS.ACTIVE,
		}),
		listColorReferences({
			orderableOnly: true,
		}),
	]);
	const clientId = String(input.clientId ?? "").trim();
	const activePromotionDiscounts = clientId
		? await getDataSource().then((ds) =>
				listActivePromotionDiscountsForClient(ds.manager, clientId),
			)
		: [];

	const colorReferencesByProductId = orderableColorReferences.reduce<
		Map<string, Awaited<ReturnType<typeof listColorReferences>>>
	>((acc, colorReference) => {
		if (!colorReference.product_id) {
			return acc;
		}

		const current = acc.get(colorReference.product_id) ?? [];
		current.push(colorReference);
		acc.set(colorReference.product_id, current);
		return acc;
	}, new Map());

	const options: OrderProductOption[] = [];

	for (const product of products) {
		const linkedColorReferences =
			colorReferencesByProductId.get(product.id)?.sort((a, b) => {
				const displayOrderCompare = a.display_order - b.display_order;

				if (displayOrderCompare !== 0) {
					return displayOrderCompare;
				}

				return String(a.erp_reference ?? a.code).localeCompare(
					String(b.erp_reference ?? b.code),
					"es",
					{ sensitivity: "base" },
				);
			}) ?? [];

		if (linkedColorReferences.length > 0) {
			for (const colorReference of linkedColorReferences) {
				const promotionDiscount = findBestPromotionDiscountForProduct(
					activePromotionDiscounts,
					product,
				);

				options.push({
					id: `${product.id}::${colorReference.id}`,
					productId: product.id,
					colorReferenceId: colorReference.id,
					name: product.name,
					reference: getVisibleProductReference(product.reference),
					orderReference:
						colorReference.erp_reference ?? colorReference.code,
					colorReferenceCode: colorReference.code,
					colorReferenceName: colorReference.name,
					isColorReference: true,
					productCategoryName: product.productCategory?.name ?? null,
					productLineName: product.productLine?.name ?? null,
					imageUrl:
						colorReference.image_url ??
						colorReference.thumb_image_url ??
						product.image_url ??
						product.productLine?.image_url ??
						null,
					basePrice: product.base_price,
					discountPercentage: formatDiscountPercentage(
						promotionDiscount?.discountPercentage ?? 0,
					),
					discountTitle: promotionDiscount?.title ?? null,
					discountBenefit: promotionDiscount?.benefit ?? null,
					format: product.format ?? null,
					packing: product.packing ?? null,
				});
			}

			continue;
		}

		if (isSyntheticProductReference(product.reference)) {
			continue;
		}

		const promotionDiscount = findBestPromotionDiscountForProduct(
			activePromotionDiscounts,
			product,
		);

		options.push({
			id: product.id,
			productId: product.id,
			colorReferenceId: null,
			name: product.name,
			reference: product.reference,
			orderReference: product.reference,
			colorReferenceCode: null,
			colorReferenceName: null,
			isColorReference: false,
			productCategoryName: product.productCategory?.name ?? null,
			productLineName: product.productLine?.name ?? null,
			imageUrl: product.image_url ?? product.productLine?.image_url ?? null,
			basePrice: product.base_price,
			discountPercentage: formatDiscountPercentage(
				promotionDiscount?.discountPercentage ?? 0,
			),
			discountTitle: promotionDiscount?.title ?? null,
			discountBenefit: promotionDiscount?.benefit ?? null,
			format: product.format ?? null,
			packing: product.packing ?? null,
		});
	}

	return options.sort((a, b) => {
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

		const productCompare = a.name.localeCompare(b.name, "es", {
			sensitivity: "base",
		});

		if (productCompare !== 0) {
			return productCompare;
		}

		return a.orderReference.localeCompare(b.orderReference, "es", {
			sensitivity: "base",
		});
	});
}

export async function listOrderProductOptionsForClientUser(userId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new OrderServiceError(
			"No existe ficha de cliente para este usuario",
			404,
			"ORDER_CLIENT_PROFILE_NOT_FOUND",
		);
	}

	return listOrderProductOptions({ clientId: client.id });
}

export async function listOrderProductOptionsForCommercialUser(
	userId: string,
	input: {
		clientId?: string | null;
	} = {},
) {
	const clientId = String(input.clientId ?? "").trim();

	if (!clientId) {
		return listOrderProductOptions();
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

	return listOrderProductOptions({ clientId });
}
