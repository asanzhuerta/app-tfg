import { getDataSource } from "@/lib/typeorm/data-source";
import type { AppReminderStatus, UpsertAppReminderBody } from "@/lib/contracts/communications";
import { AppNotification } from "@/lib/typeorm/entities/AppNotification";
import { AppReminder } from "@/lib/typeorm/entities/AppReminder";
import { syncTodayVisitNotificationsForUser } from "@/lib/typeorm/services/commercial/visit-notifications";
import {
	CommunicationsServiceError,
	normalizeDateTime,
	normalizeReminderStatus,
	normalizeText,
} from "./communication-core";

export async function listNotificationsForUser(userId: string) {
	const ds = await getDataSource();

	try {
		await syncTodayVisitNotificationsForUser(userId);
	} catch (error) {
		console.error("[communications] today visit notification sync failed:", error);
	}

	return ds
		.getRepository(AppNotification)
		.createQueryBuilder("notification")
		.where("notification.recipient_user_id = :userId", { userId })
		.orderBy("notification.read_at IS NULL", "DESC")
		.addOrderBy("notification.created_at", "DESC")
		.getMany();
}

export async function markNotificationRead(input: {
	userId: string;
	notificationId: string;
}) {
	const ds = await getDataSource();
	const repo = ds.getRepository(AppNotification);
	const notification = await repo.findOne({
		where: {
			id: input.notificationId,
			recipient_user_id: input.userId,
		},
	});

	if (!notification) {
		throw new CommunicationsServiceError(
			"Notificación no encontrada",
			404,
			"NOTIFICATION_NOT_FOUND",
		);
	}

	notification.read_at = notification.read_at ?? new Date();
	return repo.save(notification);
}

export async function markAllNotificationsRead(userId: string) {
	const ds = await getDataSource();

	await ds
		.getRepository(AppNotification)
		.createQueryBuilder()
		.update(AppNotification)
		.set({ read_at: new Date() })
		.where("recipient_user_id = :userId", { userId })
		.andWhere("read_at IS NULL")
		.execute();

	return { ok: true };
}

export async function listRemindersForUser(userId: string) {
	const ds = await getDataSource();

	return ds.getRepository(AppReminder).find({
		where: { recipient_user_id: userId },
		order: {
			status: "ASC",
			scheduled_at: "ASC",
		},
	});
}

export async function createReminderForUser(
	userId: string,
	input: UpsertAppReminderBody,
) {
	const ds = await getDataSource();
	const title = normalizeText(input.title, "El título", { required: true });
	const body = normalizeText(input.body, "El cuerpo", { required: true });
	const scheduledAt = normalizeDateTime(input.scheduledAt, "La fecha programada", {
		required: true,
	});

	return ds.getRepository(AppReminder).save(
		ds.getRepository(AppReminder).create({
			recipient_user_id: userId,
			title: String(title),
			body: String(body),
			scheduled_at: scheduledAt as Date,
			status: "pending",
			source_type: "manual",
			source_id: null,
		}),
	);
}

export async function updateReminderStatus(input: {
	userId: string;
	reminderId: string;
	status: AppReminderStatus;
}) {
	const ds = await getDataSource();
	const status = normalizeReminderStatus(input.status, true);
	const repo = ds.getRepository(AppReminder);
	const reminder = await repo.findOne({
		where: {
			id: input.reminderId,
			recipient_user_id: input.userId,
		},
	});

	if (!reminder) {
		throw new CommunicationsServiceError(
			"Recordatorio no encontrado",
			404,
			"REMINDER_NOT_FOUND",
		);
	}

	reminder.status = status as AppReminderStatus;
	return repo.save(reminder);
}
