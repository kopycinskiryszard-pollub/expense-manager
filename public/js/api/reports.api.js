import {apiGet} from './client.js';

/**
 * Pobiera raport miesieczny.
 * @param {object} query - Parametry month i year.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getMonthlyReport(query = {}) {
	return apiGet('/api/reports/monthly', query);
}

/**
 * Pobiera raport roczny.
 * @param {object} query - Parametry year, incomeView i expenseView.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getYearlyReport(query = {}) {
	return apiGet('/api/reports/yearly', query);
}

/**
 * Pobiera transakcje z wybranego wiersza raportu rocznego.
 * @param {object} query - Parametry year, type oraz categoryId albo month.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getYearlyReportTransactions(query = {}) {
	return apiGet('/api/reports/yearly/transactions', query);
}
