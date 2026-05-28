import {apiDelete, apiGet, apiPatch, apiPost} from './client.js';

/**
 * Pobiera budżet dla wskazanego miesiąca.
 * @param {object} query - Parametry month i year.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getBudgetForMonth(query = {}) {
	return apiGet('/api/budgets', query);
}

/**
 * Pobiera listę budżetów ze statusami.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listBudgetStatuses() {
	return apiGet('/api/budgets/statuses');
}

/**
 * Tworzy albo aktualizuje budżet dla okresu.
 * @param {object} budgetData - Dane budżetu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function saveBudget(budgetData) {
	return apiPost('/api/budgets', budgetData);
}

/**
 * Aktualizuje budżet po identyfikatorze.
 * @param {number|string} budgetId - Identyfikator budżetu.
 * @param {object} budgetData - Dane budżetu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function updateBudget(budgetId, budgetData) {
	return apiPatch(`/api/budgets/${budgetId}`, budgetData);
}

/**
 * Usuwa budżet po identyfikatorze.
 * @param {number|string} budgetId - Identyfikator budżetu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function deleteBudget(budgetId) {
	return apiDelete(`/api/budgets/${budgetId}`);
}
