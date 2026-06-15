import { getClientErrorMessage } from "@/lib/api/client";
import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";
import {
	formatDisplayDate,
	formatDisplayDateTime,
	toDateTimeLocalInputValue,
} from "@/lib/utils/date-format";
export { getPromotionAttachmentHref } from "./promotion-attachments";

type DeliveryFormState = {
	deliveryChannels: NotificationDeliveryChannel[];
};

export const getErrorMessage = getClientErrorMessage;

export function formatDate(value: string) {
	return formatDisplayDate(value, value);
}

export function formatDateTime(value: string) {
	return formatDisplayDateTime(value, value);
}

export function toDateTimeLocal(value: string) {
	return toDateTimeLocalInputValue(value);
}

export function hasDeliveryChannel(
	form: DeliveryFormState,
	channel: NotificationDeliveryChannel,
) {
	return form.deliveryChannels.includes(channel);
}

export function updateDeliveryChannels(
	currentChannels: NotificationDeliveryChannel[],
	channel: NotificationDeliveryChannel,
	checked: boolean,
) {
	if (channel === "in_app") {
		return ["in_app"] as NotificationDeliveryChannel[];
	}

	const nextChannels = new Set<NotificationDeliveryChannel>([
		"in_app",
		...currentChannels,
	]);

	if (checked) {
		nextChannels.add(channel);
	} else {
		nextChannels.delete(channel);
	}

	return [...nextChannels];
}
