/**
 * Kontroler profilu użytkownika: pobieranie i aktualizacja danych aktualnie zalogowanego konta.
 */
const UserModel = require('../models/user.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateProfileData,
	normalizeProfileData,
	validatePasswordChangeData
} = require('../utils/validators/user.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');
const {
	comparePassword,
	hashPassword
} = require('../security/password');

/**
 * Zwraca profil aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z danymi użytkownika ustawionymi przez requireAuth.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z profilem użytkownika.
 */
async function getMe(req, res, next) {
	try {
		const user = await UserModel.findUserProfileById(req.user.id);
		if (!user) {
			return next(new AppError(MESSAGES.AUTH_SESSION_INVALID, 401));
		}
		return success(res, 200, MESSAGES.USER_PROFILE_FETCHED, user);
	} catch (err) {
		next(err);
	}
}

/**
 * Aktualizuje opcjonalne dane profilu aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z danymi profilu w body.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON ze zaktualizowanym profilem użytkownika.
 */
async function updateMe(req, res, next) {
	try {
		const validationErrors = validateProfileData(req.body);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const profileData = normalizeProfileData(req.body);
		await UserModel.updateUserProfile(req.user.id, profileData);
		const user = await UserModel.findUserProfileById(req.user.id);
		if (!user) {
			return next(new AppError(MESSAGES.AUTH_SESSION_INVALID, 401));
		}
		return success(res, 200, MESSAGES.USER_UPDATED, user);
	} catch (err) {
		next(err);
	}
}

/**
 * Zmienia haslo aktualnie zalogowanego uzytkownika.
 * @param {object} req - Zadanie Express z haslami w body.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON z potwierdzeniem.
 */
async function updatePassword(req, res, next) {
	try {
		const validationErrors = validatePasswordChangeData(req.body);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const userPassword = await UserModel.findUserPasswordById(req.user.id);
		if (!userPassword) {
			return next(new AppError(MESSAGES.AUTH_SESSION_INVALID, 401));
		}
		const isCurrentPasswordValid = await comparePassword(req.body.currentPassword, userPassword.password);
		if (!isCurrentPasswordValid) {
			return next(new AppError(MESSAGES.USER_PASSWORD_INVALID, 400, {
				currentPassword: MESSAGES.USER_PASSWORD_INVALID
			}));
		}
		const passwordHash = await hashPassword(req.body.newPassword);
		await UserModel.updateUserPassword(req.user.id, passwordHash);
		return success(res, 200, MESSAGES.USER_PASSWORD_UPDATED, null);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getMe,
	updateMe,
	updatePassword
};
