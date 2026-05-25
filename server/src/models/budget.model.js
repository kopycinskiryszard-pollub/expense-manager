/**
 * Model budzetow miesiecznych: zapytania SQL dla pobierania, tworzenia, aktualizacji i usuwania limitow.
 */
const {query} = require('../../database/db');

/**
 * Mapuje rekord budzetu z bazy na obiekt API.
 * @param {object} row - Rekord budzetu.
 * @returns {object} Budzet zwracany przez API.
 */
function mapBudget(row) {
	return {
		id: Number(row.id),
		ownerId: Number(row.ownerId),
		month: Number(row.month),
		year: Number(row.year),
		limitAmount: Number(row.limitAmount),
		createdAt: row.createdAt
	};
}

/**
 * Pobiera budzet wlasciciela dla podanego miesiaca i roku.
 * @param {number} ownerId - Identyfikator wlasciciela.
 * @param {number} month - Miesiac budzetu.
 * @param {number} year - Rok budzetu.
 * @returns {Promise<object|null>} Budzet albo null.
 */
async function findBudgetByPeriod(ownerId, month, year) {
	const rows = await query(`
        SELECT id, ownerId, month, year, limitAmount, createdAt
        FROM budgets
        WHERE ownerId = ?
          AND month = ?
          AND year = ?
        LIMIT 1
	`, [ownerId, month, year]);
	return rows[0] ? mapBudget(rows[0]) : null;
}

/**
 * Pobiera pojedynczy budzet wlasciciela po identyfikatorze.
 * @param {number} budgetId - Identyfikator budzetu.
 * @param {number} ownerId - Identyfikator wlasciciela.
 * @returns {Promise<object|null>} Budzet albo null.
 */
async function findBudgetById(budgetId, ownerId) {
	const rows = await query(`
        SELECT id, ownerId, month, year, limitAmount, createdAt
        FROM budgets
        WHERE id = ?
          AND ownerId = ?
        LIMIT 1
	`, [budgetId, ownerId]);
	return rows[0] ? mapBudget(rows[0]) : null;
}

/**
 * Tworzy nowy budzet miesieczny wlasciciela.
 * @param {object} budgetData - Dane budzetu.
 * @returns {Promise<number>} Identyfikator utworzonego budzetu.
 */
async function createBudget(budgetData) {
	const result = await query(`
        INSERT INTO budgets (ownerId, month, year, limitAmount)
        VALUES (?, ?, ?, ?)
	`, [budgetData.ownerId, budgetData.month, budgetData.year, budgetData.limitAmount]);
	return Number(result.insertId);
}

/**
 * Aktualizuje budzet wlasciciela wybranymi polami.
 * @param {number} budgetId - Identyfikator budzetu.
 * @param {number} ownerId - Identyfikator wlasciciela.
 * @param {object} budgetData - Dane do aktualizacji.
 * @returns {Promise<number>} Liczba zmienionych rekordow.
 */
async function updateBudget(budgetId, ownerId, budgetData) {
	const fields = ['month', 'year', 'limitAmount']
	.filter((field) => Object.prototype.hasOwnProperty.call(budgetData, field));
	if (fields.length === 0) {
		return 0;
	}
	const setClause = fields.map((field) => `${field} = ?`)
							.join(', ');
	const values = fields.map((field) => budgetData[field]);
	const result = await query(`
        UPDATE budgets
        SET ${setClause}
        WHERE id = ?
          AND ownerId = ?
	`, [... values, budgetId, ownerId]);
	return result.affectedRows || 0;
}

/**
 * Usuwa budzet wlasciciela.
 * @param {number} budgetId - Identyfikator budzetu.
 * @param {number} ownerId - Identyfikator wlasciciela.
 * @returns {Promise<number>} Liczba usunietych rekordow.
 */
async function deleteBudget(budgetId, ownerId) {
	const result = await query(`
        DELETE
        FROM budgets
        WHERE id = ?
          AND ownerId = ?
	`, [budgetId, ownerId]);
	return result.affectedRows || 0;
}

module.exports = {
	findBudgetByPeriod,
	findBudgetById,
	createBudget,
	updateBudget,
	deleteBudget
};
