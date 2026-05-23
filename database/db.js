const mariadb = require('mariadb');
require('dotenv').config();
/* Utworzenie puli połączeń */
const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5
});

/* Obsługa zapytań do bazy danych */
async function query(sql, params = []) {
	let connection;
	try {
		connection = await pool.getConnection();
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

/* Export */
module.exports = {
	query
};