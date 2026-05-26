/**
 * Walidatory celów oszczędnościowych: dane celu, zmiana kwoty, filtrowanie i paginacja.
 */
const {
	hasField,
	validateAllowedFields,
	hasAnyAllowedField,
	isOptionalTextValid,
	isYearInRange,
	isFutureDate,
	isNonNegativeAmount,
	isValidAmount,
	normalizeText,
	normalizeOptionalText,
	normalizeAmount
} = require('./general.validators');
const {
	ALLOWED_PAGE_LIMITS
} = require('../constants');

/**
 * Sprawdza, czy rok jest poprawnym filtrem listy celów.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli rok jest poprawny.
 */
function isValidGoalYear(value) {
	return isYearInRange(value, 1900, 9999);
}

/**
 * Sprawdza, czy nazwa celu jest poprawna.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli nazwa jest poprawna.
 */
function isGoalNameValid(value) {
	return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 100;
}

/**
 * Sprawdza, czy opis celu jest poprawny.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli opis jest poprawny.
 */
function isGoalDescriptionValid(value) {
	return isOptionalTextValid(value, 1000);
}

/**
 * Zwraca komunikat błędu dla opisu celu.
 * @param {*} value - Sprawdzana wartość.
 * @returns {string} Komunikat błędu.
 */
function getGoalDescriptionError(value) {
	if (value !== null && value !== undefined && typeof value !== 'string') {
		return 'Opis celu musi być tekstem.';
	}
	return 'Opis celu może mieć maksymalnie 1000 znaków.';
}

/**
 * Sprawdza, czy operacja zmiany kwoty celu jest poprawna.
 * @param {*} value - Sprawdzana wartość.
 * @returns {boolean} True, jeśli operacja jest poprawna.
 */
function isGoalAmountOperationValid(value) {
	return ['increase', 'decrease'].includes(String(value));
}

/**
 * Waliduje nazwę celu, jeśli pole jest wymagane albo zostało podane.
 * @param {object} errors - Obiekt błędów.
 * @param {object} data - Dane wejściowe.
 * @param {boolean} required - Czy pole jest wymagane.
 */
function validateGoalNameField(errors, data, required = false) {
	if ((
			required || hasField(data, 'name')
		) && !isGoalNameValid(data.name)) {
		errors.name = 'Nazwa celu jest wymagana i może mieć maksymalnie 100 znaków.';
	}
}

/**
 * Waliduje kwotę docelową, jeśli pole jest wymagane albo zostało podane.
 * @param {object} errors - Obiekt błędów.
 * @param {object} data - Dane wejściowe.
 * @param {boolean} required - Czy pole jest wymagane.
 */
function validateTargetAmountField(errors, data, required = false) {
	if ((
			required || hasField(data, 'targetAmount')
		) && !isValidAmount(data.targetAmount)) {
		errors.targetAmount = 'Kwota docelowa musi być dodatnia i mieć maksymalnie dwa miejsca po przecinku.';
	}
}

/**
 * Waliduje opis celu, jeśli został podany.
 * @param {object} errors - Obiekt błędów.
 * @param {object} data - Dane wejściowe.
 */
function validateGoalDescriptionField(errors, data) {
	if (hasField(data, 'description') && !isGoalDescriptionValid(data.description)) {
		errors.description = getGoalDescriptionError(data.description);
	}
}

/**
 * Waliduje dane nowego celu.
 * @param {object} goalData - Dane celu z body żądania.
 * @returns {{name?: string, targetAmount?: string, currentAmount?: string, deadline?: string, description?: string, fields?: string}} Obiekt błędów.
 */
function validateGoalCreateData(goalData) {
	const errors = {};
	const data = goalData || {};
	const allowedFields = ['name', 'targetAmount', 'currentAmount', 'deadline', 'description'];
	validateAllowedFields(errors, data, allowedFields);
	validateGoalNameField(errors, data, true);
	validateTargetAmountField(errors, data, true);
	if (hasField(data, 'currentAmount') && !isNonNegativeAmount(data.currentAmount)) {
		errors.currentAmount = 'Zebrana kwota musi być nieujemna i mieć maksymalnie dwa miejsca po przecinku.';
	}
	if (!isFutureDate(data.deadline)) {
		errors.deadline = 'Termin celu jest wymagany, musi mieć format YYYY-MM-DD i być datą z przyszłości.';
	}
	validateGoalDescriptionField(errors, data);
	return errors;
}

/**
 * Waliduje dane edycji celu bez zmiany zebranej kwoty.
 * @param {object} goalData - Dane celu z body żądania.
 * @returns {{name?: string, targetAmount?: string, deadline?: string, description?: string, fields?: string}} Obiekt błędów.
 */
function validateGoalDetailsData(goalData) {
	const errors = {};
	const data = goalData || {};
	const allowedFields = ['name', 'targetAmount', 'deadline', 'description'];
	validateAllowedFields(errors, data, allowedFields);
	if (!hasAnyAllowedField(data, allowedFields)) {
		errors.fields = errors.fields || 'Podaj co najmniej jedno pole celu do aktualizacji.';
	}
	validateGoalNameField(errors, data);
	validateTargetAmountField(errors, data);
	if (hasField(data, 'deadline') && !isFutureDate(data.deadline)) {
		errors.deadline = 'Termin celu musi mieć format YYYY-MM-DD i być datą z przyszłości.';
	}
	validateGoalDescriptionField(errors, data);
	return errors;
}

/**
 * Waliduje żądanie zwiększenia albo zmniejszenia zebranej kwoty.
 * @param {object} amountData - Dane zmiany kwoty.
 * @returns {{amount?: string, operation?: string, fields?: string}} Obiekt błędów.
 */
function validateGoalAmountChangeData(amountData) {
	const errors = {};
	const data = amountData || {};
	const allowedFields = ['amount', 'operation'];
	validateAllowedFields(errors, data, allowedFields);
	if (!isValidAmount(data.amount)) {
		errors.amount = 'Kwota zmiany musi być dodatnia i mieć maksymalnie dwa miejsca po przecinku.';
	}
	if (!isGoalAmountOperationValid(data.operation)) {
		errors.operation = 'Operacja musi mieć wartość increase albo decrease.';
	}
	return errors;
}

/**
 * Normalizuje dane nowego celu.
 * @param {object} goalData - Dane celu z body żądania.
 * @returns {{name: string, targetAmount: string, currentAmount: string, deadline: string|null, description: string|null}} Dane gotowe do zapisu.
 */
function normalizeGoalCreateData(goalData) {
	const hasCurrentAmount = hasField(goalData, 'currentAmount');
	return {
		name: normalizeText(goalData.name),
		targetAmount: normalizeAmount(goalData.targetAmount),
		currentAmount: hasCurrentAmount ? normalizeAmount(goalData.currentAmount) : '0.00',
		deadline: goalData.deadline,
		description: normalizeOptionalText(goalData.description)
	};
}

/**
 * Normalizuje dane edycji celu bez zebranej kwoty.
 * @param {object} goalData - Dane celu z body żądania.
 * @returns {{name?: string, targetAmount?: string, deadline?: string|null, description?: string|null}} Dane gotowe do zapisu.
 */
function normalizeGoalDetailsData(goalData) {
	const normalized = {};
	if (hasField(goalData, 'name')) {
		normalized.name = normalizeText(goalData.name);
	}
	if (hasField(goalData, 'targetAmount')) {
		normalized.targetAmount = normalizeAmount(goalData.targetAmount);
	}
	if (hasField(goalData, 'deadline')) {
		normalized.deadline = goalData.deadline;
	}
	if (hasField(goalData, 'description')) {
		normalized.description = normalizeOptionalText(goalData.description);
	}
	return normalized;
}

/**
 * Normalizuje zmianę zebranej kwoty.
 * @param {object} amountData - Dane zmiany kwoty.
 * @returns {{amount: number, operation: string}} Dane gotowe do użycia.
 */
function normalizeGoalAmountChangeData(amountData) {
	return {
		amount: Number(normalizeAmount(amountData.amount)),
		operation: String(amountData.operation)
	};
}

/**
 * Normalizuje filtrowanie i paginację listy celów.
 * @param {object} query - Parametry query.
 * @returns {{filters: {year?: number}, pagination: {page: number, limit: number, offset: number}}} Parametry listy.
 */
function normalizeGoalListQuery(query) {
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
	const filters = {};
	if (data.year !== undefined && isValidGoalYear(data.year)) {
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
		}
	};
}

module.exports = {
	validateGoalCreateData,
	validateGoalDetailsData,
	validateGoalAmountChangeData,
	normalizeGoalCreateData,
	normalizeGoalDetailsData,
	normalizeGoalAmountChangeData,
	normalizeGoalListQuery
};
