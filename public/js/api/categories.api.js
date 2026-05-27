import {apiRequest} from './client.js';

/**
 * Pobiera kategorie transakcji.
 * @param {string|number|null} type - Opcjonalny typ kategorii: income/0 albo expense/1.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listCategories(type = null) {
	const query = type === null || type === undefined || type === '' ? '' : `?type=${encodeURIComponent(type)}`;
	return apiRequest(`/api/categories${query}`);
}
