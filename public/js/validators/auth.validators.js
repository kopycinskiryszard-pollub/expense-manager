import {emailRegex, isBlank, passwordRegex, usernameRegex} from './regex.js';
const messages = {
	required: 'Pole wymagane.',
	loginRequirements: 'Błędny login.',
	emailRequirements: 'Błędny e-mail.',
	passwordRequirements: 'Błędne hasło.',
	identifierRequirements: 'Błędny login albo e-mail.'
};

/**
 * Normalizuje identyfikator użytkownika tak samo, jak backend.
 * @param {*} value - Wartość pola.
 * @returns {string} Znormalizowany tekst.
 */
export function normalizeUserIdentifier(value) {
	return String(value || '')
	.trim()
	.toLowerCase();
}

/**
 * Waliduje dane logowania.
 * @param {object} loginData - Dane formularza logowania.
 * @returns {{identifier?: string, password?: string}} Błędy pól.
 */
export function validateLoginData({
	identifier,
	password
}) {
	const errors = {};
	const normalizedIdentifier = normalizeUserIdentifier(identifier);
	if (isBlank(identifier)) {
		errors.identifier = messages.required;
	} else if (!(
		usernameRegex.test(normalizedIdentifier) || emailRegex.test(normalizedIdentifier)
	)) {
		errors.identifier = messages.identifierRequirements;
	}
	if (isBlank(password)) {
		errors.password = messages.required;
	}
	return errors;
}

/**
 * Waliduje dane rejestracji.
 * @param {object} registerData - Dane formularza rejestracji.
 * @returns {{login?: string, email?: string, password?: string}} Błędy pól.
 */
export function validateRegisterData({
	login,
	email,
	password
}) {
	const errors = {};
	const normalizedLogin = normalizeUserIdentifier(login);
	const normalizedEmail = normalizeUserIdentifier(email);
	if (isBlank(login)) {
		errors.login = messages.required;
	} else if (!usernameRegex.test(normalizedLogin)) {
		errors.login = messages.loginRequirements;
	}
	if (isBlank(email)) {
		errors.email = messages.required;
	} else if (!emailRegex.test(normalizedEmail)) {
		errors.email = messages.emailRequirements;
	}
	if (isBlank(password)) {
		errors.password = messages.required;
	} else if (!passwordRegex.test(password)) {
		errors.password = messages.passwordRequirements;
	}
	return errors;
}
