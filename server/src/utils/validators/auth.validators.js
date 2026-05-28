/**
 * Walidatory uwierzytelniania: rejestracja, logowanie i normalizacja identyfikatora.
 */
const {
	usernameRegex,
	emailRegex,
	passwordRegex
} = require('../regex');
const MESSAGES = require('../messages');
const {
	isBlank
} = require('./general.validators');

/**
 * Normalizuje tekstowy identyfikator użytkownika.
 * @param {*} value - Wartość wejściowa, najczęściej login albo e-mail.
 * @returns {string} Tekst bez spacji z brzegów, zapisany małymi literami.
 */
function normalizeUserIdentifier(value) {
	return String(value || '')
	.trim()
	.toLowerCase();
}

/**
 * Sprawdza poprawność loginu użytkownika.
 * @param {string} login - Login użytkownika.
 * @returns {string|null} Komunikat błędu albo null, jeśli login jest poprawny.
 */
function validateLogin(login) {
	if (isBlank(login)) {
		return 'Pole wymagane.';
	}
	if (!usernameRegex.test(login)) {
		return MESSAGES.AUTH_REGISTER_LOGIN_REQUIREMENTS;
	}
	return null;
}

/**
 * Sprawdza poprawność adresu e-mail.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {string|null} Komunikat błędu albo null, jeśli e-mail jest poprawny.
 */
function validateEmail(email) {
	if (isBlank(email)) {
		return 'Pole wymagane.';
	}
	if (!emailRegex.test(email)) {
		return MESSAGES.AUTH_REGISTER_EMAIL_REQUIREMENTS;
	}
	return null;
}

/**
 * Sprawdza poprawność hasła użytkownika.
 * @param {string} password - Hasło w postaci jawnej.
 * @returns {string|null} Komunikat błędu albo null, jeśli hasło jest poprawne.
 */
function validatePassword(password) {
	if (isBlank(password)) {
		return 'Pole wymagane.';
	}
	if (!passwordRegex.test(password)) {
		return MESSAGES.AUTH_REGISTER_PASSWORD_REQUIREMENTS;
	}
	return null;
}

/**
 * Sprawdza identyfikator logowania, którym może być login albo e-mail.
 * @param {string} identifier - Login albo e-mail.
 * @returns {string|null} Komunikat błędu albo null, jeśli identyfikator jest poprawny.
 */
function validateLoginIdentifier(identifier) {
	if (isBlank(identifier)) {
		return 'Pole wymagane.';
	}
	if (!(
		usernameRegex.test(identifier) || emailRegex.test(identifier)
	)) {
		return MESSAGES.AUTH_LOGIN_IDENTIFIER_REQUIREMENTS;
	}
	return null;
}

/**
 * Waliduje komplet danych rejestracji.
 * @param {object} registerData - Dane formularza rejestracji.
 * @param {string} registerData.login - Login użytkownika.
 * @param {string} registerData.email - Adres e-mail użytkownika.
 * @param {string} registerData.password - Hasło użytkownika.
 * @returns {{login?: string, email?: string, password?: string}} Obiekt błędów walidacji.
 */
function validateRegisterData({
	login,
	email,
	password
}) {
	const errors = {};
	const loginError = validateLogin(login);
	const emailError = validateEmail(email);
	const passwordError = validatePassword(password);
	if (loginError) {
		errors.login = loginError;
	}
	if (emailError) {
		errors.email = emailError;
	}
	if (passwordError) {
		errors.password = passwordError;
	}
	return errors;
}

/**
 * Waliduje komplet danych logowania.
 * @param {object} loginData - Dane formularza logowania.
 * @param {string} loginData.identifier - Login albo e-mail użytkownika.
 * @param {string} loginData.password - Hasło użytkownika.
 * @returns {{identifier?: string, password?: string}} Obiekt błędów walidacji.
 */
function validateLoginData({
	identifier,
	password
}) {
	const errors = {};
	const identifierError = validateLoginIdentifier(identifier);
	if (identifierError) {
		errors.identifier = identifierError;
	}
	if (isBlank(password)) {
		errors.password = 'Pole wymagane.';
	}
	return errors;
}

module.exports = {
	normalizeUserIdentifier,
	validateRegisterData,
	validateLoginData
};
