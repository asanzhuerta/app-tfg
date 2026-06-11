import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getColorReferenceFields,
	getColorReferenceInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import {
	getColorReferenceById,
	listColorCharts,
} from "@/lib/typeorm/services/catalog/color-chart";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditColorReferencePage({ params }: Props) {
	const { id } = await params;
	const [colorReference, colorCharts] = await Promise.all([
		getColorReferenceById(id),
		listColorCharts(),
	]);

	if (!colorReference) {
		notFound();
	}

	return (
		<CatalogAdminEditShell
			title="Editar referencia de color"
			subtitle={`Ajusta tono, orden e imagen para ${colorReference.code} · ${colorReference.name}.`}
			backHref="/admin/catalog/color-references"
		>
			<CatalogAdminForm
				entityLabel="referencia"
				entityLabelPlural="las referencias de color"
				basePath="/admin/catalog/color-references"
				apiBasePath="/api/admin/catalog/color-references"
				initialValues={getColorReferenceInitialValues(colorReference)}
				fields={getColorReferenceFields(colorCharts)}
				editingId={colorReference.id}
				cancelHref="/admin/catalog/color-references"
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
