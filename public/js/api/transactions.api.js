import {apiRequest} from './client.js';

/**
 * Buduje query string z niepustych parametrów.
 * @param {object} query - Parametry filtrowania, sortowania i paginacji.
 * @returns {string} Query string z poprzedzającym znakiem ? albo pusty tekst.
 */
function buildQueryString(query = {}) {
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
 * Pobiera listę transakcji użytkownika.
 * @param {object} query - Parametry listy.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listTransactions(query = {}) {
	return apiRequest(`/api/transactions${buildQueryString(query)}`);
}

/**
 * Pobiera pojedynczą transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getTransaction(transactionID) {
	return apiRequest(`/api/transactions/${transactionID}`);
}

/**
 * Tworzy nową transakcję.
 * @param {object} transactionData - Dane transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function createTransaction(transactionData) {
	return apiRequest('/api/transactions', {
		method: 'POST',
		body: JSON.stringify(transactionData)
	});
}

/**
 * Aktualizuje transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @param {object} transactionData - Dane transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function updateTransaction(transactionID, transactionData) {
	return apiRequest(`/api/transactions/${transactionID}`, {
		method: 'PATCH',
		body: JSON.stringify(transactionData)
	});
}

/**
 * Usuwa transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function deleteTransaction(transactionID) {
	return apiRequest(`/api/transactions/${transactionID}`, {
		method: 'DELETE'
	});
}
