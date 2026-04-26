type Props = {
	errorMessage: string | null;
	successMessage: string | null;
};

export default function ProfileFeedbackMessages({
	errorMessage,
	successMessage,
}: Props) {
	return (
		<>
			{errorMessage ? (
				<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{errorMessage}
				</div>
			) : null}

			{successMessage ? (
				<div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
					{successMessage}
				</div>
			) : null}
		</>
	);
}
