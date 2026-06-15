import type { AdminTab } from "./admin-communication-forms";

export type AdminCommunicationSummary = {
	eyebrow: string;
	title: string;
	description: string;
	actionLabel: string;
};

export function buildAdminCommunicationSummaryByTab(input: {
	activePromotionsCount: number;
	publishedTrainingsCount: number;
	segmentCount: number;
	assignmentCount: number;
}): Record<AdminTab, AdminCommunicationSummary> {
	return {
		promotions: {
			eyebrow: "Promociones",
			title: `${input.activePromotionsCount} ${
				input.activePromotionsCount === 1
					? "promoción activa"
					: "promociones activas"
			}`,
			description:
				"Crea y mantiene descuentos globales, por rango, por cliente o por producto.",
			actionLabel: "Crear nueva promoción",
		},
		trainings: {
			eyebrow: "Formaciones",
			title: `${input.publishedTrainingsCount} ${
				input.publishedTrainingsCount === 1
					? "formación publicada"
					: "formaciones publicadas"
			}`,
			description:
				"Gestiona convocatorias presenciales, en línea o mixtas para clientes profesionales.",
			actionLabel: "Crear nueva formación",
		},
		segments: {
			eyebrow: "Rangos",
			title: `${input.segmentCount} ${
				input.segmentCount === 1 ? "rango definido" : "rangos definidos"
			}`,
			description:
				"Segmenta clientes por nivel comercial para campañas y beneficios específicos.",
			actionLabel: "Crear nuevo rango",
		},
		assignments: {
			eyebrow: "Asignaciones",
			title: `${input.assignmentCount} ${
				input.assignmentCount === 1
					? "cliente segmentado"
					: "clientes segmentados"
			}`,
			description:
				"Vincula clientes a rangos y revisa la cobertura de cada segmento.",
			actionLabel: "Asignar cliente",
		},
	};
}
