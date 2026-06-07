import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { SalonServiceTemplate } from "@/lib/typeorm/entities/SalonServiceTemplate";
import { listSalonProductOptions } from "@/lib/typeorm/services/salon/salon-client";
import {
	createSalonServiceTemplateForClientUser,
	deleteSalonServiceTemplateForClientUser,
	listSalonServiceTemplatesForClientUser,
} from "@/lib/typeorm/services/salon/salon-service-template";

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
		};
	}

	throw new Error(
		"No se ha encontrado un cliente profesional con usuario vinculado para ejecutar la prueba de plantillas de M5",
	);
}

async function main() {
	const ds = await getDataSource();
	const productOptions = await listSalonProductOptions();
	const product = productOptions[0];

	assertCondition(
		product,
		"No hay productos activos en catálogo para ejecutar la prueba de plantillas de M5",
	);

	const candidate = await findCandidateClientUser();
	const tag = `M5 service template smoke ${Date.now()}`;
	let createdTemplateId: string | null = null;

	try {
		const template = await createSalonServiceTemplateForClientUser(
			candidate.userId,
			{
				name: tag,
				serviceType: "Tratamiento reparador",
				result: "Cabello reforzado",
				notes: `${tag} notes`,
				technicalDescription: "Aplicación por secciones",
				formula: "Base reparadora + sellado",
				technicalNotes: "Revisar elasticidad en mantenimiento",
				productUsages: [
					{
						productId: product.productId,
						colorReferenceId: product.colorReferenceId,
						quantityUsed: 2,
						notes: "Aplicación uniforme",
					},
				],
			},
		);
		createdTemplateId = template.id;

		assertCondition(
			template.name === tag &&
				template.product_usages.length === 1 &&
				template.product_usages[0]?.product_id === product.productId,
			"La plantilla creada no devuelve la información esperada",
		);
		console.log(`PASS plantilla técnica creada (${candidate.clientName})`);

		const templates = await listSalonServiceTemplatesForClientUser(
			candidate.userId,
		);
		const savedTemplate = templates.find(
			(currentTemplate) => currentTemplate.id === template.id,
		);

		assertCondition(
			savedTemplate &&
				savedTemplate.service_type === "Tratamiento reparador" &&
				savedTemplate.formula === "Base reparadora + sellado",
			"La plantilla creada no aparece en el listado del cliente",
		);
		console.log(
			`PASS plantilla listada con ${savedTemplate.product_usages.length} producto(s)`,
		);

		await deleteSalonServiceTemplateForClientUser(candidate.userId, template.id);
		createdTemplateId = null;

		const templatesAfterDelete = await listSalonServiceTemplatesForClientUser(
			candidate.userId,
		);
		assertCondition(
			!templatesAfterDelete.some(
				(currentTemplate) => currentTemplate.id === template.id,
			),
			"La plantilla eliminada sigue apareciendo en el listado",
		);
		console.log("PASS plantilla eliminada correctamente");
	} finally {
		if (createdTemplateId) {
			await ds.getRepository(SalonServiceTemplate).delete(createdTemplateId);
		}
	}

	const remainingTemplates = await ds.getRepository(SalonServiceTemplate).count({
		where: {
			name: tag,
		},
	});

	assertCondition(
		remainingTemplates === 0,
		"La limpieza final del smoke de plantillas de M5 ha dejado registros temporales",
	);
	console.log("PASS limpieza final completada");
}

void main()
	.then(() => {
		console.log("M5 service templates smoke OK");
	})
	.catch((error) => {
		console.error("M5 service templates smoke FAILED");
		console.error(error);
		process.exitCode = 1;
	});
