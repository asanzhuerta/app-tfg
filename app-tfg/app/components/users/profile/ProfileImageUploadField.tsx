type Props = {
	displayedProfileImage?: string | null;
	isUploadingImage: boolean;
	profileImageStatusText: string | null;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onOpenFilePicker: () => void;
};

export default function ProfileImageUploadField({
	displayedProfileImage,
	isUploadingImage,
	profileImageStatusText,
	fileInputRef,
	onFileChange,
	onOpenFilePicker,
}: Props) {
	return (
		<div>
			<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
				Foto de perfil
			</label>

			<div className="mt-2 flex flex-col gap-3">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={onFileChange}
					className="hidden"
					disabled={isUploadingImage}
				/>

				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={onOpenFilePicker}
						disabled={isUploadingImage}
						className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{displayedProfileImage ? "Cambiar foto" : "Seleccionar archivo"}
					</button>

					{profileImageStatusText ? (
						<p className="text-sm text-slate-500">{profileImageStatusText}</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
