"use client";

import { useCallback, useEffect } from "react";
import { requestJson } from "@/lib/api/client";
import type { CommercialRoutePreviewResponse } from "@/lib/contracts/commercial-route";
import { useApiRequest } from "./useApiRequest";

type RoutePreviewCoordinates = {
	startLat?: number;
	startLng?: number;
};

type UseCommercialRoutePreviewOptions = {
	enabled?: boolean;
};

function buildRoutePreviewUrl(coordinates?: RoutePreviewCoordinates) {
	const url = new URL("/api/commercial/routes/preview", window.location.origin);

	if (coordinates?.startLat !== undefined && coordinates?.startLng !== undefined) {
		url.searchParams.set("startLat", String(coordinates.startLat));
		url.searchParams.set("startLng", String(coordinates.startLng));
	}

	return url.toString();
}

export function useCommercialRoutePreview(
	coordinates?: RoutePreviewCoordinates,
	options?: UseCommercialRoutePreviewOptions,
) {
	const { run, ...request } = useApiRequest<CommercialRoutePreviewResponse>();

	const load = useCallback(() => {
		return run(() =>
			requestJson<CommercialRoutePreviewResponse>(
				buildRoutePreviewUrl(coordinates),
				{
					method: "GET",
					cache: "no-store",
					fallbackMessage: "No se pudo cargar la ruta",
				},
			),
		);
	}, [coordinates, run]);

	useEffect(() => {
		if (options?.enabled === false) {
			return;
		}

		void load();
	}, [load, options?.enabled]);

	return {
		...request,
		reload: load,
	};
}
