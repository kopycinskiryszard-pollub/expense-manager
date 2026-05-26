/**
 * Model celów oszczędnościowych: zapytania SQL dla list, historii i operacji CRUD.
 */
const {query} = require('../../database/db');

/**
 * Formatuje datę z bazy do formatu YYYY-MM-DD.
 * @param {Date|string|null} value - Data zwrócona przez sterownik MariaDB.
 * @returns {string|null} Data w formacie YYYY-MM-DD albo null.
 */
function formatDate(value) {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		return value.toISOString()
					.slice(0, 10);
	}
	return String(value)
	.slice(0, 10);
}

/**
 * Mapuje rekord celu z bazy na obiekt API.
 * @param {object} row - Rekord celu.
 * @returns {object} Cel zwracany przez API.
 */
function mapGoal(row) {
	const targetAmount = Number(row.targetAmount);
	const currentAmount = Number(row.currentAmount);
	return {
		id: Number(row.id),
		ownerId: Number(row.ownerId),
		name: row.name,
		description: row.description,
		targetAmount,
		currentAmount,
		deadline: formatDate(row.deadline),
		finishedAt: formatDate(row.finishedAt),
		isClosed: Boolean(Number(row.isClosed)),
		progress: targetAmount > 0 ? Number((
			(
				currentAmount / targetAmount
			) * 100
		).toFixed(2)) : 0,
		isCompleted: currentAmount >= targetAmount,
		createdAt: row.createdAt
	};
}

/**
 * Buduje warunki WHERE dla aktywnej listy albo historii celów.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @param {boolean} history - True dla historii zrealizowanych celów.
 * @returns {{whereSql: string, params: Array<*>}} Fragment SQL i parametry.
 */
function buildListWhere(ownerId, filters = {}, history = false) {
	const conditions = ['ownerId = ?'];
	const params = [ownerId];
	if (history) {
		conditions.push('finishedAt IS NOT NULL');
		if (filters.year) {
			conditions.push('YEAR(finishedAt) = ?');
			params.push(filters.year);
		}
	} else {
		conditions.push('isClosed = false');
		conditions.push('finishedAt IS NULL');
		conditions.push('currentAmount < targetAmount');
		if (filters.year) {
			conditions.push('deadline IS NOT NULL');
			conditions.push('YEAR(deadline) = ?');
			params.push(filters.year);
		}
	}
	return {
		whereSql: conditions.join(' AND '),
		params
	};
}

/**
 * Pobiera aktywne, niezrealizowane cele właściciela.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @param {{limit: number, offset: number}} pagination - Parametry paginacji.
 * @returns {Promise<Array<object>>} Lista celów.
 */
async function findGoals(ownerId, filters, pagination) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters, false);
	const rows = await query(`
        SELECT id,
               ownerId,
               name,
               description,
               targetAmount,
               currentAmount,
               deadline,
               finishedAt,
               isClosed,
               createdAt
        FROM goals
        WHERE ${whereSql}
        ORDER BY deadline IS NULL ASC, deadline ASC, id ASC
        LIMIT ? OFFSET ?
	`, [... params, pagination.limit, pagination.offset]);
	return rows.map(mapGoal);
}

/**
 * Zlicza aktywne, niezrealizowane cele właściciela.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @returns {Promise<number>} Liczba pasujących celów.
 */
async function countGoals(ownerId, filters) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters, false);
	const rows = await query(`
        SELECT COUNT(*) AS total
        FROM goals
        WHERE ${whereSql}
	`, params);
	return Number(rows[0]?.total || 0);
}

/**
 * Pobiera historię zrealizowanych celów właściciela.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @param {{limit: number, offset: number}} pagination - Parametry paginacji.
 * @returns {Promise<Array<object>>} Lista zrealizowanych celów.
 */
async function findGoalHistory(ownerId, filters, pagination) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters, true);
	const rows = await query(`
        SELECT id,
               ownerId,
               name,
               description,
               targetAmount,
               currentAmount,
               deadline,
               finishedAt,
               isClosed,
               createdAt
        FROM goals
        WHERE ${whereSql}
        ORDER BY finishedAt DESC, id DESC
        LIMIT ? OFFSET ?
	`, [... params, pagination.limit, pagination.offset]);
	return rows.map(mapGoal);
}

/**
 * Zlicza zrealizowane cele właściciela.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @returns {Promise<number>} Liczba pasujących celów.
 */
async function countGoalHistory(ownerId, filters) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters, true);
	const rows = await query(`
        SELECT COUNT(*) AS total
        FROM goals
        WHERE ${whereSql}
	`, params);
	return Number(rows[0]?.total || 0);
}

/**
 * Pobiera pojedynczy cel właściciela po identyfikatorze.
 * @param {number} goalId - Identyfikator celu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<object|null>} Cel albo null.
 */
async function findGoalById(goalId, ownerId) {
	const rows = await query(`
        SELECT id,
               ownerId,
               name,
               description,
               targetAmount,
               currentAmount,
               deadline,
               finishedAt,
               isClosed,
               createdAt
        FROM goals
        WHERE id = ?
          AND ownerId = ?
        LIMIT 1
	`, [goalId, ownerId]);
	return rows[0] ? mapGoal(rows[0]) : null;
}

/**
 * Tworzy nowy cel właściciela.
 * @param {object} goalData - Dane celu.
 * @returns {Promise<number>} Identyfikator utworzonego celu.
 */
async function createGoal(goalData) {
	const result = await query(`
        INSERT INTO goals (ownerId, name, description, targetAmount, currentAmount, deadline, finishedAt, isClosed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, [goalData.ownerId, goalData.name, goalData.description, goalData.targetAmount, goalData.currentAmount, goalData.deadline, goalData.finishedAt,
		goalData.isClosed ? 1 : 0]);
	return Number(result.insertId);
}

/**
 * Aktualizuje cel właściciela wybranymi polami.
 * @param {number} goalId - Identyfikator celu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} goalData - Dane do aktualizacji.
 * @returns {Promise<number>} Liczba zmienionych rekordów.
 */
async function updateGoal(goalId, ownerId, goalData) {
	const fields = ['name', 'description', 'targetAmount', 'currentAmount', 'deadline', 'finishedAt', 'isClosed']
	.filter((field) => Object.prototype.hasOwnProperty.call(goalData, field));
	if (fields.length === 0) {
		return 0;
	}
	const setClause = fields.map((field) => `${field} = ?`)
							.join(', ');
	const values = fields.map((field) => field === 'isClosed' ? (
		goalData[field] ? 1 : 0
	) : goalData[field]);
	const result = await query(`
        UPDATE goals
        SET ${setClause}
        WHERE id = ?
          AND ownerId = ?
	`, [... values, goalId, ownerId]);
	return result.affectedRows || 0;
}

/**
 * Usuwa cel właściciela.
 * @param {number} goalId - Identyfikator celu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
 */
async function deleteGoal(goalId, ownerId) {
	const result = await query(`
        DELETE
        FROM goals
        WHERE id = ?
          AND ownerId = ?
	`, [goalId, ownerId]);
	return result.affectedRows || 0;
}

module.exports = {
	findGoals,
	countGoals,
	findGoalHistory,
	countGoalHistory,
	findGoalById,
	createGoal,
	updateGoal,
	deleteGoal
};
