import { NextResponse } from "next/server";
import {
	forbiddenError,
	getSessionUser,
	jsonFromError,
	readJsonBody,
	unauthorizedError,
} from "@/lib/api/server";
import type { PushSubscriptionBody } from "@/lib/typeorm/services/communications/push-subscriptions";
import {
	countActivePushSubscriptionsForUser,
	revokePushSubscriptionForUser,
	upsertPushSubscriptionForUser,
} from "@/lib/typeorm/services/communications/push-subscriptions";

export const runtime = "nodejs";

function canManagePushSubscriptions(role: string) {
	return ["client", "commercial"].includes(role);
}

export async function POST(request: Request) {
	const user = await getSessionUser();

	if (!user) {
		return unauthorizedError();
	}

	if (!canManagePushSubscriptions(user.role)) {
		return forbiddenError("No autorizado", "PUSH_SUBSCRIPTION_ROLE_FORBIDDEN");
	}

	try {
		const body = await readJsonBody<PushSubscriptionBody>(request);
		const result = await upsertPushSubscriptionForUser({
			userId: user.id,
			body,
			userAgent: request.headers.get("user-agent"),
		});
		const activeSubscriptions = await countActivePushSubscriptionsForUser(
			user.id,
		);

		return NextResponse.json(
			{ ...result, activeSubscriptions },
			{ status: 201 },
		);
	} catch (error) {
		console.error("[communications/push-subscriptions][POST] error:", error);
		return jsonFromError(error, "Error al guardar la suscripcion push");
	}
}

export async function DELETE(request: Request) {
	const user = await getSessionUser();

	if (!user) {
		return unauthorizedError();
	}

	if (!canManagePushSubscriptions(user.role)) {
		return forbiddenError("No autorizado", "PUSH_SUBSCRIPTION_ROLE_FORBIDDEN");
	}

	try {
		const body = await readJsonBody<{ endpoint?: string | null }>(request).catch(
			() => ({ endpoint: null }),
		);
		await revokePushSubscriptionForUser({
			userId: user.id,
			endpoint: body.endpoint,
		});
		const activeSubscriptions = await countActivePushSubscriptionsForUser(
			user.id,
		);

		return NextResponse.json({ ok: true, activeSubscriptions }, { status: 200 });
	} catch (error) {
		console.error("[communications/push-subscriptions][DELETE] error:", error);
		return jsonFromError(error, "Error al revocar la suscripcion push");
	}
}
