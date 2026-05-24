// Modele
const UserModel = require('../models/user.model');
// Hasła
const {
	hashPassword,
	comparePassword
} = require('../security/password');
// Odpowiedzi i błędy
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
// Walidacja
const {
	validateRegisterData,
	validateLoginData,
	hasValidationErrors
} = require('../utils/validators');

/**
 * Kontroler rejestracji użytkownika.
 * */
async function register(req, res, next) {
	try {
		const {
			login,
			email,
			password
		} = req.body;
		// Walidacja danych wejściowych.
		const validationErrors = validateRegisterData({
			login,
			email,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		// Sprawdzenie, czy login nie jest już zajęty.
		const existingLogin = await UserModel.findUserByLogin(login);
		if (existingLogin) {
			throw new AppError(MESSAGES.AUTH_LOGIN_EXISTS, 409);
		}
		// Sprawdzenie, czy e-mail nie jest już zajęty.
		const existingEmail = await UserModel.findUserByEmail(email);
		if (existingEmail) {
			throw new AppError(MESSAGES.AUTH_EMAIL_EXISTS, 409);
		}
		// Haszowanie hasła przed zapisem do bazy danych.
		const passwordHash = await hashPassword(password);
		// Nowy użytkownik
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

/**
 * Kontroler logowania użytkownika.
 * */
async function login(req, res, next) {
	try {
		const {
			identifier,
			password
		} = req.body;
		// Walidacja danych logowania.
		const validationErrors = validateLoginData({
			identifier,
			password
		});
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		// Wyszukanie użytkownika po loginie albo e-mailu.
		const user = await UserModel.findUserForLogin(identifier);
		if (!user) {
			throw new AppError(MESSAGES.AUTH_INVALID_CREDENTIALS, 401);
		}
		// Porównanie hasła z hashem zapisanym w bazie danych.
		const passwordIsCorrect = await comparePassword(password, user.password);
		if (!passwordIsCorrect) {
			throw new AppError(MESSAGES.AUTH_INVALID_CREDENTIALS, 401);
		}
		// Zwrócenie danych użytkownika bez hasła.
		return success(res, 200, MESSAGES.AUTH_LOGIN_SUCCESS, {
			id: Number(user.id),
			login: user.login,
			email: user.email,
			role: user.role
		});
	} catch (err) {
		next(err);
	}
}

// Export
module.exports = {
	register,
	login
};