import type {
	RateLimitPolicyName,
	RateLimitScope,
} from "@/lib/security/rate-limit";

export type RateLimitPolicySettingsItem = {
	name: RateLimitPolicyName;
	title: string;
	description: string;
	scope: RateLimitScope;
	enabled: boolean;
	maxRequests: number;
	windowMs: number;
	windowMinutes: number;
	defaultEnabled: boolean;
	defaultMaxRequests: number;
	defaultWindowMs: number;
	defaultWindowMinutes: number;
	message: string;
	isDefault: boolean;
};

export type UpdateRateLimitPolicySettingsBody = {
	policies?: Array<{
		name?: string;
		enabled?: boolean;
		maxRequests?: number | string | null;
		windowMinutes?: number | string | null;
	}>;
};
