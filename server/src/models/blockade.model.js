/**
 * Model blokad logowania: zapytania SQL obsługujące licznik błędnych prób i czasowe blokady.
 */
const {query} = require('../../database/db');

/**
 * Szuka wpisu blokady po identyfikatorze logowania.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<{id: number, identifier: string, count: number, createdAt: Date, lockedUntil: Date|null}|null>} Wpis blokady albo null.
 */
async function findBlockadeByIdentifier(identifier) {
	const rows = await query(`
        SELECT id, identifier, count, createdAt, lockedUntil
        FROM blockades
        WHERE identifier = ?
        LIMIT 1
	`, [identifier]);
	return rows[0] || null;
}

/**
 * Tworzy pierwszy wpis licznika błędnych prób logowania.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function createBlockade(identifier) {
	await query(`
        INSERT INTO blockades (identifier, count, createdAt, lockedUntil)
        VALUES (?, 1, NOW(), NULL)
	`, [identifier]);
}

/**
 * Zwiększa licznik błędnych prób logowania dla identyfikatora.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function incrementBlockadeCount(identifier) {
	await query(`
        UPDATE blockades
        SET count = count + 1
        WHERE identifier = ?
	`, [identifier]);
}

/**
 * Ustawia czasową blokadę logowania.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @param {Date} lockedUntil - Data zakończenia blokady.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function lockIdentifier(identifier, lockedUntil) {
	await query(`
        UPDATE blockades
        SET lockedUntil = ?
        WHERE identifier = ?
	`, [lockedUntil, identifier]);
}

/**
 * Usuwa wpis blokady dla konkretnego identyfikatora.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
 */
async function deleteBlockade(identifier) {
	const result = await query(`
        DELETE
        FROM blockades
        WHERE identifier = ?
	`, [identifier]);
	return result.affectedRows || 0;
}

/**
 * Usuwa blokady, których czas obowiązywania już minął.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
 */
async function deleteExpiredBlockades() {
	const result = await query(`
        DELETE
        FROM blockades
        WHERE lockedUntil IS NOT NULL
          AND lockedUntil <= NOW()
	`);
	return result.affectedRows || 0;
}

module.exports = {
	findBlockadeByIdentifier,
	createBlockade,
	incrementBlockadeCount,
	lockIdentifier,
	deleteBlockade,
	deleteExpiredBlockades
};
