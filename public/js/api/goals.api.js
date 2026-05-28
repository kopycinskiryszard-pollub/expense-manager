import {apiDelete, apiGet, apiPatch, apiPost} from './client.js';

/**
 * Pobiera aktywne cele.
 * @param {object} query - Parametry listy.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listGoals(query = {}) {
	return apiGet('/api/goals', query);
}

/**
 * Pobiera zrealizowane cele.
 * @param {object} query - Parametry listy.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function listGoalHistory(query = {}) {
	return apiGet('/api/goals/history', query);
}

/**
 * Pobiera pojedynczy cel.
 * @param {number|string} goalId - Identyfikator celu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getGoal(goalId) {
	return apiGet(`/api/goals/${goalId}`);
}

/**
 * Tworzy cel.
 * @param {object} goalData - Dane celu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function createGoal(goalData) {
	return apiPost('/api/goals', goalData);
}

/**
 * Aktualizuje cel.
 * @param {number|string} goalId - Identyfikator celu.
 * @param {object} goalData - Dane celu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function updateGoal(goalId, goalData) {
	return apiPatch(`/api/goals/${goalId}`, goalData);
}

/**
 * Zmienia zebraną kwotę celu.
 * @param {number|string} goalId - Identyfikator celu.
 * @param {object} amountData - Dane zmiany kwoty.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function updateGoalAmount(goalId, amountData) {
	return apiPatch(`/api/goals/${goalId}/amount`, amountData);
}

/**
 * Usuwa cel.
 * @param {number|string} goalId - Identyfikator celu.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function deleteGoal(goalId) {
	return apiDelete(`/api/goals/${goalId}`);
}
