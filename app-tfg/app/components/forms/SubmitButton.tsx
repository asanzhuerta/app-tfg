type SubmitButtonProps = {
	children: React.ReactNode;
	isSubmitting?: boolean;
	disabled?: boolean;
	className?: string;
	submittingText?: string;
};

/**
 * Botón submit reutilizable.
 *
 * Objetivos:
 * - Dejar explícito type="submit"
 * - Soportar estado de envío
 * - Evitar doble click mientras se procesa
 */
export default function SubmitButton({
	children,
	isSubmitting = false,
	disabled = false,
	className = "",
	submittingText = "Enviando...",
}: SubmitButtonProps) {
	const isDisabled = disabled || isSubmitting;

	return (
		<button
			type="submit"
			disabled={isDisabled}
			aria-disabled={isDisabled}
			aria-busy={isSubmitting}
			className={`inline-flex items-center justify-center rounded-full px-6 py-3 transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
		>
			{isSubmitting ? submittingText : children}
		</button>
	);
}
