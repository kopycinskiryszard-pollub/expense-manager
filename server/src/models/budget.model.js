/**
 * Model budżetów miesięcznych: zapytania SQL dla pobierania, tworzenia, aktualizacji i usuwania limitów.
 */
const {query} = require('../../database/db');

/**
 * Mapuje rekord budżetu z bazy na obiekt API.
 * @param {object} row - Rekord budżetu.
 * @returns {object} Budżet zwracany przez API.
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
 * Pobiera budżet właściciela dla podanego miesiąca i roku.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @returns {Promise<object|null>} Budżet albo null.
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
 * Pobiera pojedynczy budżet właściciela po identyfikatorze.
 * @param {number} budgetId - Identyfikator budżetu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<object|null>} Budżet albo null.
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
 * Tworzy nowy budżet miesięczny właściciela.
 * @param {object} budgetData - Dane budżetu.
 * @returns {Promise<number>} Identyfikator utworzonego budżetu.
 */
async function createBudget(budgetData) {
	const result = await query(`
        INSERT INTO budgets (ownerId, month, year, limitAmount)
        VALUES (?, ?, ?, ?)
	`, [budgetData.ownerId, budgetData.month, budgetData.year, budgetData.limitAmount]);
	return Number(result.insertId);
}

/**
 * Aktualizuje budżet właściciela wybranymi polami.
 * @param {number} budgetId - Identyfikator budżetu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} budgetData - Dane do aktualizacji.
 * @returns {Promise<number>} Liczba zmienionych rekordów.
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
 * Usuwa budżet właściciela.
 * @param {number} budgetId - Identyfikator budżetu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
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
