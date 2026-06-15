import { In } from "typeorm";
import type { EntityManager } from "typeorm";
import { ROLE_IDS, USER_STATUS_IDS } from "@/lib/typeorm/constants/catalog-ids";
import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";
import { AppNotification } from "@/lib/typeorm/entities/AppNotification";
import { Promotion } from "@/lib/typeorm/entities/Promotion";
import { TrainingEvent } from "@/lib/typeorm/entities/TrainingEvent";
import { User } from "@/lib/typeorm/entities/User";
import { listClientIdsEligibleForCustomerSegmentPromotion } from "@/lib/typeorm/services/clients/client-tier";
import { normalizeNotificationDeliveryChannels } from "./communication-normalizers";
import { deliverNotificationToExternalChannels } from "./notification-delivery";

async function listActiveUserIdsByRole(
	manager: EntityManager,
	roleIds: number[],
) {
	const users = await manager.getRepository(User).find({
		where: {
			role_id: In(roleIds),
			status_id: USER_STATUS_IDS.ACTIVE,
		},
	});

	return users.map((user) => user.id);
}

async function listPromotionClientRecipientIds(
	manager: EntityManager,
	promotion: Promotion,
) {
	if (promotion.client_id) {
		return listActiveUserIdsByRole(manager, [ROLE_IDS.CLIENT]).then((clientIds) =>
			clientIds.includes(String(promotion.client_id))
				? [String(promotion.client_id)]
				: [],
		);
	}

	if (promotion.customer_segment_id) {
		return listClientIdsEligibleForCustomerSegmentPromotion(
			manager,
			promotion.customer_segment_id,
		);
	}

	return listActiveUserIdsByRole(manager, [ROLE_IDS.CLIENT]);
}

async function createRecipientNotifications(
	manager: EntityManager,
	input: {
		title: string;
		body: string;
		notificationType: string;
		sourceType: string;
		sourceId: string;
		recipientUserIds?: string[];
		deliveryChannels?: NotificationDeliveryChannel[];
	},
) {
	const deliveryChannels = normalizeNotificationDeliveryChannels(
		input.deliveryChannels,
	);
	const targetUserIds = input.recipientUserIds
		? [...new Set(input.recipientUserIds.filter(Boolean))]
		: null;
	const recipients = await manager.getRepository(User).find({
		where: {
			...(targetUserIds ? { id: In(targetUserIds) } : {}),
			role_id: In([ROLE_IDS.CLIENT, ROLE_IDS.COMMERCIAL]),
			status_id: USER_STATUS_IDS.ACTIVE,
		},
	});

	if (!recipients.length) {
		return;
	}

	await manager.getRepository(AppNotification).insert(
		recipients.map((recipient) => ({
			recipient_user_id: recipient.id,
			title: input.title,
			body: input.body,
			notification_type: input.notificationType,
			channel: "in_app",
			source_type: input.sourceType,
			source_id: input.sourceId,
		})),
	);

	await deliverNotificationToExternalChannels(manager, {
		recipients,
		channels: deliveryChannels,
		title: input.title,
		body: input.body,
		notificationType: input.notificationType,
		sourceType: input.sourceType,
		sourceId: input.sourceId,
	});
}

export async function notifyPromotionPublished(
	manager: EntityManager,
	promotion: Promotion,
	deliveryChannels?: NotificationDeliveryChannel[],
) {
	const clientRecipientIds = await listPromotionClientRecipientIds(
		manager,
		promotion,
	);
	const commercialRecipientIds = await listActiveUserIdsByRole(manager, [
		ROLE_IDS.COMMERCIAL,
	]);

	await createRecipientNotifications(manager, {
		title: `Nueva promoción: ${promotion.title}`,
		body: `${promotion.description} Beneficio: ${promotion.benefit}`,
		notificationType: "promotion",
		sourceType: "promotion",
		sourceId: promotion.id,
		recipientUserIds: [...clientRecipientIds, ...commercialRecipientIds],
		deliveryChannels,
	});
}

export async function notifyTrainingPublished(
	manager: EntityManager,
	trainingEvent: TrainingEvent,
	deliveryChannels?: NotificationDeliveryChannel[],
) {
	await createRecipientNotifications(manager, {
		title: `Nueva formación: ${trainingEvent.title}`,
		body: trainingEvent.description,
		notificationType: "training",
		sourceType: "training_event",
		sourceId: trainingEvent.id,
		deliveryChannels,
	});
}
