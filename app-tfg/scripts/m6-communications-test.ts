import { In } from "typeorm";
import { ROLE_IDS, USER_STATUS_IDS } from "@/lib/typeorm/constants/catalog-ids";
import { getDataSource } from "@/lib/typeorm/data-source";
import { AppNotification } from "@/lib/typeorm/entities/AppNotification";
import { AppReminder } from "@/lib/typeorm/entities/AppReminder";
import { Client } from "@/lib/typeorm/entities/Client";
import { ClientCustomerSegment } from "@/lib/typeorm/entities/ClientCustomerSegment";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { Promotion } from "@/lib/typeorm/entities/Promotion";
import { TrainingEnrollment } from "@/lib/typeorm/entities/TrainingEnrollment";
import { TrainingEvent } from "@/lib/typeorm/entities/TrainingEvent";
import { User } from "@/lib/typeorm/entities/User";
import {
	assignClientToSegment,
	cancelTrainingEnrollment,
	createCustomerSegment,
	createPromotion,
	createReminderForUser,
	createTrainingEvent,
	deletePromotion,
	deleteTrainingEvent,
	enrollTrainingEvent,
	listPromotionsForUser,
	updateCustomerSegment,
	updatePromotion,
	updateReminderStatus,
} from "@/lib/typeorm/services/communications/communications";

type CandidateContext = {
	client: Client;
	otherClient: Client | null;
	commercialUser: User;
	adminUser: User | null;
};

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

function toDateOnly(date: Date) {
	return date.toISOString().slice(0, 10);
}

async function findCandidateContext(): Promise<CandidateContext> {
	const ds = await getDataSource();
	const clients = await ds
		.getRepository(Client)
		.createQueryBuilder("client")
		.leftJoinAndSelect("client.user", "user")
		.where("user.role_id = :clientRoleId", {
			clientRoleId: ROLE_IDS.CLIENT,
		})
		.andWhere("user.status_id = :activeStatusId", {
			activeStatusId: USER_STATUS_IDS.ACTIVE,
		})
		.orderBy("client.created_at", "DESC")
		.getMany();

	const commercialUser = await ds.getRepository(User).findOne({
		where: {
			role_id: ROLE_IDS.COMMERCIAL,
			status_id: USER_STATUS_IDS.ACTIVE,
		},
		order: { created_at: "DESC" },
	});
	const adminUser = await ds.getRepository(User).findOne({
		where: {
			role_id: ROLE_IDS.ADMIN,
			status_id: USER_STATUS_IDS.ACTIVE,
		},
		order: { created_at: "DESC" },
	});

	assertCondition(
		clients[0]?.id,
		"No hay clientes activos para ejecutar la prueba de M6",
	);
	assertCondition(
		commercialUser?.id,
		"No hay comerciales activos para ejecutar la prueba de M6",
	);

	return {
		client: clients[0],
		otherClient: clients[1] ?? null,
		commercialUser,
		adminUser,
	};
}

async function deleteNotificationsBySourceIds(sourceIds: string[]) {
	if (!sourceIds.length) {
		return;
	}

	const ds = await getDataSource();
	await ds.getRepository(AppNotification).delete({ source_id: In(sourceIds) });
}

async function main() {
	const ds = await getDataSource();
	const context = await findCandidateContext();
	const now = Date.now();
	const tag = `m6-test-${now}`;
	const today = new Date();
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
	const futureTrainingDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
	const createdSourceIds: string[] = [];
	const created = {
		segmentId: null as string | null,
		assignmentId: null as string | null,
		promotionId: null as string | null,
		trainingId: null as string | null,
		reminderId: null as string | null,
	};

	try {
		const segment = await createCustomerSegment({
			code: tag,
			name: `Segmento ${tag}`,
			description: "Segmento temporal para prueba de M6",
			criteria: "Cliente candidato activo",
		});

		assertCondition(segment?.id, "No se ha creado el segmento temporal");
		created.segmentId = segment.id;
		console.log("PASS segmento temporal creado");

		const updatedSegment = await updateCustomerSegment({
			segmentId: segment.id,
			name: `Segmento ${tag} editado`,
			description: "Segmento temporal editado",
		});
		assertCondition(
			updatedSegment?.name === `Segmento ${tag} editado`,
			"La edición del segmento no devuelve el nombre esperado",
		);
		console.log("PASS segmento editado");

		const assignment = await assignClientToSegment({
			clientId: context.client.id,
			segmentId: segment.id,
			assignedByUserId: context.adminUser?.id ?? null,
			notes: `Asignación temporal ${tag}`,
		});
		assertCondition(assignment?.id, "No se ha creado la asignación temporal");
		created.assignmentId = assignment.id;
		console.log(`PASS cliente asignado a segmento (${context.client.name})`);

		const promotion = await createPromotion({
			title: `Promoción ${tag}`,
			description: "Promoción temporal segmentada para prueba de M6",
			promotionType: "descuento",
			benefit: "10 % temporal",
			discountPercentage: "10",
			startDate: toDateOnly(today),
			endDate: toDateOnly(tomorrow),
			status: "active",
			customerSegmentId: segment.id,
			createdByUserId: context.adminUser?.id ?? null,
		});

		assertCondition(promotion?.id, "No se ha creado la promoción temporal");
		created.promotionId = promotion.id;
		createdSourceIds.push(promotion.id);
		console.log("PASS promoción segmentada creada");

		const clientPromotions = await listPromotionsForUser({
			userId: context.client.id,
			role: "client",
		});
		assertCondition(
			clientPromotions.some((current) => current.id === promotion.id),
			"El cliente asignado no ve la promoción segmentada",
		);

		const commercialPromotions = await listPromotionsForUser({
			userId: context.commercialUser.id,
			role: "commercial",
		});
		assertCondition(
			commercialPromotions.some((current) => current.id === promotion.id),
			"El comercial activo no ve la promoción publicada",
		);

		if (context.otherClient) {
			const otherClientPromotions = await listPromotionsForUser({
				userId: context.otherClient.id,
				role: "client",
			});
			assertCondition(
				!otherClientPromotions.some((current) => current.id === promotion.id),
				"Un cliente no asignado al segmento ve la promoción segmentada",
			);
		}
		console.log("PASS visibilidad de promoción por rol y segmento");

		const promotionNotifications = await ds.getRepository(AppNotification).find({
			where: {
				source_type: "promotion",
				source_id: promotion.id,
			},
		});

		assertCondition(
			promotionNotifications.some(
				(notification) => notification.recipient_user_id === context.client.id,
			),
			"La promoción segmentada no ha notificado al cliente asignado",
		);
		assertCondition(
			promotionNotifications.some(
				(notification) =>
					notification.recipient_user_id === context.commercialUser.id,
			),
			"La promoción segmentada no ha notificado al comercial activo",
		);

		if (context.otherClient) {
			assertCondition(
				!promotionNotifications.some(
					(notification) =>
						notification.recipient_user_id === context.otherClient?.id,
				),
				"La promoción segmentada ha notificado a un cliente no asignado",
			);
		}
		console.log("PASS notificaciones de promoción segmentadas");

		const updatedPromotion = await updatePromotion({
			promotionId: promotion.id,
			title: `Promoción ${tag} editada`,
			status: "archived",
		});
		assertCondition(
			updatedPromotion?.status === "archived",
			"La actualización de la promoción no cambia el estado esperado",
		);
		console.log("PASS promoción editada y archivada");

		const training = await createTrainingEvent({
			title: `Formación ${tag}`,
			description: "Formación temporal para prueba de M6",
			startsAt: futureTrainingDate.toISOString(),
			location: "Online",
			modality: "online",
			content: "Contenido temporal",
			status: "published",
			capacity: 1,
			createdByUserId: context.adminUser?.id ?? null,
		});

		assertCondition(training?.id, "No se ha creado la formación temporal");
		created.trainingId = training.id;
		createdSourceIds.push(training.id);
		console.log("PASS formación publicada creada");

		const enrollment = await enrollTrainingEvent({
			userId: context.client.id,
			trainingEventId: training.id,
			notes: `Inscripción temporal ${tag}`,
		});
		assertCondition(
			enrollment?.status === "registered",
			"La inscripción no queda en estado registered",
		);
		console.log("PASS inscripción registrada");

		const cancelledEnrollment = await cancelTrainingEnrollment({
			userId: context.client.id,
			trainingEventId: training.id,
		});
		assertCondition(
			cancelledEnrollment.status === "cancelled",
			"La cancelación de inscripción no queda en estado cancelled",
		);
		console.log("PASS inscripción cancelada");

		const reminder = await createReminderForUser(context.client.id, {
			title: `Recordatorio ${tag}`,
			body: "Recordatorio temporal de prueba",
			scheduledAt: futureTrainingDate.toISOString(),
		});
		created.reminderId = reminder.id;

		const doneReminder = await updateReminderStatus({
			userId: context.client.id,
			reminderId: reminder.id,
			status: "done",
		});
		assertCondition(
			doneReminder.status === "done",
			"El recordatorio no se actualiza a estado done",
		);
		console.log("PASS recordatorio creado y actualizado");

		await deletePromotion(promotion.id);
		created.promotionId = null;
		await deleteTrainingEvent(training.id);
		created.trainingId = null;
		console.log("PASS promoción y formación eliminadas");
	} finally {
		if (created.reminderId) {
			await ds.getRepository(AppReminder).delete(created.reminderId);
		}

		if (created.trainingId) {
			await ds.getRepository(TrainingEnrollment).delete({
				training_event_id: created.trainingId,
			});
			await ds.getRepository(TrainingEvent).delete(created.trainingId);
		}

		if (created.promotionId) {
			await ds.getRepository(Promotion).delete(created.promotionId);
		}

		if (created.assignmentId) {
			await ds
				.getRepository(ClientCustomerSegment)
				.delete(created.assignmentId);
		}

		if (created.segmentId) {
			await ds.getRepository(CustomerSegment).delete(created.segmentId);
		}

		await deleteNotificationsBySourceIds(createdSourceIds);
	}

	const leftovers = await Promise.all([
		ds.getRepository(CustomerSegment).count({ where: { code: tag } }),
		ds.getRepository(Promotion).count({ where: { title: `Promoción ${tag}` } }),
		ds.getRepository(TrainingEvent).count({
			where: { title: `Formación ${tag}` },
		}),
		ds.getRepository(AppReminder).count({
			where: { title: `Recordatorio ${tag}` },
		}),
	]);

	assertCondition(
		leftovers.every((count) => count === 0),
		"La limpieza final de la prueba de M6 ha dejado registros temporales",
	);
	console.log("PASS limpieza final completada");
}

void main()
	.then(() => {
		console.log("M6 communications test OK");
	})
	.catch((error) => {
		console.error("M6 communications test FAILED");
		console.error(error);
		process.exitCode = 1;
	});
