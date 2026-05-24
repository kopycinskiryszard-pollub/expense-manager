const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const {
	hashPassword,
	comparePassword
} = require('../security/password');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateRegisterData,
	validateLoginData,
	hasValidationErrors
} = require('../utils/validators');
const {createUserSession} = require('../security/session');
const {
	normalizeIdentifier,
	cleanExpiredBlockades,
	isIdentifierLocked,
	registerFailedLogin,
	clearFailedLogins
} = require('../security/blockades');

/**
 * Kontroler rejestracji użytkownika.
 */
async function register(req, res, next) {
	try {
		const {
			login,
			email,
			password
		} = req.body;
		const normalizedLogin = normalizeUserIdentifier(login);
		const normalizedEmail = normalizeUserIdentifier(email);
		const validationErrors = validateRegisterData({
			login: normalizedLogin,
			email: normalizedEmail,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		const existingLogin = await UserModel.findUserByLogin(normalizedLogin);
		if (existingLogin) {
			throw new AppError(MESSAGES.AUTH_REGISTER_LOGIN_EXISTS, 409);
		}
		const existingEmail = await UserModel.findUserByEmail(normalizedEmail);
		if (existingEmail) {
			throw new AppError(MESSAGES.AUTH_REGISTER_EMAIL_EXISTS, 409);
		}
		const passwordHash = await hashPassword(password);
		const user = await UserModel.createUser({
			login: normalizedLogin,
			email: normalizedEmail,
			passwordHash
		});
		return success(res, 201, MESSAGES.AUTH_REGISTER_SUCCESS, user);
	} catch (err) {
		next(err);
	}
}

/**
 * Kontroler logowania użytkownika.
 */
async function login(req, res, next) {
	try {
		const {
			identifier,
			password
		} = req.body;
		const validationErrors = validateLoginData({
			identifier,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		const normalizedIdentifier = normalizeIdentifier(identifier);
		await cleanExpiredBlockades();
		const identifierIsLocked = await isIdentifierLocked(normalizedIdentifier);
		if (identifierIsLocked) {
			throw new AppError(MESSAGES.AUTH_LOGIN_ACCOUNT_LOCKED, 423);
		}
		const user = await UserModel.findUserForLogin(normalizedIdentifier);
		if (!user) {
			await registerFailedLogin(normalizedIdentifier);
			throw new AppError(MESSAGES.AUTH_LOGIN_INVALID_CREDENTIALS, 401);
		}
		const passwordIsCorrect = await comparePassword(password, user.password);
		if (!passwordIsCorrect) {
			await registerFailedLogin(normalizedIdentifier);
			throw new AppError(MESSAGES.AUTH_LOGIN_INVALID_CREDENTIALS, 401);
		}
		await clearFailedLogins(normalizedIdentifier);
		const session = await createUserSession(user.id);
		return success(res, 200, MESSAGES.AUTH_LOGIN_SUCCESS, {
			user: {
				id: Number(user.id),
				login: user.login,
				email: user.email,
				role: user.role
			},
			session: {
				sessionID: session.sessionID,
				expiresAt: session.expiresAt
			}
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Kontroler wylogowania użytkownika.
 */
async function logout(req, res, next) {
	try {
		await SessionModel.deleteSession(req.session.sessionID);
		return success(res, 200, MESSAGES.AUTH_LOGOUT_SUCCESS, null);
	} catch (err) {
		next(err);
	}
}

/**
 * Kontroler sprawdzający aktualną sesję użytkownika.
 */
async function session(req, res, next) {
	try {
		return success(res, 200, MESSAGES.AUTH_SESSION_ACTIVE, {
			user: req.user,
			session: req.session
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	register,
	login,
	logout,
	session
};