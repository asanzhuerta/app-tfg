import type {
	AppReminderStatus,
	NotificationDeliveryChannel,
	PromotionStatus,
	TrainingEventModality,
	TrainingEventStatus,
} from "@/lib/contracts/communications";
import type { PromotionDiscountTypeCode } from "@/lib/typeorm/entities/PromotionDiscountType";
import { CommunicationsServiceError } from "./communication-errors";
import {
	NOTIFICATION_DELIVERY_CHANNELS,
	PROMOTION_DISCOUNT_TYPE_CODES,
	PROMOTION_STATUSES,
	REMINDER_STATUSES,
	TRAINING_EVENT_STATUSES,
	TRAINING_MODALITIES,
} from "./communication-constants";

export function normalizeText(
	value: string | null | undefined,
	fieldName: string,
	options: { required?: boolean } = {},
) {
	if (value === undefined) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatorio`);
		}

		return undefined;
	}

	const normalized = String(value ?? "").trim().replace(/\s+/g, " ");

	if (!normalized && options.required) {
		throw new CommunicationsServiceError(`${fieldName} es obligatorio`);
	}

	return normalized || null;
}

export function normalizeCode(value: string | null | undefined, required = false) {
	const normalized = normalizeText(value, "El código", { required });

	if (normalized === undefined || normalized === null) {
		return normalized;
	}

	const code = normalized
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "");

	if (!code) {
		throw new CommunicationsServiceError("El código no es válido");
	}

	return code;
}

export function normalizeNotificationDeliveryChannels(
	value: NotificationDeliveryChannel[] | null | undefined,
) {
	const channels = new Set<NotificationDeliveryChannel>(["in_app"]);

	if (value === undefined || value === null) {
		return [...channels];
	}

	if (!Array.isArray(value)) {
		throw new CommunicationsServiceError("Los canales de envío no son válidos");
	}

	for (const rawChannel of value) {
		if (
			!NOTIFICATION_DELIVERY_CHANNELS.includes(
				rawChannel as (typeof NOTIFICATION_DELIVERY_CHANNELS)[number],
			)
		) {
			throw new CommunicationsServiceError(
				"Uno de los canales de envío no es válido",
			);
		}

		channels.add(rawChannel);
	}

	return [...channels];
}

export function normalizeOptionalId(value: string | null | undefined) {
	if (value === undefined) {
		return undefined;
	}

	const normalized = String(value ?? "").trim();
	return normalized || null;
}

export function normalizeDateOnly(
	value: string | null | undefined,
	fieldName: string,
	options: { required?: boolean } = {},
) {
	if (value === undefined) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatoria`);
		}

		return undefined;
	}

	const normalized = String(value ?? "").trim();

	if (!normalized) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatoria`);
		}

		return null;
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
		throw new CommunicationsServiceError(
			`${fieldName} debe tener formato YYYY-MM-DD`,
			400,
			"INVALID_DATE_FORMAT",
		);
	}

	const parsed = new Date(`${normalized}T00:00:00.000Z`);

	if (Number.isNaN(parsed.getTime())) {
		throw new CommunicationsServiceError(
			`${fieldName} no es una fecha válida`,
			400,
			"INVALID_DATE",
		);
	}

	return normalized;
}

export function normalizeDateTime(
	value: string | null | undefined,
	fieldName: string,
	options: { required?: boolean } = {},
) {
	if (value === undefined) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatoria`);
		}

		return undefined;
	}

	const normalized = String(value ?? "").trim();

	if (!normalized) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatoria`);
		}

		return null;
	}

	const parsed = new Date(normalized);

	if (Number.isNaN(parsed.getTime())) {
		throw new CommunicationsServiceError(
			`${fieldName} no es una fecha válida`,
			400,
			"INVALID_DATETIME",
		);
	}

	return parsed;
}

export function normalizePositiveInteger(
	value: number | string | null | undefined,
	fieldName: string,
) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null || String(value).trim() === "") {
		return null;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new CommunicationsServiceError(
			`${fieldName} debe ser un entero positivo`,
			400,
			"INVALID_POSITIVE_INTEGER",
		);
	}

	return parsed;
}

export function normalizeDecimalAmount(
	value: number | string | null | undefined,
	fieldName: string,
	options: { required?: boolean; max?: number } = {},
) {
	if (value === undefined) {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatorio`);
		}

		return undefined;
	}

	if (value === null || String(value).trim() === "") {
		if (options.required) {
			throw new CommunicationsServiceError(`${fieldName} es obligatorio`);
		}

		return null;
	}

	const parsed = Number(String(value).trim().replace(",", "."));

	if (
		!Number.isFinite(parsed) ||
		parsed < 0 ||
		(options.max !== undefined && parsed > options.max)
	) {
		throw new CommunicationsServiceError(
			`${fieldName} no es válido`,
			400,
			"INVALID_DECIMAL_AMOUNT",
		);
	}

	return parsed.toFixed(2);
}

export function normalizePromotionDiscountPercentage(
	value: number | string | null | undefined,
	fieldName = "El porcentaje de descuento",
	options: { required?: boolean } = {},
) {
	const normalized = normalizeDecimalAmount(value, fieldName, {
		...options,
		max: 100,
	});

	if (normalized === undefined || normalized === null) {
		return normalized;
	}

	if (Number(normalized) <= 0) {
		throw new CommunicationsServiceError(
			`${fieldName} debe ser mayor que cero`,
			400,
			"INVALID_PROMOTION_DISCOUNT_PERCENTAGE",
		);
	}

	return normalized;
}

export function normalizePromotionDiscountTypeCode(
	value: string | null | undefined,
) {
	if (value === undefined || value === null || String(value).trim() === "") {
		return undefined;
	}

	const normalized = String(value).trim();

	if (
		!PROMOTION_DISCOUNT_TYPE_CODES.includes(
			normalized as (typeof PROMOTION_DISCOUNT_TYPE_CODES)[number],
		)
	) {
		throw new CommunicationsServiceError(
			"El tipo de descuento no es válido",
			400,
			"INVALID_PROMOTION_DISCOUNT_TYPE",
		);
	}

	return normalized as PromotionDiscountTypeCode;
}

export function parseDiscountPercentageFromBenefit(value: string | null | undefined) {
	const match = String(value ?? "")
		.replace(",", ".")
		.match(/(\d+(?:\.\d+)?)/);
	const parsed = Number(match?.[1]);

	if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
		return null;
	}

	return parsed.toFixed(2);
}

export function buildPromotionBenefit(input: {
	benefit?: string | null;
	discountTypeCode: string;
	discountPercentage: string | null;
	minimumOrderAmount: string | null;
	giftDescription: string | null;
}) {
	if (input.benefit) {
		return input.benefit;
	}

	if (input.discountTypeCode === "volume_percentage_discount") {
		return `${input.discountPercentage}% de descuento desde ${input.minimumOrderAmount} EUR`;
	}

	if (input.discountTypeCode === "gift_product") {
		return input.giftDescription
			? `Regalo: ${input.giftDescription}`
			: "Producto de regalo incluido";
	}

	return `${input.discountPercentage}% de descuento`;
}

export function normalizePromotionStatus(
	value: PromotionStatus | undefined,
	required = false,
) {
	if (value === undefined) {
		if (required) {
			throw new CommunicationsServiceError("El estado es obligatorio");
		}

		return undefined;
	}

	if (!PROMOTION_STATUSES.includes(value)) {
		throw new CommunicationsServiceError(
			"El estado de la promoción no es válido",
			400,
			"INVALID_PROMOTION_STATUS",
		);
	}

	return value;
}

export function normalizeTrainingEventStatus(
	value: TrainingEventStatus | undefined,
	required = false,
) {
	if (value === undefined) {
		if (required) {
			throw new CommunicationsServiceError("El estado es obligatorio");
		}

		return undefined;
	}

	if (!TRAINING_EVENT_STATUSES.includes(value)) {
		throw new CommunicationsServiceError(
			"El estado de la formación no es válido",
			400,
			"INVALID_TRAINING_STATUS",
		);
	}

	return value;
}

export function normalizeTrainingEventModality(
	value: TrainingEventModality | undefined,
	required = false,
) {
	if (value === undefined) {
		if (required) {
			throw new CommunicationsServiceError("La modalidad es obligatoria");
		}

		return undefined;
	}

	if (!TRAINING_MODALITIES.includes(value)) {
		throw new CommunicationsServiceError(
			"La modalidad de la formación no es válida",
			400,
			"INVALID_TRAINING_MODALITY",
		);
	}

	return value;
}

export function normalizeReminderStatus(
	value: AppReminderStatus | undefined,
	required = false,
) {
	if (value === undefined) {
		if (required) {
			throw new CommunicationsServiceError("El estado es obligatorio");
		}

		return undefined;
	}

	if (!REMINDER_STATUSES.includes(value)) {
		throw new CommunicationsServiceError(
			"El estado del recordatorio no es válido",
			400,
			"INVALID_REMINDER_STATUS",
		);
	}

	return value;
}
