import { getFeedbackClassName } from "./form-styles";

type FeedbackMessageProps = {
	type: "success" | "error";
	message: string;
	className?: string;
};

export default function FeedbackMessage({
	type,
	message,
	className = "",
}: FeedbackMessageProps) {
	return (
		<div
			className={`rounded-2xl border px-4 py-3 text-sm ${getFeedbackClassName(
				type,
			)} ${className}`.trim()}
		>
			{message}
		</div>
	);
}
