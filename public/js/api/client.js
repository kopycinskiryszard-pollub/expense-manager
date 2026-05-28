import {getSessionID} from '../state/session.js';

/**
 * Wykonuje żądanie do API i ujednolica obsługę odpowiedzi oraz błędów.
 * @param {string} path - Ścieżka endpointu API.
 * @param {object} options - Opcje żądania fetch.
 * @returns {Promise<object>} Odpowiedź API.
 */
export async function apiRequest(path, options = {}) {
	const headers = {
		'Content-Type': 'application/json', ... options.headers
	};
	const sessionID = getSessionID();
	if (sessionID) {
		headers.Authorization = `Bearer ${sessionID}`;
	}
	const response = await fetch(path, {
		... options,
		headers
	});
	const payload = await response.json()
								  .catch(() => null);
	if (!response.ok || !payload?.success) {
		const errorMessage = payload?.message || 'Nie udało się wykonać operacji.';
		const error = new Error(errorMessage);
		error.status = response.status;
		error.details = payload?.details || null;
		throw error;
	}
	return payload;
}

/**
 * Buduje query string z niepustych parametrów.
 * @param {object} query - Parametry query.
 * @returns {string} Query string z poprzedzającym znakiem ? albo pusty tekst.
 */
export function buildQueryString(query = {}) {
	const params = new URLSearchParams();
	Object.entries(query)
		  .forEach(([key, value]) => {
			  if (value !== undefined && value !== null && value !== '') {
				  params.set(key, value);
			  }
		  });
	const queryString = params.toString();
	return queryString ? `?${queryString}` : '';
}

/**
 * Wysyła żądanie GET.
 * @param {string} path - Ścieżka endpointu API.
 * @param {object} query - Parametry query.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function apiGet(path, query = {}) {
	return apiRequest(`${path}${buildQueryString(query)}`);
}

/**
 * Wysyła żądanie POST z opcjonalnym JSON body.
 * @param {string} path - Ścieżka endpointu API.
 * @param {object|null} data - Dane żądania.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function apiPost(path, data = null) {
	return apiRequest(path, {
		method: 'POST', ... (
			data === null ? {} : {
				body: JSON.stringify(data)
			}
		)
	});
}

/**
 * Wysyła żądanie PATCH z JSON body.
 * @param {string} path - Ścieżka endpointu API.
 * @param {object} data - Dane żądania.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function apiPatch(path, data) {
	return apiRequest(path, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

/**
 * Wysyła żądanie DELETE.
 * @param {string} path - Ścieżka endpointu API.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function apiDelete(path) {
	return apiRequest(path, {
		method: 'DELETE'
	});
}
