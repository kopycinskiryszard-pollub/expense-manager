/**
 * Model użytkownika: zapytania SQL dotyczące konta, logowania i profilu.
 */
const {query} = require('../../database/db');

/**
 * Szuka użytkownika po loginie.
 * @param {string} login - Login użytkownika.
 * @returns {Promise<{id: number}|null>} Znaleziony użytkownik albo null.
 */
async function findUserByLogin(login) {
	const rows = await query('SELECT id FROM users WHERE LOWER(login) = ? LIMIT 1',
		[String(login || '')
		 .toLowerCase()]
	);
	return rows[0] || null;
}

/**
 * Szuka użytkownika po adresie e-mail.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {Promise<{id: number}|null>} Znaleziony użytkownik albo null.
 */
async function findUserByEmail(email) {
	const rows = await query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
		[String(email || '')
		 .toLowerCase()]
	);
	return rows[0] || null;
}

/**
 * Szuka użytkownika po loginie albo adresie e-mail na potrzeby logowania.
 * @param {string} identifier - Login albo adres e-mail użytkownika.
 * @returns {Promise<{id: number, login: string, email: string, password: string, role: string}|null>} Dane logowania użytkownika albo null.
 */
async function findUserForLogin(identifier) {
	const normalizedIdentifier = String(identifier || '')
	.toLowerCase();
	const rows = await query('SELECT id, login, email, password, role FROM users WHERE LOWER(login) = ? OR LOWER(email) = ? LIMIT 1',
		[normalizedIdentifier, normalizedIdentifier]
	);
	return rows[0] || null;
}

/**
 * Pobiera hash hasla uzytkownika.
 * @param {number} userId - Identyfikator uzytkownika.
 * @returns {Promise<{id: number, password: string}|null>} Dane hasla albo null.
 */
async function findUserPasswordById(userId) {
	const rows = await query('SELECT id, password FROM users WHERE id = ? LIMIT 1', [userId]);
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

/**
 * Pobiera publiczne i opcjonalne dane profilu użytkownika.
 * @param {number} userId - Identyfikator użytkownika.
 * @returns {Promise<{id: number, login: string, email: string, role: string, name: string|null, surname: string|null, birthdate: Date|null, city: string|null, country: string|null, createdAt: Date}|null>} Dane profilu albo null.
 */
async function findUserProfileById(userId) {
	const rows = await query(`
        SELECT id,
               login,
               email,
               role,
               name,
               surname,
               birthdate,
               city,
               country,
               createdAt
        FROM users
        WHERE id = ?
        LIMIT 1
	`, [userId]);
	return rows[0] || null;
}

/**
 * Aktualizuje opcjonalne dane profilu użytkownika.
 * @param {number} userId - Identyfikator użytkownika.
 * @param {object} profileData - Dane profilu do zapisania.
 * @param {string|null} profileData.name - Imię użytkownika.
 * @param {string|null} profileData.surname - Nazwisko użytkownika.
 * @param {string|null} profileData.birthdate - Data urodzenia w formacie YYYY-MM-DD.
 * @param {string|null} profileData.city - Miasto użytkownika.
 * @param {string|null} profileData.country - Kraj użytkownika.
 * @returns {Promise<number>} Liczba zmienionych rekordów.
 */
async function updateUserProfile(userId, profileData) {
	const allowedFields = ['name', 'surname', 'birthdate', 'city', 'country'];
	const fieldsToUpdate = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(profileData, field));
	if (fieldsToUpdate.length === 0) {
		return 0;
	}
	const setClause = fieldsToUpdate.map((field) => `${field} = ?`)
									.join(', ');
	const values = fieldsToUpdate.map((field) => profileData[field]);
	const result = await query(`
        UPDATE users
        SET ${setClause}
        WHERE id = ?
	`, [... values, userId]);
	return result.affectedRows || 0;
}

/**
 * Aktualizuje haslo uzytkownika.
 * @param {number} userId - Identyfikator uzytkownika.
 * @param {string} passwordHash - Zahashowane nowe haslo.
 * @returns {Promise<number>} Liczba zmienionych rekordow.
 */
async function updateUserPassword(userId, passwordHash) {
	const result = await query(`
        UPDATE users
        SET password = ?
        WHERE id = ?
	`, [passwordHash, userId]);
	return result.affectedRows || 0;
}

async function findAllUsers() {
	const rows = await query(`
        SELECT id,
               login,
               email,
               name,
               surname,
               role,
               createdAt
        FROM users
        ORDER BY id ASC
	`);
	return rows;
}

module.exports = {
	findUserByLogin,
	findUserByEmail,
	findUserForLogin,
	findUserPasswordById,
	createUser,
	findUserProfileById,
	updateUserProfile,
	updateUserPassword,
	findAllUsers
};
