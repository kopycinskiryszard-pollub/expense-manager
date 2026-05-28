import {apiGet} from './client.js';

/**
 * Pobiera kategorie transakcji.
 * @param {string|number|null} type - Opcjonalny typ kategorii: income/0 albo expense/1.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listCategories(type = null) {
	return apiGet('/api/categories', {
		type
	});
}
