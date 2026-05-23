/* Reguły regex używane do walidacj danych wejściowych. */
const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;
const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+-=?]).{8,}$/;
/* Export */
module.exports = {
	usernameRegex,
	emailRegex,
	passwordRegex
};