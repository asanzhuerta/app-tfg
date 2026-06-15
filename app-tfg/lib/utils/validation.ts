export function normalizeWhitespace(value: string | null | undefined) {
	return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeOptionalText(value: string | null | undefined) {
	if (value === undefined) {
		return undefined;
	}

	return normalizeWhitespace(value) || null;
}

export function normalizeRequiredTextValue(
	value: string | null | undefined,
	options: { maxLength?: number } = {},
) {
	const normalized = normalizeWhitespace(value);

	if (!normalized) {
		return null;
	}

	if (options.maxLength && normalized.length > options.maxLength) {
		return null;
	}

	return normalized;
}

export function parsePositiveIntegerValue(
	value: number | string | null | undefined,
) {
	if (value === null || value === undefined || String(value).trim() === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
