/**
 * Walidatory transakcji: dane CRUD, filtry historii, sortowanie i paginacja.
 */
const {
	isOptionalTextValid,
	isPositiveInteger,
	isPastOrTodayDate,
	isValidAmount
} = require('./general.validators');

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
	const providedFields = Object.keys(data);
	const unsupportedFields = providedFields.filter((field) => !allowedFields.includes(field));
	if (unsupportedFields.length > 0) {
		errors.fields = `Nieobsługiwane pola: ${unsupportedFields.join(', ')}.`;
	}
	if (partial && providedFields.filter((field) => allowedFields.includes(field)).length === 0) {
		errors.fields = errors.fields || 'Podaj co najmniej jedno pole transakcji do aktualizacji.';
	}
	if ((
			!partial || Object.prototype.hasOwnProperty.call(data, 'categoryId')
		) && !isPositiveInteger(data.categoryId)) {
		errors.categoryId = 'Kategoria transakcji jest wymagana.';
	}
	if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) {
		if (typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 31) {
			errors.name = 'Nazwa transakcji jest wymagana i może mieć maksymalnie 31 znaków.';
		}
	}
	if ((
			!partial || Object.prototype.hasOwnProperty.call(data, 'date')
		) && !isPastOrTodayDate(data.date)) {
		errors.date = 'Data transakcji musi mieć format YYYY-MM-DD i nie może być z przyszłości.';
	}
	if ((
			!partial || Object.prototype.hasOwnProperty.call(data, 'amount')
		) && !isValidAmount(data.amount)) {
		errors.amount = 'Kwota transakcji musi być dodatnia i mieć maksymalnie dwa miejsca po przecinku.';
	}
	if (Object.prototype.hasOwnProperty.call(data, 'description') && !isOptionalTextValid(data.description, 255)) {
		errors.description = 'Opis transakcji może mieć maksymalnie 255 znaków.';
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
	if (Object.prototype.hasOwnProperty.call(transactionData, 'categoryId')) {
		normalized.categoryId = Number(transactionData.categoryId);
	}
	if (Object.prototype.hasOwnProperty.call(transactionData, 'name')) {
		normalized.name =
			String(transactionData.name)
			.trim();
	}
	if (Object.prototype.hasOwnProperty.call(transactionData, 'date')) {
		normalized.date = transactionData.date;
	}
	if (Object.prototype.hasOwnProperty.call(transactionData, 'amount')) {
		normalized.amount =
			Number(transactionData.amount)
			.toFixed(2);
	}
	if (Object.prototype.hasOwnProperty.call(transactionData, 'description')) {
		normalized.description =
			transactionData.description === null || transactionData.description === '' ? null : String(transactionData.description)
			.trim();
	}
	return normalized;
}

/**
 * Sprawdza, czy wartość jest poprawnym miesiącem.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla miesiąca od 1 do 12.
 */
function isValidMonth(value) {
	const month = Number(value);
	return Number.isInteger(month) && month >= 1 && month <= 12;
}

/**
 * Sprawdza, czy wartość jest poprawnym rokiem dla listy transakcji.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True dla roku nie późniejszego niż bieżący.
 */
function isValidTransactionYear(value) {
	const year = Number(value);
	return Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear();
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
		errors.date = 'Data musi mieć format YYYY-MM-DD i nie może być z przyszłości.';
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
	const hasInvalidPage = data.page !== undefined && (
		!Number.isInteger(Number(data.page)) || Number(data.page) <= 0
	);
	const hasInvalidLimit = data.limit !== undefined && ![10, 20, 30, 40, 50].includes(Number(data.limit));
	const useDefaultPagination = hasInvalidPage || hasInvalidLimit;
	const limit = useDefaultPagination ? 10 : (
		[10, 20, 30, 40, 50].includes(Number(data.limit)) ? Number(data.limit) : 10
	);
	const page = useDefaultPagination ? 1 : (
		Number.isInteger(Number(data.page)) && Number(data.page) > 0 ? Number(data.page) : 1
	);
	const filters = {};
	if (data.categoryId !== undefined && data.categoryId !== '' && isPositiveInteger(data.categoryId)) {
		filters.categoryId = Number(data.categoryId);
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
		pagination: {
			page,
			limit,
			offset: (
						page - 1
					) * limit
		},
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
