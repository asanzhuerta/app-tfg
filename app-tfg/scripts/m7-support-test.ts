import {
	listSupportCapabilityItems,
	summarizeSupportCapabilityItems,
} from "@/lib/support/operational-support";

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

function main() {
	const items = listSupportCapabilityItems(new Date("2026-06-04T00:00:00.000Z"));
	const summary = summarizeSupportCapabilityItems(items);
	const slugs = new Set(items.map((item) => item.slug));

	assertCondition(items.length === 4, "M7 debe listar cuatro capacidades de soporte");
	assertCondition(
		slugs.size === items.length,
		"Las capacidades de soporte de M7 no deben tener slugs duplicados",
	);

	for (const expectedSlug of [
		"browser-compatibility-guard",
		"pwa-manifest",
		"service-worker-cache",
		"safe-form-hydration",
	]) {
		assertCondition(
			slugs.has(expectedSlug),
			`Falta la capacidad de soporte esperada ${expectedSlug}`,
		);
	}

	for (const item of items) {
		assertCondition(
			item.statusLabel.length > 0,
			`La capacidad ${item.slug} no tiene etiqueta de estado`,
		);
		assertCondition(
			item.evidence.length > 0,
			`La capacidad ${item.slug} no expone evidencias`,
		);
		assertCondition(
			item.operationalUse.length > 0 && item.degradationBehavior.length > 0,
			`La capacidad ${item.slug} no documenta uso o degradación`,
		);
	}

	assertCondition(
		summary.total === items.length,
		"El resumen de soporte no coincide con el listado",
	);
	assertCondition(
		summary.ready + summary.warning + summary.missing === summary.total,
		"El resumen de estados de soporte de M7 no cuadra",
	);

	console.log("PASS inventario M7 contiene capacidades de soporte esperadas");
	console.log("PASS cada capacidad expone estado, evidencias y degradación");
	console.log("PASS resumen de soporte de M7 consistente");
}

try {
	main();
	console.log("M7 support test OK");
} catch (error) {
	console.error("M7 support test FAILED");
	console.error(error);
	process.exitCode = 1;
}
