// -----------------------------------------------------------------------------
// GEOCODIFICACIÓN DE DIRECCIONES
// -----------------------------------------------------------------------------
// Este helper convierte una dirección textual en coordenadas lat/lng.
//
// Diseño:
// - desacoplado del servicio de clientes
// - preparado para cambiar de proveedor más adelante
// - pensado para ejecutarse desde backend al crear/editar clientes
//
// Mejora introducida:
// - antes solo se intentaba una búsqueda estructurada muy estricta
// - ahora aplicamos varios fallbacks progresivos para tolerar:
//   * calles escritas con tipo de vía distinto (Calle vs Camino)
//   * códigos postales dudosos o demasiado restrictivos
//   * números de portal que no existan en OpenStreetMap
//   * registros que necesiten búsqueda libre en vez de estructurada
// -----------------------------------------------------------------------------

export type GeocodeAddressInput = {
	address?: string | null;
	city?: string | null;
	postalCode?: string | null;
	province?: string | null;
	country?: string | null;
};

export type GeocodeAddressResult = {
	lat: string;
	lng: string;
	displayName: string | null;
};

type NominatimSearchResult = {
	lat?: string;
	lon?: string;
	display_name?: string;
};

function normalizeText(value: string | null | undefined) {
	return String(value ?? "").trim();
}

function isGeocodingDebugEnabled() {
	return normalizeText(process.env.GEOCODING_DEBUG).toLowerCase() === "true";
}

function redactDebugUrl(url: string) {
	const parsedUrl = new URL(url);

	if (parsedUrl.searchParams.has("email")) {
		parsedUrl.searchParams.set("email", "[redacted]");
	}

	return parsedUrl.toString();
}

function logGeocodingDebug(message: string, data?: unknown) {
	if (!isGeocodingDebugEnabled()) {
		return;
	}

	if (data === undefined) {
		console.log(`[geocoding] ${message}`);
		return;
	}

	console.log(`[geocoding] ${message}`, data);
}

function uniqueValues(values: string[]) {
	return Array.from(new Set(values.map(normalizeText).filter(Boolean)));
}

function expandSpanishStreetAbbreviations(query: string) {
	return query
		.replace(/\bC\.\s*/gi, "Calle ")
		.replace(/\bAvda\.\s*/gi, "Avenida ")
		.replace(/\bAv\.\s*/gi, "Avenida ")
		.replace(/\bPza\.\s*/gi, "Plaza ");
}

function buildFreeTextSearchQueries(query: string) {
	const withoutPostalCode = query
		.replace(/\b\d{5}\b/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();
	const expandedAbbreviations = expandSpanishStreetAbbreviations(query);
	const expandedWithoutPostalCode =
		expandSpanishStreetAbbreviations(withoutPostalCode);

	return uniqueValues([
		query,
		expandedAbbreviations,
		withoutPostalCode,
		expandedWithoutPostalCode,
	]);
}

// Comprueba si hay suficiente información mínima para lanzar una geocodificación.
// No exigimos todos los campos, pero sí al menos dirección y ciudad.
export function hasEnoughAddressToGeocode(input: GeocodeAddressInput) {
	const address = normalizeText(input.address);
	const city = normalizeText(input.city);

	return !!address && !!city;
}

// Construye una dirección humana legible por si más adelante quieres loguearla.
export function buildFullAddressLabel(input: GeocodeAddressInput) {
	return [
		normalizeText(input.address),
		normalizeText(input.city),
		normalizeText(input.postalCode),
		normalizeText(input.province),
		normalizeText(input.country),
	]
		.filter(Boolean)
		.join(", ");
}

// Quita el número final del portal.
// Ejemplo: "Calle del Agua 42" -> "Calle del Agua"
function stripTrailingStreetNumber(address: string) {
	return address.replace(/\s+\d+[A-Za-zºª/-]*\s*$/, "").trim();
}

// Construye el bloque común de configuración del proveedor.
function getGeocodingConfig(input: GeocodeAddressInput) {
	const provider = normalizeText(process.env.GEOCODING_PROVIDER).toLowerCase();

	if (provider && provider !== "nominatim") {
		throw new Error("Proveedor de geocodificación no soportado");
	}

	return {
		baseUrl:
			normalizeText(process.env.GEOCODING_BASE_URL) ||
			"https://nominatim.openstreetmap.org",
		countryCode:
			normalizeText(process.env.GEOCODING_COUNTRY_CODE).toLowerCase() || "es",
		countryName: normalizeText(process.env.GEOCODING_COUNTRY_NAME) || "España",
		contactEmail: normalizeText(process.env.GEOCODING_EMAIL) || "",
		userAgent:
			normalizeText(process.env.GEOCODING_USER_AGENT) || "KinestilistasTFG/1.0",
		resolvedCountry: normalizeText(input.country),
	};
}

async function fetchNominatimSearch(
	url: string,
	userAgent: string,
): Promise<NominatimSearchResult[] | null> {
	logGeocodingDebug("request", {
		url: redactDebugUrl(url),
		userAgent,
	});

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"User-Agent": userAgent,
		},
		cache: "no-store",
	});

	if (!response.ok) {
		logGeocodingDebug("response error", {
			status: response.status,
			statusText: response.statusText,
		});
		throw new Error("No se pudo geocodificar la dirección");
	}

	const data = (await response.json()) as NominatimSearchResult[];
	const resultCount = Array.isArray(data) ? data.length : 0;

	logGeocodingDebug("response", {
		resultCount,
		firstResult: resultCount > 0 ? data[0]?.display_name ?? null : null,
	});

	if (!Array.isArray(data) || data.length === 0) {
		return null;
	}

	return data;
}

function mapFirstNominatimResult(data: NominatimSearchResult[] | null) {
	if (!data || data.length === 0) {
		return null;
	}

	const first = data[0];
	const lat = normalizeText(first.lat);
	const lng = normalizeText(first.lon);

	if (!lat || !lng) {
		return null;
	}

	return {
		lat,
		lng,
		displayName: normalizeText(first.display_name) || null,
	} satisfies GeocodeAddressResult;
}

async function fetchNominatimQuery(
	url: string,
	userAgent: string,
): Promise<GeocodeAddressResult | null> {
	geocodingDebugLog("Request URL:", url);
	geocodingDebugLog("User-Agent:", userAgent);

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"User-Agent": userAgent,
		},
		cache: "no-store",
	});

	const rawText = await response.text();

	geocodingDebugLog("HTTP status:", response.status, response.statusText);
	geocodingDebugLog(
		"Raw response preview:",
		rawText.length > 500 ? `${rawText.slice(0, 500)}...` : rawText,
	);

	if (!response.ok) {
		if (response.status === 429) {
			throw new GeocodingError(
				"El servicio de geocodificación ha bloqueado temporalmente las peticiones por exceso de uso. Inténtalo de nuevo en unos minutos.",
				429,
				"GEOCODING_RATE_LIMIT",
				true,
			);
		}

		if (response.status >= 500) {
			throw new GeocodingError(
				"El servicio de geocodificación no está disponible temporalmente.",
				response.status,
				"GEOCODING_PROVIDER_UNAVAILABLE",
				true,
			);
		}

		throw new GeocodingError(
			`No se pudo geocodificar la dirección. HTTP ${response.status} ${response.statusText}`,
			response.status,
			"GEOCODING_HTTP_ERROR",
			false,
		);
	}

	let data: Array<{
		lat?: string;
		lon?: string;
		display_name?: string;
	}> = [];

	try {
		data = JSON.parse(rawText) as Array<{
			lat?: string;
			lon?: string;
			display_name?: string;
		}>;
	} catch (error) {
		geocodingDebugLog("Error parseando JSON:", error);
		throw new Error("Respuesta inválida del servicio de geocodificación");
	}

	if (!Array.isArray(data) || data.length === 0) {
		geocodingDebugLog("Sin resultados");
		return null;
	}

	const first = data[0];
	const lat = normalizeText(first.lat);
	const lng = normalizeText(first.lon);

	geocodingDebugLog("Primer resultado:", first);
	geocodingDebugLog("Lat/Lng parseadas:", { lat, lng });

	if (!lat || !lng) {
		geocodingDebugLog("Resultado sin lat/lng válidas");
		return null;
	}

	return {
		lat,
		lng,
		displayName: normalizeText(first.display_name) || null,
	};
}

async function tryStructuredSearch(
	input: GeocodeAddressInput,
	userAgent: string,
	baseUrl: string,
	countryCode: string,
	countryName: string,
	contactEmail: string,
	addressVariant: string,
	includePostalCode: boolean,
) {
	const params = new URLSearchParams({
		format: "jsonv2",
		limit: "1",
		addressdetails: "1",
		street: addressVariant,
		city: normalizeText(input.city),
		state: normalizeText(input.province),
		country: normalizeText(input.country) || countryName,
		countrycodes: countryCode,
	});

	if (includePostalCode) {
		const postalCode = normalizeText(input.postalCode);
		if (postalCode) {
			params.set("postalcode", postalCode);
		}
	}

	if (contactEmail) {
		params.set("email", contactEmail);
	}

	return fetchNominatimQuery(
		`${baseUrl}/search?${params.toString()}`,
		userAgent,
	);
}

async function tryFreeTextSearch(
	input: GeocodeAddressInput,
	userAgent: string,
	baseUrl: string,
	countryCode: string,
	countryName: string,
	contactEmail: string,
	addressVariant: string,
	includePostalCode: boolean,
) {
	const q = [
		addressVariant,
		normalizeText(input.city),
		includePostalCode ? normalizeText(input.postalCode) : "",
		normalizeText(input.province),
		normalizeText(input.country) || countryName,
	]
		.filter(Boolean)
		.join(", ");

	const params = new URLSearchParams({
		format: "jsonv2",
		limit: "1",
		addressdetails: "1",
		q,
		countrycodes: countryCode,
	});

	if (contactEmail) {
		params.set("email", contactEmail);
	}

	return fetchNominatimQuery(
		`${baseUrl}/search?${params.toString()}`,
		userAgent,
	);
}

// Geocodifica usando Nominatim público.
// Estrategia:
// 1. Búsqueda estructurada exacta
// 2. Búsqueda estructurada sin código postal
// 3. Búsqueda estructurada quitando el número
// 4. Búsqueda libre con dirección completa
// 5. Búsqueda libre sin CP
// 6. Búsqueda libre sin número y sin CP
export async function geocodeAddress(
	input: GeocodeAddressInput,
): Promise<GeocodeAddressResult | null> {
	geocodingDebugLog("Input original:", input);

	if (!hasEnoughAddressToGeocode(input)) {
		geocodingDebugLog("Dirección insuficiente para geocodificar");
		return null;
	}

	const provider = normalizeText(process.env.GEOCODING_PROVIDER).toLowerCase();

	if (provider && provider !== "nominatim") {
		throw new Error("Proveedor de geocodificación no soportado");
	}

	const baseUrl =
		normalizeText(process.env.GEOCODING_BASE_URL) ||
		"https://nominatim.openstreetmap.org";

	const countryCode =
		normalizeText(process.env.GEOCODING_COUNTRY_CODE).toLowerCase() || "es";

	const countryName =
		normalizeText(process.env.GEOCODING_COUNTRY_NAME) || "España";

	const contactEmail = normalizeText(process.env.GEOCODING_EMAIL) || "";

	const userAgent =
		normalizeText(process.env.GEOCODING_USER_AGENT) || "KinestilistasTFG/1.0";

	const addressVariants = buildAddressVariants(normalizeText(input.address));

	geocodingDebugLog("Configuración:", {
		baseUrl,
		countryCode,
		countryName,
		contactEmail,
		userAgent,
	});

	geocodingDebugLog("Address variants:", addressVariants);

	for (const addressVariant of addressVariants) {
		geocodingDebugLog("Probando variante:", addressVariant);

		const structuredWithPostal = await tryStructuredSearch(
			input,
			userAgent,
			baseUrl,
			countryCode,
			countryName,
			contactEmail,
			addressVariant,
			true,
		);

		if (structuredWithPostal) {
			geocodingDebugLog("OK structuredWithPostal:", structuredWithPostal);
			return structuredWithPostal;
		}

		const structuredWithoutPostal = await tryStructuredSearch(
			input,
			userAgent,
			baseUrl,
			countryCode,
			countryName,
			contactEmail,
			addressVariant,
			false,
		);

		if (structuredWithoutPostal) {
			geocodingDebugLog("OK structuredWithoutPostal:", structuredWithoutPostal);
			return structuredWithoutPostal;
		}

		const freeTextWithPostal = await tryFreeTextSearch(
			input,
			userAgent,
			baseUrl,
			countryCode,
			countryName,
			contactEmail,
			addressVariant,
			true,
		);

		if (freeTextWithPostal) {
			geocodingDebugLog("OK freeTextWithPostal:", freeTextWithPostal);
			return freeTextWithPostal;
		}

		const freeTextWithoutPostal = await tryFreeTextSearch(
			input,
			userAgent,
			baseUrl,
			countryCode,
			countryName,
			contactEmail,
			addressVariant,
			false,
		);

		if (freeTextWithoutPostal) {
			geocodingDebugLog("OK freeTextWithoutPostal:", freeTextWithoutPostal);
			return freeTextWithoutPostal;
		}
	}

	geocodingDebugLog("No se encontró ninguna coincidencia válida");
	return null;
}

export async function geocodeFreeTextAddress(
	input: GeocodeFreeTextInput,
): Promise<GeocodeAddressResult | null> {
	const query = normalizeText(input.query);

	if (!query) {
		return null;
	}

	const config = getGeocodingConfig({ country: input.country });
	const searches = buildFreeTextSearchQueries(query);

	for (const searchQuery of searches) {
		logGeocodingDebug("attempt", { query: searchQuery });

		const params = new URLSearchParams({
			format: "jsonv2",
			limit: "1",
			addressdetails: "1",
			q: searchQuery,
			countrycodes: config.countryCode,
		});

		if (config.contactEmail) {
			params.set("email", config.contactEmail);
		}

		const data = await fetchNominatimSearch(
			`${config.baseUrl}/search?${params.toString()}`,
			config.userAgent,
		);
		const result = mapFirstNominatimResult(data);

		if (result) {
			logGeocodingDebug("matched", {
				query: searchQuery,
				displayName: result.displayName,
				lat: result.lat,
				lng: result.lng,
			});
			return result;
		}
	}

	logGeocodingDebug("no match", { query });
	return null;
}
