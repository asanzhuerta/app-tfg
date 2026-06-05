import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { ClientCustomerSegment } from "@/lib/typeorm/entities/ClientCustomerSegment";
import { getClientTierOverview } from "@/lib/typeorm/services/clients/client-tier";

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

	assertCondition(client, "Debe existir al menos un cliente para validar M6 tier");
	assertCondition(platinum, "Debe existir el segmento seeded platinum");

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
