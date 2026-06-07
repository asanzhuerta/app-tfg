import type {
	RateLimitDiagnostics,
	RateLimitDiagnosticStatusCode,
	RateLimitPolicyDiagnostic,
} from "@/lib/contracts/rate-limit-diagnostics";
import type { RateLimitPolicySettingsItem } from "@/lib/contracts/rate-limit-settings";
import { listRateLimitPolicySettings } from "@/lib/typeorm/services/security/rate-limit-policy";

function getPolicyStatus(
	policy: RateLimitPolicySettingsItem,
): RateLimitDiagnosticStatusCode {
	if (!policy.enabled) {
		return "disabled";
	}

	return policy.isDefault ? "default" : "customized";
}

function getPolicyStatusLabel(status: RateLimitDiagnosticStatusCode) {
	if (status === "disabled") {
		return "Desactivada";
	}

	if (status === "customized") {
		return "Personalizada";
	}

	return "Por defecto";
}

function mapPolicyToDiagnostic(
	policy: RateLimitPolicySettingsItem,
): RateLimitPolicyDiagnostic {
	const status = getPolicyStatus(policy);

	return {
		name: policy.name,
		title: policy.title,
		description: policy.description,
		scope: policy.scope,
		status,
		statusLabel: getPolicyStatusLabel(status),
		enabled: policy.enabled,
		maxRequests: policy.maxRequests,
		windowMinutes: policy.windowMinutes,
		defaultMaxRequests: policy.defaultMaxRequests,
		defaultWindowMinutes: policy.defaultWindowMinutes,
		message: policy.message,
	};
}

function pickStrictestPolicy(policies: RateLimitPolicyDiagnostic[]) {
	const activePolicies = policies.filter((policy) => policy.enabled);

	if (activePolicies.length === 0) {
		return "Sin políticas activas";
	}

	return activePolicies.reduce((strictest, policy) =>
		policy.maxRequests < strictest.maxRequests ? policy : strictest,
	).title;
}

function pickShortestWindowPolicy(policies: RateLimitPolicyDiagnostic[]) {
	const activePolicies = policies.filter((policy) => policy.enabled);

	if (activePolicies.length === 0) {
		return "Sin políticas activas";
	}

	return activePolicies.reduce((shortest, policy) =>
		policy.windowMinutes < shortest.windowMinutes ? policy : shortest,
	).title;
}

export function summarizeRateLimitDiagnostics(
	policies: RateLimitPolicyDiagnostic[],
	now = new Date(),
) {
	return {
		total: policies.length,
		active: policies.filter((policy) => policy.enabled).length,
		disabled: policies.filter((policy) => policy.status === "disabled").length,
		customized: policies.filter((policy) => policy.status === "customized")
			.length,
		defaulted: policies.filter((policy) => policy.status === "default").length,
		strictestPolicy: pickStrictestPolicy(policies),
		shortestWindowPolicy: pickShortestWindowPolicy(policies),
		lastCheckedAt: now.toISOString(),
	};
}

export async function getRateLimitDiagnostics(
	now = new Date(),
): Promise<RateLimitDiagnostics> {
	const policies = (await listRateLimitPolicySettings()).map(
		mapPolicyToDiagnostic,
	);

	return {
		summary: summarizeRateLimitDiagnostics(policies, now),
		policies,
	};
}
