import { NextResponse } from "next/server";
import {
	jsonFromError,
	readJsonBody,
	requireRoleUser,
	unauthorizedError,
} from "@/lib/api/server";
import type { UpdateRateLimitPolicySettingsBody } from "@/lib/contracts/rate-limit-settings";
import {
	listRateLimitPolicySettings,
	updateRateLimitPolicySettings,
} from "@/lib/typeorm/services/security/rate-limit-policy";

export async function GET() {
	const user = await requireRoleUser("admin");

	if (!user) {
		return unauthorizedError();
	}

	try {
		const policies = await listRateLimitPolicySettings();
		return NextResponse.json(policies, { status: 200 });
	} catch (error) {
		console.error("[admin/settings/rate-limits][GET] error:", error);
		return jsonFromError(
			error,
			"Error al obtener la configuracion de rate limiting",
		);
	}
}

export async function PUT(request: Request) {
	const user = await requireRoleUser("admin");

	if (!user) {
		return unauthorizedError();
	}

	try {
		const body = await readJsonBody<UpdateRateLimitPolicySettingsBody>(request);
		const policies = await updateRateLimitPolicySettings({
			policies: Array.isArray(body.policies) ? body.policies : [],
		});

		return NextResponse.json(policies, { status: 200 });
	} catch (error) {
		console.error("[admin/settings/rate-limits][PUT] error:", error);
		return jsonFromError(
			error,
			"Error al guardar la configuracion de rate limiting",
		);
	}
}
