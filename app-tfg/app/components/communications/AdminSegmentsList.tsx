"use client";

import type { SegmentView } from "./communication-view-types";

type AdminSegmentsListProps = {
	segments: SegmentView[];
	pendingAction: string | null;
	confirmDeleteAction: string | null;
	onEdit: (segment: SegmentView) => void;
	onDelete: (id: string) => void;
};

export function AdminSegmentsList({
	segments,
	pendingAction,
	confirmDeleteAction,
	onEdit,
	onDelete,
}: AdminSegmentsListProps) {
	if (!segments.length) {
		return (
			<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
				Sin rangos registrados.
			</p>
		);
	}

	return (
		<div className="grid gap-3 md:grid-cols-2">
			{segments.map((segment) => (
				<article
					key={segment.id}
					className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
				>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
						{segment.code}
					</p>
					<h3 className="mt-1 font-semibold text-slate-900">{segment.name}</h3>
					<p className="mt-2 text-sm text-slate-600">
						{segment.description ?? "Sin descripción"}
					</p>
					{segment.criteria ? (
						<p className="mt-2 text-xs text-slate-500">
							Criterios: {segment.criteria}
						</p>
					) : null}
					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => onEdit(segment)}
							className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
						>
							Editar
						</button>
						<button
							type="button"
							onClick={() => onDelete(segment.id)}
							disabled={pendingAction === `segment-${segment.id}`}
							className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
						>
							{confirmDeleteAction === `segment-${segment.id}`
								? "Confirmar eliminar"
								: "Eliminar"}
						</button>
					</div>
				</article>
			))}
		</div>
	);
}
