import ColorChartsExplorer from "@/app/components/catalog/ColorChartsExplorer";
import { buildCategoryBadgeClassMap } from "@/app/components/catalog/category-badge-palette";
import { listCatalogColorChartsWithReferences } from "@/lib/typeorm/services/catalog/catalog-reader";
import { listProductCategories } from "@/lib/typeorm/services/catalog/product-category";

export default async function CommercialColorationPage() {
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
			subtitle="Explora cartas de color y referencias para asesoramiento tecnico"
			colorCharts={colorCharts}
			colorReferences={colorReferences}
			categoryBadgeClassMap={categoryBadgeClassMap}
			detailBasePath="/commercials/coloration"
		/>
	);
}
