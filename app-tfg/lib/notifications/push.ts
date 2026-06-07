import webpush from "web-push";
import type { PushSubscription } from "web-push";
import type { UserPushSubscription } from "@/lib/typeorm/entities/UserPushSubscription";

export type PushNotificationPayload = {
	title: string;
	body: string;
	url?: string;
	tag?: string;
};

type PushDeliveryResult =
	| { status: "sent" }
	| { status: "skipped"; reason: "not_configured" }
	| { status: "expired" }
	| { status: "failed"; reason: string };

let configured = false;

export function getVapidPublicKey() {
	return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function getVapidConfig() {
	const publicKey = getVapidPublicKey();
	const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
	const subject =
		process.env.VAPID_SUBJECT?.trim() ||
		process.env.SMTP_FROM?.trim() ||
		process.env.MAIL_FROM?.trim();

	if (!publicKey || !privateKey || !subject) {
		return null;
	}

	return { publicKey, privateKey, subject };
}

export function isPushDeliveryConfigured() {
	return Boolean(getVapidConfig());
}

function ensureWebPushConfigured() {
	const config = getVapidConfig();

	if (!config) {
		return false;
	}

	if (!configured) {
		webpush.setVapidDetails(
			config.subject,
			config.publicKey,
			config.privateKey,
		);
		configured = true;
	}

	return true;
}

function toWebPushSubscription(
	subscription: Pick<UserPushSubscription, "endpoint" | "p256dh" | "auth">,
): PushSubscription {
	return {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: subscription.p256dh,
			auth: subscription.auth,
		},
	};
}

export async function sendPushNotification(
	subscription: Pick<UserPushSubscription, "endpoint" | "p256dh" | "auth">,
	payload: PushNotificationPayload,
): Promise<PushDeliveryResult> {
	if (!ensureWebPushConfigured()) {
		return { status: "skipped", reason: "not_configured" };
	}

	try {
		await webpush.sendNotification(
			toWebPushSubscription(subscription),
			JSON.stringify(payload),
		);

		return { status: "sent" };
	} catch (error) {
		const maybeStatusCode =
			typeof error === "object" && error !== null && "statusCode" in error
				? Number((error as { statusCode?: unknown }).statusCode)
				: null;

		if (maybeStatusCode === 404 || maybeStatusCode === 410) {
			return { status: "expired" };
		}

		const reason = error instanceof Error ? error.message : "unknown_error";
		console.error("[notifications/push] delivery failed:", reason);
		return { status: "failed", reason };
	}
}
