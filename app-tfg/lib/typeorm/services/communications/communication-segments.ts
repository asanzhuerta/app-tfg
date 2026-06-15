import { getDataSource } from "@/lib/typeorm/data-source";
import type {
	AdminAssignClientSegmentBody,
	AdminUpsertCustomerSegmentBody,
} from "@/lib/contracts/communications";
import { Client } from "@/lib/typeorm/entities/Client";
import { ClientCustomerSegment } from "@/lib/typeorm/entities/ClientCustomerSegment";
import { CustomerSegment } from "@/lib/typeorm/entities/CustomerSegment";
import { getCustomerSegmentTierOrderSql } from "@/lib/typeorm/services/clients/client-tier";
import {
	CommunicationsServiceError,
	normalizeCode,
	normalizeOptionalId,
	normalizeText,
	requireEntityById,
	rethrowCommunicationsPersistenceError,
} from "./communication-core";

export async function listCustomerSegments(input: { search?: string | null } = {}) {
	const ds = await getDataSource();
	const query = ds
		.getRepository(CustomerSegment)
		.createQueryBuilder("segment")
		.orderBy(getCustomerSegmentTierOrderSql("segment"), "ASC")
		.addOrderBy("segment.name", "ASC");
	const search = String(input.search ?? "").trim();

	if (search) {
		query.where(
			`(
				segment.code ILIKE :search
				OR segment.name ILIKE :search
				OR COALESCE(segment.description, '') ILIKE :search
				OR COALESCE(segment.criteria, '') ILIKE :search
			)`,
			{ search: `%${search}%` },
		);
	}

	return query.getMany();
}

export async function getCustomerSegmentById(id: string) {
	const ds = await getDataSource();

	return ds.getRepository(CustomerSegment).findOne({
		where: { id },
	});
}

export async function createCustomerSegment(
	input: AdminUpsertCustomerSegmentBody,
) {
	const ds = await getDataSource();
	const code = normalizeCode(input.code, true);
	const name = normalizeText(input.name, "El nombre", { required: true });
	const description = normalizeText(input.description, "La descripción");
	const criteria = normalizeText(input.criteria, "Los criterios");

	try {
		const created = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(CustomerSegment);
			return repo.save(
				repo.create({
					code: String(code),
					name: String(name),
					description: description ?? null,
					criteria: criteria ?? null,
				}),
			);
		});

		return getCustomerSegmentById(created.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo crear el rango",
			"CUSTOMER_SEGMENT_CREATE_FAILED",
		);
	}
}

export async function updateCustomerSegment(
	input: { segmentId: string } & AdminUpsertCustomerSegmentBody,
) {
	const ds = await getDataSource();
	const code = normalizeCode(input.code);
	const name = normalizeText(input.name, "El nombre");
	const description = normalizeText(input.description, "La descripción");
	const criteria = normalizeText(input.criteria, "Los criterios");

	try {
		const updated = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(CustomerSegment);
			const segment = await repo.findOne({ where: { id: input.segmentId } });

			if (!segment) {
				throw new CommunicationsServiceError(
					"Rango no encontrado",
					404,
					"CUSTOMER_SEGMENT_NOT_FOUND",
				);
			}

			if (code !== undefined) {
				segment.code = String(code);
			}

			if (name !== undefined) {
				segment.name = String(name);
			}

			if (description !== undefined) {
				segment.description = description;
			}

			if (criteria !== undefined) {
				segment.criteria = criteria;
			}

			return repo.save(segment);
		});

		return getCustomerSegmentById(updated.id);
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo actualizar el rango",
			"CUSTOMER_SEGMENT_UPDATE_FAILED",
		);
	}
}

export async function deleteCustomerSegment(segmentId: string) {
	const ds = await getDataSource();
	const result = await ds.getRepository(CustomerSegment).delete({ id: segmentId });

	if (!result.affected) {
		throw new CommunicationsServiceError(
			"Rango no encontrado",
			404,
			"CUSTOMER_SEGMENT_NOT_FOUND",
		);
	}

	return { id: segmentId };
}

export async function listClientSegmentAssignments(
	input: { search?: string | null } = {},
) {
	const ds = await getDataSource();
	const query = ds
		.getRepository(ClientCustomerSegment)
		.createQueryBuilder("assignment")
		.leftJoinAndSelect("assignment.client", "client")
		.leftJoinAndSelect("client.user", "clientUser")
		.leftJoinAndSelect("assignment.segment", "segment")
		.leftJoinAndSelect("assignment.assignedByUser", "assignedByUser")
		.orderBy("client.name", "ASC")
		.addOrderBy(getCustomerSegmentTierOrderSql("segment"), "ASC")
		.addOrderBy("assignment.created_at", "DESC");
	const search = String(input.search ?? "").trim();

	if (search) {
		query.where(
			`(
				client.name ILIKE :search
				OR COALESCE(client.contact_name, '') ILIKE :search
				OR COALESCE(clientUser.email, '') ILIKE :search
				OR segment.name ILIKE :search
				OR segment.code ILIKE :search
			)`,
			{ search: `%${search}%` },
		);
	}

	return query.getMany();
}

export async function assignClientToSegment(
	input: AdminAssignClientSegmentBody & { assignedByUserId?: string | null },
) {
	const ds = await getDataSource();
	const clientId = normalizeOptionalId(input.clientId);
	const segmentId = normalizeOptionalId(input.segmentId);
	const notes = normalizeText(input.notes, "Las notas");

	if (!clientId) {
		throw new CommunicationsServiceError("El cliente es obligatorio");
	}

	if (!segmentId) {
		throw new CommunicationsServiceError("El rango es obligatorio");
	}

	try {
		const created = await ds.transaction(async (manager) => {
			await requireEntityById(
				manager,
				Client,
				clientId,
				"Cliente no encontrado",
				"CLIENT_NOT_FOUND",
			);
			await requireEntityById(
				manager,
				CustomerSegment,
				segmentId,
				"Rango no encontrado",
				"CUSTOMER_SEGMENT_NOT_FOUND",
			);

			const repo = manager.getRepository(ClientCustomerSegment);

			return repo.save(
				repo.create({
					client_id: clientId,
					segment_id: segmentId,
					assigned_by_user_id: input.assignedByUserId ?? null,
					notes: notes ?? null,
				}),
			);
		});

		return created;
	} catch (error) {
		rethrowCommunicationsPersistenceError(
			error,
			"No se pudo asignar el cliente al rango",
			"CLIENT_SEGMENT_ASSIGNMENT_FAILED",
		);
	}
}

export async function removeClientSegmentAssignment(assignmentId: string) {
	const ds = await getDataSource();
	const result = await ds
		.getRepository(ClientCustomerSegment)
		.delete({ id: assignmentId });

	if (!result.affected) {
		throw new CommunicationsServiceError(
			"Asignación no encontrada",
			404,
			"CLIENT_SEGMENT_ASSIGNMENT_NOT_FOUND",
		);
	}

	return { id: assignmentId };
}

