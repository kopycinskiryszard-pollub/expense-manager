/**
 * Middleware autoryzacji: sprawdza sesję użytkownika i uprawnienia administratora.
 */
const SessionModel = require('../models/session.model');
const {
	extendUserSession,
	getSessionIDFromRequest
} = require('../security/session');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');

/**
 * Wymaga aktywnej sesji użytkownika i automatycznie przedłuża jej ważność.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przejścia do kolejnego middleware.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function requireAuth(req, res, next) {
	try {
		await SessionModel.deleteExpiredSessions();
		const sessionID = getSessionIDFromRequest(req);
		if (!sessionID) {
			throw new AppError(MESSAGES.AUTH_REQUIRED, 401);
		}
		const session = await SessionModel.findSessionWithUser(sessionID);
		if (!session) {
			throw new AppError(MESSAGES.AUTH_SESSION_INVALID, 401);
		}
		if (new Date(session.expiresAt) <= new Date()) {
			await SessionModel.deleteSession(sessionID);
			throw new AppError(MESSAGES.AUTH_SESSION_EXPIRED, 401);
		}
		const newExpiresAt = await extendUserSession(sessionID);
		req.user = {
			id: Number(session.userId),
			login: session.login,
			email: session.email,
			role: session.role
		};
		req.session = {
			sessionID,
			expiresAt: newExpiresAt
		};
		next();
	} catch (err) {
		next(err);
	}
}

/**
 * Wymaga, aby zalogowany użytkownik miał rolę administratora.
 * @param {object} req - Żądanie Express z danymi użytkownika ustawionymi przez requireAuth.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przejścia do kolejnego middleware.
 * @returns {void} Nie zwraca wartości.
 */
function requireAdmin(req, res, next) {
	if (!req.user || req.user.role !== 'admin') {
		next(new AppError(MESSAGES.AUTH_FORBIDDEN, 403));
	} else {
		next();
	}
}

module.exports = {
	requireAuth,
	requireAdmin
};
