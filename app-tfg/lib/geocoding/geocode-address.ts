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
// Nota:
// Nominatim soporta búsqueda estructurada con campos como street, city,
// postalcode y state. Para este proyecto partimos de esa opción porque encaja
// bien con el modelo actual de dirección del cliente.

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

// Geocodifica usando Nominatim público.
// Si más adelante cambias de proveedor, lo ideal es bifurcar aquí por env.
export async function geocodeAddress(
	input: GeocodeAddressInput,
): Promise<GeocodeAddressResult | null> {
	if (!hasEnoughAddressToGeocode(input)) {
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

	const params = new URLSearchParams({
		format: "jsonv2",
		limit: "1",
		addressdetails: "1",
		street: normalizeText(input.address),
		city: normalizeText(input.city),
		postalcode: normalizeText(input.postalCode),
		state: normalizeText(input.province),
		country: normalizeText(input.country) || countryName,
		countrycodes: countryCode,
	});

	if (contactEmail) {
		params.set("email", contactEmail);
	}

	const response = await fetch(`${baseUrl}/search?${params.toString()}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"User-Agent": userAgent,
		},
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("No se pudo geocodificar la dirección");
	}

	const data = (await response.json()) as NominatimSearchResult[];

	if (!Array.isArray(data) || data.length === 0) {
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
	};
}
