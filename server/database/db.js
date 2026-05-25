/**
 * Moduł połączenia z MariaDB: tworzy pulę połączeń i udostępnia funkcję query.
 */
const mariadb = require('mariadb');
require('dotenv')
.config();

/**
 * Pula połączeń z bazą danych MariaDB.
 * @type {import('mariadb').Pool}
 */
const Pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5
});

/**
 * Wykonuje zapytanie SQL z opcjonalnymi parametrami.
 * @param {string} sql - Treść zapytania SQL.
 * @param {Array<*>} params - Parametry zapytania podstawiane w miejsce znaków zapytania.
 * @returns {Promise<unknown>} Wynik zapytania zwrócony przez sterownik MariaDB.
 */
async function query(sql, params = []) {
	let connection;
	try {
		connection = await Pool.getConnection();
		return await connection.query(sql, params);
	} catch (error) {
		console.error('Błąd bazy danych:', error);
		throw error;
	} finally {
		if (connection) {
			await connection.release();
		}
	}
}

module.exports = {
	query
};
