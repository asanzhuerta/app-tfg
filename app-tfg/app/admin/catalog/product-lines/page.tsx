import H1Title from "@/app/components/H1Title";
import {
	buildCategoryBadgeClassMap,
	getCategoryBadgeClass,
} from "@/app/components/catalog/category-badge-palette";
import CatalogAdminWorkspace from "@/app/components/catalog-admin/CatalogAdminWorkspace";
import type { EntityTableItem } from "@/app/components/entity-table/entity-table-types";
import { listProductCategories } from "@/lib/typeorm/services/catalog/product-category";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";

function mapProductLineToItem(
	productLine: Awaited<ReturnType<typeof listProductLines>>[number],
	categoryBadgeClassMap: Map<string, string>,
): EntityTableItem {
	return {
		id: productLine.id,
		title: productLine.name,
		subtitle: productLine.description || "Sin descripcion",
		imageUrl: productLine.image_url,
		category: productLine.productCategory?.name ?? "Sin categoria",
		status: productLine.image_url ? "Con imagen" : "Sin imagen",
		primaryDate: String(9999 - productLine.display_order).padStart(4, "0"),
		badges: [
			{
				label: productLine.productCategory?.name ?? "Sin categoria",
				className: getCategoryBadgeClass(
					productLine.productCategory?.name,
					categoryBadgeClassMap,
				),
			},
		],
		fields: [],
		actions: [
			{
				label: "Editar",
				href: `/admin/catalog/product-lines/${productLine.id}/edit`,
				variant: "secondary",
			},
		],
		searchText: [
			productLine.name,
			productLine.description,
			productLine.productCategory?.name,
		]
			.filter(Boolean)
			.join(" "),
	};
}

export default async function AdminProductLinesPage() {
	const [productLines, productCategories] = await Promise.all([
		listProductLines(),
		listProductCategories(),
	]);
	const categoryBadgeClassMap = buildCategoryBadgeClassMap(
		productCategories.map((productCategory) => productCategory.name),
	);

	return (
		<div className="space-y-6">
			<H1Title
				title="Lineas comerciales"
				subtitle="Gestiona las agrupaciones especificas de la oferta del distribuidor"
			/>

			<CatalogAdminWorkspace
				entityLabel="linea comercial"
				basePath="/admin/catalog/product-lines"
				items={productLines.map((productLine) =>
					mapProductLineToItem(productLine, categoryBadgeClassMap),
				)}
				metrics={[
					{ label: "lineas", value: productLines.length },
					{
						label: "con imagen",
						value: productLines.filter((productLine) => Boolean(productLine.image_url))
							.length,
					},
					{
						label: "categorias usadas",
						value: new Set(
							productLines.map((productLine) => productLine.product_category_id),
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
					emptyMessage: "No hay lineas comerciales registradas todavia.",
				}}
			/>
		</div>
	);
}
