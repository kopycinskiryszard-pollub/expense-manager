/**
 * Walidatory profilu użytkownika: opcjonalne dane osobowe i ich normalizacja.
 */
const {
	hasField,
	validateAllowedFields,
	isPastOrTodayDate,
	matchesTrimmed,
	normalizeOptionalText
} = require('./general.validators');
const {
	optionalText50Regex,
	optionalText100Regex,
	passwordRegex
} = require('../regex');
const MESSAGES = require('../messages');

/**
 * Sprawdza, czy data opcjonalna ma format YYYY-MM-DD i nie jest z przyszłości.
 * @param {*} value - Sprawdzana data.
 * @returns {boolean} True, jeśli data jest poprawna.
 */
function isOptionalBirthdateValid(value) {
	return value === null || value === undefined || value === '' || isPastOrTodayDate(value);
}

/**
 * Waliduje opcjonalne dane profilu użytkownika.
 * @param {object} profileData - Dane profilu przekazane w żądaniu PATCH.
 * @returns {{name?: string, surname?: string, birthdate?: string, city?: string, country?: string, fields?: string}} Obiekt błędów walidacji.
 */
function validateProfileData(profileData) {
	const errors = {};
	const data = profileData || {};
	const allowedFields = ['name', 'surname', 'birthdate', 'city', 'country'];
	validateAllowedFields(errors, data, allowedFields);
	if (!matchesTrimmed(data.name, optionalText50Regex)) {
		errors.name = 'Błędne imię.';
	}
	if (!matchesTrimmed(data.surname, optionalText50Regex)) {
		errors.surname = 'Błędne nazwisko.';
	}
	if (!isOptionalBirthdateValid(data.birthdate)) {
		errors.birthdate = 'Błędna data.';
	}
	if (!matchesTrimmed(data.city, optionalText100Regex)) {
		errors.city = 'Błędne miasto.';
	}
	if (!matchesTrimmed(data.country, optionalText100Regex)) {
		errors.country = 'Błędny kraj.';
	}
	return errors;
}

/**
 * Normalizuje opcjonalne dane profilu przed zapisem do bazy.
 * @param {object} profileData - Dane profilu przekazane w żądaniu PATCH.
 * @returns {{name?: string|null, surname?: string|null, birthdate?: string|null, city?: string|null, country?: string|null}} Dane gotowe do zapisu.
 */
function normalizeProfileData(profileData) {
	const normalized = {};
	for (const field of ['name', 'surname', 'birthdate', 'city', 'country']) {
		if (hasField(profileData, field)) {
			normalized[field] = normalizeOptionalText(profileData[field]);
		}
	}
	return normalized;
}

/**
 * Waliduje dane zmiany hasla.
 * @param {object} passwordData - Dane formularza zmiany hasla.
 * @returns {{currentPassword?: string, newPassword?: string, confirmPassword?: string}} Bledy pol.
 */
function validatePasswordChangeData(passwordData) {
	const errors = {};
	const data = passwordData || {};
	validateAllowedFields(errors, data, ['currentPassword', 'newPassword', 'confirmPassword']);
	if (!data.currentPassword) {
		errors.currentPassword = 'Pole wymagane.';
	} else if (!passwordRegex.test(String(data.currentPassword))) {
		errors.currentPassword = MESSAGES.AUTH_REGISTER_PASSWORD_REQUIREMENTS;
	}
	if (!data.newPassword) {
		errors.newPassword = 'Pole wymagane.';
	} else if (!passwordRegex.test(String(data.newPassword))) {
		errors.newPassword = MESSAGES.AUTH_REGISTER_PASSWORD_REQUIREMENTS;
	}
	if (!data.confirmPassword) {
		errors.confirmPassword = 'Pole wymagane.';
	} else if (String(data.newPassword || '') !== String(data.confirmPassword || '')) {
		errors.confirmPassword = 'Hasła nie są zgodne.';
	}
	return errors;
}

module.exports = {
	validateProfileData,
	normalizeProfileData,
	validatePasswordChangeData
};
