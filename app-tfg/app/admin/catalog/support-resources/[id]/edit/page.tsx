import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getSupportResourceFields,
	getSupportResourceInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { listSupportResourceTypes } from "@/lib/typeorm/services/catalog/lookups";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";
import { listProducts } from "@/lib/typeorm/services/catalog/product";
import { getSupportResourceById } from "@/lib/typeorm/services/catalog/support-resource";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditSupportResourcePage({ params }: Props) {
	const { id } = await params;
	const [supportResource, supportResourceTypes, products, productLines] =
		await Promise.all([
			getSupportResourceById(id),
			listSupportResourceTypes(),
			listProducts(),
			listProductLines(),
		]);

	if (!supportResource) {
		notFound();
	}

	return (
		<CatalogAdminEditShell
			title="Editar recurso de apoyo"
			subtitle={`Actualiza el contexto y la documentación de ${supportResource.title}.`}
			backHref="/admin/catalog/support-resources"
			backLabel="recursos de apoyo"
		>
			<CatalogAdminForm
				entityLabel="recurso"
				entityLabelPlural="los recursos de apoyo"
				basePath="/admin/catalog/support-resources"
				apiBasePath="/api/admin/catalog/support-resources"
				initialValues={getSupportResourceInitialValues(supportResource)}
				fields={getSupportResourceFields({
					supportResourceTypes,
					products,
					productLines,
				})}
				editingId={supportResource.id}
				cancelHref="/admin/catalog/support-resources"
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
