import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
	updateClientLocation,
	UpdateClientError,
	getClientById,
} from "@/lib/typeorm/services/commercial/client";

type SessionLike = {
	user?: {
		id: string;
		role: string;
	};
} | null;

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

type UpdateClientLocationBody = {
	lat?: number | string;
	lng?: number | string;
};

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const session = (await auth()) as SessionLike;

		if (!session?.user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		const { id } = await context.params;

		// ------------------------------------------------------------------
		// Permisos
		// ------------------------------------------------------------------
		// Admin: puede actualizar cualquier cliente
		// Cliente: solo puede actualizar su propia ubicación
		// Comercial: de momento no permitido
		if (
			session.user.role !== "admin" &&
			!(session.user.role === "client" && session.user.id === id)
		) {
			return NextResponse.json(
				{ error: "No tienes permisos para actualizar esta ubicación" },
				{ status: 403 },
			);
		}

		const existingClient = await getClientById(id);

		if (!existingClient) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 },
			);
		}

		const body = (await request.json()) as UpdateClientLocationBody;

		if (body.lat === undefined || body.lng === undefined) {
			return NextResponse.json(
				{ error: "lat y lng son obligatorios" },
				{ status: 400 },
			);
		}

		const updatedClient = await updateClientLocation({
			clientId: id,
			lat: body.lat,
			lng: body.lng,
		});

		return NextResponse.json(updatedClient, { status: 200 });
	} catch (error) {
		console.error("[clients/[id]/location][PATCH] error:", error);

		if (error instanceof UpdateClientError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}

		return NextResponse.json(
			{ error: "Error al actualizar la ubicación del cliente" },
			{ status: 500 },
		);
	}
}
