/**
 * Kontroler profilu użytkownika: pobieranie i aktualizacja danych aktualnie zalogowanego konta.
 */
const UserModel = require('../models/user.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateProfileData,
	normalizeProfileData
} = require('../utils/validators/user.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');

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
			throw new AppError(MESSAGES.AUTH_SESSION_INVALID, 401);
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
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		const profileData = normalizeProfileData(req.body);
		await UserModel.updateUserProfile(req.user.id, profileData);
		const user = await UserModel.findUserProfileById(req.user.id);
		if (!user) {
			throw new AppError(MESSAGES.AUTH_SESSION_INVALID, 401);
		}
		return success(res, 200, MESSAGES.USER_UPDATED, user);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getMe,
	updateMe
};
