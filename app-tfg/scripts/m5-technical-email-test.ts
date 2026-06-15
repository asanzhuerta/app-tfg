import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { SalonClient } from "@/lib/typeorm/entities/SalonClient";
import { listSalonProductOptions } from "@/lib/typeorm/services/salon/salon-client";
import {
	createSalonClientForClientUser,
	createSalonServiceForClientUser,
	getSalonTechnicalEmailDraftForClientUser,
} from "@/lib/typeorm/services/salon/salon-client";

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

async function findCandidateClientUser() {
	const ds = await getDataSource();
	const clients = await ds
		.getRepository(Client)
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.orderBy("client.created_at", "DESC")
		.getMany();

	for (const client of clients) {
		if (!client.user?.id) {
			continue;
		}

		return {
			clientId: client.id,
			userId: client.user.id,
			clientName: client.name,
			userName: client.user.name || client.name,
		};
	}

	throw new Error(
		"No se ha encontrado un cliente profesional con usuario vinculado para ejecutar la prueba de M5",
	);
}

async function main() {
	const ds = await getDataSource();
	const productOptions = await listSalonProductOptions();
	const product = productOptions[0];

	assertCondition(
		product,
		"No hay productos activos en catálogo para ejecutar la prueba de correo técnico de M5",
	);

	const candidate = await findCandidateClientUser();
	const tag = `M5 technical email test ${Date.now()}`;
	let createdSalonClientId: string | null = null;

	try {
		const createdSalonClient = await createSalonClientForClientUser(
			candidate.userId,
			{
				name: tag,
				phone: "600123123",
				email: "m5-test@example.com",
				notes: `${tag} notes`,
			},
		);
		createdSalonClientId = createdSalonClient.id;
		console.log(`PASS ficha temporal creada (${candidate.clientName})`);

		const detail = await createSalonServiceForClientUser(
			candidate.userId,
			createdSalonClient.id,
			{
				serviceDate: "2026-06-03",
				serviceType: "Diagnóstico capilar",
				result: "Brillo reforzado",
				notes: `${tag} service`,
				technicalDescription: "Aplicación de tratamiento reparador",
				formula: "Tratamiento reparador + sellado",
				technicalNotes: "Revisar hidratacion a las dos semanas",
				productUsages: [
					{
						productId: product.productId,
						colorReferenceId: product.colorReferenceId,
						quantityUsed: 1.5,
						notes: "Aplicación en medios y puntas",
					},
				],
			},
		);

		const createdService = detail.services.find(
			(service) =>
				service.service_type === "Diagnóstico capilar" &&
				service.notes === `${tag} service`,
		);

		assertCondition(
			createdService,
			"No se ha localizado el servicio temporal creado para la prueba de M5",
		);
		assertCondition(
			detail.suggestions.length > 0,
			"La reconstruccion de sugerencias no ha generado resultados tras crear el servicio temporal",
		);
		console.log(
			`PASS servicio temporal creado con ${detail.suggestions.length} sugerencia(s)`,
		);

		const draft = await getSalonTechnicalEmailDraftForClientUser(
			candidate.userId,
			createdSalonClient.id,
			createdService.id,
		);

		assertCondition(
			draft.recipient_name === tag,
			"El borrador técnico no apunta al cliente del salón esperado",
		);
		assertCondition(
			draft.recipient_email === "m5-test@example.com",
			"El borrador técnico no conserva el correo del cliente del salón",
		);
		assertCondition(
			draft.subject.includes("Diagnóstico capilar"),
			"El asunto del borrador técnico no incluye el tipo de servicio",
		);
		assertCondition(
			draft.body.includes("Resumen del servicio") &&
				draft.body.includes("Tratamiento reparador + sellado"),
			"El cuerpo del borrador técnico no incluye el resumen o la formula esperada",
		);
		assertCondition(
			draft.body.includes(product.name),
			"El cuerpo del borrador técnico no incluye el producto utilizado",
		);
		assertCondition(
			draft.body.includes("Sugerencias de mantenimiento"),
			"El cuerpo del borrador técnico no incluye el bloque de sugerencias",
		);
		console.log(
			`PASS borrador técnico generado para ${draft.recipient_name} con asunto válido`,
		);
	} finally {
		if (createdSalonClientId) {
			await ds.getRepository(SalonClient).delete(createdSalonClientId);
		}
	}

	const remainingSalonClients = await ds.getRepository(SalonClient).count({
		where: {
			name: tag,
		},
	});

	assertCondition(
		remainingSalonClients === 0,
		"La limpieza final de la prueba de M5 ha dejado fichas temporales sin borrar",
	);
	console.log("PASS limpieza final completada");
}

void main()
	.then(() => {
		console.log("M5 technical email test OK");
	})
	.catch((error) => {
		console.error("M5 technical email test FAILED");
		console.error(error);
		process.exitCode = 1;
	});
