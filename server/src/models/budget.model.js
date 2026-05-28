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
 * Pobiera budżety właściciela razem z sumą wydatków i statusem miesiąca.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<Array<object>>} Lista budżetów ze statusami.
 */
async function findBudgetsWithStatuses(ownerId) {
	const rows = await query(`
        SELECT b.id,
               b.ownerId,
               b.month,
               b.year,
               b.limitAmount,
               b.createdAt,
               COALESCE(SUM(CASE WHEN c.type = 1 THEN t.amount ELSE 0 END), 0) AS spentAmount
        FROM budgets b
                 LEFT JOIN transactions t ON t.ownerId = b.ownerId
                    AND MONTH(t.date) = b.month
                    AND YEAR(t.date) = b.year
                 LEFT JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE b.ownerId = ?
        GROUP BY b.id, b.ownerId, b.month, b.year, b.limitAmount, b.createdAt
        ORDER BY b.year DESC, b.month DESC
	`, [ownerId]);
	return rows.map((row) => {
		const budget = mapBudget(row);
		const spentAmount = Number(row.spentAmount || 0);
		const difference = Number((
			budget.limitAmount - spentAmount
		).toFixed(2));
		return {
			... budget,
			spentAmount,
			difference,
			status: difference >= 0 ? 'within_limit' : 'exceeded'
		};
	});
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
	findBudgetsWithStatuses,
	createBudget,
	updateBudget,
	deleteBudget
};
