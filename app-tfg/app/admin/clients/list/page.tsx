import EntityTable from "@/app/components/entity-table/EntityTable";
import { listClients } from "@/lib/typeorm/services/commercial/client";
import { mapClientsToEntityTableItems } from "./client-table-mapper";

export default async function AdminClientsPage() {
	const clients = await listClients();
	const items = mapClientsToEntityTableItems(clients);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-3 text-sm text-slate-600">
				<div className="rounded-full border border-slate-200 bg-white px-4 py-2">
					<span className="font-semibold text-slate-900">
						{clients.length}
					</span>{" "}
					clientes totales
				</div>

				<div className="rounded-full border border-slate-200 bg-white px-4 py-2">
					<span className="font-semibold text-slate-900">
						{
							clients.filter(
								(client) =>
									Array.isArray(client.commercialAssignments) &&
									client.commercialAssignments.length > 0,
							).length
						}
					</span>{" "}
					con comercial asignado
				</div>

				<div className="rounded-full border border-slate-200 bg-white px-4 py-2">
					<span className="font-semibold text-slate-900">
						{
							clients.filter(
								(client) =>
									!Array.isArray(client.commercialAssignments) ||
									client.commercialAssignments.length === 0,
							).length
						}
					</span>{" "}
					sin asignación activa
				</div>
			</div>

			<EntityTable
				items={items}
				config={{
					categoryLabel: "Provincia",
					statusLabel: "Asignación",
					showImageFilter: true,
					emptyMessage: "No hay clientes registrados.",
				}}
			/>
		</div>
	);
}