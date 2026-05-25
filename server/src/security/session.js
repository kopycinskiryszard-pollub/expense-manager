/**
 * Logika sesji użytkownika: generowanie ID, wyliczanie ważności i odczyt tokena Bearer.
 */
const crypto = require('crypto');
const SessionModel = require('../models/session.model');

/**
 * Pobiera czas ważności sesji z konfiguracji środowiska.
 * @returns {number} Czas ważności sesji w minutach.
 */
function getSessionDurationMinutes() {
	return Number(process.env.SESSION_EXPIRES_MINUTES) || 15;
}

/**
 * Generuje bezpieczny identyfikator sesji.
 * @returns {string} Identyfikator sesji w formacie UUID.
 */
function generateSessionID() {
	return crypto.randomUUID();
}

/**
 * Wylicza datę wygaśnięcia nowej lub odnowionej sesji.
 * @returns {Date} Data wygaśnięcia sesji.
 */
function getSessionExpiresAt() {
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + getSessionDurationMinutes());
	return expiresAt;
}

/**
 * Tworzy sesję użytkownika po poprawnym zalogowaniu.
 * @param {number} userId - Identyfikator użytkownika.
 * @returns {Promise<{sessionID: string, userId: number, expiresAt: Date}>} Dane utworzonej sesji.
 */
async function createUserSession(userId) {
	await SessionModel.deleteExpiredSessions();
	const sessionID = generateSessionID();
	const expiresAt = getSessionExpiresAt();
	return await SessionModel.createSession({
		sessionID,
		userId,
		expiresAt
	});
}

/**
 * Przedłuża czas ważności istniejącej sesji użytkownika.
 * @param {string} sessionID - Identyfikator sesji.
 * @returns {Promise<Date>} Nowa data wygaśnięcia sesji.
 */
async function extendUserSession(sessionID) {
	const expiresAt = getSessionExpiresAt();
	await SessionModel.extendSession(sessionID, expiresAt);
	return expiresAt;
}

/**
 * Pobiera identyfikator sesji z nagłówka Authorization.
 * Obsługiwany format: Authorization: Bearer SESSION_ID.
 * @param {object} req - Żądanie Express.
 * @param {object} req.headers - Nagłówki żądania.
 * @returns {string|null} Identyfikator sesji albo null.
 */
function getSessionIDFromRequest(req) {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return null;
	}
	const [type, sessionID] = authorization.split(' ');
	if (type !== 'Bearer' || !sessionID) {
		return null;
	}
	return sessionID;
}

module.exports = {
	createUserSession,
	extendUserSession,
	getSessionIDFromRequest
};
