"use client";

import Link from "next/link";
import type { TrainingEventView } from "./communication-view-types";
import { activeTrainingEnrollmentStatuses } from "./admin-communication-forms";
import { formatDateTime } from "./admin-communication-utils";
import StatusBadge from "./StatusBadge";

type AdminTrainingsListProps = {
	trainings: TrainingEventView[];
	pendingAction: string | null;
	confirmDeleteAction: string | null;
	expandedTrainingId: string | null;
	onToggleEnrollmentList: (id: string) => void;
	onStatusChange: (id: string, status: string) => void;
	onEdit: (training: TrainingEventView) => void;
	onDelete: (id: string) => void;
};

export function AdminTrainingsList({
	trainings,
	pendingAction,
	confirmDeleteAction,
	expandedTrainingId,
	onToggleEnrollmentList,
	onStatusChange,
	onEdit,
	onDelete,
}: AdminTrainingsListProps) {
	if (!trainings.length) {
		return (
			<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
				Sin formaciones registradas.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{trainings.map((training) => {
				const isDraftTraining = training.status === "draft";
				const isPublishedTraining = training.status === "published";
				const isClosedTraining =
					training.status === "completed" || training.status === "cancelled";
				const activeEnrollments = training.enrollments.filter((enrollment) =>
					activeTrainingEnrollmentStatuses.has(enrollment.status),
				);
				const isExpanded = expandedTrainingId === training.id;

				return (
					<article
						key={training.id}
						className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
					>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 className="font-semibold text-slate-900">
									{training.title}
								</h3>
								<p className="mt-1 text-sm text-slate-600">
									{training.description}
								</p>
							</div>
							<StatusBadge status={training.status} />
						</div>
						<p className="mt-3 text-xs text-slate-500">
							{formatDateTime(training.startsAt)} - {training.modality}
							{training.location ? ` - ${training.location}` : ""}
						</p>
						<p className="mt-2 text-xs text-slate-500">
							Inscripciones activas: {training.activeEnrollmentsCount}
							{training.capacity ? ` / ${training.capacity}` : ""}
						</p>
						<button
							type="button"
							onClick={() => onToggleEnrollmentList(training.id)}
							className="mt-3 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
							aria-expanded={isExpanded}
						>
							{isExpanded ? "Ocultar inscritos" : "Ver inscritos"} (
							{activeEnrollments.length})
						</button>
						{isExpanded ? (
							<div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
								{activeEnrollments.length ? (
									<ul className="grid gap-2">
										{activeEnrollments.map((enrollment) => (
											<li
												key={enrollment.id}
												className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"
											>
												<div>
													<p className="font-semibold text-slate-900">
														{enrollment.userName}
													</p>
													<p className="text-xs text-slate-500">
														{enrollment.userEmail || "Sin correo"} -{" "}
														{enrollment.status}
													</p>
												</div>
												<Link
													href={`/admin/users/list/${enrollment.userId}`}
													className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
												>
													Ver perfil
												</Link>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-slate-500">
										Todavía no hay usuarios inscritos.
									</p>
								)}
							</div>
						) : null}
						<div className="mt-3 flex flex-wrap gap-2">
							{isDraftTraining ? (
								<button
									type="button"
									onClick={() => onStatusChange(training.id, "published")}
									disabled={pendingAction === `training-${training.id}`}
									className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
								>
									Publicar
								</button>
							) : null}
							{isPublishedTraining ? (
								<>
									<button
										type="button"
										onClick={() => onStatusChange(training.id, "completed")}
										disabled={pendingAction === `training-${training.id}`}
										className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
									>
										Completar
									</button>
									<button
										type="button"
										onClick={() => onStatusChange(training.id, "cancelled")}
										disabled={pendingAction === `training-${training.id}`}
										className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
									>
										Cancelar
									</button>
								</>
							) : null}
							{!isClosedTraining ? (
								<button
									type="button"
									onClick={() => onEdit(training)}
									className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
								>
									Editar
								</button>
							) : null}
							{!isPublishedTraining ? (
								<button
									type="button"
									onClick={() => onDelete(training.id)}
									disabled={
										pendingAction === `training-delete-${training.id}`
									}
									className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
								>
									{confirmDeleteAction === `training-delete-${training.id}`
										? "Confirmar eliminar"
										: "Eliminar"}
								</button>
							) : null}
						</div>
					</article>
				);
			})}
		</div>
	);
}
