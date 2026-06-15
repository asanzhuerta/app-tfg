"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { SegmentFormState } from "./admin-communication-forms";

type SubmitHandler = (
	event: FormEvent<HTMLFormElement>,
) => void | Promise<void>;

type AdminSegmentFormProps = {
	form: SegmentFormState;
	setForm: Dispatch<SetStateAction<SegmentFormState>>;
	className: string;
	isOpen: boolean;
	isEditing: boolean;
	isSubmitPending: boolean;
	onClose: () => void;
	onSubmit: SubmitHandler;
};

export function AdminSegmentForm({
	form,
	setForm,
	className,
	isOpen,
	isEditing,
	isSubmitPending,
	onClose,
	onSubmit,
}: AdminSegmentFormProps) {
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
						{isEditing ? "Editar rango" : "Nuevo rango"}
					</h2>
					<p className="text-sm text-slate-500">
						Crea rangos comerciales para dirigir promociones.
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
			<input
				required
				placeholder="Código interno"
				value={form.code}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						code: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<input
				required
				placeholder="Nombre"
				value={form.name}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						name: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<textarea
				placeholder="Descripción"
				value={form.description}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						description: event.target.value,
					}))
				}
				className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<textarea
				placeholder="Criterios comerciales"
				value={form.criteria}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						criteria: event.target.value,
					}))
				}
				className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={isSubmitPending}
					className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{isEditing ? "Guardar cambios" : "Crear rango"}
				</button>
				{isEditing ? (
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
					>
						Cancelar edición
					</button>
				) : null}
			</div>
		</form>
	);
}
