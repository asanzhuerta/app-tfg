import type {
	AppReminderStatus,
	PromotionStatus,
	TrainingEnrollmentStatus,
	TrainingEventModality,
	TrainingEventStatus,
} from "@/lib/contracts/communications";

export type SegmentView = {
	id: string;
	code: string;
	name: string;
	description: string | null;
	criteria: string | null;
};

export type ClientOptionView = {
	id: string;
	name: string;
	contactName: string | null;
	email: string | null;
};

export type ProductOptionView = {
	id: string;
	name: string;
	reference?: string | null;
};

export type ProductLineOptionView = {
	id: string;
	name: string;
};

export type PromotionDiscountTypeView = {
	id: string;
	code: string;
	name: string;
	description: string | null;
	displayOrder: number;
};

export type ClientSegmentAssignmentView = {
	id: string;
	clientId: string;
	clientName: string;
	clientEmail: string | null;
	segmentId: string;
	segmentName: string;
	segmentCode: string;
	notes: string | null;
	createdAt: string;
};

export type PromotionView = {
	id: string;
	title: string;
	description: string;
	promotionType: string;
	promotionDiscountTypeId: string;
	promotionDiscountTypeCode: string;
	promotionDiscountTypeName: string;
	benefit: string;
	discountPercentage: string | null;
	minimumOrderAmount: string | null;
	giftProductId: string | null;
	giftProductName: string | null;
	giftDescription: string | null;
	imageUrl: string | null;
	attachmentUrl: string | null;
	attachmentName: string | null;
	attachmentMimeType: string | null;
	startDate: string;
	endDate: string;
	status: PromotionStatus;
	productId: string | null;
	productName: string | null;
	productLineId: string | null;
	productLineName: string | null;
	clientId: string | null;
	clientName: string | null;
	customerSegmentId: string | null;
	customerSegmentName: string | null;
};

export type TrainingEnrollmentView = {
	id: string;
	status: TrainingEnrollmentStatus;
	userId: string;
	userName: string;
	userEmail: string;
	enrolledAt: string;
};

export type TrainingEventView = {
	id: string;
	title: string;
	description: string;
	startsAt: string;
	location: string | null;
	modality: TrainingEventModality;
	content: string | null;
	status: TrainingEventStatus;
	capacity: number | null;
	activeEnrollmentsCount: number;
	enrollments: TrainingEnrollmentView[];
	currentUserEnrollment: TrainingEnrollmentView | null;
};

export type NotificationView = {
	id: string;
	title: string;
	body: string;
	notificationType: string;
	sourceType: string | null;
	sourceId: string | null;
	readAt: string | null;
	createdAt: string;
};

export type ReminderView = {
	id: string;
	title: string;
	body: string;
	scheduledAt: string;
	status: AppReminderStatus;
	createdAt: string;
};
