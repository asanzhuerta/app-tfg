import { QueryFailedError } from "typeorm";

type QueryDriverError = {
	code?: string;
	constraint?: string;
};

const CONSTRAINT_ERRORS: Record<
	string,
	{ message: string; code: string; status?: number }
> = {
	customer_segments_code_unique: {
		message: "Ya existe un rango con ese código",
		code: "DUPLICATE_CUSTOMER_SEGMENT_CODE",
		status: 409,
	},
	UQ_customer_segments_code: {
		message: "Ya existe un rango con ese código",
		code: "DUPLICATE_CUSTOMER_SEGMENT_CODE",
		status: 409,
	},
	client_customer_segments_client_segment_unique: {
		message: "El cliente ya pertenece a ese rango",
		code: "DUPLICATE_CLIENT_SEGMENT_ASSIGNMENT",
		status: 409,
	},
	UQ_client_customer_segments_client_segment: {
		message: "El cliente ya pertenece a ese rango",
		code: "DUPLICATE_CLIENT_SEGMENT_ASSIGNMENT",
		status: 409,
	},
	training_enrollments_event_user_unique: {
		message: "El usuario ya está inscrito en esta formación",
		code: "DUPLICATE_TRAINING_ENROLLMENT",
		status: 409,
	},
	UQ_training_enrollments_event_user: {
		message: "El usuario ya está inscrito en esta formación",
		code: "DUPLICATE_TRAINING_ENROLLMENT",
		status: 409,
	},
};

export class CommunicationsServiceError extends Error {
	status: number;
	code: string;

	constructor(
		message: string,
		status = 400,
		code = "COMMUNICATIONS_SERVICE_ERROR",
	) {
		super(message);
		this.name = "CommunicationsServiceError";
		this.status = status;
		this.code = code;
	}
}

function getDriverError(error: unknown): QueryDriverError | null {
	if (!(error instanceof QueryFailedError)) {
		return null;
	}

	const maybeDriverError = (
		error as QueryFailedError & { driverError?: QueryDriverError }
	).driverError;

	return maybeDriverError && typeof maybeDriverError === "object"
		? maybeDriverError
		: null;
}

export function rethrowCommunicationsPersistenceError(
	error: unknown,
	fallbackMessage: string,
	fallbackCode = "COMMUNICATIONS_PERSISTENCE_ERROR",
) {
	if (error instanceof CommunicationsServiceError) {
		throw error;
	}

	const driverError = getDriverError(error);

	if (driverError?.constraint && CONSTRAINT_ERRORS[driverError.constraint]) {
		const constraintError = CONSTRAINT_ERRORS[driverError.constraint];
		throw new CommunicationsServiceError(
			constraintError.message,
			constraintError.status ?? 409,
			constraintError.code,
		);
	}

	if (driverError?.code === "23503") {
		throw new CommunicationsServiceError(
			"Alguna de las relaciones indicadas no es válida",
			400,
			"INVALID_COMMUNICATIONS_RELATION",
		);
	}

	if (driverError?.code === "23514") {
		throw new CommunicationsServiceError(
			"Los datos no cumplen las reglas de negocio de comunicaciones",
			400,
			"INVALID_COMMUNICATIONS_CONSTRAINT",
		);
	}

	throw new CommunicationsServiceError(fallbackMessage, 500, fallbackCode);
}


