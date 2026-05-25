/**
 * Kontroler uwierzytelniania: rejestracja, logowanie, wylogowanie i sprawdzanie sesji.
 */
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
	normalizeUserIdentifier,
	validateRegisterData,
	validateLoginData,
	hasValidationErrors
} = require('../utils/validators');
const {createUserSession} = require('../security/session');
const {
	cleanExpiredBlockades,
	isIdentifierLocked,
	registerFailedLogin,
	clearFailedLogins
} = require('../security/blockades');

/**
 * Rejestruje nowego użytkownika po walidacji danych i sprawdzeniu unikalności loginu oraz e-maila.
 * @param {object} req - Żądanie Express z danymi rejestracji w body.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z publicznymi danymi użytkownika.
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
 * Loguje użytkownika loginem albo e-mailem, obsługując blokady po błędnych próbach.
 * @param {object} req - Żądanie Express z identyfikatorem i hasłem w body.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z danymi użytkownika i sesji.
 */
async function login(req, res, next) {
	try {
		const {
			identifier,
			password
		} = req.body;
		const normalizedIdentifier = normalizeUserIdentifier(identifier);
		const validationErrors = validateLoginData({
			identifier: normalizedIdentifier,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
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
 * Wylogowuje użytkownika przez usunięcie jego bieżącej sesji.
 * @param {object} req - Żądanie Express z danymi sesji ustawionymi przez middleware.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z potwierdzeniem wylogowania.
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
 * Zwraca dane aktualnie zalogowanego użytkownika i jego odnowionej sesji.
 * @param {object} req - Żądanie Express z danymi użytkownika i sesji.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z danymi użytkownika i sesji.
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
