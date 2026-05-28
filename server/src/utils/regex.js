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
const positiveIntegerRegex = /^[1-9]\d*$/;
const monthRegex = /^(?:[1-9]|1[0-2])$/;
const yearRegex = /^\d{4}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const nonNegativeAmountRegex = /^\d{1,8}(\.\d{1,2})?$/;
const positiveAmountRegex = /^(?!(?:0|0\.0{1,2})$)\d{1,8}(\.\d{1,2})?$/;
const transactionNameRegex = /^.{1,30}$/u;
const transactionDescriptionRegex = /^[\s\S]{0,300}$/u;
const goalNameRegex = /^.{1,30}$/u;
const goalDescriptionRegex = /^[\s\S]{0,500}$/u;
const optionalText50Regex = /^[\s\S]{0,50}$/u;
const optionalText100Regex = /^[\s\S]{0,100}$/u;
module.exports = {
	usernameRegex,
	emailRegex,
	passwordRegex,
	positiveIntegerRegex,
	monthRegex,
	yearRegex,
	dateRegex,
	nonNegativeAmountRegex,
	positiveAmountRegex,
	transactionNameRegex,
	transactionDescriptionRegex,
	goalNameRegex,
	goalDescriptionRegex,
	optionalText50Regex,
	optionalText100Regex
};
