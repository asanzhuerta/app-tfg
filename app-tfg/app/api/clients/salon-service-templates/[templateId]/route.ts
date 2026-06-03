import { NextResponse } from "next/server";
import type { RouteContext } from "@/lib/contracts/api";
import {
	jsonFromError,
	requireRoleUser,
	unauthorizedError,
} from "@/lib/api/server";
import { deleteSalonServiceTemplateForClientUser } from "@/lib/typeorm/services/salon/salon-service-template";

type TemplateRouteContext = RouteContext<{
	templateId: string;
}>;

export async function DELETE(_: Request, context: TemplateRouteContext) {
	const user = await requireRoleUser("client");

	if (!user) {
		return unauthorizedError();
	}

	try {
		const { templateId } = await context.params;
		const result = await deleteSalonServiceTemplateForClientUser(
			user.id,
			templateId,
		);

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error(
			"[clients/salon-service-templates/[templateId]][DELETE] error:",
			error,
		);
		return jsonFromError(error, "Error al eliminar la plantilla tecnica");
	}
}
