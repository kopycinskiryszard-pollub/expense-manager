/**
 * Testy jednostkowe kontrolera profilu użytkownika z mockowanym modelem użytkownika.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const mockUserModel = {};
const userModelPath = require.resolve('../server/src/models/user.model');
const userModelMock = new Module(userModelPath);
userModelMock.filename = userModelPath;
userModelMock.loaded = true;
userModelMock.exports = mockUserModel;
require.cache[userModelPath] = userModelMock;
const UserController = require('../server/src/controllers/user.controller');

/**
 * Czyści funkcje przypisane do mocka modelu po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockUserModel)) {
		delete mockUserModel[key];
	}
}

/**
 * Tworzy uproszczony mock odpowiedzi Express.
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
 * Uruchamia kontroler profilu i przechwytuje odpowiedź oraz błąd przekazany do next.
 * @param {Function} controller - Testowana funkcja kontrolera.
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
 * Testy getMe
 */
test('getMe zwraca profil aktualnego użytkownika', async () => {
	const profile = {
		id: 7,
		login: 'janek',
		email: 'jan@example.com',
		name: 'Jan'
	};
	mockUserModel.findUserProfileById = async (userId) => {
		assert.equal(userId, 7);
		return profile;
	};
	const {
		res,
		nextError
	} = await runController(UserController.getMe, {
		user: {
			id: 7
		}
	});
	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.USER_PROFILE_FETCHED);
	assert.deepEqual(res.body.data, profile);
});
/**
 * Testy updateMe
 */
test('updateMe waliduje i aktualizuje dane profilu', async () => {
	let updatedData = null;
	mockUserModel.updateUserProfile = async (userId, profileData) => {
		assert.equal(userId, 7);
		updatedData = profileData;
		return 1;
	};
	mockUserModel.findUserProfileById =
		async () => (
			{
				id: 7,
				name: 'Jan',
				city: 'Lublin'
			}
		);
	const {
		res,
		nextError
	} = await runController(UserController.updateMe, {
		user: {
			id: 7
		},
		body: {
			name: '  Jan  ',
			city: '  Lublin  '
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(updatedData, {
		name: 'Jan',
		city: 'Lublin'
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.USER_UPDATED);
});
test('updateMe przekazuje błąd 400 dla niepoprawnych danych profilu', async () => {
	const {
		nextError
	} = await runController(UserController.updateMe, {
		user: {
			id: 7
		},
		body: {
			name: 'a'.repeat(51)
		}
	});
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.VALIDATION_ERROR);
	assert.ok(nextError.details.name);
});
