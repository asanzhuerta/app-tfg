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
			title="Nueva subcategoria"
			subtitle="Crea una agrupacion interna para una linea cuando necesite identidad o imagen propia."
			backHref={backHref}
			backLabel="lineas comerciales"
		>
			<CatalogAdminForm
				entityLabel="subcategoria"
				entityLabelPlural="las subcategorias del catalogo"
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
