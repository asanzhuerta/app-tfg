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

const CLIENT_TIER_ALIASES: Record<
	Exclude<ClientTierCode, "none">,
	readonly string[]
> = {
	silver: ["silver", "plata"],
	gold: ["gold", "oro"],
	platinum: ["platinum", "platino"],
};
const TIER_PRIORITY = ["platinum", "gold", "silver"] as const;
const TIER_LIST_ORDER = ["silver", "gold", "platinum"] as const;
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

export function normalizeClientTierCode(value: string | null | undefined) {
	const normalizedCode = normalizeSegmentCode(value);

	return (
		TIER_LIST_ORDER.find((tierCode) =>
			CLIENT_TIER_ALIASES[tierCode].includes(normalizedCode),
		) ?? null
	);
}

function getClientTierCodeAliases(
	tierCodes: readonly Exclude<ClientTierCode, "none">[],
) {
	return [
		...new Set(
			tierCodes.flatMap((tierCode) => CLIENT_TIER_ALIASES[tierCode]),
		),
	];
}

function getHighestClientTierCode(codes: Iterable<string | null | undefined>) {
	const normalizedCodes = new Set(
		[...codes]
			.map((code) => normalizeClientTierCode(code))
			.filter((code): code is Exclude<ClientTierCode, "none"> =>
				Boolean(code),
			),
	);

	return (
		TIER_PRIORITY.find((tierCode) => normalizedCodes.has(tierCode)) ??
		DEFAULT_TIER_CODE
	);
}

function getIncludedClientTierCodes(
	tierCode: string | null | undefined,
) {
	const normalizedTierCode =
		normalizeClientTierCode(tierCode) ?? DEFAULT_TIER_CODE;
	const tierIndex = TIER_LIST_ORDER.indexOf(normalizedTierCode);

	return TIER_LIST_ORDER.slice(0, tierIndex + 1);
}

function getRecipientTierCodesForPromotionTier(
	tierCode: string | null | undefined,
) {
	const normalizedTierCode = normalizeClientTierCode(tierCode);

	if (!normalizedTierCode) {
		return [];
	}

	const tierIndex = TIER_LIST_ORDER.indexOf(normalizedTierCode);

	return TIER_LIST_ORDER.slice(tierIndex);
}

function sqlStringLiteral(value: string) {
	return `'${value.replace(/'/g, "''")}'`;
}

function buildSqlInList(values: readonly string[]) {
	return values.map(sqlStringLiteral).join(", ");
}

export function getCustomerSegmentTierOrderSql(alias = "segment") {
	const codeExpression = `LOWER(${alias}.code)`;

	return [
		"CASE",
		`WHEN ${codeExpression} IN (${buildSqlInList(CLIENT_TIER_ALIASES.silver)}) THEN 1`,
		`WHEN ${codeExpression} IN (${buildSqlInList(CLIENT_TIER_ALIASES.gold)}) THEN 2`,
		`WHEN ${codeExpression} IN (${buildSqlInList(CLIENT_TIER_ALIASES.platinum)}) THEN 3`,
		"ELSE 4",
		"END",
	].join(" ");
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
		.andWhere("LOWER(segment.code) IN (:...tierCodes)", {
			tierCodes: getClientTierCodeAliases(TIER_PRIORITY),
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

export async function listApplicableCustomerSegmentIdsForClient(
	manager: EntityManager,
	clientId: string,
) {
	const assignments = await manager
		.getRepository(ClientCustomerSegment)
		.createQueryBuilder("assignment")
		.leftJoinAndSelect("assignment.segment", "segment")
		.where("assignment.client_id = :clientId", { clientId })
		.getMany();
	const assignedSegmentIds = assignments
		.map((assignment) => assignment.segment_id)
		.filter(Boolean);
	const assignedTierCode = getHighestClientTierCode(
		assignments.map((assignment) => assignment.segment?.code),
	);
	const includedTierAliases = getClientTierCodeAliases(
		getIncludedClientTierCodes(assignedTierCode),
	);
	const tierSegments = await manager
		.getRepository(CustomerSegment)
		.createQueryBuilder("segment")
		.select("segment.id", "id")
		.where("LOWER(segment.code) IN (:...tierCodes)", {
			tierCodes: includedTierAliases,
		})
		.getRawMany<{ id: string }>();

	return [
		...new Set([
			...assignedSegmentIds,
			...tierSegments.map((segment) => segment.id),
		]),
	];
}

export async function listClientIdsEligibleForCustomerSegmentPromotion(
	manager: EntityManager,
	segmentId: string,
) {
	const targetSegment = await manager.getRepository(CustomerSegment).findOne({
		where: { id: segmentId },
	});
	const targetTierCode = normalizeClientTierCode(targetSegment?.code);
	const query = manager
		.getRepository(ClientCustomerSegment)
		.createQueryBuilder("assignment")
		.innerJoin("assignment.segment", "segment")
		.innerJoin(User, "user", "user.id = assignment.client_id")
		.select("DISTINCT assignment.client_id", "clientId");

	if (targetTierCode) {
		query.where("LOWER(segment.code) IN (:...tierCodes)", {
			tierCodes: getClientTierCodeAliases(
				getRecipientTierCodesForPromotionTier(targetTierCode),
			),
		});
	} else {
		query.where("assignment.segment_id = :segmentId", { segmentId });
	}

	const rows = await query.getRawMany<{ clientId: string }>();

	return rows.map((row) => row.clientId);
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
		.orderBy(getCustomerSegmentTierOrderSql("segment"), "ASC")
		.addOrderBy("assignment.created_at", "DESC")
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
	const tierCode = getHighestClientTierCode(
		assignedSegments.map((segment) => segment.code),
	);

	return {
		code: tierCode,
		...TIER_DETAILS[tierCode],
		assignedSegments,
	};
}
