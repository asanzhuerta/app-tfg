"use client";

import { useCallback, useEffect } from "react";
import { requestJson } from "@/lib/api/client";
import type {
	CommercialProfileResponse,
	UpdateCommercialProfileBody,
} from "@/lib/contracts/commercial-profile";
import { useApiRequest } from "./useApiRequest";

export function useCommercialProfile() {
	const { run, ...request } = useApiRequest<CommercialProfileResponse>();

	const load = useCallback(() => {
		return run(() =>
			requestJson<CommercialProfileResponse>("/api/commercial/profile", {
				method: "GET",
				cache: "no-store",
				fallbackMessage: "No se pudo cargar la configuracion comercial",
			}),
		);
	}, [run]);

	const save = useCallback(
		(payload: UpdateCommercialProfileBody) => {
			return run(
				() =>
					requestJson<CommercialProfileResponse>("/api/commercial/profile", {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(payload),
						fallbackMessage: "No se pudo guardar la configuracion comercial",
					}),
				{ preserveData: true },
			);
		},
		[run],
	);

	useEffect(() => {
		void load();
	}, [load]);

	return {
		...request,
		reload: load,
		save,
	};
}
