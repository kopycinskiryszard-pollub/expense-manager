/**
 * Model sesji: zapytania SQL tworzące, odnawiające i usuwające sesje użytkowników.
 */
const {query} = require('../../database/db');

/**
 * Tworzy nową sesję użytkownika w bazie danych.
 * @param {object} sessionData - Dane nowej sesji.
 * @param {string} sessionData.sessionID - Identyfikator sesji.
 * @param {number} sessionData.userId - Identyfikator użytkownika.
 * @param {Date} sessionData.expiresAt - Data wygaśnięcia sesji.
 * @returns {Promise<{sessionID: string, userId: number, expiresAt: Date}>} Dane utworzonej sesji.
 */
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
 * Szuka sesji razem z podstawowymi danymi właściciela sesji.
 * @param {string} sessionID - Identyfikator sesji.
 * @returns {Promise<{sessionID: string, userId: number, expiresAt: Date, login: string, email: string, role: string}|null>} Dane sesji z użytkownikiem albo null.
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
 * Aktualizuje czas wygaśnięcia istniejącej sesji.
 * @param {string} sessionID - Identyfikator sesji.
 * @param {Date} expiresAt - Nowa data wygaśnięcia sesji.
 * @returns {Promise<number>} Liczba zmienionych rekordów.
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
 * Usuwa pojedynczą sesję.
 * @param {string} sessionID - Identyfikator sesji.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
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
 * Usuwa wszystkie sesje wskazanego użytkownika.
 * @param {number} userId - Identyfikator użytkownika.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
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
 * Usuwa wszystkie wygasłe sesje.
 * @returns {Promise<number>} Liczba usuniętych rekordów.
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
