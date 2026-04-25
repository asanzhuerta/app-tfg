"use client";

import { useCallback, useEffect } from "react";
import { requestJson } from "@/lib/api/client";
import type { CommercialClient } from "@/app/components/commercial/commercial-client-types";
import { useApiRequest } from "./useApiRequest";

export function useCommercialClients() {
	const { run, ...request } = useApiRequest<CommercialClient[]>([]);

	const load = useCallback(() => {
		return run(() =>
			requestJson<CommercialClient[]>("/api/commercial/clients", {
				method: "GET",
				cache: "no-store",
				fallbackMessage: "No se pudieron obtener los clientes",
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
