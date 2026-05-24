const {query} = require('../../database/db');

/**
 * Utworzenie nowej sesji użytkownika.
 * */
async function createSession({
	sessionID,
	userId,
	expiresAt
}) {
	await query(`
        INSERT INTO sessions (sessionID, userId, expiresAt)
        VALUES (?, ?, ?)
	`, [sessionID, userId, expiresAt]);
	return {
		sessionID,
		userId,
		expiresAt
	};
}

/**
 * Wyszukanie sesji razem z podstawowymi danymi użytkownika.
 */
async function findSessionWithUser(sessionID) {
	const rows = await query(`
        SELECT s.sessionID,
               s.userId,
               s.expiresAt,
               u.login,
               u.email,
               u.role
        FROM sessions s
                 JOIN users u ON u.id = s.userId
        WHERE s.sessionID = ?
        LIMIT 1
	`, [sessionID]);
	return rows[0] || null;
}

/**
 * Przedłużenie czasu ważności istniejącej sesji.
 */
async function extendSession(sessionID, expiresAt) {
	const result = await query(`
        UPDATE sessions
        SET expiresAt = ?
        WHERE sessionID = ?
	`, [expiresAt, sessionID]);
	return result.affectedRows || 0;
}

/**
 * Usunięcie pojedynczej sesji.
 */
async function deleteSession(sessionID) {
	const result = await query(`
        DELETE
        FROM sessions
        WHERE sessionID = ?
	`, [sessionID]);
	return result.affectedRows || 0;
}

/**
 * Usunięcie wszystkich sesji danego użytkownika.
 */
async function deleteSessionsByUserId(userId) {
	const result = await query(`
        DELETE
        FROM sessions
        WHERE userId = ?
	`, [userId]);
	return result.affectedRows || 0;
}

/**
 * Usunięcie wygasłych sesji.
 */
async function deleteExpiredSessions() {
	const result = await query(`
        DELETE
        FROM sessions
        WHERE expiresAt <= NOW()
	`);
	return result.affectedRows || 0;
}

module.exports = {
	createSession,
	findSessionWithUser,
	extendSession,
	deleteSession,
	deleteSessionsByUserId,
	deleteExpiredSessions
};