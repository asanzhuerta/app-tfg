import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { ClientCustomerSegment } from "@/lib/typeorm/entities/ClientCustomerSegment";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { User } from "@/lib/typeorm/entities/User";
import type { DataSource, EntityManager } from "typeorm";

export type ClientTierCode = "platinum" | "gold" | "silver" | "none";

export type ClientTierOverview = {
	code: ClientTierCode;
	name: string;
	description: string;
	benefitSummary: string;
	nextStep: string;
	assignedSegments: Array<{
		code: string;
		name: string;
		description: string | null;
		criteria: string | null;
	}>;
};

const TIER_PRIORITY = ["platinum", "gold", "silver"] as const;
const DEFAULT_TIER_CODE = "silver";
const DEFAULT_TIER_ASSIGNMENT_NOTE = "Asignación automatica de rango base Plata";

const TIER_DETAILS: Record<
	ClientTierCode,
	Pick<ClientTierOverview, "name" | "description" | "benefitSummary" | "nextStep">
> = {
	platinum: {
		name: "Platino",
		description: "Eres cliente Platino",
		benefitSummary:
			"Puedes acceder a las promociones de mayor prioridad cuando administración las active para tu rango.",
		nextStep:
			"Mantén tu actividad comercial para conservar el acceso a las ventajas premium del distribuidor.",
	},
	gold: {
		name: "Oro",
		description: "Eres cliente Oro",
		benefitSummary:
			"Puedes aprovechar promociones segmentadas y condiciones preferentes asignadas a clientes de uso frecuente.",
		nextStep:
			"Continúa concentrando pedidos y actividad en la plataforma para optar al nivel Platino.",
	},
	silver: {
		name: "Plata",
		description: "Eres cliente Plata",
		benefitSummary:
			"Tienes acceso a las promociones activas vinculadas a clientes con seguimiento comercial ordinario.",
		nextStep:
			"Incrementa tu actividad y pedidos para optar a ventajas superiores de cliente Oro.",
	},
	none: {
		name: "Sin rango",
		description: "Aún no tienes rango comercial asignado",
		benefitSummary:
			"Administración puede asignarte un rango Plata, Oro o Platino para activar ventajas segmentadas.",
		nextStep:
			"Cuando se implemente el sistema de puntos, tu rango podr? calcularse desde actividad y ventas.",
	},
};

function normalizeSegmentCode(value: string | null | undefined) {
	return String(value ?? "").trim().toLowerCase();
}

async function ensureSilverSegment(manager: EntityManager) {
	const repo = manager.getRepository(CustomerSegment);
	const existing = await repo.findOne({
		where: { code: DEFAULT_TIER_CODE },
	});

	if (existing) {
		return existing;
	}

	return repo.save(
		repo.create({
			code: DEFAULT_TIER_CODE,
			name: "Plata",
			description: "Clientes activos con seguimiento comercial ordinario.",
			criteria: "Rango comercial base asignado por defecto.",
		}),
	);
}

export async function ensureDefaultSilverClientTier(
	manager: EntityManager,
	clientId: string,
) {
	const clientExists = await manager.getRepository(Client).exists({
		where: { id: clientId },
	});

	if (!clientExists) {
		return null;
	}

	const hasTier = await manager
		.getRepository(ClientCustomerSegment)
		.createQueryBuilder("assignment")
		.innerJoin("assignment.segment", "segment")
		.where("assignment.client_id = :clientId", { clientId })
		.andWhere("segment.code IN (:...tierCodes)", {
			tierCodes: TIER_PRIORITY,
		})
		.getExists();

	if (hasTier) {
		return null;
	}

	const silverSegment = await ensureSilverSegment(manager);
	const assignmentRepo = manager.getRepository(ClientCustomerSegment);

	return assignmentRepo.save(
		assignmentRepo.create({
			client_id: clientId,
			segment_id: silverSegment.id,
			notes: DEFAULT_TIER_ASSIGNMENT_NOTE,
		}),
	);
}

async function resolveClientId(dataSource: DataSource, clientOrUserId: string) {
	const user = await dataSource.getRepository(User).findOne({
		where: { id: clientOrUserId },
		relations: {
			linkedClient: true,
		},
	});

	return user?.linkedClient?.id ?? clientOrUserId;
}

export async function getClientTierOverview(
	clientOrUserId: string,
): Promise<ClientTierOverview> {
	const dataSource = await getDataSource();
	const clientId = await resolveClientId(dataSource, clientOrUserId);
	const assignments = await dataSource
		.getRepository(ClientCustomerSegment)
		.createQueryBuilder("assignment")
		.leftJoinAndSelect("assignment.segment", "segment")
		.where("assignment.client_id = :clientId", { clientId })
		.orderBy("assignment.created_at", "DESC")
		.getMany();
	const assignedSegments = assignments
		.map((assignment) => assignment.segment)
		.filter(Boolean)
		.map((segment) => ({
			code: segment.code,
			name: segment.name,
			description: segment.description,
			criteria: segment.criteria,
		}));
	const assignedCodes = new Set(
		assignedSegments.map((segment) => normalizeSegmentCode(segment.code)),
	);
	const tierCode =
		TIER_PRIORITY.find((candidate) => assignedCodes.has(candidate)) ?? "silver";

	return {
		code: tierCode,
		...TIER_DETAILS[tierCode],
		assignedSegments,
	};
}
