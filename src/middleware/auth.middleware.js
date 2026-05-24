const SessionModel = require('../models/session.model');
const {
	extendUserSession,
	getSessionIDFromRequest
} = require('../security/session');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');

/**
 * Middleware sprawdzający, czy użytkownik ma aktywną sesję.
 * Przy każdej poprawnej akcji użytkownika sesja jest automatycznie przedłużana.
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

module.exports = {
	requireAuth
};