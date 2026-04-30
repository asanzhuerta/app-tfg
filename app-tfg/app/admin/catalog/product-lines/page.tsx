import H1Title from "@/app/components/H1Title";
import CatalogAdminWorkspace from "@/app/components/catalog-admin/CatalogAdminWorkspace";
import type { EntityTableItem } from "@/app/components/entity-table/entity-table-types";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";

function getCategoryBadgeClass(categoryName: string | undefined) {
	switch (categoryName) {
		case "COLORACION":
			return "bg-sky-100 text-sky-700 border border-sky-200";
		case "FORMA":
			return "bg-violet-100 text-violet-700 border border-violet-200";
		case "ALTO RENDIMIENTO":
			return "bg-amber-100 text-amber-700 border border-amber-200";
		case "ACABADO":
			return "bg-emerald-100 text-emerald-700 border border-emerald-200";
		case "HOMBRE":
			return "bg-slate-200 text-slate-700 border border-slate-300";
		case "CUIDADO CAPILAR":
			return "bg-rose-100 text-rose-700 border border-rose-200";
		default:
			return "bg-slate-100 text-slate-700 border border-slate-200";
	}
}

function mapProductLineToItem(
	productLine: Awaited<ReturnType<typeof listProductLines>>[number],
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
				className: getCategoryBadgeClass(productLine.productCategory?.name),
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
	const productLines = await listProductLines();

	return (
		<div className="space-y-6">
			<H1Title
				title="Lineas comerciales"
				subtitle="Gestiona las agrupaciones especificas de la oferta del distribuidor"
			/>

			<CatalogAdminWorkspace
				entityLabel="linea comercial"
				basePath="/admin/catalog/product-lines"
				items={productLines.map(mapProductLineToItem)}
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
