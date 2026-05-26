/**
 * Testy jednostkowe middleware sprawdzającego uprawnienia administratora.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const sessionModelPath = require.resolve('../server/src/models/session.model');
const sessionModelMock = new Module(sessionModelPath);
sessionModelMock.filename = sessionModelPath;
sessionModelMock.loaded = true;
sessionModelMock.exports = {};
require.cache[sessionModelPath] = sessionModelMock;
const {requireAdmin} = require('../server/src/middleware/auth.middleware');

/**
 * Uruchamia middleware requireAdmin i zwraca błąd przekazany do next.
 * @param {object} req - Mock żądania Express.
 * @returns {Error|null} Błąd przekazany do next albo null.
 */
function runRequireAdmin(req) {
	let nextError = null;
	requireAdmin(req, {}, (err) => {
		nextError = err || null;
	});
	return nextError;
}

/**
 * Testy requireAdmin
 */
test('requireAdmin przepuszcza użytkownika z rolą admin', () => {
	const error = runRequireAdmin({
		user: {
			role: 'admin'
		}
	});
	assert.equal(error, null);
});
test('requireAdmin zwraca błąd 403 dla użytkownika bez roli admin', () => {
	const error = runRequireAdmin({
		user: {
			role: 'user'
		}
	});
	assert.equal(error.statusCode, 403);
	assert.equal(error.message, MESSAGES.AUTH_FORBIDDEN);
});
