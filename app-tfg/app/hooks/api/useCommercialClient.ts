"use client";

import { useCallback, useEffect } from "react";
import { requestJson } from "@/lib/api/client";
import type { CommercialClient } from "@/app/components/commercial/commercial-client-types";
import { useApiRequest } from "./useApiRequest";

export function useCommercialClient(clientId: string) {
	const { run, ...request } = useApiRequest<CommercialClient>();

	const load = useCallback(() => {
		if (!clientId) {
			return Promise.resolve(null);
		}

		return run(() =>
			requestJson<CommercialClient>(`/api/commercial/clients/${clientId}`, {
				method: "GET",
				cache: "no-store",
				fallbackMessage: "No se pudo obtener el cliente",
			}),
		);
	}, [clientId, run]);

	useEffect(() => {
		void load();
	}, [load]);

	return {
		...request,
		reload: load,
	};
}
