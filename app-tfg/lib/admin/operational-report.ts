import type { AdminOperationalOverview } from "@/lib/contracts/admin-operational-overview";
import { getAdminOperationalOverview } from "@/lib/admin/operational-overview";
import { CSV_CONTENT_TYPE, toCsv } from "@/lib/utils/csv";

type BuildAdminOperationalReportInput = {
	now?: Date;
};

function buildFileName(now: Date) {
	const date = now.toISOString().slice(0, 10);
	return `kinestilistas-m7-operational-report-${date}.csv`;
}

function buildRows(overview: AdminOperationalOverview) {
	return overview.sections.flatMap((section) =>
		section.metrics.map((metric) => [
			section.slug,
			section.title,
			section.status,
			section.statusLabel,
			section.href,
			metric.label,
			metric.value,
			metric.helper ?? "",
			section.lastCheckedAt,
		]),
	);
}

export async function buildAdminOperationalReport(
	input: BuildAdminOperationalReportInput = {},
) {
	const now = input.now ?? new Date();
	const overview = await getAdminOperationalOverview(now);
	const headers = [
		"section_slug",
		"section_title",
		"status",
		"status_label",
		"detail_href",
		"metric_label",
		"metric_value",
		"metric_helper",
		"last_checked_at",
	];
	const rows = buildRows(overview);

	return {
		content: toCsv(headers, rows),
		contentType: CSV_CONTENT_TYPE,
		fileName: buildFileName(now),
		rowCount: rows.length,
		summary: overview.summary,
	};
}
