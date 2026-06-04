import type { RateLimitPolicyName, RateLimitScope } from "@/lib/security/rate-limit";

export type RateLimitDiagnosticStatusCode =
	| "default"
	| "customized"
	| "disabled";

export type RateLimitPolicyDiagnostic = {
	name: RateLimitPolicyName;
	title: string;
	description: string;
	scope: RateLimitScope;
	status: RateLimitDiagnosticStatusCode;
	statusLabel: string;
	enabled: boolean;
	maxRequests: number;
	windowMinutes: number;
	defaultMaxRequests: number;
	defaultWindowMinutes: number;
	message: string;
};

export type RateLimitDiagnosticsSummary = {
	total: number;
	active: number;
	disabled: number;
	customized: number;
	defaulted: number;
	strictestPolicy: string;
	shortestWindowPolicy: string;
	lastCheckedAt: string;
};

export type RateLimitDiagnostics = {
	summary: RateLimitDiagnosticsSummary;
	policies: RateLimitPolicyDiagnostic[];
};
