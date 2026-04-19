import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { User } from "@/lib/typeorm/entities/User";
import { ROLE_IDS } from "@/lib/typeorm/constants/catalog-ids";

// --------------------------------------------------------------------------
// Funciones auxiliares para normalización de datos
// --------------------------------------------------------------------------
function normalizeText(value: string | null | undefined) {
	return String(value ?? "").trim();
}

function normalizeCoordinate(
	value: number | string | null,
	min: number,
	max: number,
	fieldName: string,
): string | null {
	if (value === null || String(value).trim() === "") {
		return null;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
		throw new UpdateClientError(`${fieldName} no es válida`);
	}

	return parsed.toFixed(6);
}
// --------------------------------------------------------------------------
// Tipos de datos para los inputs de los servicios
// --------------------------------------------------------------------------
type CreateClientInput = {
	name: string;
	contactName?: string | null;
	taxId?: string | null;
	address: string;
	city: string;
	postalCode?: string | null;
	province?: string | null;
	userId: string;
	notes?: string | null;
};

type UpdateClientInput = {
	clientId: string;
	name: string;
	contactName?: string | null;
	taxId?: string | null;
	address: string;
	city: string;
	postalCode?: string | null;
	province?: string | null;
	lat?: number | string | null;
	lng?: number | string | null;
	notes?: string | null;
};

// --------------------------------------------------------------------------
// SERVICIOS
// --------------------------------------------------------------------------
export class CreateClientError extends Error {
	status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = "CreateClientError";
		this.status = status;
	}
}

export class UpdateClientError extends Error {
	status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = "UpdateClientError";
		this.status = status;
	}
}
// Crear cliente profesional
export async function createClient(input: CreateClientInput) {
	const ds = await getDataSource();

	return ds.transaction(async (manager) => {
		const clientRepo = manager.getRepository(Client);
		const userRepo = manager.getRepository(User);

		const linkedUser = await userRepo.findOne({
			where: { id: input.userId },
		});

		if (!linkedUser || linkedUser.role_id !== ROLE_IDS.CLIENT) {
			throw new CreateClientError("Usuario cliente inválido");
		}

		const existing = await clientRepo.findOne({
			where: { id: input.userId },
		});

		if (existing) {
			throw new CreateClientError("Ya existe cliente para este usuario");
		}

		const client = clientRepo.create({
			id: input.userId,
			name: normalizeText(input.name),
			contact_name: normalizeText(input.contactName) || null,
			tax_id: normalizeText(input.taxId) || null,
			address: normalizeText(input.address),
			city: normalizeText(input.city),
			postal_code: normalizeText(input.postalCode) || null,
			province: normalizeText(input.province) || null,
			notes: normalizeText(input.notes) || null,
		});

		return clientRepo.save(client);
	});
}

// Obtener cliente por ID
export async function getClientById(id: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Client);

	return repo
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.leftJoinAndSelect(
			"client.commercialAssignments",
			"activeAssignment",
			"activeAssignment.unassigned_at IS NULL",
		)
		.leftJoinAndSelect("activeAssignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.where("client.id = :id", { id })
		.orderBy("activeAssignment.assigned_at", "DESC")
		.getOne();
}

// Obtener cliente por ID sin relaciones (para uso interno en otros servicios)
export async function listClients() {
	const ds = await getDataSource();
	const repo = ds.getRepository(Client);

	return repo
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.leftJoinAndSelect(
			"client.commercialAssignments",
			"activeAssignment",
			"activeAssignment.unassigned_at IS NULL",
		)
		.leftJoinAndSelect("activeAssignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.orderBy("client.created_at", "DESC")
		.getMany();
}

// Actualizar datos de cliente
export async function updateClient(input: UpdateClientInput) {
	const ds = await getDataSource();

	return ds.transaction(async (manager) => {
		const repo = manager.getRepository(Client);

		const client = await repo.findOne({
			where: { id: input.clientId },
		});

		if (!client) {
			throw new UpdateClientError("Cliente no encontrado");
		}

		client.name = normalizeText(input.name);
		client.contact_name = normalizeText(input.contactName) || null;
		client.tax_id = normalizeText(input.taxId) || null;
		client.address = normalizeText(input.address);
		client.city = normalizeText(input.city);
		client.postal_code = normalizeText(input.postalCode) || null;
		client.province = normalizeText(input.province) || null;

		if (input.lat !== undefined) {
			client.lat = normalizeCoordinate(input.lat, -90, 90, "La latitud");
		}

		if (input.lng !== undefined) {
			client.lng = normalizeCoordinate(input.lng, -180, 180, "La longitud");
		}

		client.notes = normalizeText(input.notes) || null;
		client.updated_at = new Date();

		await repo.save(client);

		return client;
	});
}

// Obtener cliente por usuario vinculado
export async function getClientByUserId(userId: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Client);

	return repo
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.leftJoinAndSelect(
			"client.commercialAssignments",
			"activeAssignment",
			"activeAssignment.unassigned_at IS NULL",
		)
		.leftJoinAndSelect("activeAssignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.where("client.id = :userId", { userId })
		.getOne();
}

// Listar clientes asignados a un comercial
export async function listClientsByCommercialId(commercialId: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Client);

	return repo
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.innerJoinAndSelect(
			"client.commercialAssignments",
			"activeAssignment",
			"activeAssignment.unassigned_at IS NULL AND activeAssignment.commercial_id = :commercialId",
			{ commercialId },
		)
		.leftJoinAndSelect("activeAssignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.orderBy("client.created_at", "DESC")
		.getMany();
}

// Obtener cliente por ID para comercial (solo si tiene asignación activa con ese comercial)
export async function getClientByIdForCommercial(
	clientId: string,
	commercialId: string,
) {
	const ds = await getDataSource();
	const repo = ds.getRepository(Client);

	return repo
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.innerJoinAndSelect(
			"client.commercialAssignments",
			"activeAssignment",
			"activeAssignment.unassigned_at IS NULL AND activeAssignment.commercial_id = :commercialId",
			{ commercialId },
		)
		.leftJoinAndSelect("activeAssignment.commercial", "commercial")
		.leftJoinAndSelect("commercial.user", "commercialUser")
		.where("client.id = :clientId", { clientId })
		.getOne();
}
