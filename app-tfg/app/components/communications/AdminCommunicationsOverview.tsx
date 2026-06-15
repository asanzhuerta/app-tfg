import { tabs, type AdminTab } from "./admin-communication-forms";
import type { AdminCommunicationSummary } from "./admin-communication-summary";

type Props = {
	activeTab: AdminTab;
	activeSummary: AdminCommunicationSummary;
	onTabChange: (tab: AdminTab) => void;
	onOpenForm: (tab: AdminTab) => void;
};

export default function AdminCommunicationsOverview({
	activeTab,
	activeSummary,
	onTabChange,
	onOpenForm,
}: Props) {
	return (
		<>
			<div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/75 p-2">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => onTabChange(tab.key)}
						className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
							activeTab === tab.key
								? "bg-slate-900 text-white"
								: "text-slate-600 hover:bg-slate-100"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						{activeSummary.eyebrow}
					</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
						{activeSummary.title}
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-slate-600">
						{activeSummary.description}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenForm(activeTab)}
					className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
				>
					{activeSummary.actionLabel}
				</button>
			</section>
		</>
	);
}
