import CatalogAdminCreateShell from "@/app/admin/catalog/_shared/CatalogAdminCreateShell";
import {
	getProductSubcategoryFields,
	getProductSubcategoryInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";
import { listProductSubcategories } from "@/lib/typeorm/services/catalog/product-subcategory";

type Props = {
	searchParams?: Promise<{
		productLineId?: string | string[];
	}>;
};

type NewProductSubcategorySearchParams = {
	productLineId?: string | string[];
};

function buildBackHref(productLineId: string | null) {
	if (!productLineId) {
		return "/admin/catalog/product-lines";
	}

	return `/admin/catalog/product-lines?expandedLineId=${encodeURIComponent(productLineId)}`;
}

export default async function NewProductSubcategoryPage({
	searchParams,
}: Props) {
	const [{ productLineId }, productLines, productSubcategories] = await Promise.all([
		searchParams ?? Promise.resolve<NewProductSubcategorySearchParams>({}),
		listProductLines(),
		listProductSubcategories(),
	]);
	const resolvedProductLineId = Array.isArray(productLineId)
		? productLineId[0] ?? ""
		: productLineId ?? "";
	const backHref = buildBackHref(resolvedProductLineId || null);

	return (
		<CatalogAdminCreateShell
			title="Nueva subcategoría"
			subtitle="Crea una agrupación interna dentro de una línea comercial."
			backHref={backHref}
			backLabel="líneas comerciales"
		>
			<CatalogAdminForm
				entityLabel="subcategoría"
				entityLabelPlural="las subcategorías del catálogo"
				basePath={backHref}
				apiBasePath="/api/admin/catalog/product-subcategories"
				initialValues={{
					...getProductSubcategoryInitialValues(),
					productLineId: resolvedProductLineId,
				}}
				fields={getProductSubcategoryFields(
					productLines,
					productSubcategories,
				)}
				cancelHref={backHref}
				showHeader={false}
			/>
		</CatalogAdminCreateShell>
	);
}
