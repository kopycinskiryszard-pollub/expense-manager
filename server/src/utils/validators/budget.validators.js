/**
 * Walidatory budżetów miesięcznych: okres budżetowy, kwota limitu i parametry wyszukiwania.
 */
const {
	hasField,
	validateAllowedFields,
	hasAnyAllowedField,
	isValidMonth,
	isYearInRange,
	isNonNegativeAmount,
	normalizeAmount,
	normalizeInteger
} = require('./general.validators');

/**
 * Zwraca miesiąc i rok z podanej daty referencyjnej.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {{month: number, year: number}} Bieżący okres budżetowy.
 */
function getCurrentBudgetPeriod(referenceDate = new Date()) {
	return {
		month: referenceDate.getMonth() + 1,
		year: referenceDate.getFullYear()
	};
}

/**
 * Zamienia miesiąc i rok na porównywalny indeks miesięczny.
 * @param {number} month - Miesiąc od 1 do 12.
 * @param {number} year - Rok.
 * @returns {number} Indeks okresu.
 */
function getBudgetPeriodIndex(month, year) {
	return year * 12 + month - 1;
}

/**
 * Sprawdza, czy wartość jest poprawnym miesiącem.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla liczb całkowitych 1-12.
 */
function isValidBudgetMonth(value) {
	return isValidMonth(value);
}

/**
 * Sprawdza, czy wartość jest poprawnym rokiem budżetu.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla sensownego roku kalendarzowego.
 */
function isValidBudgetYear(value) {
	return isYearInRange(value, 1900, 9999);
}

/**
 * Sprawdza, czy kwota budżetu jest nieujemna i ma maksymalnie dwa miejsca po przecinku.
 * @param {*} value - Sprawdzana kwota.
 * @returns {boolean} True dla poprawnej kwoty.
 */
function isValidBudgetAmount(value) {
	return isNonNegativeAmount(value);
}

/**
 * Sprawdza, czy pole budżetu jest wymagane albo zostało podane.
 * @param {object} data - Dane wejściowe.
 * @param {string} field - Nazwa pola.
 * @param {boolean} partial - True dla częściowej aktualizacji PATCH.
 * @returns {boolean} True, jeśli pole trzeba zwalidować.
 */
function shouldValidateBudgetField(data, field, partial) {
	return !partial || hasField(data, field);
}

/**
 * Sprawdza, czy okres budżetowy jest w przeszłości.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {boolean} True dla okresów sprzed bieżącego miesiąca.
 */
function isPastBudgetPeriod(month, year, referenceDate = new Date()) {
	const current = getCurrentBudgetPeriod(referenceDate);
	return getBudgetPeriodIndex(month, year) < getBudgetPeriodIndex(current.month, current.year);
}

/**
 * Sprawdza, czy okres mieści się od bieżącego miesiąca do 12 miesięcy w przód.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {boolean} True dla okresu dostępnego do planowania.
 */
function isBudgetPeriodInPlanningWindow(month, year, referenceDate = new Date()) {
	const current = getCurrentBudgetPeriod(referenceDate);
	const currentIndex = getBudgetPeriodIndex(current.month, current.year);
	const budgetIndex = getBudgetPeriodIndex(month, year);
	return budgetIndex >= currentIndex && budgetIndex <= currentIndex + 12;
}

/**
 * Waliduje dane budżetu z body żądania.
 * @param {object} budgetData - Dane budżetu.
 * @param {boolean} partial - True dla częściowej aktualizacji PATCH.
 * @returns {{month?: string, year?: string, limitAmount?: string, fields?: string}} Obiekt błędów.
 */
function validateBudgetData(budgetData, partial = false) {
	const errors = {};
	const data = budgetData || {};
	const allowedFields = ['month', 'year', 'limitAmount'];
	validateAllowedFields(errors, data, allowedFields);
	if (partial && !hasAnyAllowedField(data, allowedFields)) {
		errors.fields = errors.fields || 'Podaj co najmniej jedno pole budzetu do aktualizacji.';
	}
	if (shouldValidateBudgetField(data, 'month', partial) && !isValidBudgetMonth(data.month)) {
		errors.month = 'Miesiac musi byc liczba od 1 do 12.';
	}
	if (shouldValidateBudgetField(data, 'year', partial) && !isValidBudgetYear(data.year)) {
		errors.year = 'Rok musi byc poprawnym rokiem kalendarzowym.';
	}
	if (shouldValidateBudgetField(data, 'limitAmount', partial) && !isValidBudgetAmount(data.limitAmount)) {
		errors.limitAmount = 'Limit budzetu musi byc nieujemna kwota z maksymalnie dwoma miejscami po przecinku.';
	}
	return errors;
}

/**
 * Waliduje, czy okres budżetu można planować.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {{period?: string}} Obiekt błędów okresu.
 */
function validateBudgetPlanningPeriod(month, year, referenceDate = new Date()) {
	if (!isBudgetPeriodInPlanningWindow(month, year, referenceDate)) {
		return {
			period: 'Budzet mozna planowac od biezacego miesiaca do 12 miesiecy w przod.'
		};
	}
	return {};
}

/**
 * Normalizuje dane budżetu przed zapisem.
 * @param {object} budgetData - Dane z body żądania.
 * @returns {{month?: number, year?: number, limitAmount?: string}} Dane gotowe do modelu.
 */
function normalizeBudgetData(budgetData) {
	const normalized = {};
	if (hasField(budgetData, 'month')) {
		normalized.month = normalizeInteger(budgetData.month);
	}
	if (hasField(budgetData, 'year')) {
		normalized.year = normalizeInteger(budgetData.year);
	}
	if (hasField(budgetData, 'limitAmount')) {
		normalized.limitAmount = normalizeAmount(budgetData.limitAmount);
	}
	return normalized;
}

/**
 * Normalizuje parametry wyszukiwania budżetu. Niepoprawne albo niepełne filtry wskazują bieżący miesiąc.
 * @param {object} query - Parametry query.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {{month: number, year: number}} Okres wyszukiwania.
 */
function normalizeBudgetQuery(query, referenceDate = new Date()) {
	const data = query || {};
	if (isValidBudgetMonth(data.month) && isValidBudgetYear(data.year)) {
		return {
			month: Number(data.month),
			year: Number(data.year)
		};
	}
	return getCurrentBudgetPeriod(referenceDate);
}

module.exports = {
	getCurrentBudgetPeriod,
	isPastBudgetPeriod,
	isBudgetPeriodInPlanningWindow,
	validateBudgetData,
	validateBudgetPlanningPeriod,
	normalizeBudgetData,
	normalizeBudgetQuery
};
