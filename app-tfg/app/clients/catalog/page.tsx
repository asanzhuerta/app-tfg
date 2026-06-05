import CatalogProductsExplorer from "@/app/components/catalog/CatalogProductsExplorer";
import { listActiveCatalogProducts } from "@/lib/typeorm/services/catalog/catalog-reader";

export default async function ClientCatalogPage() {
	const products = await listActiveCatalogProducts();

	return (
		<CatalogProductsExplorer
			title="Catálogo"
			subtitle="Explora productos, formatos y documentación técnica"
			products={products}
			detailBasePath="/clients/catalog"
		/>
	);
}
