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
