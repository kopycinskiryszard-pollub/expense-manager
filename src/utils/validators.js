const {
	usernameRegex,
	emailRegex,
	passwordRegex
} = require('./regex');
const MESSAGES = require('./messages');

/* Walidacja loginu użytkownika. Zwraca null, jeśli login jest zgodny z wymaganiami. */
function validateLogin(login) {
	if (!login || !usernameRegex.test(login)) {
		return MESSAGES.AUTH_LOGIN_REQUIREMENTS;
	}
	return null;
}

/* Walidacja adresu e-mail. Zwraca null, jeśli e-mail jest zgodny z wymaganiami. */
function validateEmail(email) {
	if (!email || !emailRegex.test(email)) {
		return MESSAGES.AUTH_EMAIL_REQUIREMENTS;
	}
	return null;
}

/* Walidacja hasła. Zwraca null, jeśli hasło nie jest zgodne z wymaganiami (musi zawierać małą literę, dużą literę, cyfrę i znak specjalny). */
function validatePassword(password) {
	if (!password || !passwordRegex.test(password)) {
		return MESSAGES.AUTH_PASSWORD_REQUIREMENTS;
	}
	return null;
}

/* Zbiorcza walidacja danych rejestracji. Funkcja zwraca obiekt błędów. Jeśli obiekt jest pusty, dane są poprawne. */
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

/* Sprawdzenie, czy obiekt błędów zawiera jakikolwiek błąd. */
function hasValidationErrors(errors) {
	return Object.keys(errors).length > 0;
}

/* EXPORT */
module.exports = {
	validateLogin,
	validateEmail,
	validatePassword,
	validateRegisterData,
	hasValidationErrors
};