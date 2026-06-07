import { NextResponse } from "next/server";
import { getRateLimitDiagnostics } from "@/lib/admin/rate-limit-diagnostics";
import {
	jsonFromError,
	requireRoleUser,
	unauthorizedError,
} from "@/lib/api/server";

export async function GET() {
	const user = await requireRoleUser("admin");

	if (!user) {
		return unauthorizedError();
	}

	try {
		const diagnostics = await getRateLimitDiagnostics();
		return NextResponse.json(diagnostics, { status: 200 });
	} catch (error) {
		console.error("[admin/settings/rate-limits/status][GET] error:", error);
		return jsonFromError(
			error,
			"Error al obtener el diagnóstico de rate limiting",
		);
	}
}
