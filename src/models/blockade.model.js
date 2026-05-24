const {query} = require('../../database/db');

/**
 * Wyszukanie blokady po identyfikatorze logowania.
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
 * Utworzenie pierwszego wpisu blokady po błędnym logowaniu.
 */
async function createBlockade(identifier) {
	await query(`
        INSERT INTO blockades (identifier, count, createdAt, lockedUntil)
        VALUES (?, 1, NOW(), NULL)
	`, [identifier]);
}

/**
 * Zwiększenie licznika błędnych prób logowania.
 */
async function incrementBlockadeCount(identifier) {
	await query(`
        UPDATE blockades
        SET count = count + 1
        WHERE identifier = ?
	`, [identifier]);
}

/**
 * Ustawienie czasowej blokady logowania.
 */
async function lockIdentifier(identifier, lockedUntil) {
	await query(`
        UPDATE blockades
        SET lockedUntil = ?
        WHERE identifier = ?
	`, [lockedUntil, identifier]);
}

/**
 * Usunięcie blokady dla konkretnego identyfikatora.
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
 * Usunięcie przedawnionych blokad.
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