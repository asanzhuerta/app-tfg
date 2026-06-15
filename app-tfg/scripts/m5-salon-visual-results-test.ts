import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { SalonClient } from "@/lib/typeorm/entities/SalonClient";
import { SalonService } from "@/lib/typeorm/entities/SalonService";
import {
	createSalonClientForClientUser,
	createSalonServiceForClientUser,
	deleteSalonServiceForClientUser,
	listSalonProductOptions,
	updateSalonServiceForClientUser,
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
		};
	}

	throw new Error(
		"No se ha encontrado un cliente profesional con usuario vinculado para ejecutar la prueba visual de M5",
	);
}

function buildResultImageUrl(tag: string, index: number) {
	return `https://res.cloudinary.com/demo/image/upload/v1234567/kinestilistas/salon-result-images/${tag}-${index}.jpg`;
}

async function main() {
	const ds = await getDataSource();
	const colorProduct = (await listSalonProductOptions()).find((product) =>
		Boolean(product.colorReferenceId),
	);

	assertCondition(
		colorProduct,
		"No hay productos de coloración con tonalidad vinculada para ejecutar la prueba visual de M5",
	);

	const candidate = await findCandidateClientUser();
	const tag = `m5-salon-visual-${Date.now()}`;
	const resultImages = [buildResultImageUrl(tag, 1), buildResultImageUrl(tag, 2)];
	let createdSalonClientId: string | null = null;
	let createdServiceId: string | null = null;

	try {
		const createdSalonClient = await createSalonClientForClientUser(
			candidate.userId,
			{
				name: tag,
				phone: "600123123",
				email: "m5-visual-test@example.com",
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
				serviceType: "Coloración técnica",
				result: "Rubio beige uniforme",
				notes: `${tag} service`,
				technicalDescription: "Aplicación por secciones con saturacion completa",
				formula: "Tono principal + oxidante + matiz",
				technicalNotes: "Control visual cada 10 minutos",
				productUsages: [
					{
						productId: colorProduct.productId,
						colorReferenceId: colorProduct.colorReferenceId,
						quantityUsed: 1.25,
						notes: "Aplicación en raiz y barrido a medios",
					},
				],
				resultImages,
			},
		);

		const createdService = detail.services.find(
			(service) =>
				service.service_type === "Coloración técnica" &&
				service.notes === `${tag} service`,
		);

		assertCondition(
			createdService,
			"No se ha localizado el servicio temporal creado para la prueba visual de M5",
		);
		createdServiceId = createdService.id;
		assertCondition(
			createdService.product_usages[0]?.color_reference_id ===
				colorProduct.colorReferenceId,
			"El servicio no conserva la tonalidad seleccionada",
		);
		assertCondition(
			createdService.result_images.length === 2,
			"El servicio no conserva las dos imágenes de resultado final",
		);
		console.log("PASS servicio visual creado con tonalidad e imágenes");

		const updatedDetail = await updateSalonServiceForClientUser(
			candidate.userId,
			createdSalonClient.id,
			{
				serviceId: createdService.id,
				serviceDate: "2026-06-03",
				serviceType: "Coloración técnica",
				result: "Rubio beige corregido",
				notes: `${tag} service updated`,
				technicalDescription: "Repaso de matiz en zonas sensibles",
				formula: "Tono principal + matiz corrector",
				technicalNotes: "Repetir mantenimiento en cuatro semanas",
				productUsages: [
					{
						productId: colorProduct.productId,
						colorReferenceId: colorProduct.colorReferenceId,
						quantityUsed: 1,
						notes: "Repaso final",
					},
				],
				resultImages: [resultImages[1]],
			},
		);

		const updatedService = updatedDetail.services.find(
			(service) => service.id === createdService.id,
		);

		assertCondition(
			updatedService?.result_images.length === 1 &&
				updatedService.result_images[0]?.image_url === resultImages[1],
			"La actualización del servicio no ha conservado la galeria esperada",
		);
		assertCondition(
			updatedService.product_usages[0]?.color_reference_code ===
				colorProduct.colorReferenceCode,
			"La actualización del servicio ha perdido la tonalidad del producto",
		);
		console.log("PASS servicio visual actualizado con galeria reducida");

		await deleteSalonServiceForClientUser(
			candidate.userId,
			createdSalonClient.id,
			createdService.id,
		);
		createdServiceId = null;

		const remainingService = await ds.getRepository(SalonService).findOne({
			where: {
				id: createdService.id,
			},
		});
		assertCondition(
			!remainingService,
			"El servicio visual temporal sigue existiendo tras el borrado",
		);
		console.log("PASS servicio visual eliminado correctamente");
	} finally {
		if (createdServiceId) {
			await ds.getRepository(SalonService).delete(createdServiceId);
		}

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
		"La limpieza final de la prueba visual de M5 ha dejado fichas temporales sin borrar",
	);
	console.log("PASS limpieza final completada");
}

void main()
	.then(() => {
		console.log("M5 salón visual test OK");
	})
	.catch((error) => {
		console.error("M5 salón visual test FAILED");
		console.error(error);
		process.exitCode = 1;
	});
