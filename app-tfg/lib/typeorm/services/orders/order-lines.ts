import type { CreateOrderLineBody } from "@/lib/contracts/order";
import { OrderServiceError } from "@/lib/typeorm/services/orders/order-errors";

export type NormalizedOrderLineInput = {
	productId: string;
	colorReferenceId: string | null;
	quantity: number;
};

export type PreparedOrderLineRecord = {
	productId: string;
	colorReferenceId: string | null;
	quantity: number;
	unitPriceSnapshot: string;
	discountPercentage: string;
	lineTotal: string;
	orderReferenceSnapshot: string;
	variantCodeSnapshot: string | null;
	variantNameSnapshot: string | null;
};

function buildOrderLineMergeKey(line: {
	productId: string;
	colorReferenceId?: string | null;
}) {
	return `${line.productId}::${String(line.colorReferenceId ?? "").trim()}`;
}

export function normalizeRequestedOrderLines(
	lines: CreateOrderLineBody[] | null | undefined,
	options: {
		allowEmpty?: boolean;
	} = {},
) {
	const sanitized = Array.isArray(lines) ? lines : [];

	if (sanitized.length === 0) {
		if (options.allowEmpty) {
			return [] as NormalizedOrderLineInput[];
		}

		throw new OrderServiceError(
			"Debes indicar al menos un producto para el pedido",
			400,
			"ORDER_LINES_REQUIRED",
		);
	}

	const merged = new Map<string, NormalizedOrderLineInput>();

	for (const line of sanitized) {
		const productId = String(line?.productId ?? "").trim();
		const colorReferenceId = String(line?.colorReferenceId ?? "").trim() || null;
		const quantity = Number(line?.quantity);

		if (!productId) {
			throw new OrderServiceError(
				"Cada línea del pedido debe indicar un producto",
				400,
				"ORDER_LINE_PRODUCT_REQUIRED",
			);
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new OrderServiceError(
				"La cantidad de cada línea debe ser un entero positivo",
				400,
				"ORDER_LINE_QUANTITY_INVALID",
			);
		}

		const key = buildOrderLineMergeKey({ productId, colorReferenceId });
		const current = merged.get(key);

		merged.set(key, {
			productId,
			colorReferenceId,
			quantity: (current?.quantity ?? 0) + quantity,
		});
	}

	return Array.from(merged.values());
}
