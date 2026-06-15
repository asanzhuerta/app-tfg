import type {
	CommercialVisitDetail,
	CommercialVisitDeliveryOrder,
	CommercialVisit,
	CommercialVisitClient,
	CommercialVisitClientUser,
	CommercialVisitCommercial,
	CommercialVisitCommercialUser,
	CommercialVisitStatus,
	CommercialVisitStatusCode,
	CommercialVisitType,
	CommercialVisitTypeCode,
} from "@/lib/contracts/commercial-visit";
import { formatDisplayDate } from "@/lib/utils/date-format";

export type {
	CommercialVisitDetail,
	CommercialVisitDeliveryOrder,
	CommercialVisit,
	CommercialVisitClient,
	CommercialVisitClientUser,
	CommercialVisitCommercial,
	CommercialVisitCommercialUser,
	CommercialVisitStatus,
	CommercialVisitStatusCode,
	CommercialVisitType,
	CommercialVisitTypeCode,
};

export const COMMERCIAL_VISIT_STATUS_OPTIONS = [
	{ id: 1, code: "planned", label: "Planificada" },
	{ id: 2, code: "completed", label: "Completada" },
	{ id: 3, code: "cancelled", label: "Cancelada" },
	{ id: 4, code: "postponed", label: "Aplazada" },
] as const;

export const COMMERCIAL_VISIT_TYPE_OPTIONS = [
	{ id: 1, code: "delivery", label: "Reparto" },
	{ id: 2, code: "routine", label: "Rutinaria" },
] as const;

export function getVisitStatusCodeById(
	statusId: number | string | null | undefined,
) {
	const parsedStatusId = Number(statusId);
	return (
		COMMERCIAL_VISIT_STATUS_OPTIONS.find(
			(option) => option.id === parsedStatusId,
		)?.code ?? null
	);
}

export function getVisitStatusIdByCode(
	statusCode: CommercialVisitStatusCode | string,
) {
	return (
		COMMERCIAL_VISIT_STATUS_OPTIONS.find(
			(option) => option.code === statusCode,
		)?.id ?? null
	);
}

export function getVisitTypeCodeById(
	visitTypeId: number | string | null | undefined,
) {
	const parsedVisitTypeId = Number(visitTypeId);
	return (
		COMMERCIAL_VISIT_TYPE_OPTIONS.find(
			(option) => option.id === parsedVisitTypeId,
		)?.code ?? null
	);
}

export function getVisitStatusLabel(statusId: number) {
	return (
		COMMERCIAL_VISIT_STATUS_OPTIONS.find((option) => option.id === statusId)
			?.label ?? "Desconocido"
	);
}

export function getVisitTypeLabel(visitTypeId: number) {
	return (
		COMMERCIAL_VISIT_TYPE_OPTIONS.find((option) => option.id === visitTypeId)
			?.label ?? "Desconocido"
	);
}

export function getVisitStatusClasses(statusId: number) {
	switch (getVisitStatusCodeById(statusId)) {
		case "planned":
			return "bg-amber-50 text-amber-700";
		case "completed":
			return "bg-emerald-50 text-emerald-700";
		case "cancelled":
			return "bg-rose-50 text-rose-700";
		case "postponed":
			return "bg-orange-50 text-orange-700";
		default:
			return "bg-slate-100 text-slate-700";
	}
}

export function formatVisitDate(value: string | null | undefined) {
	if (!value) {
		return "-";
	}

	return formatDisplayDate(value);
}
