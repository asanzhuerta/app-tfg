import { NextResponse } from "next/server";
import type { RouteContext } from "@/lib/contracts/api";
import {
	jsonFromError,
	requireRoleUser,
	unauthorizedError,
} from "@/lib/api/server";
import { getSalonTechnicalEmailDraftForClientUser } from "@/lib/typeorm/services/salon/salon-client";

type ServiceTechnicalEmailRouteContext = RouteContext<{
	id: string;
	serviceId: string;
}>;

export async function GET(
	_: Request,
	context: ServiceTechnicalEmailRouteContext,
) {
	const user = await requireRoleUser("client");

	if (!user) {
		return unauthorizedError();
	}

	try {
		const { id, serviceId } = await context.params;
		const draft = await getSalonTechnicalEmailDraftForClientUser(
			user.id,
			id,
			serviceId,
		);

		return NextResponse.json(draft, { status: 200 });
	} catch (error) {
		console.error(
			"[clients/salon-clients/[id]/services/[serviceId]/technical-email][GET] error:",
			error,
		);
		return jsonFromError(error, "Error al preparar el correo técnico");
	}
}
