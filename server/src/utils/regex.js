/**
 * Centralne wyrażenia regularne używane przez walidatory danych użytkownika.
 */
/**
 * Wyrażenie regularne sprawdzające login użytkownika.
 * @type {RegExp}
 */
const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;

/**
 * Wyrażenie regularne sprawdzające adres e-mail.
 * @type {RegExp}
 */
const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

/**
 * Wyrażenie regularne sprawdzające siłę hasła.
 * @type {RegExp}
 */
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+-=?]).{8,}$/;

module.exports = {
	usernameRegex,
	emailRegex,
	passwordRegex
};
