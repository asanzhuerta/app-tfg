export type DateLike = Date | string | null | undefined;

type DateParseOptions = {
	dateOnly?: boolean;
};

const numericDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const madridDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	timeZone: "Europe/Madrid",
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "2-digit",
});

const displayDateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const displayDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const mediumDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

const longUtcDateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});

export function parseDateLike(
	value: DateLike,
	options: DateParseOptions = {},
) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const rawValue = String(value);
	const parsed =
		options.dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
			? new Date(`${rawValue}T00:00:00`)
			: new Date(rawValue);

	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatNumericDateTime(value: DateLike, fallback = "-") {
	const date = parseDateLike(value);
	return date ? numericDateTimeFormatter.format(date) : fallback;
}

export function formatMadridDateTime(value: DateLike, fallback = "-") {
	const date = parseDateLike(value);
	return date ? madridDateTimeFormatter.format(date) : fallback;
}

export function formatShortDate(value: DateLike, fallback = "-") {
	const date = parseDateLike(value);
	return date ? shortDateFormatter.format(date) : fallback;
}

export function formatDisplayDate(value: DateLike, fallback = "-") {
	const date = parseDateLike(value, { dateOnly: true });
	return date ? displayDateFormatter.format(date) : fallback;
}

export function formatDisplayDateTime(value: DateLike, fallback = "--") {
	const date = parseDateLike(value);
	return date ? displayDateTimeFormatter.format(date) : fallback;
}

export function formatMediumDateTime(value: DateLike, fallback = "--") {
	const date = parseDateLike(value);
	return date ? mediumDateTimeFormatter.format(date) : fallback;
}

export function formatLongUtcDate(value: DateLike, fallback = "-") {
	const date = parseDateLike(value);
	return date ? longUtcDateFormatter.format(date) : fallback;
}

export function toDateTimeLocalInputValue(value: DateLike) {
	const date = parseDateLike(value);

	if (!date) {
		return typeof value === "string" ? value.slice(0, 16) : "";
	}

	const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return localTime.toISOString().slice(0, 16);
}

export function toLocalDateInputValue(value: DateLike) {
	const date = parseDateLike(value);

	if (!date) {
		return "";
	}

	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return localDate.toISOString().slice(0, 10);
}
