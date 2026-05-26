/**
 * Model raportów: agregacje dochodów, wydatków i danych budżetu.
 */
const {query} = require('../../database/db');

/**
 * Formatuje sumę z bazy do liczby.
 * @param {*} value - Wartość z bazy.
 * @returns {number} Kwota jako liczba.
 */
function toAmount(value) {
	return Number(value || 0);
}

/**
 * Mapuje wiersz grupowany po kategorii.
 * @param {object} row - Wiersz z bazy.
 * @returns {object} Pozycja raportu.
 */
function mapCategorySummary(row) {
	return {
		category: {
			id: Number(row.categoryId),
			code: row.categoryCode,
			name: row.categoryName,
			type: Number(row.categoryType)
		},
		total: toAmount(row.total),
		count: Number(row.count)
	};
}

/**
 * Mapuje wiersz grupowany po miesiącu.
 * @param {object} row - Wiersz z bazy.
 * @returns {object} Pozycja raportu.
 */
function mapMonthSummary(row) {
	return {
		month: Number(row.month),
		total: toAmount(row.total),
		count: Number(row.count)
	};
}

/**
 * Pobiera roczne podsumowanie po kategoriach.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {number} type - Typ kategorii.
 * @param {number} year - Rok raportu.
 * @returns {Promise<Array<object>>} Pozycje raportu.
 */
async function getYearlyByCategory(ownerId, type, year) {
	const rows = await query(`
        SELECT c.id          AS categoryId,
               c.code        AS categoryCode,
               c.name        AS categoryName,
               c.type        AS categoryType,
               SUM(t.amount) AS total,
               COUNT(*)      AS count
        FROM transactions t
                 JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE t.ownerId = ?
          AND c.type = ?
          AND YEAR(t.date) = ?
        GROUP BY c.id, c.code, c.name, c.type
        ORDER BY total DESC, c.name ASC
	`, [ownerId, type, year]);
	return rows.map(mapCategorySummary);
}

/**
 * Pobiera roczne podsumowanie po miesiącach.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {number} type - Typ kategorii.
 * @param {number} year - Rok raportu.
 * @returns {Promise<Array<object>>} Pozycje raportu.
 */
async function getYearlyByMonth(ownerId, type, year) {
	const rows = await query(`
        SELECT MONTH(t.date) AS month,
               SUM(t.amount) AS total,
               COUNT(*)      AS count
        FROM transactions t
                 JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE t.ownerId = ?
          AND c.type = ?
          AND YEAR(t.date) = ?
        GROUP BY MONTH(t.date)
        ORDER BY month ASC
	`, [ownerId, type, year]);
	return rows.map(mapMonthSummary);
}

module.exports = {
	getYearlyByCategory,
	getYearlyByMonth
};
