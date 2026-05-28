/**
 * Ogólne funkcje walidacyjne współdzielone przez walidatory domenowe.
 */
const {
	ALLOWED_PAGE_LIMITS
} = require('../constants');
const {
	dateRegex,
	monthRegex,
	nonNegativeAmountRegex,
	positiveAmountRegex,
	positiveIntegerRegex,
	yearRegex
} = require('../regex');

/**
 * Sprawdza, czy obiekt błędów zawiera co najmniej jeden błąd.
 * @param {object} errors - Obiekt błędów walidacji.
 * @returns {boolean} True, jeśli obiekt zawiera błędy.
 */
function hasValidationErrors(errors) {
	return Object.keys(errors).length > 0;
}

/**
 * Sprawdza, czy obiekt zawiera wskazane pole.
 * @param {object} data - Sprawdzany obiekt.
 * @param {string} field - Nazwa pola.
 * @returns {boolean} True, jeśli pole istnieje w obiekcie.
 */
function hasField(data, field) {
	return Object.prototype.hasOwnProperty.call(data, field);
}

/**
 * Sprawdza, czy wartość po przycięciu jest pusta.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli wartość jest pusta.
 */
function isBlank(value) {
	return String(value || '')
	.trim() === '';
}

/**
 * Dodaje błąd dla pól, których walidator nie obsługuje.
 * @param {object} errors - Obiekt błędów.
 * @param {object} data - Dane wejściowe.
 * @param {string[]} allowedFields - Lista obsługiwanych pól.
 */
function validateAllowedFields(errors, data, allowedFields) {
	const unsupportedFields = Object.keys(data)
									.filter((field) => !allowedFields.includes(field));
	if (unsupportedFields.length > 0) {
		errors.fields = `Nieobsługiwane pola: ${unsupportedFields.join(', ')}.`;
	}
}

/**
 * Sprawdza, czy podano co najmniej jedno obsługiwane pole.
 * @param {object} data - Dane wejściowe.
 * @param {string[]} allowedFields - Lista obsługiwanych pól.
 * @returns {boolean} True, jeśli istnieje co najmniej jedno obsługiwane pole.
 */
function hasAnyAllowedField(data, allowedFields) {
	return Object.keys(data)
				 .some((field) => allowedFields.includes(field));
}

/**
 * Sprawdza wartość tekstową przez regex po przycięciu spacji.
 * @param {*} value - Sprawdzana wartość.
 * @param {RegExp} regex - Wyrażenie regularne.
 * @returns {boolean} True, jeśli wartość pasuje do wzorca.
 */
function matchesTrimmed(value, regex) {
	return regex.test(String(value || '')
	.trim());
}

/**
 * Sprawdza, czy wartość tekstowa jest pusta albo mieści się w podanym limicie znaków.
 * @param {*} value - Sprawdzana wartość.
 * @param {number} maxLength - Maksymalna liczba znaków.
 * @returns {boolean} True, jeśli wartość jest poprawna.
 */
function isOptionalTextValid(value, maxLength) {
	return value === null || value === undefined || (
		typeof value === 'string' && value.trim().length <= maxLength
	);
}

/**
 * Sprawdza, czy wartość jest dodatnią liczbą całkowitą.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli wartość jest dodatnią liczbą całkowitą.
 */
function isPositiveInteger(value) {
	return matchesTrimmed(value, positiveIntegerRegex);
}

/**
 * Sprawdza, czy wartość jest poprawnym miesiącem.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla miesiąca od 1 do 12.
 */
function isValidMonth(value) {
	return matchesTrimmed(value, monthRegex);
}

/**
 * Sprawdza, czy wartość jest rokiem z podanego zakresu.
 * @param {*} value - Sprawdzana wartość.
 * @param {number} minYear - Minimalny rok.
 * @param {number} maxYear - Maksymalny rok.
 * @returns {boolean} True, jeśli rok mieści się w zakresie.
 */
function isYearInRange(value, minYear, maxYear) {
	if (!matchesTrimmed(value, yearRegex)) {
		return false;
	}
	const year = Number(value);
	return year >= minYear && year <= maxYear;
}

/**
 * Sprawdza, czy data ma format YYYY-MM-DD i istnieje w kalendarzu.
 * @param {*} value - Sprawdzana data.
 * @returns {boolean} True, jeśli data jest poprawna.
 */
function isValidDate(value) {
	if (typeof value !== 'string' || !dateRegex.test(value)) {
		return false;
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) {
		return false;
	}
	const [year, month, day] = value.split('-')
									.map(Number);
	return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

/**
 * Sprawdza, czy data ma format YYYY-MM-DD, istnieje w kalendarzu i nie jest z przyszłości.
 * @param {*} value - Sprawdzana data.
 * @returns {boolean} True, jeśli data jest poprawna.
 */
function isPastOrTodayDate(value) {
	if (!isValidDate(value)) {
		return false;
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	const today = new Date();
	const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	return date <= todayUtc;
}

/**
 * Sprawdza, czy data ma format YYYY-MM-DD, istnieje w kalendarzu i jest z przyszłości.
 * @param {*} value - Sprawdzana data.
 * @returns {boolean} True, jeśli data jest poprawna i przyszła.
 */
function isFutureDate(value) {
	if (!isValidDate(value)) {
		return false;
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	const today = new Date();
	const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	return date > todayUtc;
}

/**
 * Sprawdza, czy kwota jest nieujemna i ma maksymalnie dwa miejsca po przecinku.
 * @param {*} value - Sprawdzana kwota.
 * @returns {boolean} True, jeśli kwota jest poprawna.
 */
function isNonNegativeAmount(value) {
	const textValue = String(value)
	.trim();
	return nonNegativeAmountRegex.test(textValue);
}

/**
 * Sprawdza, czy kwota jest dodatnia i ma maksymalnie dwa miejsca po przecinku.
 * @param {*} value - Sprawdzana kwota.
 * @returns {boolean} True, jeśli kwota jest poprawna.
 */
function isValidAmount(value) {
	return matchesTrimmed(value, positiveAmountRegex);
}

/**
 * Normalizuje tekst wymagany do zapisu.
 * @param {*} value - Wartość wejściowa.
 * @returns {string} Przycięty tekst.
 */
function normalizeText(value) {
	return String(value)
	.trim();
}

/**
 * Normalizuje opcjonalny tekst, zamieniając null i pusty tekst na null.
 * @param {*} value - Wartość wejściowa.
 * @returns {string|null} Przycięty tekst albo null.
 */
function normalizeOptionalText(value) {
	return value === null || value === undefined || value === '' ? null : normalizeText(value);
}

/**
 * Normalizuje kwotę do formatu z dwoma miejscami po przecinku.
 * @param {*} value - Wartość wejściowa.
 * @returns {string} Kwota gotowa do zapisu.
 */
function normalizeAmount(value) {
	return Number(value)
	.toFixed(2);
}

/**
 * Normalizuje liczbę całkowitą.
 * @param {*} value - Wartość wejściowa.
 * @returns {number} Liczba gotowa do zapisu.
 */
function normalizeInteger(value) {
	return Number(value);
}

/**
 * Normalizuje parametry paginacji list.
 * Jeśli page albo limit są błędne, zwraca pierwszą stronę i limit 10.
 * @param {object} query - Parametry query.
 * @returns {{page: number, limit: number, offset: number}} Parametry paginacji.
 */
function normalizePaginationQuery(query) {
	const data = query || {};
	const hasInvalidPage = data.page !== undefined && (
		!Number.isInteger(Number(data.page)) || Number(data.page) <= 0
	);
	const hasInvalidLimit = data.limit !== undefined && !ALLOWED_PAGE_LIMITS.includes(Number(data.limit));
	const useDefaultPagination = hasInvalidPage || hasInvalidLimit;
	const limit = useDefaultPagination ? 10 : (
		ALLOWED_PAGE_LIMITS.includes(Number(data.limit)) ? Number(data.limit) : 10
	);
	const page = useDefaultPagination ? 1 : (
		Number.isInteger(Number(data.page)) && Number(data.page) > 0 ? Number(data.page) : 1
	);
	return {
		page,
		limit,
		offset: (
					page - 1
				) * limit
	};
}

module.exports = {
	hasValidationErrors,
	hasField,
	isBlank,
	validateAllowedFields,
	hasAnyAllowedField,
	matchesTrimmed,
	isOptionalTextValid,
	isPositiveInteger,
	isValidMonth,
	isYearInRange,
	isPastOrTodayDate,
	isFutureDate,
	isNonNegativeAmount,
	isValidAmount,
	normalizeText,
	normalizeOptionalText,
	normalizeAmount,
	normalizeInteger,
	normalizePaginationQuery
};
