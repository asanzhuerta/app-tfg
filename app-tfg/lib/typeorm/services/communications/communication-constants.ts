export const PROMOTION_STATUSES = ["draft", "active", "archived"] as const;
export const PROMOTION_DISCOUNT_TYPE_CODES = [
	"percentage_discount",
	"volume_percentage_discount",
	"gift_product",
] as const;
export const DEFAULT_PROMOTION_DISCOUNT_TYPE_CODE = "percentage_discount";
export const TRAINING_EVENT_STATUSES = [
	"draft",
	"published",
	"cancelled",
	"completed",
] as const;
export const TRAINING_MODALITIES = ["in_person", "online", "hybrid"] as const;
export const REMINDER_STATUSES = ["pending", "done", "cancelled"] as const;
export const ACTIVE_ENROLLMENT_STATUSES = ["registered", "attended"] as const;
export const NOTIFICATION_DELIVERY_CHANNELS = ["in_app", "email", "push"] as const;
export const ACTIVE_ENROLLMENT_STATUS_SET = new Set<string>([
	...ACTIVE_ENROLLMENT_STATUSES,
]);
