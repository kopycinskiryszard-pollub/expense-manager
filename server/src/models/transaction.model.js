/**
 * Model transakcji: zapytania SQL dla CRUD, filtrowania, sortowania i paginacji historii.
 */
const {query} = require('../../database/db');

/**
 * Formatuje wartość daty z bazy do formatu YYYY-MM-DD.
 * @param {Date|string} value - Data zwrócona przez sterownik MariaDB.
 * @returns {string} Data w formacie YYYY-MM-DD.
 */
function formatDate(value) {
	if (value instanceof Date) {
		return value.toISOString()
					.slice(0, 10);
	}
	return String(value)
	.slice(0, 10);
}

/**
 * Mapuje rekord transakcji z bazy na obiekt API.
 * @param {object} row - Rekord transakcji z dołączoną kategorią.
 * @returns {object} Transakcja zwracana przez API.
 */
function mapTransaction(row) {
	return {
		id: Number(row.id),
		categoryId: Number(row.categoryId),
		category: {
			id: Number(row.categoryId),
			code: row.categoryCode,
			name: row.categoryName,
			type: Number(row.categoryType)
		},
		name: row.name,
		date: formatDate(row.date),
		amount: Number(row.amount),
		description: row.description,
		ownerId: Number(row.ownerId),
		createdAt: row.createdAt
	};
}

/**
 * Buduje warunki WHERE dla listy transakcji jednego właściciela.
 * @param {number} ownerId - Identyfikator właściciela transakcji.
 * @param {object} filters - Filtry listy transakcji.
 * @returns {{whereSql: string, params: Array<*>}} Fragment SQL i parametry.
 */
function buildListWhere(ownerId, filters = {}) {
	const conditions = ['t.ownerId = ?'];
	const params = [ownerId];
	if (filters.categoryId) {
		conditions.push('t.categoryId = ?');
		params.push(filters.categoryId);
	}
	if (filters.date) {
		conditions.push('t.date = ?');
		params.push(filters.date);
	} else {
		if (filters.month) {
			conditions.push('MONTH(t.date) = ?');
			params.push(filters.month);
		}
		if (filters.year) {
			conditions.push('YEAR(t.date) = ?');
			params.push(filters.year);
		}
		if (filters.dateFrom) {
			conditions.push('t.date >= ?');
			params.push(filters.dateFrom);
		}
		if (filters.dateTo) {
			conditions.push('t.date <= ?');
			params.push(filters.dateTo);
		}
	}
	return {
		whereSql: conditions.join(' AND '),
		params
	};
}

/**
 * Zwraca bezpieczną nazwę kolumny sortowania.
 * @param {string} sortBy - Nazwa pola sortowania z query.
 * @returns {string} Kolumna SQL.
 */
function getSortColumn(sortBy) {
	return sortBy === 'amount' ? 't.amount' : 't.date';
}

/**
 * Pobiera transakcje właściciela z filtrami, sortowaniem i paginacją.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @param {{page: number, limit: number, offset: number}} pagination - Parametry paginacji.
 * @param {{sortBy: string, order: string}} sorting - Parametry sortowania.
 * @returns {Promise<Array<object>>} Lista transakcji.
 */
async function findTransactions(ownerId, filters, pagination, sorting) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters);
	const sortColumn = getSortColumn(sorting.sortBy);
	const sortOrder = sorting.order === 'asc' ? 'ASC' : 'DESC';
	const rows = await query(`
        SELECT t.id,
               t.categoryId,
               c.code AS categoryCode,
               c.name AS categoryName,
               c.type AS categoryType,
               t.name,
               t.date,
               t.amount,
               t.description,
               t.ownerId,
               t.createdAt
        FROM transactions t
                 JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE ${whereSql}
        ORDER BY ${sortColumn} ${sortOrder}, t.id DESC
        LIMIT ? OFFSET ?
	`, [... params, pagination.limit, pagination.offset]);
	return rows.map(mapTransaction);
}

/**
 * Zlicza transakcje właściciela pasujące do filtrów.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} filters - Filtry listy.
 * @returns {Promise<number>} Liczba pasujących transakcji.
 */
async function countTransactions(ownerId, filters) {
	const {
		whereSql,
		params
	} = buildListWhere(ownerId, filters);
	const rows = await query(`
        SELECT COUNT(*) AS total
        FROM transactions t
        WHERE ${whereSql}
	`, params);
	return Number(rows[0]?.total || 0);
}

/**
 * Szuka pojedynczej transakcji właściciela.
 * @param {number} transactionId - Identyfikator transakcji.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<object|null>} Transakcja albo null.
 */
async function findTransactionById(transactionId, ownerId) {
	const rows = await query(`
        SELECT t.id,
               t.categoryId,
               c.code AS categoryCode,
               c.name AS categoryName,
               c.type AS categoryType,
               t.name,
               t.date,
               t.amount,
               t.description,
               t.ownerId,
               t.createdAt
        FROM transactions t
                 JOIN \`transaction-categories\` c ON c.id = t.categoryId
        WHERE t.id = ?
          AND t.ownerId = ?
        LIMIT 1
	`, [transactionId, ownerId]);
	return rows[0] ? mapTransaction(rows[0]) : null;
}

/**
 * Tworzy nową transakcję właściciela.
 * @param {object} transactionData - Dane nowej transakcji.
 * @returns {Promise<number>} Identyfikator utworzonej transakcji.
 */
async function createTransaction(transactionData) {
	const result = await query(`
        INSERT INTO transactions (categoryId, name, date, amount, description, ownerId)
        VALUES (?, ?, ?, ?, ?, ?)
	`, [transactionData.categoryId, transactionData.name, transactionData.date, transactionData.amount, transactionData.description || null,
		transactionData.ownerId]);
	return Number(result.insertId);
}

/**
 * Aktualizuje transakcję właściciela wybranymi polami.
 * @param {number} transactionId - Identyfikator transakcji.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {object} transactionData - Dane do aktualizacji.
 * @returns {Promise<number>} Liczba zmienionych rekordów.
 */
async function updateTransaction(transactionId, ownerId, transactionData) {
	const fields = ['categoryId', 'name', 'date', 'amount', 'description']
	.filter((field) => Object.prototype.hasOwnProperty.call(transactionData, field));
	if (fields.length === 0) {
		return 0;
	}
	const setClause = fields.map((field) => `${field} = ?`)
							.join(', ');
	const values = fields.map((field) => transactionData[field]);
	const result = await query(`
        UPDATE transactions
        SET ${setClause}
        WHERE id = ?
          AND ownerId = ?
	`, [... values, transactionId, ownerId]);
	return result.affectedRows || 0;
}

/**
 * Usuwa transakcję właściciela.
 * @param {number} transactionId - Identyfikator transakcji.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
 */
async function deleteTransaction(transactionId, ownerId) {
	const result = await query(`
        DELETE
        FROM transactions
        WHERE id = ?
          AND ownerId = ?
	`, [transactionId, ownerId]);
	return result.affectedRows || 0;
}

module.exports = {
	findTransactions,
	countTransactions,
	findTransactionById,
	createTransaction,
	updateTransaction,
	deleteTransaction
};
