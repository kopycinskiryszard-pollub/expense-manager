const {query} = require('../../database/db');
/* Model użytkownika. Tutaj znajdują się zapytania SQL związane z tabelą users. */

/* Szukanie użytkownika po loginie. */
async function findUserByLogin(login) {
	const rows = await query('SELECT id FROM users WHERE login = ? LIMIT 1', [login]);
	return rows[0] || null;
}

/* Szukanie użytkownika po adresie e-mail. */
async function findUserByEmail(email) {
	const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
	return rows[0] || null;
}

/* Szukanie użytkownika po loginie i adresie e-mail. */
async function findUser(loginOrEmail) {
	const rows = await query('SELECT id FROM users WHERE login = ? OR  email = ? LIMIT 1', [loginOrEmail, loginOrEmail]);
	return rows[0] || null;
}

/* Tworzenie nowego użytkownika. */
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

/* EXPORT */
module.exports = {
	findUserByLogin,
	findUserByEmail,
	findUser,
	createUser
};