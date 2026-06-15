import { In } from "typeorm";
import { getDataSource } from "@/lib/typeorm/data-source";
import type {
	AdminUpsertTrainingEventBody,
	TrainingEnrollmentBody,
} from "@/lib/contracts/communications";
import { TrainingEnrollment } from "@/lib/typeorm/entities/TrainingEnrollment";
import { TrainingEvent } from "@/lib/typeorm/entities/TrainingEvent";
import {
	ACTIVE_ENROLLMENT_STATUSES,
	ACTIVE_ENROLLMENT_STATUS_SET,
	CommunicationsServiceError,
	normalizeDateTime,
	normalizeNotificationDeliveryChannels,
	normalizePositiveInteger,
	normalizeText,
	normalizeTrainingEventModality,
	normalizeTrainingEventStatus,
	notifyTrainingPublished,
	rethrowCommunicationsPersistenceError,
} from "./communication-core";

export async function listAdminTrainingEvents(
	input: { search?: string | null } = {},
) {
	const ds = await getDataSource();
	const query = ds
		.getRepository(TrainingEvent)
		.createQueryBuilder("trainingEvent")
		.leftJoinAndSelect("trainingEvent.enrollments", "enrollment")
		.leftJoinAndSelect("enrollment.user", "enrollmentUser")
		.leftJoinAndSelect("trainingEvent.createdByUser", "createdByUser")
		.orderBy("trainingEvent.starts_at", "DESC");
	const search = String(input.search ?? "").trim();

	if (search) {
		query.where(
			`(
				trainingEvent.title ILIKE :search
				OR trainingEvent.description ILIKE :search
				OR COALESCE(trainingEvent.location, '') ILIKE :search
				OR COALESCE(trainingEvent.content, '') ILIKE :search
			)`,
			{ search: `%${search}%` },
		);
	}

	return query.getMany();
}

export async function getTrainingEventById(id: string) {
	const ds = await getDataSource();

	return ds
		.getRepository(TrainingEvent)
		.createQueryBuilder("trainingEvent")
		.leftJoinAndSelect("trainingEvent.enrollments", "enrollment")
		.leftJoinAndSelect("enrollment.user", "enrollmentUser")
		.leftJoinAndSelect("trainingEvent.createdByUser", "createdByUser")
		.where("trainingEvent.id = :id", { id })
		.getOne();
}

export async function createTrainingEvent(
	input: AdminUpsertTrainingEventBody & { createdByUserId?: string | null },
) {
	const ds = await getDataSource();
	const title = normalizeText(input.title, "El título", { required: true });
	const description = normalizeText(input.description, "La descripción", {
		required: true,
	});
	const startsAt = normalizeDateTime(input.startsAt, "La fecha de inicio", {
		required: true,
	});
	const location = normalizeText(input.location, "La ubicación");
	const modality = normalizeTrainingEventModality(input.modality) ?? "in_person";
	const content = normalizeText(input.content, "El contenido");
	const status = normalizeTrainingEventStatus(input.status) ?? "draft";
	const capacity = normalizePositiveInteger(input.capacity, "La capacidad");
	const deliveryChannels = normalizeNotificationDeliveryChannels(
		input.deliveryChannels,
	);

	try {
		const created = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(TrainingEvent);
			const trainingEvent = await repo.save(
				repo.create({
					title: String(title),
					description: String(description),
					starts_at: startsAt as Date,
					location: location ?? null,
					modality,
					content: content ?? null,
					status,
					capacity: capacity ?? null,
					created_by_user_id: input.createdByUserId ?? null,
				}),
			);

			if (trainingEvent.status === "published") {
				await notifyTrainingPublished(manager, trainingEvent, deliveryChannels);
			}

			return trainingEvent;
		});

		return getTrainingEventById(created.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo crear la formación",
			"TRAINING_CREATE_FAILED",
		);
	}
}

export async function updateTrainingEvent(
	input: { trainingEventId: string } & AdminUpsertTrainingEventBody,
) {
	const ds = await getDataSource();
	const normalized = {
		title: normalizeText(input.title, "El título"),
		description: normalizeText(input.description, "La descripción"),
		startsAt: normalizeDateTime(input.startsAt, "La fecha de inicio"),
		location: normalizeText(input.location, "La ubicación"),
		modality: normalizeTrainingEventModality(input.modality),
		content: normalizeText(input.content, "El contenido"),
		status: normalizeTrainingEventStatus(input.status),
		capacity: normalizePositiveInteger(input.capacity, "La capacidad"),
		deliveryChannels: normalizeNotificationDeliveryChannels(
			input.deliveryChannels,
		),
	};

	try {
		const updated = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(TrainingEvent);
			const trainingEvent = await repo.findOne({
				where: { id: input.trainingEventId },
			});

			if (!trainingEvent) {
				throw new CommunicationsServiceError(
					"Formación no encontrada",
					404,
					"TRAINING_NOT_FOUND",
				);
			}

			const wasPublished = trainingEvent.status === "published";

			if (normalized.title !== undefined) {
				trainingEvent.title = String(normalized.title);
			}

			if (normalized.description !== undefined) {
				trainingEvent.description = String(normalized.description);
			}

			if (normalized.startsAt !== undefined) {
				trainingEvent.starts_at = normalized.startsAt as Date;
			}

			if (normalized.location !== undefined) {
				trainingEvent.location = normalized.location;
			}

			if (normalized.modality !== undefined) {
				trainingEvent.modality = normalized.modality;
			}

			if (normalized.content !== undefined) {
				trainingEvent.content = normalized.content;
			}

			if (normalized.status !== undefined) {
				trainingEvent.status = normalized.status;
			}

			if (normalized.capacity !== undefined) {
				trainingEvent.capacity = normalized.capacity;
			}

			const saved = await repo.save(trainingEvent);

			if (!wasPublished && saved.status === "published") {
				await notifyTrainingPublished(
					manager,
					saved,
					normalized.deliveryChannels,
				);
			}

			return saved;
		});

		return getTrainingEventById(updated.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo actualizar la formación",
			"TRAINING_UPDATE_FAILED",
		);
	}
}

export async function deleteTrainingEvent(trainingEventId: string) {
	const ds = await getDataSource();
	const result = await ds
		.getRepository(TrainingEvent)
		.delete({ id: trainingEventId });

	if (!result.affected) {
		throw new CommunicationsServiceError(
			"Formación no encontrada",
			404,
			"TRAINING_NOT_FOUND",
		);
	}

	return { id: trainingEventId };
}

export async function listTrainingEventsForUser(userId: string) {
	const ds = await getDataSource();

	return ds
		.getRepository(TrainingEvent)
		.createQueryBuilder("trainingEvent")
		.leftJoinAndSelect(
			"trainingEvent.enrollments",
			"enrollment",
			"enrollment.user_id = :userId",
			{ userId },
		)
		.where("trainingEvent.status = :status", { status: "published" })
		.orderBy("trainingEvent.starts_at", "ASC")
		.getMany();
}

export async function enrollTrainingEvent(
	input: { userId: string; trainingEventId: string } & TrainingEnrollmentBody,
) {
	const ds = await getDataSource();
	const notes = normalizeText(input.notes, "Las notas");

	try {
		return ds.transaction(async (manager) => {
			const eventRepo = manager.getRepository(TrainingEvent);
			const enrollmentRepo = manager.getRepository(TrainingEnrollment);
			const trainingEvent = await eventRepo.findOne({
				where: { id: input.trainingEventId },
			});

			if (!trainingEvent) {
				throw new CommunicationsServiceError(
					"Formación no encontrada",
					404,
					"TRAINING_NOT_FOUND",
				);
			}

			if (trainingEvent.status !== "published") {
				throw new CommunicationsServiceError(
					"Solo puedes inscribirte en formaciones publicadas",
					400,
					"TRAINING_NOT_PUBLISHED",
				);
			}

			const existing = await enrollmentRepo.findOne({
				where: {
					training_event_id: input.trainingEventId,
					user_id: input.userId,
				},
			});
			const isAlreadyActive = existing
				? ACTIVE_ENROLLMENT_STATUS_SET.has(existing.status)
				: false;

			if (!isAlreadyActive && trainingEvent.capacity) {
				const activeCount = await enrollmentRepo.count({
					where: {
						training_event_id: input.trainingEventId,
						status: In([...ACTIVE_ENROLLMENT_STATUSES]),
					},
				});

				if (activeCount >= trainingEvent.capacity) {
					throw new CommunicationsServiceError(
						"La formación no tiene plazas disponibles",
						409,
						"TRAINING_CAPACITY_FULL",
					);
				}
			}

			if (existing) {
				existing.status = "registered";
				existing.notes = notes ?? existing.notes;
				return enrollmentRepo.save(existing);
			}

			return enrollmentRepo.save(
				enrollmentRepo.create({
					training_event_id: input.trainingEventId,
					user_id: input.userId,
					status: "registered",
					notes: notes ?? null,
				}),
			);
		});
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo registrar la inscripción",
			"TRAINING_ENROLLMENT_FAILED",
		);
	}
}

export async function cancelTrainingEnrollment(input: {
	userId: string;
	trainingEventId: string;
}) {
	const ds = await getDataSource();
	const enrollment = await ds.getRepository(TrainingEnrollment).findOne({
		where: {
			training_event_id: input.trainingEventId,
			user_id: input.userId,
		},
	});

	if (!enrollment) {
		throw new CommunicationsServiceError(
			"Inscripción no encontrada",
			404,
			"TRAINING_ENROLLMENT_NOT_FOUND",
		);
	}

	enrollment.status = "cancelled";
	return ds.getRepository(TrainingEnrollment).save(enrollment);
}

