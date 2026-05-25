/**
 * Testy jednostkowe kontrolera uwierzytelniania z mockowanymi zależnościami.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const MESSAGES = require('../server/src/utils/messages');
const mockUserModel = {};
const mockSessionModel = {};
const mockPasswordSecurity = {};
const mockSessionSecurity = {};
const mockBlockadeSecurity = {};

/**
 * Podmienia wybrany moduł aplikacji na mock używany w testach jednostkowych.
 * @param {string} modulePath - Ścieżka modułu przekazywana do require.
 * @param {*} exports - Obiekt eksportowany przez mockowany moduł.
 * @returns {void} Nie zwraca wartości.
 */
function mockModule(modulePath, exports) {
	const resolvedPath = require.resolve(modulePath);
	require.cache[resolvedPath] = {
		id: resolvedPath,
		filename: resolvedPath,
		loaded: true,
		exports
	};
}

mockModule('../server/src/models/user.model', mockUserModel);
mockModule('../server/src/models/session.model', mockSessionModel);
mockModule('../server/src/security/password', {
	hashPassword: (... args) => mockPasswordSecurity.hashPassword(... args),
	comparePassword: (... args) => mockPasswordSecurity.comparePassword(... args)
});
mockModule('../server/src/security/session', {
	createUserSession: (... args) => mockSessionSecurity.createUserSession(... args)
});
mockModule('../server/src/security/blockades', {
	cleanExpiredBlockades: (... args) => mockBlockadeSecurity.cleanExpiredBlockades(... args),
	isIdentifierLocked: (... args) => mockBlockadeSecurity.isIdentifierLocked(... args),
	registerFailedLogin: (... args) => mockBlockadeSecurity.registerFailedLogin(... args),
	clearFailedLogins: (... args) => mockBlockadeSecurity.clearFailedLogins(... args)
});
const AuthController = require('../server/src/controllers/auth.controller');

/**
 * Czyści: funkcje przypisane do mocków po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockUserModel)) {
		delete mockUserModel[key];
	}
	for (const key of Object.keys(mockSessionModel)) {
		delete mockSessionModel[key];
	}
	for (const key of Object.keys(mockPasswordSecurity)) {
		delete mockPasswordSecurity[key];
	}
	for (const key of Object.keys(mockSessionSecurity)) {
		delete mockSessionSecurity[key];
	}
	for (const key of Object.keys(mockBlockadeSecurity)) {
		delete mockBlockadeSecurity[key];
	}
}

/**
 * Tworzy uproszczony mock odpowiedzi Express z metodami status i json.
 * @returns {{statusCode: null|number, body: unknown, status: Function, json: Function}} Mock odpowiedzi HTTP.
 */
function createResponse() {
	return {
		statusCode: null,
		body: null,
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		json(body) {
			this.body = body;
			return this;
		}
	};
}

/**
 * Uruchamia kontroler i przechwytuje odpowiedź oraz błąd przekazany do next.
 * @param {Function} controller - Testowana funkcja kontrolera Express.
 * @param {object} req - Mock żądania Express.
 * @returns {Promise<{res: object, nextError: Error|null}>} Wynik działania kontrolera.
 */
async function runController(controller, req) {
	const res = createResponse();
	let nextError = null;
	await controller(req, res, (err) => {
		nextError = err;
	});
	return {
		res,
		nextError
	};
}

test.afterEach(() => {
	resetMocks();
});
/**
 * Testy register
 */
test('register tworzy użytkownika i zwraca odpowiedź 201 dla poprawnych danych', async () => {
	let receivedPassword = null;
	let receivedUserData = null;
	mockUserModel.findUserByLogin = async () => null;
	mockUserModel.findUserByEmail = async () => null;
	mockPasswordSecurity.hashPassword = async (password) => {
		receivedPassword = password;
		return 'hashed-password';
	};
	mockUserModel.createUser = async (userData) => {
		receivedUserData = userData;
		return {
			id: 1,
			login: userData.login,
			email: userData.email,
			role: 'user'
		};
	};
	const {
		res,
		nextError
	} = await runController(AuthController.register, {
		body: {
			login: '  Valid_User  ',
			email: '  USER@example.com  ',
			password: 'Password1!'
		}
	});
	assert.equal(nextError, null);
	assert.equal(receivedPassword, 'Password1!');
	assert.deepEqual(receivedUserData, {
		login: 'valid_user',
		email: 'user@example.com',
		passwordHash: 'hashed-password'
	});
	assert.equal(res.statusCode, 201);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.AUTH_REGISTER_SUCCESS,
		data: {
			id: 1,
			login: 'valid_user',
			email: 'user@example.com',
			role: 'user'
		}
	});
});
test('register przekazuje błąd 400 dla niepoprawnych danych rejestracji', async () => {
	const {
		res,
		nextError
	} = await runController(AuthController.register, {
		body: {
			login: 'bad',
			email: 'not-an-email',
			password: 'weak'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.VALIDATION_ERROR);
	assert.ok(nextError.details.login);
	assert.ok(nextError.details.email);
	assert.ok(nextError.details.password);
});
test('register przekazuje błąd 409, gdy login jest już zajęty', async () => {
	mockUserModel.findUserByLogin =
		async () => (
			{id: 1}
		);
	const {
		res,
		nextError
	} = await runController(AuthController.register, {
		body: {
			login: 'valid_user',
			email: 'valid.user@example.com',
			password: 'Password1!'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 409);
	assert.equal(nextError.message, MESSAGES.AUTH_REGISTER_LOGIN_EXISTS);
});
/**
 * Testy login
 */
test('login zwraca dane użytkownika i sesji dla poprawnych danych', async () => {
	const expiresAt = new Date('2030-01-01T10:00:00.000Z');
	const calls = [];
	mockBlockadeSecurity.cleanExpiredBlockades = async () => {
		calls.push('cleanExpiredBlockades');
	};
	mockBlockadeSecurity.isIdentifierLocked = async () => false;
	mockUserModel.findUserForLogin = async (identifier) => {
		calls.push(`findUserForLogin:${identifier}`);
		return {
			id: 5,
			login: 'valid_user',
			email: 'valid.user@example.com',
			password: 'hashed-password',
			role: 'user'
		};
	};
	mockPasswordSecurity.comparePassword = async (password, hash) => {
		calls.push(`comparePassword:${password}:${hash}`);
		return true;
	};
	mockBlockadeSecurity.clearFailedLogins = async (identifier) => {
		calls.push(`clearFailedLogins:${identifier}`);
	};
	mockSessionSecurity.createUserSession = async (userId) => {
		calls.push(`createUserSession:${userId}`);
		return {
			sessionID: 'session-id-123',
			expiresAt
		};
	};
	const {
		res,
		nextError
	} = await runController(AuthController.login, {
		body: {
			identifier: '  VALID_USER  ',
			password: 'Password1!'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(calls,
		['cleanExpiredBlockades', 'findUserForLogin:valid_user', 'comparePassword:Password1!:hashed-password', 'clearFailedLogins:valid_user',
		 'createUserSession:5']
	);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.AUTH_LOGIN_SUCCESS,
		data: {
			user: {
				id: 5,
				login: 'valid_user',
				email: 'valid.user@example.com',
				role: 'user'
			},
			session: {
				sessionID: 'session-id-123',
				expiresAt
			}
		}
	});
});
test('login przekazuje błąd 423, gdy identyfikator jest zablokowany', async () => {
	mockBlockadeSecurity.cleanExpiredBlockades = async () => {
	};
	mockBlockadeSecurity.isIdentifierLocked = async () => true;
	const {
		res,
		nextError
	} = await runController(AuthController.login, {
		body: {
			identifier: 'valid_user',
			password: 'Password1!'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 423);
	assert.equal(nextError.message, MESSAGES.AUTH_LOGIN_ACCOUNT_LOCKED);
});
test('login rejestruje nieudaną próbę i przekazuje błąd 401 dla błędnego hasła', async () => {
	let failedLoginIdentifier = null;
	mockBlockadeSecurity.cleanExpiredBlockades = async () => {
	};
	mockBlockadeSecurity.isIdentifierLocked = async () => false;
	mockUserModel.findUserForLogin =
		async () => (
			{
				id: 5,
				login: 'valid_user',
				email: 'valid.user@example.com',
				password: 'hashed-password',
				role: 'user'
			}
		);
	mockPasswordSecurity.comparePassword = async () => false;
	mockBlockadeSecurity.registerFailedLogin = async (identifier) => {
		failedLoginIdentifier = identifier;
	};
	const {
		res,
		nextError
	} = await runController(AuthController.login, {
		body: {
			identifier: 'valid_user',
			password: 'WrongPassword1!'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(failedLoginIdentifier, 'valid_user');
	assert.equal(nextError.statusCode, 401);
	assert.equal(nextError.message, MESSAGES.AUTH_LOGIN_INVALID_CREDENTIALS);
});
/**
 * Testy logout
 */
test('logout usuwa sesję i zwraca odpowiedź 200', async () => {
	let deletedSessionID = null;
	mockSessionModel.deleteSession = async (sessionID) => {
		deletedSessionID = sessionID;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(AuthController.logout, {
		session: {
			sessionID: 'session-id-123'
		}
	});
	assert.equal(nextError, null);
	assert.equal(deletedSessionID, 'session-id-123');
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.AUTH_LOGOUT_SUCCESS,
		data: null
	});
});
/**
 * Testy session
 */
test('session zwraca aktualnego użytkownika i dane sesji', async () => {
	const req = {
		user: {
			id: 5,
			login: 'valid_user',
			email: 'valid.user@example.com',
			role: 'user'
		},
		session: {
			sessionID: 'session-id-123',
			expiresAt: new Date('2030-01-01T10:00:00.000Z')
		}
	};
	const {
		res,
		nextError
	} = await runController(AuthController.session, req);
	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.AUTH_SESSION_ACTIVE,
		data: {
			user: req.user,
			session: req.session
		}
	});
});
