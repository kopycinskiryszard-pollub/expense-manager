/**
 * Logika haseł: hashowanie i porównywanie haseł za pomocą bcrypt.
 */
const bcrypt = require('bcryptjs');

/**
 * Hashuje hasło przed zapisem do bazy danych.
 * @param {string} password - Hasło w postaci jawnej.
 * @returns {Promise<string>} Hash hasła, wygenerowany przez bcrypt.
 */
async function hashPassword(password) {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
}

/**
 * Porównuje hasło jawne z hashem zapisanym w bazie danych.
 * @param {string} password - Hasło w postaci jawnej.
 * @param {string} hash - Hash hasła, zapisany w bazie danych.
 * @returns {Promise<boolean>} True, jeśli hasło pasuje do hasha.
 */
async function comparePassword(password, hash) {
	return await bcrypt.compare(password, hash);
}

module.exports = {
	hashPassword,
	comparePassword
};
