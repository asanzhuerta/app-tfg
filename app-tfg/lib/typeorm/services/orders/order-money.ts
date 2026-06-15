import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";
import {
	applyPercentageDiscountToCents as applySharedPercentageDiscountToCents,
	formatCents as formatSharedCents,
	parseNonNegativeMoneyToCents,
	parsePositiveMoneyToCents,
	parseStoredMoneyToCents as parseSharedStoredMoneyToCents,
} from "@/lib/utils/money";

export function parseMoneyToCents(value: string | number) {
	const cents = parseNonNegativeMoneyToCents(value);

	if (cents === null) {
		throw new OrderServiceError(
			"Importe de producto no valido",
			500,
			"INVALID_PRODUCT_PRICE",
		);
	}

	return cents;
}

export function parseStoredMoneyToCents(
	value: string | number | null | undefined,
) {
	return parseSharedStoredMoneyToCents(value);
}

export function normalizePaymentAmountToCents(
	value: string | number | null | undefined,
) {
	const cents = parsePositiveMoneyToCents(value);

	if (cents === null) {
		throw new OrderServiceError(
			"Debes indicar un importe de cobro mayor que cero",
			400,
			"ORDER_PAYMENT_AMOUNT_INVALID",
		);
	}

	return cents;
}

export function formatCents(cents: number) {
	return formatSharedCents(cents);
}

export function applyPercentageDiscountToCents(
	amountCents: number,
	discountPercentage: number,
) {
	return applySharedPercentageDiscountToCents(amountCents, discountPercentage);
}
