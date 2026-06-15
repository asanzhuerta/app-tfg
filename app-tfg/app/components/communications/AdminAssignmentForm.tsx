"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ClientOptionView, SegmentView } from "./communication-view-types";
import type { AssignmentFormState } from "./admin-communication-forms";

type SubmitHandler = (
	event: FormEvent<HTMLFormElement>,
) => void | Promise<void>;

type AdminAssignmentFormProps = {
	form: AssignmentFormState;
	setForm: Dispatch<SetStateAction<AssignmentFormState>>;
	className: string;
	isOpen: boolean;
	isSubmitPending: boolean;
	clients: ClientOptionView[];
	segments: SegmentView[];
	onClose: () => void;
	onSubmit: SubmitHandler;
};

export function AdminAssignmentForm({
	form,
	setForm,
	className,
	isOpen,
	isSubmitPending,
	clients,
	segments,
	onClose,
	onSubmit,
}: AdminAssignmentFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			role="dialog"
			aria-modal={isOpen}
			className={className}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						Asignar cliente a rango
					</h2>
					<p className="text-sm text-slate-500">
						El rango controla qué promociones ve cada salón.
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
				>
					Cerrar
				</button>
			</div>
			<select
				required
				value={form.clientId}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						clientId: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			>
				<option value="">Selecciona cliente</option>
				{clients.map((client) => (
					<option key={client.id} value={client.id}>
						{client.name}
						{client.email ? ` - ${client.email}` : ""}
					</option>
				))}
			</select>
			<select
				required
				value={form.segmentId}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						segmentId: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			>
				<option value="">Selecciona rango</option>
				{segments.map((segment) => (
					<option key={segment.id} value={segment.id}>
						{segment.name}
					</option>
				))}
			</select>
			<textarea
				placeholder="Notas internas"
				value={form.notes}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						notes: event.target.value,
					}))
				}
				className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<button
				type="submit"
				disabled={isSubmitPending}
				className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
			>
				Asignar rango
			</button>
		</form>
	);
}
