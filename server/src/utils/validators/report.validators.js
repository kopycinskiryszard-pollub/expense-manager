/**
 * Walidatory raportów miesięcznych i rocznych.
 */
const {
	isValidMonth,
	isYearInRange,
	normalizeInteger
} = require('./general.validators');
const REPORT_VIEWS = ['category', 'month'];
const REPORT_TYPES = ['income', 'expense'];

/**
 * Sprawdza, czy rok jest poprawny dla raportów.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli rok jest poprawny.
 */
function isValidReportYear(value) {
	return isYearInRange(value, 1900, 9999);
}

/**
 * Zwraca bieżący miesiąc i rok.
 * @returns {{month: number, year: number}} Bieżący okres.
 */
function getCurrentReportPeriod() {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear()
	};
}

/**
 * Normalizuje parametry raportu miesięcznego.
 * @param {object} query - Parametry query.
 * @returns {{month: number, year: number}} Okres raportu.
 */
function normalizeMonthlyReportQuery(query) {
	const data = query || {};
	if (isValidMonth(data.month) && isValidReportYear(data.year)) {
		return {
			month: normalizeInteger(data.month),
			year: normalizeInteger(data.year)
		};
	}
	return getCurrentReportPeriod();
}

/**
 * Normalizuje parametry raportu rocznego.
 * @param {object} query - Parametry query.
 * @returns {{year: number, incomeView: string, expenseView: string}} Parametry raportu.
 */
function normalizeYearlyReportQuery(query) {
	const data = query || {};
	const currentPeriod = getCurrentReportPeriod();
	return {
		year: isValidReportYear(data.year) ? normalizeInteger(data.year) : currentPeriod.year,
		incomeView: REPORT_VIEWS.includes(String(data.incomeView)) ? String(data.incomeView) : 'category',
		expenseView: REPORT_VIEWS.includes(String(data.expenseView)) ? String(data.expenseView) : 'category'
	};
}

/**
 * Waliduje parametry listy transakcji z raportu rocznego.
 * @param {object} query - Parametry query.
 * @returns {{type?: string, scope?: string}} Obiekt błędów.
 */
function validateYearlyReportTransactionsQuery(query) {
	const errors = {};
	const data = query || {};
	if (!REPORT_TYPES.includes(String(data.type))) {
		errors.type = 'Typ raportu musi mieć wartość income albo expense.';
	}
	if ((
			data.categoryId === undefined || data.categoryId === ''
		) && (
			data.month === undefined || data.month === ''
		)) {
		errors.scope = 'Podaj categoryId albo month.';
	}
	if (data.categoryId !== undefined && data.categoryId !== '' && (
		!Number.isInteger(Number(data.categoryId)) || Number(data.categoryId) <= 0
	)) {
		errors.categoryId = 'Kategoria musi być dodatnią liczbą całkowitą.';
	}
	if (data.month !== undefined && data.month !== '' && !isValidMonth(data.month)) {
		errors.month = 'Miesiąc musi być liczbą od 1 do 12.';
	}
	return errors;
}

/**
 * Normalizuje parametry listy transakcji z raportu rocznego.
 * @param {object} query - Parametry query.
 * @returns {{year: number, type: string, categoryId?: number, month?: number}} Filtry listy.
 */
function normalizeYearlyReportTransactionsQuery(query) {
	const data = query || {};
	const currentPeriod = getCurrentReportPeriod();
	const filters = {
		year: isValidReportYear(data.year) ? normalizeInteger(data.year) : currentPeriod.year,
		type: String(data.type) === 'income' ? 'income' : 'expense'
	};
	if (data.categoryId !== undefined && data.categoryId !== '' && Number.isInteger(Number(data.categoryId)) && Number(data.categoryId) > 0) {
		filters.categoryId = normalizeInteger(data.categoryId);
	}
	if (data.month !== undefined && data.month !== '' && isValidMonth(data.month)) {
		filters.month = normalizeInteger(data.month);
	}
	return filters;
}

module.exports = {
	normalizeMonthlyReportQuery,
	normalizeYearlyReportQuery,
	validateYearlyReportTransactionsQuery,
	normalizeYearlyReportTransactionsQuery
};
