import { In, IsNull } from "typeorm";
import type { EntityManager } from "typeorm";
import { ROLE_IDS } from "@/lib/typeorm/constants/catalog-ids";
import { User } from "@/lib/typeorm/entities/User";
import { UserPushSubscription } from "@/lib/typeorm/entities/UserPushSubscription";
import {
	buildNotificationEmailHtml,
	sendNotificationEmail,
} from "@/lib/notifications/email";
import { sendPushNotification } from "@/lib/notifications/push";
import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";

type NotificationDeliveryInput = {
	recipients: User[];
	channels: NotificationDeliveryChannel[];
	title: string;
	body: string;
	notificationType: string;
	sourceType: string;
	sourceId: string;
};

function getNotificationPath(user: User) {
	if (user.role_id === ROLE_IDS.CLIENT) {
		return "/clients/notifications";
	}

	if (user.role_id === ROLE_IDS.COMMERCIAL) {
		return "/commercials/notifications";
	}

	return "/profile";
}

function getBaseUrl() {
	return (
		process.env.APP_BASE_URL?.trim() ||
		process.env.NEXTAUTH_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		null
	);
}

function toAbsoluteUrl(path: string) {
	const baseUrl = getBaseUrl();

	if (!baseUrl) {
		return path;
	}

	try {
		return new URL(path, baseUrl).toString();
	} catch {
		return path;
	}
}

async function deliverEmailNotifications(input: NotificationDeliveryInput) {
	await Promise.all(
		input.recipients.map((recipient) => {
			const path = getNotificationPath(recipient);
			const actionUrl = toAbsoluteUrl(path);

			return sendNotificationEmail({
				to: recipient.email,
				subject: input.title,
				text: `${input.body}\n\nAbrir aviso: ${actionUrl}`,
				html: buildNotificationEmailHtml({
					title: input.title,
					body: input.body,
					actionUrl,
				}),
			});
		}),
	);
}

async function deliverPushNotifications(
	manager: EntityManager,
	input: NotificationDeliveryInput,
) {
	const recipientIds = input.recipients.map((recipient) => recipient.id);

	if (!recipientIds.length) {
		return;
	}

	const subscriptions = await manager.getRepository(UserPushSubscription).find({
		where: {
			user_id: In(recipientIds),
			revoked_at: IsNull(),
		},
	});

	if (!subscriptions.length) {
		return;
	}

	const recipientById = new Map(
		input.recipients.map((recipient) => [recipient.id, recipient]),
	);
	const now = new Date();
	const subscriptionRepo = manager.getRepository(UserPushSubscription);

	await Promise.all(
		subscriptions.map(async (subscription) => {
			const recipient = recipientById.get(subscription.user_id);
			const url = recipient ? getNotificationPath(recipient) : "/profile";
			const result = await sendPushNotification(subscription, {
				title: input.title,
				body: input.body,
				url,
				tag: `${input.sourceType}:${input.sourceId}:${input.notificationType}`,
			});

			if (result.status === "sent") {
				await subscriptionRepo.update(subscription.id, {
					last_used_at: now,
				});
			}

			if (result.status === "expired") {
				await subscriptionRepo.update(subscription.id, {
					revoked_at: now,
				});
			}
		}),
	);
}

export async function deliverNotificationToExternalChannels(
	manager: EntityManager,
	input: NotificationDeliveryInput,
) {
	const channels = new Set(input.channels);

	if (channels.has("email")) {
		try {
			await deliverEmailNotifications(input);
		} catch (error) {
			console.error(
				"[communications/delivery] email delivery skipped:",
				error instanceof Error ? error.message : error,
			);
		}
	}

	if (channels.has("push")) {
		try {
			await deliverPushNotifications(manager, input);
		} catch (error) {
			console.error(
				"[communications/delivery] push delivery skipped:",
				error instanceof Error ? error.message : error,
			);
		}
	}
}
