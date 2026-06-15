import type {
	SalonServiceSummary,
	SalonServiceTemplateSummary,
} from "@/lib/contracts/salon";
import { deleteSalonResultImage } from "./salon-client-api";
import { buildSalonProductSelectionId } from "./salon-ui";
export { inputClassName, textareaClassName } from "@/app/components/ui/form-styles";

export type EditableProductUsage = {
	localId: string;
	selectionId: string;
	quantityUsed: string;
	notes: string;
};

export type EditableResultImage = {
	localId: string;
	imageUrl: string;
	persisted: boolean;
};

export async function cleanupTransientResultImages(
	images: EditableResultImage[],
) {
	const transientImages = images.filter((image) => !image.persisted);

	await Promise.allSettled(
		transientImages.map((image) =>
			deleteSalonResultImage(image.imageUrl).catch(() => null),
		),
	);
}

export function createEmptyProductUsage(
	localId = `usage-${Date.now()}`,
): EditableProductUsage {
	return {
		localId,
		selectionId: "",
		quantityUsed: "",
		notes: "",
	};
}

export function createProductUsageFromService(
	service: SalonServiceSummary,
	index: number,
): EditableProductUsage {
	const productUsage = service.product_usages[index];

	if (!productUsage) {
		return createEmptyProductUsage(`usage-${service.id}-${index}`);
	}

	return {
		localId: `usage-${service.id}-${productUsage.id}`,
		selectionId: buildSalonProductSelectionId(
			productUsage.product_id,
			productUsage.color_reference_id,
		),
		quantityUsed: productUsage.quantity_used ?? "",
		notes: productUsage.notes ?? "",
	};
}

export function createProductUsageFromTemplate(
	template: SalonServiceTemplateSummary,
	index: number,
): EditableProductUsage {
	const productUsage = template.product_usages[index];

	if (!productUsage) {
		return createEmptyProductUsage(`template-usage-${template.id}-${index}`);
	}

	return {
		localId: `template-usage-${template.id}-${productUsage.id}`,
		selectionId: buildSalonProductSelectionId(
			productUsage.product_id,
			productUsage.color_reference_id,
		),
		quantityUsed: productUsage.quantity_used ?? "",
		notes: productUsage.notes ?? "",
	};
}

export function createEditableResultImage(
	imageUrl: string,
	persisted: boolean,
	localId = `result-image-${Date.now()}-${Math.random().toString(16).slice(2)}`,
): EditableResultImage {
	return {
		localId,
		imageUrl,
		persisted,
	};
}

export function buildServiceSearchValue(service: SalonServiceSummary) {
	const productSearchValue = service.product_usages
		.flatMap((productUsage) => [
			productUsage.product_name,
			productUsage.product_reference ?? "",
			productUsage.color_reference_code ?? "",
			productUsage.color_reference_name ?? "",
			productUsage.product_line_name ?? "",
			productUsage.notes ?? "",
		])
		.join(" ");

	return [
		service.service_type,
		service.result ?? "",
		service.notes ?? "",
		service.technical_description ?? "",
		service.formula ?? "",
		service.technical_notes ?? "",
		productSearchValue,
		...service.result_images.map((resultImage) => resultImage.image_url),
	]
		.join(" ")
		.toLocaleLowerCase("es");
}
