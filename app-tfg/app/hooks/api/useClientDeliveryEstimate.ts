"use client";

import { useCallback, useEffect } from "react";
import { requestJson } from "@/lib/api/client";
import type { DeliveryEstimateResponse } from "@/lib/contracts/delivery-estimate";
import { useApiRequest } from "./useApiRequest";

export function useClientDeliveryEstimate() {
	const { run, ...request } = useApiRequest<DeliveryEstimateResponse>();

	const load = useCallback(() => {
		return run(() =>
			requestJson<DeliveryEstimateResponse>("/api/clients/delivery-estimate", {
				method: "GET",
				cache: "no-store",
				fallbackMessage: "No se pudo cargar la hora aproximada de reparto",
			}),
		);
	}, [run]);

	useEffect(() => {
		void load();
	}, [load]);

	return {
		...request,
		reload: load,
	};
}
