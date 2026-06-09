import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getProductSubcategoryFields,
	getProductSubcategoryInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";
import {
	getProductSubcategoryById,
	listProductSubcategories,
} from "@/lib/typeorm/services/catalog/product-subcategory";

type Props = {
	params: Promise<{ id: string }>;
};

function buildBackHref(productLineId: string | null) {
	if (!productLineId) {
		return "/admin/catalog/product-lines";
	}

	return `/admin/catalog/product-lines?expandedLineId=${encodeURIComponent(productLineId)}`;
}

export default async function EditProductSubcategoryPage({ params }: Props) {
	const { id } = await params;
	const [productSubcategory, productLines, productSubcategories] = await Promise.all([
		getProductSubcategoryById(id),
		listProductLines(),
		listProductSubcategories(),
	]);

	if (!productSubcategory) {
		notFound();
	}

	const backHref = buildBackHref(productSubcategory.product_line_id);
	const availableParentSubcategories = productSubcategories.filter(
		(candidate) => candidate.id !== productSubcategory.id,
	);

	return (
		<CatalogAdminEditShell
			title="Editar subcategoría"
			subtitle={`Actualiza línea, descripción y posición para ${productSubcategory.name}.`}
			backHref={backHref}
			backLabel="líneas comerciales"
		>
			<CatalogAdminForm
				entityLabel="subcategoría"
				entityLabelPlural="las subcategorías del catálogo"
				basePath={backHref}
				apiBasePath="/api/admin/catalog/product-subcategories"
				initialValues={getProductSubcategoryInitialValues(productSubcategory)}
				fields={getProductSubcategoryFields(
					productLines,
					availableParentSubcategories,
				)}
				editingId={productSubcategory.id}
				cancelHref={backHref}
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
