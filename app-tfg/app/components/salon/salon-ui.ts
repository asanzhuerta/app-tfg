import type { ApiErrorResponse } from "@/lib/contracts/api";
import type {
	SalonProductOption,
	SalonServiceProductUsageSummary,
} from "@/lib/contracts/salon";

export function buildSalonProductSelectionId(
	productId: string,
	colorReferenceId: string | null | undefined = null,
) {
	const normalizedProductId = String(productId ?? "").trim();
	const normalizedColorReferenceId = String(colorReferenceId ?? "").trim();

	return normalizedColorReferenceId
		? `${normalizedProductId}::${normalizedColorReferenceId}`
		: normalizedProductId;
}

export function formatSalonQuantity(value: string | null | undefined) {
	const parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		return null;
	}

	return parsed.toLocaleString("es-ES", {
		minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
		maximumFractionDigits: 2,
	});
}

export function buildSalonColorToneLabel(params: {
	colorReferenceCode?: string | null;
	colorReferenceName?: string | null;
}) {
	const parts = [
		params.colorReferenceCode ? `tono ${params.colorReferenceCode}` : null,
		params.colorReferenceName,
	].filter(Boolean);

	return parts.length > 0 ? parts.join(" / ") : null;
}

export function buildSalonProductLabel(product: SalonProductOption) {
	const contextParts = [
		product.productLineName,
		buildSalonColorToneLabel({
			colorReferenceCode: product.colorReferenceCode,
			colorReferenceName: product.colorReferenceName,
		}),
		product.format,
	].filter(Boolean);

	return `${product.reference ? `${product.reference} - ` : ""}${product.name}${
		contextParts.length > 0 ? ` - ${contextParts.join(" / ")}` : ""
	}`;
}

export function buildSalonProductUsageLabel(
	productUsage: Pick<
		SalonServiceProductUsageSummary,
		| "product_name"
		| "product_reference"
		| "color_reference_code"
		| "color_reference_name"
	>,
) {
	const titleParts = [productUsage.product_name];

	if (productUsage.product_reference) {
		titleParts.push(productUsage.product_reference);
	}

	const toneLabel = buildSalonColorToneLabel({
		colorReferenceCode: productUsage.color_reference_code,
		colorReferenceName: productUsage.color_reference_name,
	});

	return toneLabel
		? `${titleParts.join(" - ")} - ${toneLabel}`
		: titleParts.join(" - ");
}

export function getApiErrorMessage(
	data: ApiErrorResponse | null | undefined,
	fallback: string,
) {
	return data?.error || data?.message || fallback;
}
