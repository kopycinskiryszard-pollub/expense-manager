const UserModel = require('../models/user.model');
const {hashPassword} = require('../security/password');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateRegisterData,
	hasValidationErrors
} = require('../utils/validators');

/*	Kontroler rejestracji użytkownika. */
async function register(req, res, next) {
	try {
		const {
			login,
			email,
			password
		} = req.body;
		/* Walidacja danych wejściowych. */
		const validationErrors = validateRegisterData({
			login,
			email,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		/* Sprawdzenie, czy login nie jest już zajęty. */
		const existingLogin = await UserModel.findUserByLogin(login);
		if (existingLogin) {
			throw new AppError(MESSAGES.AUTH_LOGIN_EXISTS, 409);
		}
		/* Sprawdzenie, czy e-mail nie jest już zajęty. */
		const existingEmail = await UserModel.findUserByEmail(email);
		if (existingEmail) {
			throw new AppError(MESSAGES.AUTH_EMAIL_EXISTS, 409);
		}
		/* Haszowanie hasła przed zapisem do bazy danych. */
		const passwordHash = await hashPassword(password);
		const user = await UserModel.createUser({
			login,
			email,
			passwordHash
		});
		return success(res, 201, MESSAGES.AUTH_REGISTER_SUCCESS, user);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	register
};