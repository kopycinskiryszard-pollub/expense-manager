import {apiDelete, apiGet, apiPatch, apiPost} from './client.js';

/**
 * Pobiera listę transakcji użytkownika.
 * @param {object} query - Parametry listy.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listTransactions(query = {}) {
	return apiGet('/api/transactions', query);
}

/**
 * Pobiera pojedynczą transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getTransaction(transactionID) {
	return apiGet(`/api/transactions/${transactionID}`);
}

/**
 * Tworzy nową transakcję.
 * @param {object} transactionData - Dane transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function createTransaction(transactionData) {
	return apiPost('/api/transactions', transactionData);
}

/**
 * Aktualizuje transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @param {object} transactionData - Dane transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function updateTransaction(transactionID, transactionData) {
	return apiPatch(`/api/transactions/${transactionID}`, transactionData);
}

/**
 * Usuwa transakcję.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function deleteTransaction(transactionID) {
	return apiDelete(`/api/transactions/${transactionID}`);
}
