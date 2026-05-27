const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;
const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+-=?]).{8,}$/;
const messages = {
	loginRequirements: 'Login musi mieć 6-20 znaków, litery, cyfry oraz _ .',
	emailRequirements: 'Podany e-mail ma nieprawidłowy format.',
	passwordRequirements: 'Hasło musi mieć co najmniej 8 znaków, w tym małą i dużą literę, cyfrę oraz znak specjalny !@#$%^&*()_+-=? .',
	identifierRequirements: 'Podaj poprawny login albo e-mail.',
	invalidCredentials: 'Nieprawidłowy login lub hasło.'
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
	if (!normalizedIdentifier || !(
		usernameRegex.test(normalizedIdentifier) || emailRegex.test(normalizedIdentifier)
	)) {
		errors.identifier = messages.identifierRequirements;
	}
	if (!password) {
		errors.password = messages.invalidCredentials;
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
	if (!normalizedLogin || !usernameRegex.test(normalizedLogin)) {
		errors.login = messages.loginRequirements;
	}
	if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
		errors.email = messages.emailRequirements;
	}
	if (!password || !passwordRegex.test(password)) {
		errors.password = messages.passwordRequirements;
	}
	return errors;
}
