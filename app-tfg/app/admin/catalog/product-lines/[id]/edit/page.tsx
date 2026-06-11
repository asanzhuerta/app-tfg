import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getProductLineFields,
	getProductLineInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { listProductCategories } from "@/lib/typeorm/services/catalog/product-category";
import { getProductLineById } from "@/lib/typeorm/services/catalog/product-line";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditProductLinePage({ params }: Props) {
	const { id } = await params;
	const [productLine, productCategories] = await Promise.all([
		getProductLineById(id),
		listProductCategories(),
	]);

	if (!productLine) {
		notFound();
	}

	return (
		<CatalogAdminEditShell
			title="Editar línea comercial"
			subtitle={`Actualiza imagen, categoría y posicion para ${productLine.name}.`}
			backHref="/admin/catalog/product-lines"
		>
			<CatalogAdminForm
				entityLabel="línea comercial"
				entityLabelPlural="las líneas comerciales"
				basePath="/admin/catalog/product-lines"
				apiBasePath="/api/admin/catalog/product-lines"
				initialValues={getProductLineInitialValues(productLine)}
				fields={getProductLineFields(productCategories)}
				editingId={productLine.id}
				cancelHref="/admin/catalog/product-lines"
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
