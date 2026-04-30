import { getDataSource } from "@/lib/typeorm/data-source";
import type { AdminUpsertProductSubcategoryBody } from "@/lib/contracts/product-catalog";
import { Product } from "@/lib/typeorm/entities/Product";
import { ProductSubcategory } from "@/lib/typeorm/entities/ProductSubcategory";
import { normalizeProductSubcategoryWriteInput } from "./catalog-validation";
import {
	CatalogServiceError,
	cleanupCatalogImageReplacement,
	requireProductLine,
	rethrowCatalogPersistenceError,
} from "./catalog-internal";

type ListProductSubcategoriesInput = {
	productLineId?: string | null;
	search?: string | null;
};

export async function listProductSubcategories(
	input: ListProductSubcategoriesInput = {},
) {
	const ds = await getDataSource();
	const repo = ds.getRepository(ProductSubcategory);
	const query = repo
		.createQueryBuilder("productSubcategory")
		.leftJoinAndSelect("productSubcategory.productLine", "productLine")
		.leftJoinAndSelect("productLine.productCategory", "productCategory")
		.orderBy("productSubcategory.display_order", "ASC")
		.addOrderBy("productSubcategory.name", "ASC");

	const productLineId = String(input.productLineId ?? "").trim();
	const search = String(input.search ?? "").trim();

	if (productLineId) {
		query.andWhere("productSubcategory.product_line_id = :productLineId", {
			productLineId,
		});
	}

	if (search) {
		query.andWhere(
			`(
				productSubcategory.name ILIKE :search
				OR COALESCE(productSubcategory.description, '') ILIKE :search
				OR productLine.name ILIKE :search
				OR COALESCE(productCategory.name, '') ILIKE :search
			)`,
			{ search: `%${search}%` },
		);
	}

	return query.getMany();
}

export async function getProductSubcategoryById(id: string) {
	const ds = await getDataSource();
	const repo = ds.getRepository(ProductSubcategory);

	return repo.findOne({
		where: { id },
		relations: {
			productLine: {
				productCategory: true,
			},
		},
	});
}

export async function createProductSubcategory(
	input: AdminUpsertProductSubcategoryBody,
) {
	const ds = await getDataSource();
	const normalized = normalizeProductSubcategoryWriteInput(input, {
		required: true,
	});

	try {
		const createdProductSubcategory = await ds.transaction(async (manager) => {
			await requireProductLine(manager, String(normalized.productLineId));

			const repo = manager.getRepository(ProductSubcategory);
			const productSubcategory = repo.create({
				name: normalized.name,
				description: normalized.description ?? null,
				product_line_id: String(normalized.productLineId),
				image_url: normalized.imageUrl ?? null,
				display_order: normalized.displayOrder ?? 0,
			});

			return repo.save(productSubcategory);
		});

		return getProductSubcategoryById(createdProductSubcategory.id);
	} catch (error) {
		rethrowCatalogPersistenceError(
			error,
			"No se pudo crear la subcategoria",
			"PRODUCT_SUBCATEGORY_CREATE_FAILED",
		);
	}
}

export async function updateProductSubcategory(
	input: { productSubcategoryId: string } & AdminUpsertProductSubcategoryBody,
) {
	const ds = await getDataSource();
	const normalized = normalizeProductSubcategoryWriteInput(input);

	try {
		const updatedProductSubcategory = await ds.transaction(async (manager) => {
			const repo = manager.getRepository(ProductSubcategory);
			const productSubcategory = await repo.findOne({
				where: { id: input.productSubcategoryId },
			});

			if (!productSubcategory) {
				throw new CatalogServiceError(
					"Subcategoria no encontrada",
					404,
					"PRODUCT_SUBCATEGORY_NOT_FOUND",
				);
			}

			const previousImageUrl = productSubcategory.image_url;

			if (normalized.productLineId !== undefined) {
				if (
					normalized.productLineId !== productSubcategory.product_line_id
				) {
					const linkedProductsCount = await manager.getRepository(Product).count({
						where: {
							product_subcategory_id: input.productSubcategoryId,
						},
					});

					if (linkedProductsCount > 0) {
						throw new CatalogServiceError(
							"No se puede cambiar la linea de una subcategoria que ya tiene productos asociados",
							400,
							"PRODUCT_SUBCATEGORY_LINE_CHANGE_WITH_PRODUCTS",
						);
					}
				}

				await requireProductLine(manager, normalized.productLineId);
				productSubcategory.product_line_id = normalized.productLineId;
			}

			if (normalized.name !== undefined) {
				productSubcategory.name = normalized.name;
			}

			if (normalized.description !== undefined) {
				productSubcategory.description = normalized.description;
			}

			if (normalized.imageUrl !== undefined) {
				productSubcategory.image_url = normalized.imageUrl;
			}

			if (normalized.displayOrder !== undefined) {
				productSubcategory.display_order = normalized.displayOrder;
			}

			const savedProductSubcategory = await repo.save(productSubcategory);

			return {
				id: savedProductSubcategory.id,
				previousImageUrl,
				nextImageUrl: savedProductSubcategory.image_url,
			};
		});

		await cleanupCatalogImageReplacement(
			updatedProductSubcategory.previousImageUrl,
			updatedProductSubcategory.nextImageUrl,
			"catalog/product-subcategory",
		);

		return getProductSubcategoryById(updatedProductSubcategory.id);
	} catch (error) {
		rethrowCatalogPersistenceError(
			error,
			"No se pudo actualizar la subcategoria",
			"PRODUCT_SUBCATEGORY_UPDATE_FAILED",
		);
	}
}
