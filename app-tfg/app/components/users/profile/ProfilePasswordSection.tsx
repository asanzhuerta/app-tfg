import PasswordFieldWithStrength from "@/app/components/users/PasswordFieldWithStrength";

type Props = {
	password: string;
	confirmPassword: string;
	onPasswordChange: (value: string) => void;
	onConfirmPasswordChange: (value: string) => void;
};

export default function ProfilePasswordSection({
	password,
	confirmPassword,
	onPasswordChange,
	onConfirmPasswordChange,
}: Props) {
	return (
		<div className="mt-6 rounded-xl bg-slate-50 p-4">
			<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
				Cambiar contraseña
			</p>

			<PasswordFieldWithStrength
				name="password"
				label="Nueva contraseña"
				placeholder="Dejar en blanco para no cambiarla"
				required={false}
				showConfirm
				confirmName="confirm_password"
				confirmLabel="Confirmar nueva contraseña"
				value={password}
				onChange={onPasswordChange}
				confirmValue={confirmPassword}
				onConfirmChange={onConfirmPasswordChange}
			/>
		</div>
	);
}
