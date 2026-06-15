export const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";

export type CsvCell = string | number | null | undefined;

export function escapeCsvValue(value: CsvCell) {
	const text = String(value ?? "");

	if (!/[",\r\n]/.test(text)) {
		return text;
	}

	return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(headers: string[], rows: CsvCell[][]) {
	return [headers, ...rows]
		.map((row) => row.map((value) => escapeCsvValue(value)).join(","))
		.join("\n");
}
