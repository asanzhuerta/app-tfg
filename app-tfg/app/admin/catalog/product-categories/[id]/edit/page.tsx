import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getProductCategoryFields,
	getProductCategoryInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { getProductCategoryById } from "@/lib/typeorm/services/catalog/product-category";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditProductCategoryPage({ params }: Props) {
	const { id } = await params;
	const category = await getProductCategoryById(id);

	if (!category) {
		notFound();
	}

	return (
		<CatalogAdminEditShell
			title="Editar categoria"
			subtitle={`Actualiza la estructura base del catalogo para ${category.name}.`}
			backHref="/admin/catalog/product-categories"
			backLabel="categorias"
		>
			<CatalogAdminForm
				entityLabel="categoria"
				entityLabelPlural="las categorias del catalogo"
				basePath="/admin/catalog/product-categories"
				apiBasePath="/api/admin/catalog/product-categories"
				initialValues={getProductCategoryInitialValues(category)}
				fields={getProductCategoryFields()}
				editingId={category.id}
				cancelHref="/admin/catalog/product-categories"
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
