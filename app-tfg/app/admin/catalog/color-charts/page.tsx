import H1Title from "@/app/components/H1Title";
import ColorChartHierarchyWorkspace from "@/app/components/catalog-admin/ColorChartHierarchyWorkspace";
import {
	serializeColorChartListItem,
	serializeColorReferenceListItem,
} from "@/app/components/catalog/coloration-serializers";
import { getSingleSearchParamValue } from "@/app/components/catalog-admin/catalog-navigation";
import {
	listColorCharts,
	listColorReferences,
} from "@/lib/typeorm/services/catalog/color-chart";

type Props = {
	searchParams?: Promise<{
		expandedLineId?: string | string[];
	}>;
};

export default async function AdminColorChartsPage({ searchParams }: Props) {
	const [resolvedSearchParams, colorCharts, colorReferences] = await Promise.all([
		searchParams ??
			Promise.resolve<{
				expandedLineId?: string | string[];
			}>({}),
		listColorCharts(),
		listColorReferences(),
	]);

	return (
		<div className="space-y-6">
			<H1Title
				title="Cartas de color"
				subtitle="Agrupa las cartas cromaticas por linea comercial y navega sus referencias filtradas"
			/>

			<ColorChartHierarchyWorkspace
				colorCharts={colorCharts.map(serializeColorChartListItem)}
				colorReferences={colorReferences.map(serializeColorReferenceListItem)}
				initialExpandedLineId={getSingleSearchParamValue(
					resolvedSearchParams.expandedLineId,
				)}
			/>
		</div>
	);
}
