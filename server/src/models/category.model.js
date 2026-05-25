/**
 * Model kategorii transakcji: zapytania SQL pobierające wspólne kategorie dochodów i wydatków.
 */
const {query} = require('../../database/db');

/**
 * Mapuje rekord kategorii z bazy do obiektu zwracanego przez API.
 * @param {object} row - Rekord kategorii zwrócony przez MariaDB.
 * @returns {{id: number, code: string, name: string, description: string|null, type: number}} Kategoria transakcji.
 */
function mapCategory(row) {
	return {
		id: Number(row.id),
		code: row.code,
		name: row.name,
		description: row.description,
		type: Number(row.type)
	};
}

/**
 * Pobiera kategorie transakcji, opcjonalnie ograniczone do dochodów albo wydatków.
 * @param {number|null} type - Typ kategorii: 0 dla dochodu, 1 dla wydatku albo null dla wszystkich.
 * @returns {Promise<Array<{id: number, code: string, name: string, description: string|null, type: number}>>} Lista kategorii.
 */
async function findCategories(type = null) {
	const params = [];
	let sql = `
        SELECT id, code, name, description, type
        FROM \`transaction-categories\`
	`;
	if (type !== null) {
		sql += ' WHERE type = ?';
		params.push(type);
	}
	sql += ' ORDER BY type ASC, name ASC';
	const rows = await query(sql, params);
	return rows.map(mapCategory);
}

module.exports = {
	findCategories
};
