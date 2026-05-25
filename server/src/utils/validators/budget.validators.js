/**
 * Walidatory budzetow miesiecznych: okres budzetowy, kwota limitu i parametry wyszukiwania.
 */

/**
 * Zwraca miesiac i rok z podanej daty referencyjnej.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {{month: number, year: number}} Biezacy okres budzetowy.
 */
function getCurrentBudgetPeriod(referenceDate = new Date()) {
	return {
		month: referenceDate.getMonth() + 1,
		year: referenceDate.getFullYear()
	};
}

/**
 * Zamienia miesiac i rok na porownywalny indeks miesieczny.
 * @param {number} month - Miesiac od 1 do 12.
 * @param {number} year - Rok.
 * @returns {number} Indeks okresu.
 */
function getBudgetPeriodIndex(month, year) {
	return year * 12 + month - 1;
}

/**
 * Sprawdza, czy wartosc jest poprawnym miesiacem.
 * @param {*} value - Sprawdzana wartosc.
 * @returns {boolean} True dla liczb calkowitych 1-12.
 */
function isValidBudgetMonth(value) {
	const month = Number(value);
	return Number.isInteger(month) && month >= 1 && month <= 12;
}

/**
 * Sprawdza, czy wartosc jest poprawnym rokiem budzetu.
 * @param {*} value - Sprawdzana wartosc.
 * @returns {boolean} True dla sensownego roku kalendarzowego.
 */
function isValidBudgetYear(value) {
	const year = Number(value);
	return Number.isInteger(year) && year >= 1900 && year <= 9999;
}

/**
 * Sprawdza, czy kwota budzetu jest nieujemna i ma maksymalnie dwa miejsca po przecinku.
 * @param {*} value - Sprawdzana kwota.
 * @returns {boolean} True dla poprawnej kwoty.
 */
function isValidBudgetAmount(value) {
	if (value === null || value === undefined || value === '') {
		return false;
	}
	const textValue = String(value)
	.trim();
	if (!/^\d+(\.\d{1,2})?$/.test(textValue)) {
		return false;
	}
	return Number(textValue) >= 0;
}

/**
 * Sprawdza, czy okres budzetowy jest w przeszlosci.
 * @param {number} month - Miesiac budzetu.
 * @param {number} year - Rok budzetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {boolean} True dla okresow sprzed biezacego miesiaca.
 */
function isPastBudgetPeriod(month, year, referenceDate = new Date()) {
	const current = getCurrentBudgetPeriod(referenceDate);
	return getBudgetPeriodIndex(month, year) < getBudgetPeriodIndex(current.month, current.year);
}

/**
 * Sprawdza, czy okres miesci sie od biezacego miesiaca do 12 miesiecy w przod.
 * @param {number} month - Miesiac budzetu.
 * @param {number} year - Rok budzetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {boolean} True dla okresu dostepnego do planowania.
 */
function isBudgetPeriodInPlanningWindow(month, year, referenceDate = new Date()) {
	const current = getCurrentBudgetPeriod(referenceDate);
	const currentIndex = getBudgetPeriodIndex(current.month, current.year);
	const budgetIndex = getBudgetPeriodIndex(month, year);
	return budgetIndex >= currentIndex && budgetIndex <= currentIndex + 12;
}

/**
 * Waliduje dane budzetu z body zadania.
 * @param {object} budgetData - Dane budzetu.
 * @param {boolean} partial - True dla czesciowej aktualizacji PATCH.
 * @returns {{month?: string, year?: string, limitAmount?: string, fields?: string}} Obiekt bledow.
 */
function validateBudgetData(budgetData, partial = false) {
	const errors = {};
	const data = budgetData || {};
	const allowedFields = ['month', 'year', 'limitAmount'];
	const providedFields = Object.keys(data);
	const unsupportedFields = providedFields.filter((field) => !allowedFields.includes(field));
	if (unsupportedFields.length > 0) {
		errors.fields = `Nieobslugiwane pola: ${unsupportedFields.join(', ')}.`;
	}
	if (partial && providedFields.filter((field) => allowedFields.includes(field)).length === 0) {
		errors.fields = errors.fields || 'Podaj co najmniej jedno pole budzetu do aktualizacji.';
	}
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'month')) && !isValidBudgetMonth(data.month)) {
		errors.month = 'Miesiac musi byc liczba od 1 do 12.';
	}
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'year')) && !isValidBudgetYear(data.year)) {
		errors.year = 'Rok musi byc poprawnym rokiem kalendarzowym.';
	}
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'limitAmount')) && !isValidBudgetAmount(data.limitAmount)) {
		errors.limitAmount = 'Limit budzetu musi byc nieujemna kwota z maksymalnie dwoma miejscami po przecinku.';
	}
	return errors;
}

/**
 * Waliduje, czy okres budzetu mozna planowac.
 * @param {number} month - Miesiac budzetu.
 * @param {number} year - Rok budzetu.
 * @param {Date} referenceDate - Data odniesienia.
 * @returns {{period?: string}} Obiekt bledow okresu.
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
 * Normalizuje dane budzetu przed zapisem.
 * @param {object} budgetData - Dane z body zadania.
 * @returns {{month?: number, year?: number, limitAmount?: string}} Dane gotowe do modelu.
 */
function normalizeBudgetData(budgetData) {
	const normalized = {};
	if (Object.prototype.hasOwnProperty.call(budgetData, 'month')) {
		normalized.month = Number(budgetData.month);
	}
	if (Object.prototype.hasOwnProperty.call(budgetData, 'year')) {
		normalized.year = Number(budgetData.year);
	}
	if (Object.prototype.hasOwnProperty.call(budgetData, 'limitAmount')) {
		normalized.limitAmount = Number(budgetData.limitAmount).toFixed(2);
	}
	return normalized;
}

/**
 * Normalizuje parametry wyszukiwania budzetu. Niepoprawne albo niepelne filtry wskazuja biezacy miesiac.
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
