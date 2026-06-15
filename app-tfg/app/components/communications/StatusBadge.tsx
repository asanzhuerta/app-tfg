type Props = {
	status: string;
};

export default function StatusBadge({ status }: Props) {
	return (
		<span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
			{status}
		</span>
	);
}
