"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TrainingFormState } from "./admin-communication-forms";
import DeliveryChannelsField from "./DeliveryChannelsField";

type SubmitHandler = (
	event: FormEvent<HTMLFormElement>,
) => void | Promise<void>;

type AdminTrainingFormProps = {
	form: TrainingFormState;
	setForm: Dispatch<SetStateAction<TrainingFormState>>;
	className: string;
	isOpen: boolean;
	isEditing: boolean;
	isSubmitPending: boolean;
	onClose: () => void;
	onSubmit: SubmitHandler;
};

export function AdminTrainingForm({
	form,
	setForm,
	className,
	isOpen,
	isEditing,
	isSubmitPending,
	onClose,
	onSubmit,
}: AdminTrainingFormProps) {
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
						{isEditing ? "Editar formación" : "Nueva formación"}
					</h2>
					<p className="text-sm text-slate-500">
						Publica sesiones presenciales, en línea o mixtas.
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
				placeholder="Título"
				value={form.title}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						title: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<textarea
				required
				placeholder="Descripción"
				value={form.description}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						description: event.target.value,
					}))
				}
				className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<div className="grid gap-3 md:grid-cols-2">
				<input
					required
					type="datetime-local"
					value={form.startsAt}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							startsAt: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
				<input
					placeholder="Ubicación o enlace"
					value={form.location}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							location: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
				<select
					value={form.modality}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							modality: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="in_person">Presencial</option>
					<option value="online">En línea</option>
					<option value="hybrid">Mixta</option>
				</select>
				<select
					value={form.status}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							status: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="draft">Borrador</option>
					<option value="published">Publicada</option>
					<option value="cancelled">Cancelada</option>
					<option value="completed">Completada</option>
				</select>
				<input
					type="number"
					min="1"
					placeholder="Capacidad opcional"
					value={form.capacity}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							capacity: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
			</div>
			<textarea
				placeholder="Contenido / temario"
				value={form.content}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						content: event.target.value,
					}))
				}
				className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<DeliveryChannelsField
				deliveryChannels={form.deliveryChannels}
				onChange={(deliveryChannels) =>
					setForm((current) => ({
						...current,
						deliveryChannels,
					}))
				}
			/>
			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={isSubmitPending}
					className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{isEditing ? "Guardar cambios" : "Crear formación"}
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
