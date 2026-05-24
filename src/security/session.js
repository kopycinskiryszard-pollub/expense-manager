const crypto = require('crypto');
const SessionModel = require('../models/session.model');

/**
 * Pobranie czasu ważności sesji z konfiguracji środowiska.
 */
function getSessionDurationMinutes() {
	return Number(process.env.SESSION_EXPIRES_MINUTES) || 15;
}

/**
 * Wygenerowanie bezpiecznego identyfikatora sesji.
 */
function generateSessionID() {
	return crypto.randomUUID();
}

/**
 * Wyliczenie daty wygaśnięcia sesji.
 */
function getSessionExpiresAt() {
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + getSessionDurationMinutes());
	return expiresAt;
}

/**
 * Utworzenie sesji użytkownika (po poprawnym zalogowaniu).
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
 * Przedłużenie istniejącej sesji użytkownika.
 */
async function extendUserSession(sessionID) {
	const expiresAt = getSessionExpiresAt();
	await SessionModel.extendSession(sessionID, expiresAt);
	return expiresAt;
}

/**
 * Pobranie identyfikatora sesji z nagłówka Authorization.
 Obsługiwany format: Authorization: Bearer SESSION_ID.
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