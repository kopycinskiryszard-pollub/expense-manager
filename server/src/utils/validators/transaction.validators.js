/**
 * Walidatory transakcji: dane CRUD, filtry historii, sortowanie i paginacja.
 */
const {
	hasField,
	isBlank,
	validateAllowedFields,
	hasAnyAllowedField,
	isPositiveInteger,
	isValidMonth: isCommonValidMonth,
	isYearInRange,
	isPastOrTodayDate,
	isValidAmount,
	matchesTrimmed,
	normalizeText,
	normalizeOptionalText,
	normalizeAmount,
	normalizeInteger,
	normalizePaginationQuery
} = require('./general.validators');
const {
	transactionDescriptionRegex,
	transactionNameRegex
} = require('../regex');
const MAX_TRANSACTION_AMOUNT = 9999999.99;

/**
 * Sprawdza, czy pole transakcji jest wymagane albo zostało podane.
 * @param {object} data - Dane wejściowe.
 * @param {string} field - Nazwa pola.
 * @param {boolean} partial - True dla częściowej aktualizacji PATCH.
 * @returns {boolean} True, jeśli pole trzeba zwalidować.
 */
function shouldValidateTransactionField(data, field, partial) {
	return !partial || hasField(data, field);
}

/**
 * Sprawdza, czy nazwa transakcji jest poprawna.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli nazwa jest poprawna.
 */
function isTransactionNameValid(value) {
	return matchesTrimmed(value, transactionNameRegex);
}

/**
 * Waliduje dane nowej albo aktualizowanej transakcji.
 * @param {object} transactionData - Dane transakcji z body żądania.
 * @param {boolean} partial - True dla częściowej aktualizacji PATCH.
 * @returns {{categoryId?: string, name?: string, date?: string, amount?: string, description?: string, fields?: string}} Obiekt błędów walidacji.
 */
function validateTransactionData(transactionData, partial = false) {
	const errors = {};
	const data = transactionData || {};
	const allowedFields = ['categoryId', 'name', 'date', 'amount', 'description'];
	validateAllowedFields(errors, data, allowedFields);
	if (partial && !hasAnyAllowedField(data, allowedFields)) {
		errors.fields = errors.fields || 'Podaj co najmniej jedno pole transakcji do aktualizacji.';
	}
	if (shouldValidateTransactionField(data, 'categoryId', partial) && isBlank(data.categoryId)) {
		errors.categoryId = 'Pole wymagane.';
	} else if (shouldValidateTransactionField(data, 'categoryId', partial) && !isPositiveInteger(data.categoryId)) {
		errors.categoryId = 'Błędna kategoria.';
	}
	if (shouldValidateTransactionField(data, 'name', partial) && isBlank(data.name)) {
		errors.name = 'Pole wymagane.';
	} else if (shouldValidateTransactionField(data, 'name', partial) && !isTransactionNameValid(data.name)) {
		errors.name = 'Błędna nazwa.';
	}
	if (shouldValidateTransactionField(data, 'date', partial) && isBlank(data.date)) {
		errors.date = 'Pole wymagane.';
	} else if (shouldValidateTransactionField(data, 'date', partial) && !isPastOrTodayDate(data.date)) {
		errors.date = 'Błędna data.';
	}
	if (shouldValidateTransactionField(data, 'amount', partial) && isBlank(data.amount)) {
		errors.amount = 'Pole wymagane.';
	} else if (shouldValidateTransactionField(data, 'amount', partial) && (
		!isValidAmount(data.amount) || Number(data.amount) > MAX_TRANSACTION_AMOUNT
	)) {
		errors.amount = 'Błędna kwota.';
	}
	if (hasField(data, 'description') && !transactionDescriptionRegex.test(String(data.description || ''))) {
		errors.description = 'Błędny opis.';
	}
	return errors;
}

/**
 * Normalizuje dane transakcji przed zapisem w bazie danych.
 * @param {object} transactionData - Dane transakcji z body żądania.
 * @returns {{categoryId?: number, name?: string, date?: string, amount?: string, description?: string|null}} Dane gotowe do zapisu.
 */
function normalizeTransactionData(transactionData) {
	const normalized = {};
	if (hasField(transactionData, 'categoryId')) {
		normalized.categoryId = normalizeInteger(transactionData.categoryId);
	}
	if (hasField(transactionData, 'name')) {
		normalized.name = normalizeText(transactionData.name);
	}
	if (hasField(transactionData, 'date')) {
		normalized.date = transactionData.date;
	}
	if (hasField(transactionData, 'amount')) {
		normalized.amount = normalizeAmount(transactionData.amount);
	}
	if (hasField(transactionData, 'description')) {
		normalized.description = normalizeOptionalText(transactionData.description);
	}
	return normalized;
}

/**
 * Sprawdza, czy wartość jest poprawnym miesiącem.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla miesiąca od 1 do 12.
 */
function isValidMonth(value) {
	return isCommonValidMonth(value);
}

/**
 * Sprawdza, czy wartość jest poprawnym rokiem dla listy transakcji.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla roku nie późniejszego niż bieżący.
 */
function isValidTransactionYear(value) {
	return isYearInRange(value, 1900, new Date().getFullYear());
}

/**
 * Normalizuje typ kategorii dla listy transakcji.
 * @param {*} value - Wartość parametru type.
 * @returns {number|null} Typ kategorii albo null.
 */
function normalizeTransactionType(value) {
	if (value === undefined || value === null || value === '') {
		return null;
	}
	const normalizedType = String(value)
	.trim()
	.toLowerCase();
	if (normalizedType === '0' || normalizedType === 'income') {
		return 0;
	}
	if (normalizedType === '1' || normalizedType === 'expense') {
		return 1;
	}
	return null;
}

/**
 * Zwraca bieżący miesiąc i rok.
 * @returns {{month: number, year: number}} Bieżący okres.
 */
function getCurrentTransactionPeriod() {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear()
	};
}

/**
 * Sprawdza, czy query zawiera błędny parametr miesiąca albo roku.
 * @param {object} data - Parametry query.
 * @returns {boolean} True, jeśli podany miesiąc albo rok jest niepoprawny.
 */
function hasInvalidMonthOrYear(data) {
	return (
			   data.month !== undefined && !isValidMonth(data.month)
		   ) || (
			   data.year !== undefined && !isValidTransactionYear(data.year)
		   );
}

/**
 * Waliduje parametry listy transakcji: dokładną datę oraz sortowanie.
 * Błędne filtry kategorii, miesiąca, roku i paginacji są normalizowane bez zwracania 400.
 * @param {object} query - Parametry query żądania listy transakcji.
 * @returns {{date?: string, sortBy?: string, order?: string}} Obiekt błędów walidacji.
 */
function validateTransactionListQuery(query) {
	const errors = {};
	const data = query || {};
	if (data.date !== undefined && data.date !== '' && !isPastOrTodayDate(data.date)) {
		errors.date = 'Błędna data.';
	}
	if (data.sortBy !== undefined && data.sortBy !== '' && !['date', 'amount'].includes(String(data.sortBy))) {
		errors.sortBy = 'Sortowanie jest możliwe tylko po date albo amount.';
	}
	if (data.order !== undefined && data.order !== '' && !['asc', 'desc'].includes(String(data.order)
	.toLowerCase())) {
		errors.order = 'Kierunek sortowania musi mieć wartość asc albo desc.';
	}
	return errors;
}

/**
 * Normalizuje parametry listy transakcji, w tym bezpieczne wartości paginacji.
 * @param {object} query - Parametry query żądania listy transakcji.
 * @returns {{filters: object, pagination: {page: number, limit: number, offset: number}, sorting: {sortBy: string, order: string}}} Parametry listy.
 */
function normalizeTransactionListQuery(query) {
	const data = query || {};
	const pagination = normalizePaginationQuery(data);
	const filters = {};
	if (data.categoryId !== undefined && data.categoryId !== '' && isPositiveInteger(data.categoryId)) {
		filters.categoryId = Number(data.categoryId);
	}
	const type = normalizeTransactionType(data.type);
	if (type !== null) {
		filters.type = type;
	}
	const shouldUseCurrentPeriod = hasInvalidMonthOrYear(data);
	if (data.date !== undefined && data.date !== '' && !shouldUseCurrentPeriod) {
		filters.date = data.date;
	}
	if (shouldUseCurrentPeriod) {
		const currentPeriod = getCurrentTransactionPeriod();
		filters.month = currentPeriod.month;
		filters.year = currentPeriod.year;
	} else if (data.month !== undefined && data.month !== '') {
		filters.month = Number(data.month);
		if (data.year !== undefined && data.year !== '') {
			filters.year = Number(data.year);
		}
	} else if (data.year !== undefined && data.year !== '') {
		filters.year = Number(data.year);
	}
	return {
		filters,
		pagination,
		sorting: {
			sortBy: data.sortBy || 'date',
			order: data.order ? String(data.order)
			.toLowerCase() : 'desc'
		}
	};
}

module.exports = {
	validateTransactionData,
	normalizeTransactionData,
	validateTransactionListQuery,
	normalizeTransactionListQuery
};
