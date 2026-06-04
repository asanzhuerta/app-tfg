import { getRateLimitDiagnostics } from "@/lib/admin/rate-limit-diagnostics";
import type { RateLimitPolicyName } from "@/lib/security/rate-limit";

function assertCondition(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

async function main() {
	const diagnostics = await getRateLimitDiagnostics(
		new Date("2026-06-04T00:00:00.000Z"),
	);
	const policyNames = new Set(diagnostics.policies.map((policy) => policy.name));

	assertCondition(
		diagnostics.policies.length === 10,
		"M7 debe diagnosticar las diez politicas de rate limiting",
	);
	assertCondition(
		policyNames.size === diagnostics.policies.length,
		"Las politicas de rate limiting no deben tener nombres duplicados",
	);

	const expectedPolicies: RateLimitPolicyName[] = [
		"DEFAULT_API",
		"AUTH_API",
		"REGISTER_REQUEST",
		"ADMIN_GENERIC_READ",
		"ADMIN_GENERIC_WRITE",
		"ADMIN_USERS_READ",
		"ADMIN_USERS_WRITE",
		"PROFILE_IMAGE_UPLOAD",
		"LOGIN_IP",
		"LOGIN_IDENTIFIER",
	];

	for (const expectedPolicy of expectedPolicies) {
		assertCondition(
			policyNames.has(expectedPolicy),
			`Falta la politica de rate limiting esperada ${expectedPolicy}`,
		);
	}

	for (const policy of diagnostics.policies) {
		assertCondition(
			policy.statusLabel.length > 0,
			`La politica ${policy.name} no tiene etiqueta de estado`,
		);
		assertCondition(
			policy.maxRequests > 0 && policy.windowMinutes > 0,
			`La politica ${policy.name} no expone limites positivos`,
		);
		assertCondition(
			policy.defaultMaxRequests > 0 && policy.defaultWindowMinutes > 0,
			`La politica ${policy.name} no expone valores por defecto positivos`,
		);
	}

	assertCondition(
		diagnostics.summary.total === diagnostics.policies.length,
		"El resumen de rate limiting no coincide con el listado",
	);
	assertCondition(
		diagnostics.summary.active + diagnostics.summary.disabled ===
			diagnostics.summary.total,
		"El resumen de politicas activas y desactivadas no cuadra",
	);
	assertCondition(
		diagnostics.summary.defaulted +
			diagnostics.summary.customized +
			diagnostics.summary.disabled ===
			diagnostics.summary.total,
		"El resumen de estados de configuracion no cuadra",
	);

	console.log("PASS diagnostico M7 contiene politicas de rate limiting esperadas");
	console.log("PASS cada politica expone limites, defaults y estado");
	console.log("PASS resumen de rate limiting M7 consistente");
}

main()
	.then(() => {
		console.log("M7 rate limit smoke OK");
	})
	.catch((error) => {
		console.error("M7 rate limit smoke FAILED");
		console.error(error);
		process.exitCode = 1;
	});
