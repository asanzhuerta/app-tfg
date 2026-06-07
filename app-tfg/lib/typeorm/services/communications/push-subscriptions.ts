import { getDataSource } from "@/lib/typeorm/data-source";
import { IsNull } from "typeorm";
import { UserPushSubscription } from "@/lib/typeorm/entities/UserPushSubscription";
import { CommunicationsServiceError } from "./communications";

type PushSubscriptionKeysBody = {
	p256dh?: unknown;
	auth?: unknown;
};

export type PushSubscriptionBody = {
	endpoint?: unknown;
	expirationTime?: unknown;
	keys?: PushSubscriptionKeysBody | null;
};

function normalizeRequiredText(value: unknown, fieldName: string) {
	const normalized = String(value ?? "").trim();

	if (!normalized) {
		throw new CommunicationsServiceError(`${fieldName} es obligatorio`);
	}

	return normalized;
}

function normalizeExpirationTime(value: unknown) {
	if (value === null || value === undefined) {
		return null;
	}

	const timestamp = Number(value);

	if (!Number.isFinite(timestamp) || timestamp <= 0) {
		return null;
	}

	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? null : date;
}

export async function upsertPushSubscriptionForUser(input: {
	userId: string;
	body: PushSubscriptionBody;
	userAgent?: string | null;
}) {
	const endpoint = normalizeRequiredText(input.body.endpoint, "El endpoint");
	const p256dh = normalizeRequiredText(
		input.body.keys?.p256dh,
		"La clave p256dh",
	);
	const auth = normalizeRequiredText(input.body.keys?.auth, "La clave auth");
	const expirationTime = normalizeExpirationTime(input.body.expirationTime);
	const ds = await getDataSource();
	const repo = ds.getRepository(UserPushSubscription);
	let subscription = await repo.findOne({ where: { endpoint } });

	if (!subscription) {
		subscription = repo.create({ endpoint });
	}

	subscription.user_id = input.userId;
	subscription.p256dh = p256dh;
	subscription.auth = auth;
	subscription.expiration_time = expirationTime;
	subscription.user_agent = input.userAgent?.trim() || null;
	subscription.revoked_at = null;

	const saved = await repo.save(subscription);

	return {
		ok: true,
		subscriptionId: saved.id,
	};
}

export async function revokePushSubscriptionForUser(input: {
	userId: string;
	endpoint?: string | null;
}) {
	const ds = await getDataSource();
	const repo = ds.getRepository(UserPushSubscription);
	const endpoint = input.endpoint?.trim();
	const now = new Date();

	if (endpoint) {
		await repo.update(
			{ user_id: input.userId, endpoint },
			{ revoked_at: now },
		);
	} else {
		await repo.update(
			{ user_id: input.userId, revoked_at: IsNull() },
			{ revoked_at: now },
		);
	}

	return { ok: true };
}

export async function countActivePushSubscriptionsForUser(userId: string) {
	const ds = await getDataSource();

	return ds.getRepository(UserPushSubscription).count({
		where: {
			user_id: userId,
			revoked_at: IsNull(),
		},
	});
}
