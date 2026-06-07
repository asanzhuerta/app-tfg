import { EntityManager } from "typeorm";
import { Client } from "@/lib/typeorm/entities/Client";
import { ensureDefaultSilverClientTier } from "@/lib/typeorm/services/clients/client-tier";

// --------------------------------------------------------------------------
// Servicio interno: creación automática de cliente desde usuario
// --------------------------------------------------------------------------

type CreateClientFromUserInput = {
	userId: string;
	name: string;
	company?: string | null;
};

// Este servicio NO valida roles ni permisos.
// Se usa internamente dentro de otros servicios (ej: registerUserByAdmin).
export async function createClientFromUser(
	manager: EntityManager,
	input: CreateClientFromUserInput,
) {
	const repo = manager.getRepository(Client);

	const existing = await repo.findOne({
		where: { id: input.userId },
	});

	if (existing) {
		await ensureDefaultSilverClientTier(manager, existing.id);
		return existing;
	}

	const client = repo.create({
		id: input.userId,
		name: input.company || input.name,
		contact_name: input.name,
		address: "Pendiente",
		city: "Pendiente",
		notes: "Cliente creado automáticamente",
	});

	const savedClient = await repo.save(client);

	await ensureDefaultSilverClientTier(manager, savedClient.id);

	return savedClient;
}
