import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";

export type AdminTab = "promotions" | "trainings" | "segments" | "assignments";

export const tabs: Array<{ key: AdminTab; label: string }> = [
	{ key: "promotions", label: "Promociones" },
	{ key: "trainings", label: "Formaciones" },
	{ key: "segments", label: "Rangos" },
	{ key: "assignments", label: "Asignaciones" },
];

export const defaultDeliveryChannels: NotificationDeliveryChannel[] = ["in_app"];

export const activeTrainingEnrollmentStatuses = new Set([
	"registered",
	"attended",
]);

export const emptyPromotionForm = {
	title: "",
	description: "",
	promotionType: "",
	promotionDiscountTypeCode: "percentage_discount",
	benefit: "",
	discountPercentage: "",
	minimumOrderAmount: "",
	giftProductId: "",
	giftDescription: "",
	imageUrl: "",
	attachmentUrl: "",
	attachmentName: "",
	attachmentMimeType: "",
	startDate: "",
	endDate: "",
	status: "draft",
	productId: "",
	productLineId: "",
	clientId: "",
	customerSegmentId: "",
	deliveryChannels: [...defaultDeliveryChannels],
};

export const emptyTrainingForm = {
	title: "",
	description: "",
	startsAt: "",
	location: "",
	modality: "in_person",
	content: "",
	status: "draft",
	capacity: "",
	deliveryChannels: [...defaultDeliveryChannels],
};

export const emptySegmentForm = {
	code: "",
	name: "",
	description: "",
	criteria: "",
};

export const emptyAssignmentForm = {
	clientId: "",
	segmentId: "",
	notes: "",
};

export type PromotionFormState = typeof emptyPromotionForm;
export type TrainingFormState = typeof emptyTrainingForm;
export type SegmentFormState = typeof emptySegmentForm;
export type AssignmentFormState = typeof emptyAssignmentForm;
