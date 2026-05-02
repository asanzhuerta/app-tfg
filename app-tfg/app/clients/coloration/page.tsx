import ColorChartsExplorer from "@/app/components/catalog/ColorChartsExplorer";
import { buildCategoryBadgeClassMap } from "@/app/components/catalog/category-badge-palette";
import { listCatalogColorChartsWithReferences } from "@/lib/typeorm/services/catalog/catalog-reader";
import { listProductCategories } from "@/lib/typeorm/services/catalog/product-category";

export default async function ClientColorationPage() {
	const [{ colorCharts, colorReferences }, productCategories] = await Promise.all([
		listCatalogColorChartsWithReferences(),
		listProductCategories(),
	]);
	const categoryBadgeClassMap = buildCategoryBadgeClassMap(
		productCategories.map((productCategory) => productCategory.name),
	);

	return (
		<ColorChartsExplorer
			title="Coloracion"
			subtitle="Consulta gamas, cartas y tonos disponibles en el catalogo"
			colorCharts={colorCharts}
			colorReferences={colorReferences}
			categoryBadgeClassMap={categoryBadgeClassMap}
			detailBasePath="/clients/coloration"
		/>
	);
}
