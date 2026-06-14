export type ClientTierRecalculationFrequency = "annual" | "monthly";

export type ClientTierPolicySettings = {
	thresholdSilver: string;
	thresholdGold: string;
	thresholdPlatinum: string;
	recalculationFrequency: ClientTierRecalculationFrequency;
	recalculationMonth: number;
	recalculationDay: number;
};

export type UpdateClientTierPolicySettingsBody = {
	thresholdSilver?: number | string | null;
	thresholdGold?: number | string | null;
	thresholdPlatinum?: number | string | null;
	recalculationFrequency?: ClientTierRecalculationFrequency | string | null;
	recalculationMonth?: number | string | null;
	recalculationDay?: number | string | null;
};

export type ClientTierRecalculationResult = {
	periodStart: string;
	periodEnd: string;
	frequency: ClientTierRecalculationFrequency;
	processedClients: number;
	updatedClients: number;
	assigned: {
		silver: number;
		gold: number;
		platinum: number;
		none: number;
	};
};
