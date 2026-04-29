import { notFound } from "next/navigation";
import CatalogAdminEditShell from "@/app/admin/catalog/_shared/CatalogAdminEditShell";
import {
	getColorChartFields,
	getColorChartInitialValues,
} from "@/app/admin/catalog/_shared/catalog-form-config";
import CatalogAdminForm from "@/app/components/catalog-admin/CatalogAdminForm";
import { getColorChartById } from "@/lib/typeorm/services/catalog/color-chart";
import { listProductLines } from "@/lib/typeorm/services/catalog/product-line";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditColorChartPage({ params }: Props) {
	const { id } = await params;
	const [colorChart, productLines] = await Promise.all([
		getColorChartById(id),
		listProductLines(),
	]);

	if (!colorChart) {
		notFound();
	}

	return (
		<CatalogAdminEditShell
			title="Editar carta de color"
			subtitle={`Actualiza la portada y la vinculacion comercial de ${colorChart.name}.`}
			backHref="/admin/catalog/color-charts"
			backLabel="cartas de color"
		>
			<CatalogAdminForm
				entityLabel="carta de color"
				entityLabelPlural="las cartas de color"
				basePath="/admin/catalog/color-charts"
				apiBasePath="/api/admin/catalog/color-charts"
				initialValues={getColorChartInitialValues(colorChart)}
				fields={getColorChartFields(productLines)}
				editingId={colorChart.id}
				cancelHref="/admin/catalog/color-charts"
				showHeader={false}
			/>
		</CatalogAdminEditShell>
	);
}
