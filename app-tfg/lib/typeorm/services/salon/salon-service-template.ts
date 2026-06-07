import type {
	CreateSalonServiceProductUsageBody,
	SalonServiceTemplateProductUsageSummary,
	SalonServiceTemplateSummary,
} from "@/lib/contracts/salon";
import { getVisibleProductReference } from "@/lib/catalog/product-reference";
import { normalizeText } from "@/lib/utils/text";
import { getDataSource } from "@/lib/typeorm/data-source";
import { ColorReference } from "@/lib/typeorm/entities/ColorReference";
import { Product } from "@/lib/typeorm/entities/Product";
import { SalonServiceTemplate } from "@/lib/typeorm/entities/SalonServiceTemplate";
import { SalonServiceTemplateProductUsage } from "@/lib/typeorm/entities/SalonServiceTemplateProductUsage";
import { getClientByUserId } from "@/lib/typeorm/services/commercial/client";
import { SalonTechnicalServiceError } from "@/lib/typeorm/services/salon/salon-client";
import { In, type EntityManager, type Repository } from "typeorm";

type CreateSalonServiceTemplateInput = {
	name?: string | null;
	serviceType?: string | null;
	notes?: string | null;
	result?: string | null;
	technicalDescription?: string | null;
	formula?: string | null;
	technicalNotes?: string | null;
	productUsages?: CreateSalonServiceProductUsageBody[] | null;
};

type NormalizedSalonTemplateProductUsageInput = {
	productId: string;
	colorReferenceId: string | null;
	quantityUsed: string | null;
	notes: string | null;
};

type NormalizedSalonServiceTemplateInput = {
	name: string;
	serviceType: string;
	notes: string | null;
	result: string | null;
	technicalDescription: string | null;
	formula: string | null;
	technicalNotes: string | null;
	productUsages: NormalizedSalonTemplateProductUsageInput[];
};

function toIsoString(value: Date | string | null | undefined) {
	if (!value) {
		return "";
	}

	return value instanceof Date ? value.toISOString() : String(value);
}

function normalizeRequiredText(
	value: string | null | undefined,
	message: string,
	code: string,
) {
	const normalized = normalizeText(value);

	if (!normalized) {
		throw new SalonTechnicalServiceError(message, 400, code);
	}

	return normalized;
}

function normalizeOptionalQuantityUsed(value: number | string | null | undefined) {
	if (value === undefined || value === null || String(value).trim() === "") {
		return null;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new SalonTechnicalServiceError(
			"La cantidad usada debe ser un número positivo",
			400,
			"SALON_TEMPLATE_PRODUCT_USAGE_QUANTITY_INVALID",
		);
	}

	return parsed.toFixed(2);
}

function normalizeProductUsageInputs(
	productUsages: CreateSalonServiceProductUsageBody[] | null | undefined,
) {
	const sanitized = Array.isArray(productUsages) ? productUsages : [];
	const normalizedUsages: NormalizedSalonTemplateProductUsageInput[] = [];

	for (const productUsage of sanitized) {
		const productId = String(productUsage?.productId ?? "").trim();
		const colorReferenceId =
			String(productUsage?.colorReferenceId ?? "").trim() || null;
		const quantityUsed = normalizeOptionalQuantityUsed(productUsage?.quantityUsed);
		const notes = normalizeText(productUsage?.notes) || null;
		const isEmptyRow = !productId && !colorReferenceId && !quantityUsed && !notes;

		if (isEmptyRow) {
			continue;
		}

		if (!productId) {
			throw new SalonTechnicalServiceError(
				"Cada producto de la plantilla debe indicar un producto del catálogo",
				400,
				"SALON_TEMPLATE_PRODUCT_USAGE_PRODUCT_REQUIRED",
			);
		}

		normalizedUsages.push({
			productId,
			colorReferenceId,
			quantityUsed,
			notes,
		});
	}

	return normalizedUsages;
}

function normalizeSalonServiceTemplateInput(
	input: CreateSalonServiceTemplateInput,
): NormalizedSalonServiceTemplateInput {
	return {
		name: normalizeRequiredText(
			input.name,
			"Debes indicar un nombre para la plantilla",
			"SALON_TEMPLATE_NAME_REQUIRED",
		),
		serviceType: normalizeRequiredText(
			input.serviceType,
			"Debes indicar el tipo de servicio de la plantilla",
			"SALON_TEMPLATE_SERVICE_TYPE_REQUIRED",
		),
		notes: normalizeText(input.notes) || null,
		result: normalizeText(input.result) || null,
		technicalDescription: normalizeText(input.technicalDescription) || null,
		formula: normalizeText(input.formula) || null,
		technicalNotes: normalizeText(input.technicalNotes) || null,
		productUsages: normalizeProductUsageInputs(input.productUsages),
	};
}

async function requireClientProfileForUser(userId: string) {
	const client = await getClientByUserId(userId);

	if (!client) {
		throw new SalonTechnicalServiceError(
			"No existe una ficha de cliente profesional para este usuario",
			404,
			"SALON_TEMPLATE_OWNER_NOT_FOUND",
		);
	}

	return client;
}

async function ensureTemplateProductUsagesAreValid(
	manager: EntityManager,
	productUsages: NormalizedSalonTemplateProductUsageInput[],
) {
	if (productUsages.length === 0) {
		return;
	}

	const productIds = productUsages.map((productUsage) => productUsage.productId);
	const uniqueProductIds = Array.from(new Set(productIds));
	const products = await manager.getRepository(Product).findBy({
		id: In(uniqueProductIds),
	});

	if (products.length !== uniqueProductIds.length) {
		throw new SalonTechnicalServiceError(
			"Alguno de los productos indicados ya no existe en el catálogo",
			400,
			"SALON_TEMPLATE_PRODUCT_USAGE_PRODUCT_NOT_FOUND",
		);
	}

	const colorReferenceRepo = manager.getRepository(ColorReference);
	const linkedColorReferences = await colorReferenceRepo.findBy({
		product_id: In(uniqueProductIds),
	});
	const colorReferenceIds = Array.from(
		new Set(
			productUsages
				.map((productUsage) => productUsage.colorReferenceId)
				.filter((value): value is string => Boolean(value)),
		),
	);
	const selectedColorReferences =
		colorReferenceIds.length > 0
			? await colorReferenceRepo.findBy({
					id: In(colorReferenceIds),
				})
			: [];
	const selectedColorReferenceById = new Map(
		selectedColorReferences.map((colorReference) => [colorReference.id, colorReference]),
	);
	const linkedColorReferencesByProductId = linkedColorReferences.reduce<
		Map<string, ColorReference[]>
	>((acc, colorReference) => {
		if (!colorReference.product_id) {
			return acc;
		}

		const current = acc.get(colorReference.product_id) ?? [];
		current.push(colorReference);
		acc.set(colorReference.product_id, current);
		return acc;
	}, new Map());

	for (const productUsage of productUsages) {
		const linkedVariants =
			linkedColorReferencesByProductId.get(productUsage.productId) ?? [];

		if (linkedVariants.length === 0) {
			if (productUsage.colorReferenceId) {
				throw new SalonTechnicalServiceError(
					"La tonalidad seleccionada no corresponde con el producto de la plantilla",
					400,
					"SALON_TEMPLATE_PRODUCT_USAGE_COLOR_REFERENCE_INVALID",
				);
			}

			continue;
		}

		if (!productUsage.colorReferenceId) {
			throw new SalonTechnicalServiceError(
				"Debes indicar la tonalidad concreta para cada tinte de la plantilla",
				400,
				"SALON_TEMPLATE_PRODUCT_USAGE_COLOR_REFERENCE_REQUIRED",
			);
		}

		const selectedColorReference = selectedColorReferenceById.get(
			productUsage.colorReferenceId,
		);

		if (
			!selectedColorReference ||
			selectedColorReference.product_id !== productUsage.productId
		) {
			throw new SalonTechnicalServiceError(
				"La tonalidad seleccionada no corresponde con el producto de la plantilla",
				400,
				"SALON_TEMPLATE_PRODUCT_USAGE_COLOR_REFERENCE_INVALID",
			);
		}
	}
}

function createSalonServiceTemplatesBaseQuery(
	repo: Repository<SalonServiceTemplate>,
) {
	return repo
		.createQueryBuilder("template")
		.leftJoinAndSelect("template.productUsages", "productUsage")
		.leftJoinAndSelect("productUsage.colorReference", "colorReference")
		.leftJoinAndSelect("productUsage.product", "product")
		.leftJoinAndSelect("product.productLine", "productLine");
}

function mapSalonServiceTemplateProductUsage(
	productUsage: SalonServiceTemplateProductUsage,
): SalonServiceTemplateProductUsageSummary {
	return {
		id: productUsage.id,
		template_id: productUsage.template_id,
		product_id: productUsage.product_id,
		color_reference_id: productUsage.color_reference_id ?? null,
		color_reference_code: productUsage.colorReference?.code ?? null,
		color_reference_name: productUsage.colorReference?.name ?? null,
		product_name: productUsage.product?.name ?? "Producto",
		product_reference: getVisibleProductReference(
			productUsage.product?.reference ?? null,
		),
		product_line_name: productUsage.product?.productLine?.name ?? null,
		quantity_used: productUsage.quantity_used ?? null,
		notes: productUsage.notes ?? null,
	};
}

function mapSalonServiceTemplate(
	template: SalonServiceTemplate,
): SalonServiceTemplateSummary {
	const sortedProductUsages = [...(template.productUsages ?? [])].sort((a, b) => {
		const lineCompare = String(a.product?.productLine?.name ?? "").localeCompare(
			String(b.product?.productLine?.name ?? ""),
			"es",
			{ sensitivity: "base" },
		);

		if (lineCompare !== 0) {
			return lineCompare;
		}

		return String(a.product?.name ?? "").localeCompare(
			String(b.product?.name ?? ""),
			"es",
			{ sensitivity: "base" },
		);
	});

	return {
		id: template.id,
		client_id: template.client_id,
		created_by_user_id: template.created_by_user_id,
		name: template.name,
		service_type: template.service_type,
		notes: template.notes ?? null,
		result: template.result ?? null,
		technical_description: template.technical_description ?? null,
		formula: template.formula ?? null,
		technical_notes: template.technical_notes ?? null,
		product_usages: sortedProductUsages.map(mapSalonServiceTemplateProductUsage),
		created_at: toIsoString(template.created_at),
		updated_at: toIsoString(template.updated_at),
	};
}

async function getOwnedSalonServiceTemplate(
	manager: EntityManager,
	clientId: string,
	templateId: string,
) {
	const template = await createSalonServiceTemplatesBaseQuery(
		manager.getRepository(SalonServiceTemplate),
	)
		.where("template.id = :templateId", { templateId })
		.andWhere("template.client_id = :clientId", { clientId })
		.orderBy("productUsage.created_at", "ASC")
		.getOne();

	if (!template) {
		throw new SalonTechnicalServiceError(
			"La plantilla técnica solicitada no existe",
			404,
			"SALON_TEMPLATE_NOT_FOUND",
		);
	}

	return template;
}

async function replaceSalonServiceTemplateProductUsages(
	manager: EntityManager,
	templateId: string,
	productUsages: NormalizedSalonTemplateProductUsageInput[],
) {
	const productUsageRepo = manager.getRepository(SalonServiceTemplateProductUsage);

	await productUsageRepo.delete({
		template_id: templateId,
	});

	if (productUsages.length === 0) {
		return;
	}

	await productUsageRepo.save(
		productUsages.map((productUsage) =>
			productUsageRepo.create({
				template_id: templateId,
				product_id: productUsage.productId,
				color_reference_id: productUsage.colorReferenceId,
				quantity_used: productUsage.quantityUsed,
				notes: productUsage.notes,
			}),
		),
	);
}

export async function listSalonServiceTemplatesForClientUser(userId: string) {
	const client = await requireClientProfileForUser(userId);
	const ds = await getDataSource();
	const templates = await createSalonServiceTemplatesBaseQuery(
		ds.getRepository(SalonServiceTemplate),
	)
		.where("template.client_id = :clientId", { clientId: client.id })
		.orderBy("template.updated_at", "DESC")
		.addOrderBy("template.created_at", "DESC")
		.addOrderBy("productUsage.created_at", "ASC")
		.getMany();

	return templates.map(mapSalonServiceTemplate);
}

export async function createSalonServiceTemplateForClientUser(
	userId: string,
	input: CreateSalonServiceTemplateInput,
) {
	const client = await requireClientProfileForUser(userId);
	const normalizedInput = normalizeSalonServiceTemplateInput(input);
	const ds = await getDataSource();
	let createdTemplateId = "";

	await ds.transaction(async (manager) => {
		await ensureTemplateProductUsagesAreValid(
			manager,
			normalizedInput.productUsages,
		);

		const templateRepo = manager.getRepository(SalonServiceTemplate);
		const createdTemplate = await templateRepo.save(
			templateRepo.create({
				client_id: client.id,
				created_by_user_id: userId,
				name: normalizedInput.name,
				service_type: normalizedInput.serviceType,
				notes: normalizedInput.notes,
				result: normalizedInput.result,
				technical_description: normalizedInput.technicalDescription,
				formula: normalizedInput.formula,
				technical_notes: normalizedInput.technicalNotes,
			}),
		);

		createdTemplateId = createdTemplate.id;

		await replaceSalonServiceTemplateProductUsages(
			manager,
			createdTemplate.id,
			normalizedInput.productUsages,
		);
	});

	const savedTemplate = await getOwnedSalonServiceTemplate(
		ds.manager,
		client.id,
		createdTemplateId,
	);

	return mapSalonServiceTemplate(savedTemplate);
}

export async function deleteSalonServiceTemplateForClientUser(
	userId: string,
	templateId: string,
) {
	const client = await requireClientProfileForUser(userId);
	const ds = await getDataSource();

	await ds.transaction(async (manager) => {
		await getOwnedSalonServiceTemplate(manager, client.id, templateId);
		await manager.getRepository(SalonServiceTemplate).delete({
			id: templateId,
		});
	});

	return {
		id: templateId,
	};
}
