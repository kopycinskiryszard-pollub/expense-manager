/**
 * Model pulpitu: lekkie agregacje dla aktualnego widoku startowego.
 */
const {query} = require('../../database/db');

/**
 * Pobiera sumy dochodow i wydatkow dla wskazanych okresow.
 * @param {number} ownerId - Identyfikator wlasciciela transakcji.
 * @param {Array<{month: number, year: number}>} periods - Okresy do pobrania.
 * @returns {Promise<Array<object>>} Podsumowania okresow.
 */
async function getMonthlySummaries(ownerId, periods) {
	if (!periods.length) {
		return [];
	}
	const periodConditions = periods.map(() => '(MONTH(t.date) = ? AND YEAR(t.date) = ?)')
									.join(' OR ');
	const periodParams = periods.flatMap((period) => [period.month, period.year]);
	const rows = await query(`
        SELECT MONTH(t.date) AS month,
               YEAR(t.date)  AS year,
               c.type        AS type,
               SUM(t.amount) AS total,
               COUNT(*)      AS count
        FROM transactions t
                 JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE t.ownerId = ?
          AND (${periodConditions})
        GROUP BY YEAR(t.date), MONTH(t.date), c.type
	`, [ownerId, ... periodParams]);
	return rows.map((row) => (
		{
			month: Number(row.month),
			year: Number(row.year),
			type: Number(row.type),
			total: Number(row.total || 0),
			count: Number(row.count || 0)
		}
	));
}

module.exports = {
	getMonthlySummaries
};
