import type {
	listAdminPromotions,
	listAdminTrainingEvents,
	listClientSegmentAssignments,
	listCustomerSegments,
	listNotificationsForUser,
	listPromotionDiscountTypes,
	listPromotionsForUser,
	listRemindersForUser,
	listTrainingEventsForUser,
} from "@/lib/typeorm/services/communications/communications";
import type { listClients } from "@/lib/typeorm/services/commercial/client";
import type { listProducts } from "@/lib/typeorm/services/catalog/product";
import type { listProductLines } from "@/lib/typeorm/services/catalog/product-line";
import type {
	ClientOptionView,
	ClientSegmentAssignmentView,
	NotificationView,
	ProductLineOptionView,
	ProductOptionView,
	PromotionView,
	PromotionDiscountTypeView,
	ReminderView,
	SegmentView,
	TrainingEventView,
} from "./communication-view-types";

const ACTIVE_ENROLLMENTS = new Set(["registered", "attended"]);

function toIsoString(value: Date | string | null | undefined) {
	if (!value) {
		return "";
	}

	return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeSegment(
	segment: Awaited<ReturnType<typeof listCustomerSegments>>[number],
): SegmentView {
	return {
		id: segment.id,
		code: segment.code,
		name: segment.name,
		description: segment.description,
		criteria: segment.criteria,
	};
}

export function serializeClientOption(
	client: Awaited<ReturnType<typeof listClients>>[number],
): ClientOptionView {
	return {
		id: client.id,
		name: client.name,
		contactName: client.contact_name ?? null,
		email: client.user?.email ?? null,
	};
}

export function serializeProductOption(
	product: Awaited<ReturnType<typeof listProducts>>[number],
): ProductOptionView {
	return {
		id: product.id,
		name: product.name,
		reference: product.reference,
	};
}

export function serializeProductLineOption(
	productLine: Awaited<ReturnType<typeof listProductLines>>[number],
): ProductLineOptionView {
	return {
		id: productLine.id,
		name: productLine.name,
	};
}

export function serializePromotionDiscountType(
	discountType: Awaited<ReturnType<typeof listPromotionDiscountTypes>>[number],
): PromotionDiscountTypeView {
	return {
		id: discountType.id,
		code: discountType.code,
		name: discountType.name,
		description: discountType.description,
		displayOrder: discountType.display_order,
	};
}

export function serializeClientSegmentAssignment(
	assignment: Awaited<ReturnType<typeof listClientSegmentAssignments>>[number],
): ClientSegmentAssignmentView {
	return {
		id: assignment.id,
		clientId: assignment.client_id,
		clientName: assignment.client?.name ?? "Cliente",
		clientEmail: assignment.client?.user?.email ?? null,
		segmentId: assignment.segment_id,
		segmentName: assignment.segment?.name ?? "Rango",
		segmentCode: assignment.segment?.code ?? "",
		notes: assignment.notes,
		createdAt: toIsoString(assignment.created_at),
	};
}

export function serializePromotion(
	promotion:
		| Awaited<ReturnType<typeof listAdminPromotions>>[number]
		| Awaited<ReturnType<typeof listPromotionsForUser>>[number],
): PromotionView {
	return {
		id: promotion.id,
		title: promotion.title,
		description: promotion.description,
		promotionType: promotion.promotion_type,
		promotionDiscountTypeId: promotion.promotion_discount_type_id,
		promotionDiscountTypeCode:
			promotion.discountType?.code ?? "percentage_discount",
		promotionDiscountTypeName:
			promotion.discountType?.name ?? promotion.promotion_type,
		benefit: promotion.benefit,
		discountPercentage: promotion.discount_percentage,
		minimumOrderAmount: promotion.minimum_order_amount,
		giftProductId: promotion.gift_product_id,
		giftProductName: promotion.giftProduct?.name ?? null,
		giftDescription: promotion.gift_description,
		imageUrl: promotion.image_url,
		attachmentUrl: promotion.attachment_url,
		attachmentName: promotion.attachment_name,
		attachmentMimeType: promotion.attachment_mime_type,
		startDate: promotion.start_date,
		endDate: promotion.end_date,
		status: promotion.status,
		productId: promotion.product_id,
		productName: promotion.product?.name ?? null,
		productLineId: promotion.product_line_id,
		productLineName: promotion.productLine?.name ?? null,
		clientId: promotion.client_id,
		clientName: promotion.client?.name ?? null,
		customerSegmentId: promotion.customer_segment_id,
		customerSegmentName: promotion.customerSegment?.name ?? null,
	};
}

export function serializeTrainingEvent(
	trainingEvent:
		| Awaited<ReturnType<typeof listAdminTrainingEvents>>[number]
		| Awaited<ReturnType<typeof listTrainingEventsForUser>>[number],
): TrainingEventView {
	const enrollments = trainingEvent.enrollments ?? [];
	const currentUserEnrollment = enrollments[0] ?? null;

	return {
		id: trainingEvent.id,
		title: trainingEvent.title,
		description: trainingEvent.description,
		startsAt: toIsoString(trainingEvent.starts_at),
		location: trainingEvent.location,
		modality: trainingEvent.modality,
		content: trainingEvent.content,
		status: trainingEvent.status,
		capacity: trainingEvent.capacity,
		activeEnrollmentsCount: enrollments.filter((enrollment) =>
			ACTIVE_ENROLLMENTS.has(enrollment.status),
		).length,
		currentUserEnrollment: currentUserEnrollment
			? {
					id: currentUserEnrollment.id,
					status: currentUserEnrollment.status,
			  }
			: null,
	};
}

export function serializeNotification(
	notification: Awaited<ReturnType<typeof listNotificationsForUser>>[number],
): NotificationView {
	return {
		id: notification.id,
		title: notification.title,
		body: notification.body,
		notificationType: notification.notification_type,
		sourceType: notification.source_type,
		sourceId: notification.source_id,
		readAt: notification.read_at ? toIsoString(notification.read_at) : null,
		createdAt: toIsoString(notification.created_at),
	};
}

export function serializeReminder(
	reminder: Awaited<ReturnType<typeof listRemindersForUser>>[number],
): ReminderView {
	return {
		id: reminder.id,
		title: reminder.title,
		body: reminder.body,
		scheduledAt: toIsoString(reminder.scheduled_at),
		status: reminder.status,
		createdAt: toIsoString(reminder.created_at),
	};
}
