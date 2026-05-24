const {query} = require('../../database/db');

/**
 * Szukanie użytkownika przez login.
 * */
async function findUserByLogin(login) {
	const rows = await query('SELECT id FROM users WHERE login = ? LIMIT 1', [login]);
	return rows[0] || null;
}

/**
 * Szukanie użytkownika przez adres e-mail.
 * */
async function findUserByEmail(email) {
	const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
	return rows[0] || null;
}

/**
 * Szukanie użytkownika przez login lub adres e-mail.
 * */
async function findUserForLogin(identifier) {
	const rows = await query('SELECT id, login, email, password, role FROM users WHERE login = ? OR  email = ? LIMIT 1', [identifier, identifier]);
	return rows[0] || null;
}

/**
 * Tworzenie nowego użytkownika.
 * */
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

// Export
module.exports = {
	findUserByLogin,
	findUserByEmail,
	findUserForLogin,
	createUser
};