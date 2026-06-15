"use client";

import type { ClientSegmentAssignmentView } from "./communication-view-types";

type AdminAssignmentsListProps = {
	assignments: ClientSegmentAssignmentView[];
	pendingAction: string | null;
	confirmDeleteAction: string | null;
	onDelete: (id: string) => void;
};

export function AdminAssignmentsList({
	assignments,
	pendingAction,
	confirmDeleteAction,
	onDelete,
}: AdminAssignmentsListProps) {
	if (!assignments.length) {
		return (
			<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
				Sin asignaciones registradas.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{assignments.map((assignment) => (
				<article
					key={assignment.id}
					className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h3 className="font-semibold text-slate-900">
								{assignment.clientName}
							</h3>
							<p className="text-sm text-slate-500">
								{assignment.clientEmail ?? "Sin correo"} -{" "}
								{assignment.segmentName}
							</p>
						</div>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
							{assignment.segmentCode}
						</span>
					</div>
					{assignment.notes ? (
						<p className="mt-2 text-sm text-slate-600">{assignment.notes}</p>
					) : null}
					<button
						type="button"
						onClick={() => onDelete(assignment.id)}
						disabled={pendingAction === `assignment-${assignment.id}`}
						className="mt-3 rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
					>
						{confirmDeleteAction === `assignment-${assignment.id}`
							? "Confirmar quitar"
							: "Quitar asignación"}
					</button>
				</article>
			))}
		</div>
	);
}
