import { getDataSource } from "@/lib/typeorm/data-source";
import type { AdminUpsertPromotionBody } from "@/lib/contracts/communications";
import { Promotion } from "@/lib/typeorm/entities/Promotion";
import { PromotionDiscountType } from "@/lib/typeorm/entities/PromotionDiscountType";
import {
	getCustomerSegmentTierOrderSql,
	listApplicableCustomerSegmentIdsForClient,
} from "@/lib/typeorm/services/clients/client-tier";
import {
	assertPromotionDateRange,
	assertPromotionTarget,
	buildPromotionBenefit,
	CommunicationsServiceError,
	ensurePromotionRelations,
	normalizeDateOnly,
	normalizeDecimalAmount,
	normalizeNotificationDeliveryChannels,
	normalizeOptionalId,
	normalizePromotionDiscountPercentage,
	normalizePromotionSpecificValues,
	normalizePromotionStatus,
	normalizeText,
	notifyPromotionPublished,
	resolvePromotionDiscountType,
	rethrowCommunicationsPersistenceError,
} from "./communication-core";

export async function listPromotionDiscountTypes() {
	const ds = await getDataSource();

	return ds.getRepository(PromotionDiscountType).find({
		where: { is_active: true },
		order: {
			display_order: "ASC",
			name: "ASC",
		},
	});
}

export async function listAdminPromotions(input: { search?: string | null } = {}) {
	const ds = await getDataSource();
	const query = ds
		.getRepository(Promotion)
		.createQueryBuilder("promotion")
		.leftJoinAndSelect("promotion.discountType", "discountType")
		.leftJoinAndSelect("promotion.product", "product")
		.leftJoinAndSelect("promotion.giftProduct", "giftProduct")
		.leftJoinAndSelect("promotion.productLine", "productLine")
		.leftJoinAndSelect("promotion.client", "client")
		.leftJoinAndSelect("promotion.customerSegment", "segment")
		.leftJoinAndSelect("promotion.createdByUser", "createdByUser")
		.orderBy(getCustomerSegmentTierOrderSql("segment"), "ASC")
		.addOrderBy("promotion.created_at", "DESC");
	const search = String(input.search ?? "").trim();

	if (search) {
		query.where(
			`(
				promotion.title ILIKE :search
				OR promotion.description ILIKE :search
				OR promotion.promotion_type ILIKE :search
				OR promotion.benefit ILIKE :search
				OR COALESCE(discountType.name, '') ILIKE :search
				OR COALESCE(giftProduct.name, '') ILIKE :search
				OR COALESCE(product.name, '') ILIKE :search
				OR COALESCE(productLine.name, '') ILIKE :search
				OR COALESCE(client.name, '') ILIKE :search
				OR COALESCE(segment.name, '') ILIKE :search
			)`,
			{ search: `%${search}%` },
		);
	}

	return query.getMany();
}

export async function getPromotionById(id: string) {
	const ds = await getDataSource();

	return ds
		.getRepository(Promotion)
		.createQueryBuilder("promotion")
		.leftJoinAndSelect("promotion.discountType", "discountType")
		.leftJoinAndSelect("promotion.product", "product")
		.leftJoinAndSelect("promotion.giftProduct", "giftProduct")
		.leftJoinAndSelect("promotion.productLine", "productLine")
		.leftJoinAndSelect("promotion.client", "client")
		.leftJoinAndSelect("promotion.customerSegment", "segment")
		.leftJoinAndSelect("promotion.createdByUser", "createdByUser")
		.where("promotion.id = :id", { id })
		.getOne();
}

export async function createPromotion(
	input: AdminUpsertPromotionBody & { createdByUserId?: string | null },
) {
	const ds = await getDataSource();
	const title = normalizeText(input.title, "El título", { required: true });
	const description = normalizeText(input.description, "La descripción", {
		required: true,
	});
	const promotionType = normalizeText(input.promotionType, "El tipo");
	const rawBenefit = normalizeText(input.benefit, "El beneficio");
	const discountPercentage = normalizePromotionDiscountPercentage(
		input.discountPercentage,
	);
	const minimumOrderAmount = normalizeDecimalAmount(
		input.minimumOrderAmount,
		"El importe mínimo",
	);
	const giftProductId = normalizeOptionalId(input.giftProductId) ?? null;
	const giftDescription = normalizeText(input.giftDescription, "El regalo");
	const imageUrl = normalizeText(input.imageUrl, "La imagen");
	const attachmentUrl = normalizeText(input.attachmentUrl, "El adjunto");
	const attachmentName = normalizeText(input.attachmentName, "El nombre del adjunto");
	const attachmentMimeType = normalizeText(
		input.attachmentMimeType,
		"El tipo del adjunto",
	);
	const startDate = normalizeDateOnly(input.startDate, "La fecha de inicio", {
		required: true,
	});
	const endDate = normalizeDateOnly(input.endDate, "La fecha fin", {
		required: true,
	});
	const status = normalizePromotionStatus(input.status) ?? "draft";
	const productId = normalizeOptionalId(input.productId) ?? null;
	const productLineId = normalizeOptionalId(input.productLineId) ?? null;
	const clientId = normalizeOptionalId(input.clientId) ?? null;
	const customerSegmentId = normalizeOptionalId(input.customerSegmentId) ?? null;
	const deliveryChannels = normalizeNotificationDeliveryChannels(
		input.deliveryChannels,
	);

	assertPromotionDateRange(String(startDate), String(endDate));
	assertPromotionTarget({ clientId, customerSegmentId });

	try {
		const created = await ds.transaction(async (manager) => {
			const discountType = await resolvePromotionDiscountType(manager, {
				discountTypeId: input.promotionDiscountTypeId,
				discountTypeCode: input.promotionDiscountTypeCode,
			});
			const specificValues = normalizePromotionSpecificValues({
				discountTypeCode: discountType.code,
				benefit: rawBenefit,
				discountPercentage,
				minimumOrderAmount,
				giftProductId,
				giftDescription,
			});

			await ensurePromotionRelations(manager, {
				productId,
				productLineId,
				giftProductId: specificValues.giftProductId,
				clientId,
				customerSegmentId,
			});

			const repo = manager.getRepository(Promotion);
			const benefit = buildPromotionBenefit({
				benefit: rawBenefit,
				discountTypeCode: discountType.code,
				discountPercentage: specificValues.discountPercentage,
				minimumOrderAmount: specificValues.minimumOrderAmount,
				giftDescription: specificValues.giftDescription,
			});
			const promotion = await repo.save(
				repo.create({
					title: String(title),
					description: String(description),
					promotion_type: String(promotionType ?? discountType.name),
					promotion_discount_type_id: discountType.id,
					benefit,
					discount_percentage: specificValues.discountPercentage,
					minimum_order_amount: specificValues.minimumOrderAmount,
					gift_product_id: specificValues.giftProductId,
					gift_description: specificValues.giftDescription,
					image_url: imageUrl ?? null,
					attachment_url: attachmentUrl ?? null,
					attachment_name: attachmentName ?? null,
					attachment_mime_type: attachmentMimeType ?? null,
					start_date: String(startDate),
					end_date: String(endDate),
					status,
					product_id: productId,
					product_line_id: productLineId,
					client_id: clientId,
					customer_segment_id: customerSegmentId,
					created_by_user_id: input.createdByUserId ?? null,
				}),
			);

			if (promotion.status === "active") {
				await notifyPromotionPublished(manager, promotion, deliveryChannels);
			}

			return promotion;
		});

		return getPromotionById(created.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo crear la promoción",
			"PROMOTION_CREATE_FAILED",
		);
	}
}

export async function updatePromotion(
	input: { promotionId: string } & AdminUpsertPromotionBody,
) {
	const ds = await getDataSource();
	const normalized = {
		title: normalizeText(input.title, "El título"),
		description: normalizeText(input.description, "La descripción"),
		promotionType: normalizeText(input.promotionType, "El tipo"),
		benefit: normalizeText(input.benefit, "El beneficio"),
		discountPercentage: normalizePromotionDiscountPercentage(
			input.discountPercentage,
		),
		minimumOrderAmount: normalizeDecimalAmount(
			input.minimumOrderAmount,
			"El importe mínimo",
		),
		giftProductId: normalizeOptionalId(input.giftProductId),
		giftDescription: normalizeText(input.giftDescription, "El regalo"),
		imageUrl: normalizeText(input.imageUrl, "La imagen"),
		attachmentUrl: normalizeText(input.attachmentUrl, "El adjunto"),
		attachmentName: normalizeText(input.attachmentName, "El nombre del adjunto"),
		attachmentMimeType: normalizeText(
			input.attachmentMimeType,
			"El tipo del adjunto",
		),
		startDate: normalizeDateOnly(input.startDate, "La fecha de inicio"),
		endDate: normalizeDateOnly(input.endDate, "La fecha fin"),
		status: normalizePromotionStatus(input.status),
		productId: normalizeOptionalId(input.productId),
		productLineId: normalizeOptionalId(input.productLineId),
		clientId: normalizeOptionalId(input.clientId),
		customerSegmentId: normalizeOptionalId(input.customerSegmentId),
		deliveryChannels: normalizeNotificationDeliveryChannels(
			input.deliveryChannels,
		),
	};

	try {
		const updated = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(Promotion);
			const promotion = await repo.findOne({
				where: { id: input.promotionId },
			});

			if (!promotion) {
				throw new CommunicationsServiceError(
					"Promoción no encontrada",
					404,
					"PROMOTION_NOT_FOUND",
				);
			}

			const wasActive = promotion.status === "active";
			const discountType = await resolvePromotionDiscountType(manager, {
				discountTypeId: input.promotionDiscountTypeId,
				discountTypeCode: input.promotionDiscountTypeCode,
				fallbackDiscountTypeId: promotion.promotion_discount_type_id,
			});
			const hasSpecificPromotionChanges =
				input.promotionDiscountTypeId !== undefined ||
				input.promotionDiscountTypeCode !== undefined ||
				input.discountPercentage !== undefined ||
				input.minimumOrderAmount !== undefined ||
				input.giftProductId !== undefined ||
				input.giftDescription !== undefined;
			const specificValues = normalizePromotionSpecificValues({
				discountTypeCode: discountType.code,
				benefit: normalized.benefit ?? promotion.benefit,
				discountPercentage: normalized.discountPercentage,
				minimumOrderAmount: normalized.minimumOrderAmount,
				giftProductId: normalized.giftProductId,
				giftDescription: normalized.giftDescription,
				existing: {
					discountPercentage: promotion.discount_percentage,
					minimumOrderAmount: promotion.minimum_order_amount,
					giftProductId: promotion.gift_product_id,
					giftDescription: promotion.gift_description,
				},
			});
			const nextBenefit =
				normalized.benefit !== undefined || hasSpecificPromotionChanges
					? buildPromotionBenefit({
							benefit: normalized.benefit ?? null,
							discountTypeCode: discountType.code,
							discountPercentage: specificValues.discountPercentage,
							minimumOrderAmount: specificValues.minimumOrderAmount,
							giftDescription: specificValues.giftDescription,
						})
					: promotion.benefit;
			const nextValues = {
				title: normalized.title ?? promotion.title,
				description: normalized.description ?? promotion.description,
				promotionType:
					normalized.promotionType ??
					(hasSpecificPromotionChanges
						? discountType.name
						: promotion.promotion_type),
				benefit: nextBenefit,
				discountTypeId: discountType.id,
				discountPercentage: specificValues.discountPercentage,
				minimumOrderAmount: specificValues.minimumOrderAmount,
				giftProductId: specificValues.giftProductId,
				giftDescription: specificValues.giftDescription,
				imageUrl:
					normalized.imageUrl !== undefined
						? normalized.imageUrl
						: promotion.image_url,
				attachmentUrl:
					normalized.attachmentUrl !== undefined
						? normalized.attachmentUrl
						: promotion.attachment_url,
				attachmentName:
					normalized.attachmentName !== undefined
						? normalized.attachmentName
						: promotion.attachment_name,
				attachmentMimeType:
					normalized.attachmentMimeType !== undefined
						? normalized.attachmentMimeType
						: promotion.attachment_mime_type,
				startDate: normalized.startDate ?? promotion.start_date,
				endDate: normalized.endDate ?? promotion.end_date,
				status: normalized.status ?? promotion.status,
				productId:
					normalized.productId !== undefined
						? normalized.productId
						: promotion.product_id,
				productLineId:
					normalized.productLineId !== undefined
						? normalized.productLineId
						: promotion.product_line_id,
				clientId:
					normalized.clientId !== undefined
						? normalized.clientId
						: promotion.client_id,
				customerSegmentId:
					normalized.customerSegmentId !== undefined
						? normalized.customerSegmentId
						: promotion.customer_segment_id,
			};

			assertPromotionDateRange(nextValues.startDate, nextValues.endDate);
			assertPromotionTarget({
				clientId: nextValues.clientId,
				customerSegmentId: nextValues.customerSegmentId,
			});
			await ensurePromotionRelations(manager, nextValues);

			promotion.title = String(nextValues.title);
			promotion.description = String(nextValues.description);
			promotion.promotion_type = String(nextValues.promotionType);
			promotion.benefit = String(nextValues.benefit);
			promotion.promotion_discount_type_id = nextValues.discountTypeId;
			promotion.discount_percentage = nextValues.discountPercentage;
			promotion.minimum_order_amount = nextValues.minimumOrderAmount;
			promotion.gift_product_id = nextValues.giftProductId;
			promotion.gift_description = nextValues.giftDescription;
			promotion.image_url = nextValues.imageUrl;
			promotion.attachment_url = nextValues.attachmentUrl;
			promotion.attachment_name = nextValues.attachmentName;
			promotion.attachment_mime_type = nextValues.attachmentMimeType;
			promotion.start_date = nextValues.startDate;
			promotion.end_date = nextValues.endDate;
			promotion.status = nextValues.status;
			promotion.product_id = nextValues.productId;
			promotion.product_line_id = nextValues.productLineId;
			promotion.client_id = nextValues.clientId;
			promotion.customer_segment_id = nextValues.customerSegmentId;

			const saved = await repo.save(promotion);

			if (!wasActive && saved.status === "active") {
				await notifyPromotionPublished(
					manager,
					saved,
					normalized.deliveryChannels,
				);
			}

			return saved;
		});

		return getPromotionById(updated.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo actualizar la promoción",
			"PROMOTION_UPDATE_FAILED",
		);
	}
}

export async function deletePromotion(promotionId: string) {
	const ds = await getDataSource();
	const result = await ds.getRepository(Promotion).delete({ id: promotionId });

	if (!result.affected) {
		throw new CommunicationsServiceError(
			"Promoción no encontrada",
			404,
			"PROMOTION_NOT_FOUND",
		);
	}

	return { id: promotionId };
}

export async function listPromotionsForUser(input: {
	userId: string;
	role: string;
}) {
	const ds = await getDataSource();
	const today = new Date().toISOString().slice(0, 10);
	const query = ds
		.getRepository(Promotion)
		.createQueryBuilder("promotion")
		.leftJoinAndSelect("promotion.discountType", "discountType")
		.leftJoinAndSelect("promotion.product", "product")
		.leftJoinAndSelect("promotion.giftProduct", "giftProduct")
		.leftJoinAndSelect("promotion.productLine", "productLine")
		.leftJoinAndSelect("promotion.client", "client")
		.leftJoinAndSelect("promotion.customerSegment", "segment")
		.where("promotion.status = :status", { status: "active" })
		.andWhere("promotion.start_date <= :today", { today })
		.andWhere("promotion.end_date >= :today", { today })
		.orderBy(getCustomerSegmentTierOrderSql("segment"), "ASC")
		.addOrderBy("promotion.end_date", "ASC")
		.addOrderBy("promotion.title", "ASC");

	if (input.role === "client") {
		const applicableSegmentIds =
			await listApplicableCustomerSegmentIdsForClient(ds.manager, input.userId);
		const segmentPromotionPredicate = applicableSegmentIds.length
			? "OR promotion.customer_segment_id IN (:...applicableSegmentIds)"
			: "";
		const queryParameters = applicableSegmentIds.length
			? { userId: input.userId, applicableSegmentIds }
			: { userId: input.userId };

		query.andWhere(
			`(
				(promotion.client_id IS NULL AND promotion.customer_segment_id IS NULL)
				OR promotion.client_id = :userId
				${segmentPromotionPredicate}
			)`,
			queryParameters,
		);
	}

	return query.getMany();
}

