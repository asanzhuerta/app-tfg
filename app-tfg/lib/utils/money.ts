export function parseDecimalNumber(value: string | number | null | undefined) {
	const parsed = Number(String(value ?? "").trim().replace(",", "."));
	return Number.isFinite(parsed) ? parsed : null;
}

export function parseNonNegativeMoneyToCents(
	value: string | number | null | undefined,
) {
	const parsed = parseDecimalNumber(value);

	if (parsed === null || parsed < 0) {
		return null;
	}

	return Math.round(parsed * 100);
}

export function parsePositiveMoneyToCents(
	value: string | number | null | undefined,
) {
	const parsed = parseDecimalNumber(value);

	if (parsed === null || parsed <= 0) {
		return null;
	}

	return Math.round(parsed * 100);
}

export function parseStoredMoneyToCents(
	value: string | number | null | undefined,
) {
	const parsed = parseDecimalNumber(value);
	return parsed !== null && parsed > 0 ? Math.round(parsed * 100) : 0;
}

export function formatCents(cents: number) {
	return (Math.max(0, cents) / 100).toFixed(2);
}

export function formatCurrency(
	value: string | number | null | undefined,
	fallback = String(value ?? ""),
) {
	const parsed = parseDecimalNumber(value);

	if (parsed === null) {
		return fallback;
	}

	return parsed.toLocaleString("es-ES", {
		style: "currency",
		currency: "EUR",
	});
}

export function formatNumber(
	value: string | number | null | undefined,
	fallback = String(value ?? ""),
) {
	const parsed = parseDecimalNumber(value);

	if (parsed === null) {
		return fallback;
	}

	return parsed.toLocaleString("es-ES", {
		maximumFractionDigits: 2,
		minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
	});
}

export function parsePercentage(value: string | number | null | undefined) {
	const parsed = parseDecimalNumber(value);

	if (parsed === null || parsed <= 0 || parsed > 100) {
		return 0;
	}

	return parsed;
}

export function formatPercentage(value: string | number | null | undefined) {
	return formatNumber(value);
}

export function applyPercentageDiscountToCents(
	amountCents: number,
	discountPercentage: number,
) {
	const basisPoints = Math.round(discountPercentage * 100);
	const discountedAmount = Math.round(
		(amountCents * Math.max(0, 10_000 - basisPoints)) / 10_000,
	);

	return Math.max(0, discountedAmount);
}
