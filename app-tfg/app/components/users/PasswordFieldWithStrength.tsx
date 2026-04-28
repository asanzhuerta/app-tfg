"use client";

import { useId, useMemo, useState } from "react";
import { PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/utils/password-utils";

type Props = {
	name?: string;
	label?: string;
	placeholder?: string;
	required?: boolean;
	autoComplete?: string;
	confirmName?: string;
	confirmLabel?: string;
	showConfirm?: boolean;
	defaultValue?: string;
	value?: string;
	onChange?: (value: string) => void;
	confirmValue?: string;
	onConfirmChange?: (value: string) => void;
};

export default function PasswordFieldWithStrength({
	name = "password",
	label = "Contraseña",
	placeholder = "Contraseña",
	required = false,
	autoComplete = "new-password",
	confirmName = "confirm_password",
	confirmLabel = "Confirmar contraseña",
	showConfirm = false,
	defaultValue = "",
	value,
	onChange,
	confirmValue,
	onConfirmChange,
}: Props) {
	const passwordInputId = useId();
	const confirmPasswordInputId = useId();
	const [internalPassword, setInternalPassword] = useState<string | null>(null);
	const [internalConfirmPassword, setInternalConfirmPassword] = useState("");

	const password = value ?? internalPassword ?? defaultValue;
	const resolvedConfirmPassword = confirmValue ?? internalConfirmPassword;

	const setPassword = (nextValue: string) => {
		if (onChange) {
			onChange(nextValue);
			return;
		}
		setInternalPassword(nextValue);
	};

	const setConfirmPassword = (nextValue: string) => {
		if (onConfirmChange) {
			onConfirmChange(nextValue);
			return;
		}
		setInternalConfirmPassword(nextValue);
	};

	const validation = useMemo(() => validatePassword(password), [password]);

	const progressWidth = `${(validation.score / 3) * 100}%`;

	const progressClass =
		validation.score === 0
			? "bg-red-500"
			: validation.score === 1
				? "bg-orange-500"
				: validation.score === 2
					? "bg-yellow-500"
					: "bg-green-500";

	const passwordsMatch =
		!showConfirm ||
		resolvedConfirmPassword === "" ||
		password === resolvedConfirmPassword;

	return (
		<div className="space-y-3">
			<div>
				<label
					htmlFor={passwordInputId}
					className="mb-1 hidden text-sm font-medium text-slate-700"
				>
					{label}
				</label>
				<input
					id={passwordInputId}
					name={name}
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder={placeholder}
					autoComplete={autoComplete}
					required={required}
					minLength={PASSWORD_MIN_LENGTH}
					className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400"
				/>
			</div>

			<div>
				<div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
					<div
						className={`h-full transition-all ${progressClass}`}
						style={{ width: progressWidth }}
					/>
				</div>

				<div className="mt-2 space-y-1 text-xs text-slate-500">
					<p className={validation.lengthValid ? "text-green-600" : ""}>
						• Mínimo 8 caracteres
					</p>
					<p className={validation.hasNumber ? "text-green-600" : ""}>
						• Al menos 1 número
					</p>
					<p className={validation.hasSymbol ? "text-green-600" : ""}>
						• Al menos 1 símbolo
					</p>
				</div>
			</div>

			{showConfirm ? (
				<div>
					<label
						htmlFor={confirmPasswordInputId}
						className="mb-1 hidden text-sm font-medium text-slate-700"
					>
						{confirmLabel}
					</label>
					<input
						id={confirmPasswordInputId}
						name={confirmName}
						type="password"
						value={resolvedConfirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Repite la contraseña"
						autoComplete={autoComplete}
						required={required}
						className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-400"
					/>
					{resolvedConfirmPassword && !passwordsMatch ? (
						<p className="mt-2 text-xs text-red-500">
							Las contraseñas no coinciden
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
