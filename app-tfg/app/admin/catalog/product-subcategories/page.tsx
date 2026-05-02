import H1Title from "@/app/components/H1Title";
import {
	buildCategoryBadgeClassMap,
	getCategoryBadgeClass,
} from "@/app/components/catalog/category-badge-palette";
import CatalogAdminWorkspace from "@/app/components/catalog-admin/CatalogAdminWorkspace";
import type { EntityTableItem } from "@/app/components/entity-table/entity-table-types";
import { listProductCategories } from "@/lib/typeorm/services/catalog/product-category";
import { listProductSubcategories } from "@/lib/typeorm/services/catalog/product-subcategory";

function mapProductSubcategoryToItem(
	productSubcategory: Awaited<ReturnType<typeof listProductSubcategories>>[number],
	categoryBadgeClassMap: Map<string, string>,
): EntityTableItem {
	return {
		id: productSubcategory.id,
		title: productSubcategory.name,
		subtitle: productSubcategory.description || "Sin descripcion",
		imageUrl: productSubcategory.image_url,
		category:
			productSubcategory.productLine?.productCategory?.name ?? "Sin categoria",
		status: productSubcategory.image_url ? "Con imagen" : "Sin imagen",
		primaryDate: String(9999 - productSubcategory.display_order).padStart(4, "0"),
		badges: [
			{
				label:
					productSubcategory.productLine?.productCategory?.name ??
					"Sin categoria",
				className: getCategoryBadgeClass(
					productSubcategory.productLine?.productCategory?.name,
					categoryBadgeClassMap,
				),
			},
			{
				label: productSubcategory.productLine?.name ?? "Sin linea",
				className: "bg-slate-100 text-slate-700 border border-slate-200",
			},
		],
		fields: [],
		actions: [
			{
				label: "Editar",
				href: `/admin/catalog/product-subcategories/${productSubcategory.id}/edit`,
				variant: "secondary",
			},
		],
		filterValues: {
			productLine: productSubcategory.productLine?.name ?? null,
		},
		searchText: [
			productSubcategory.name,
			productSubcategory.description,
			productSubcategory.productLine?.name,
			productSubcategory.productLine?.productCategory?.name,
		]
			.filter(Boolean)
			.join(" "),
	};
}

export default async function AdminProductSubcategoriesPage() {
	const [productSubcategories, productCategories] = await Promise.all([
		listProductSubcategories(),
		listProductCategories(),
	]);
	const categoryBadgeClassMap = buildCategoryBadgeClassMap(
		productCategories.map((productCategory) => productCategory.name),
	);

	return (
		<div className="space-y-6">
			<H1Title
				title="Subcategorias"
				subtitle="Gestiona los grupos internos de una linea cuando necesitan imagen o identidad propia"
			/>

			<CatalogAdminWorkspace
				entityLabel="subcategoria"
				basePath="/admin/catalog/product-subcategories"
				items={productSubcategories.map((productSubcategory) =>
					mapProductSubcategoryToItem(
						productSubcategory,
						categoryBadgeClassMap,
					),
				)}
				metrics={[
					{ label: "subcategorias", value: productSubcategories.length },
					{
						label: "con imagen",
						value: productSubcategories.filter((item) => Boolean(item.image_url))
							.length,
					},
					{
						label: "lineas usadas",
						value: new Set(
							productSubcategories.map((item) => item.product_line_id),
						).size,
					},
				]}
				tableConfig={{
					categoryLabel: "Categoria",
					statusLabel: "Imagen",
					showImageFilter: true,
					cardVariant: "media",
					gridClassName:
						"grid grid-cols-1 gap-3 p-3 lg:grid-cols-2 2xl:grid-cols-3",
					extraFilters: [
						{
							key: "productLine",
							label: "Linea comercial",
							allLabel: "Todas",
						},
					],
					emptyMessage: "No hay subcategorias registradas todavia.",
				}}
			/>
		</div>
	);
}
