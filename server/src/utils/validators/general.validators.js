/**
 * Ogólne funkcje walidacyjne współdzielone przez walidatory domenowe.
 */
/**
 * Sprawdza, czy obiekt błędów zawiera co najmniej jeden błąd.
 * @param {object} errors - Obiekt błędów walidacji.
 * @returns {boolean} True, jeśli obiekt zawiera błędy.
 */
function hasValidationErrors(errors) {
	return Object.keys(errors).length > 0;
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
	const numberValue = Number(value);
	return Number.isInteger(numberValue) && numberValue > 0;
}

/**
 * Sprawdza, czy data ma format YYYY-MM-DD, istnieje w kalendarzu i nie jest z przyszłości.
 * @param {*} value - Sprawdzana data.
 * @returns {boolean} True, jeśli data jest poprawna.
 */
function isPastOrTodayDate(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) {
		return false;
	}
	const [year, month, day] = value.split('-')
									.map(Number);
	const today = new Date();
	const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day && date <= todayUtc;
}

/**
 * Sprawdza, czy kwota jest dodatnia i ma maksymalnie dwa miejsca po przecinku.
 * @param {*} value - Sprawdzana kwota.
 * @returns {boolean} True, jeśli kwota jest poprawna.
 */
function isValidAmount(value) {
	if (value === null || value === undefined || value === '') {
		return false;
	}
	const textValue = String(value)
	.trim();
	if (!/^\d+(\.\d{1,2})?$/.test(textValue)) {
		return false;
	}
	return Number(textValue) > 0;
}

module.exports = {
	hasValidationErrors,
	isOptionalTextValid,
	isPositiveInteger,
	isPastOrTodayDate,
	isValidAmount
};
