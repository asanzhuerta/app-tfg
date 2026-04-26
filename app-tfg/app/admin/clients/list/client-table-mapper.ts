import { formatDate } from "@/lib/utils/user-utils";
import type { EntityTableItem } from "@/app/components/entity-table/entity-table-types";

// Adapta una entidad Cliente al formato visual reutilizable EntityTableItem.
export function mapClientsToEntityTableItems(
	clients: any[],
): EntityTableItem[] {
	return clients.map((client) => {
		const activeAssignment = Array.isArray(client.commercialAssignments)
			? (client.commercialAssignments[0] ?? null)
			: null;

		const assignedCommercial = activeAssignment?.commercial ?? null;
		const assignedCommercialUser = assignedCommercial?.user ?? null;

		const assignedCommercialName =
			assignedCommercialUser?.name?.trim() || "Sin comercial asignado";

		const assignedCommercialEmail =
			assignedCommercialUser?.email?.trim() || "-";

		return {
			id: client.id,
			title: client.name,
			subtitle:
				client.contact_name || client.user?.email || "Sin persona de contacto",
			imageUrl: client.user?.profile_image_url ?? null,
			category: client.province || client.city || null,
			status: assignedCommercial ? "Asignado" : "Sin asignar",
			primaryDate: client.created_at
				? new Date(client.created_at).toISOString()
				: null,
			badges: assignedCommercial
				? [
						{
							label: assignedCommercialName,
							className: "bg-cyan-100 text-cyan-800 border border-cyan-200",
						},
					]
				: [
						{
							label: "Pendiente de asignación",
							className: "bg-amber-100 text-amber-800 border border-amber-200",
						},
					],
			fields: [
				{
					label: "Correo",
					value: client.user?.email || "-",
				},
				{
					label: "Teléfono",
					value: client.user?.phone || "-",
				},
				{
					label: "Ciudad",
					value: client.city || "-",
				},
				{
					label: "Provincia",
					value: client.province || "-",
				},
				{
					label: "Comercial asignado",
					value: assignedCommercialName,
				},
				{
					label: "Correo comercial",
					value: assignedCommercialEmail,
				},
				{
					label: "Fecha asignación",
					value: formatDate(activeAssignment?.assigned_at),
				},
			],
			actions: [
				{
					label: "Ver detalle",
					href: `/admin/clients/list/${client.id}`,
					variant: "primary",
				},
				{
					label: "Gestionar asignación",
					href: `/admin/clients/assignments?clientId=${client.id}`,
					variant: "secondary",
				},
			],
			searchText: [
				client.name,
				client.contact_name,
				client.city,
				client.province,
				client.user?.name,
				client.user?.email,
				client.user?.phone,
				assignedCommercialUser?.name,
				assignedCommercialUser?.email,
			]
				.filter(Boolean)
				.join(" "),
		};
	});
}
