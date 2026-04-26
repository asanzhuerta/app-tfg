import Link from "next/link";
import SubmitButton from "@/app/components/forms/SubmitButton";

type Props = {
	isViewMode: boolean;
	isSelfEditMode: boolean;
	isAdminEditMode: boolean;
	isSaving: boolean;
	submitLabel?: string;
	backHref?: string;
	onReset: () => void;
};

export default function ProfileActionsSection({
	isViewMode,
	isSelfEditMode,
	isAdminEditMode,
	isSaving,
	submitLabel,
	backHref,
	onReset,
}: Props) {
	if (isViewMode) {
		return null;
	}

	return (
		<div className="mt-6 flex flex-wrap gap-3">
			<SubmitButton
				isSubmitting={isSaving}
				submittingText="Guardando..."
				className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
			>
				{submitLabel ?? "Guardar cambios"}
			</SubmitButton>

			{isSelfEditMode ? (
				<button
					type="button"
					onClick={onReset}
					className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				>
					Restablecer
				</button>
			) : null}

			{isAdminEditMode && backHref ? (
				<Link
					href={backHref}
					className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				>
					Cancelar
				</Link>
			) : null}
		</div>
	);
}
