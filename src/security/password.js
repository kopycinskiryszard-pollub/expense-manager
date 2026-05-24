const bcrypt = require('bcryptjs');

/**
 * Hashowanie hasła przed zapisem do bazy danych.
 */
async function hashPassword(password) {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
}

/**
 * Porównanie hasła jawnego z hashem w bazie danych.
 */
async function comparePassword(password, hash) {
	return await bcrypt.compare(password, hash);
}

module.exports = {
	hashPassword,
	comparePassword
};