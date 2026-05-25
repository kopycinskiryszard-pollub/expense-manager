const {query} = require('../../database/db');

/**
 * Szuka użytkownika po loginie.
 * @param {string} login - Login użytkownika.
 * @returns {Promise<{id: number}|null>} Znaleziony użytkownik albo null.
 */
async function findUserByLogin(login) {
	const rows = await query('SELECT id FROM users WHERE login = ? LIMIT 1', [login]);
	return rows[0] || null;
}

/**
 * Szuka użytkownika po adresie e-mail.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {Promise<{id: number}|null>} Znaleziony użytkownik albo null.
 */
async function findUserByEmail(email) {
	const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
	return rows[0] || null;
}

/**
 * Szuka użytkownika po loginie albo adresie e-mail na potrzeby logowania.
 * @param {string} identifier - Login albo adres e-mail użytkownika.
 * @returns {Promise<{id: number, login: string, email: string, password: string, role: string}|null>} Dane logowania użytkownika albo null.
 */
async function findUserForLogin(identifier) {
	const rows = await query('SELECT id, login, email, password, role FROM users WHERE login = ? OR  email = ? LIMIT 1', [identifier, identifier]);
	return rows[0] || null;
}

/**
 * Tworzy nowego użytkownika z domyślną rolą user.
 * @param {object} userData - Dane nowego użytkownika.
 * @param {string} userData.login - Login użytkownika.
 * @param {string} userData.email - Adres e-mail użytkownika.
 * @param {string} userData.passwordHash - Zahashowane hasło użytkownika.
 * @returns {Promise<{id: number, login: string, email: string, role: string}>} Publiczne dane utworzonego użytkownika.
 */
async function createUser({
	login,
	email,
	passwordHash
}) {
	const result = await query(`
        INSERT INTO users (login, email, password, role)
        VALUES (?, ?, ?, 'user')
	`, [login, email, passwordHash]);
	return {
		id: Number(result.insertId),
		login,
		email,
		role: 'user'
	};
}

module.exports = {
	findUserByLogin,
	findUserByEmail,
	findUserForLogin,
	createUser
};
