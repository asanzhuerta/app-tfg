export type SupportCapabilityStatusCode = "ready" | "warning" | "missing";

export type SupportCapabilityEvidence = {
	label: string;
	value: string;
};

export type SupportCapabilityItem = {
	slug: string;
	title: string;
	category: string;
	status: SupportCapabilityStatusCode;
	statusLabel: string;
	description: string;
	operationalUse: string;
	degradationBehavior: string;
	evidence: SupportCapabilityEvidence[];
	lastCheckedAt: string;
};

export type SupportCapabilitySummary = {
	total: number;
	ready: number;
	warning: number;
	missing: number;
	lastCheckedAt: string;
};
