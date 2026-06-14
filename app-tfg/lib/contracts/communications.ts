export type PromotionStatus = "draft" | "active" | "archived";
export type TrainingEventStatus =
	| "draft"
	| "published"
	| "cancelled"
	| "completed";
export type TrainingEventModality = "in_person" | "online" | "hybrid";
export type TrainingEnrollmentStatus = "registered" | "cancelled" | "attended";
export type AppReminderStatus = "pending" | "done" | "cancelled";
export type NotificationDeliveryChannel = "in_app" | "email" | "push";
export type PromotionDiscountTypeCode =
	| "percentage_discount"
	| "volume_percentage_discount"
	| "gift_product";

export type AdminUpsertCustomerSegmentBody = {
	code?: string;
	name?: string;
	description?: string | null;
	criteria?: string | null;
};

export type AdminAssignClientSegmentBody = {
	clientId?: string;
	segmentId?: string;
	notes?: string | null;
};

export type AdminUpsertPromotionBody = {
	title?: string;
	description?: string;
	promotionType?: string;
	promotionDiscountTypeId?: string | null;
	promotionDiscountTypeCode?: PromotionDiscountTypeCode | string | null;
	benefit?: string;
	discountPercentage?: number | string | null;
	minimumOrderAmount?: number | string | null;
	giftProductId?: string | null;
	giftDescription?: string | null;
	imageUrl?: string | null;
	attachmentUrl?: string | null;
	attachmentName?: string | null;
	attachmentMimeType?: string | null;
	startDate?: string;
	endDate?: string;
	status?: PromotionStatus;
	productId?: string | null;
	productLineId?: string | null;
	clientId?: string | null;
	customerSegmentId?: string | null;
	deliveryChannels?: NotificationDeliveryChannel[];
};

export type AdminUpsertTrainingEventBody = {
	title?: string;
	description?: string;
	startsAt?: string;
	location?: string | null;
	modality?: TrainingEventModality;
	content?: string | null;
	status?: TrainingEventStatus;
	capacity?: number | string | null;
	deliveryChannels?: NotificationDeliveryChannel[];
};

export type TrainingEnrollmentBody = {
	notes?: string | null;
};

export type UpsertAppReminderBody = {
	title?: string;
	body?: string;
	scheduledAt?: string;
	status?: AppReminderStatus;
};

export function buildAdminUpsertCustomerSegmentInput(
	body: AdminUpsertCustomerSegmentBody,
) {
	return {
		code: body.code,
		name: body.name,
		description: body.description,
		criteria: body.criteria,
	};
}

export function buildAdminAssignClientSegmentInput(
	body: AdminAssignClientSegmentBody,
) {
	return {
		clientId: body.clientId,
		segmentId: body.segmentId,
		notes: body.notes,
	};
}

export function buildAdminUpsertPromotionInput(
	body: AdminUpsertPromotionBody,
) {
	return {
		title: body.title,
		description: body.description,
		promotionType: body.promotionType,
		promotionDiscountTypeId: body.promotionDiscountTypeId,
		promotionDiscountTypeCode: body.promotionDiscountTypeCode,
		benefit: body.benefit,
		discountPercentage: body.discountPercentage,
		minimumOrderAmount: body.minimumOrderAmount,
		giftProductId: body.giftProductId,
		giftDescription: body.giftDescription,
		imageUrl: body.imageUrl,
		attachmentUrl: body.attachmentUrl,
		attachmentName: body.attachmentName,
		attachmentMimeType: body.attachmentMimeType,
		startDate: body.startDate,
		endDate: body.endDate,
		status: body.status,
		productId: body.productId,
		productLineId: body.productLineId,
		clientId: body.clientId,
		customerSegmentId: body.customerSegmentId,
		deliveryChannels: body.deliveryChannels,
	};
}

export function buildAdminUpsertTrainingEventInput(
	body: AdminUpsertTrainingEventBody,
) {
	return {
		title: body.title,
		description: body.description,
		startsAt: body.startsAt,
		location: body.location,
		modality: body.modality,
		content: body.content,
		status: body.status,
		capacity: body.capacity,
		deliveryChannels: body.deliveryChannels,
	};
}

export function buildTrainingEnrollmentInput(body: TrainingEnrollmentBody) {
	return {
		notes: body.notes,
	};
}

export function buildUpsertAppReminderInput(body: UpsertAppReminderBody) {
	return {
		title: body.title,
		body: body.body,
		scheduledAt: body.scheduledAt,
		status: body.status,
	};
}
