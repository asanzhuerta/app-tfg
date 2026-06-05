import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { ClientCustomerSegment } from "@/lib/typeorm/entities/ClientCustomerSegment";
import { getClientTierOverview } from "@/lib/typeorm/services/clients/client-tier";

const TIER_CODES = ["silver", "gold", "platinum"] as const;

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

async function main() {
	const dataSource = await getDataSource();
	const client = await dataSource
		.getRepository(Client)
		.createQueryBuilder("client")
		.orderBy("client.created_at", "ASC")
		.getOne();
	const platinum = await dataSource.getRepository(CustomerSegment).findOne({
		where: {
			code: "platinum",
		},
	});
	const silver = await dataSource.getRepository(CustomerSegment).findOne({
		where: {
			code: "silver",
		},
	});
	const clientsWithoutTier = await dataSource
		.getRepository(Client)
		.createQueryBuilder("client")
		.where(
			`
			NOT EXISTS (
				SELECT 1
				FROM client_customer_segments assignment
				INNER JOIN customer_segments segment
					ON segment.id = assignment.segment_id
				WHERE assignment.client_id = client.id
					AND segment.code IN (:...tierCodes)
			)
			`,
			{ tierCodes: TIER_CODES },
		)
		.getCount();

	assertCondition(client, "Debe existir al menos un cliente para validar M6 tier");
	assertCondition(silver, "Debe existir el segmento seeded silver");
	assertCondition(platinum, "Debe existir el segmento seeded platinum");
	assertCondition(
		clientsWithoutTier === 0,
		"Todos los clientes deben tener al menos un rango comercial base",
	);

	const assignmentRepo = dataSource.getRepository(ClientCustomerSegment);
	const existingAssignment = await assignmentRepo.findOne({
		where: {
			client_id: client.id,
			segment_id: platinum.id,
		},
	});
	let createdAssignmentId: string | null = null;

	try {
		if (!existingAssignment) {
			const assignment = await assignmentRepo.save(
				assignmentRepo.create({
					client_id: client.id,
					segment_id: platinum.id,
					notes: "Smoke temporal M6 client tier badge",
				}),
			);
			createdAssignmentId = assignment.id;
		}

		const tier = await getClientTierOverview(client.id);

		assertCondition(
			tier.code === "platinum",
			"El badge debe priorizar el rango Platino cuando el cliente lo tiene asignado",
		);
		assertCondition(
			tier.assignedSegments.some((segment) => segment.code === "platinum"),
			"El resumen del badge debe conservar los segmentos asignados",
		);
		assertCondition(
			tier.benefitSummary.length > 0 && tier.nextStep.length > 0,
			"El badge debe exponer ventajas y siguiente paso",
		);

		console.log("PASS todos los clientes tienen rango comercial base");
		console.log("PASS badge cliente detecta rango Platino");
		console.log("PASS badge cliente conserva segmentos asignados");
		console.log("PASS badge cliente expone ventajas comerciales");
	} finally {
		if (createdAssignmentId) {
			await assignmentRepo.delete(createdAssignmentId);
		}
	}
}

main()
	.then(() => {
		console.log("M6 client tier smoke OK");
	})
	.catch((error) => {
		console.error("M6 client tier smoke FAILED");
		console.error(error);
		process.exitCode = 1;
	});
