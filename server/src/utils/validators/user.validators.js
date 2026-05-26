/**
 * Walidatory profilu użytkownika: opcjonalne dane osobowe i ich normalizacja.
 */
const {
	hasField,
	validateAllowedFields,
	isOptionalTextValid,
	isPastOrTodayDate,
	normalizeOptionalText
} = require('./general.validators');

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
	if (!isOptionalTextValid(data.name, 50)) {
		errors.name = 'Imię może mieć maksymalnie 50 znaków.';
	}
	if (!isOptionalTextValid(data.surname, 50)) {
		errors.surname = 'Nazwisko może mieć maksymalnie 50 znaków.';
	}
	if (!isOptionalBirthdateValid(data.birthdate)) {
		errors.birthdate = 'Data urodzenia musi mieć format YYYY-MM-DD i nie może być z przyszłości.';
	}
	if (!isOptionalTextValid(data.city, 100)) {
		errors.city = 'Miasto może mieć maksymalnie 100 znaków.';
	}
	if (!isOptionalTextValid(data.country, 100)) {
		errors.country = 'Kraj może mieć maksymalnie 100 znaków.';
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
