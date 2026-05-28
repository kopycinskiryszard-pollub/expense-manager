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
	optionalText100Regex
} = require('../regex');

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

module.exports = {
	validateProfileData,
	normalizeProfileData
};
