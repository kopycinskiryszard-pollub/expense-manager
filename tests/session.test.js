/**
 * Testy jednostkowe modułu sesji bez połączenia z bazą danych.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const sessionModelPath = require.resolve('../server/src/models/session.model');
const mockSessionModel = {};

require.cache[sessionModelPath] = {
	id: sessionModelPath,
	filename: sessionModelPath,
	loaded: true,
	exports: mockSessionModel
};

const {
	createUserSession,
	extendUserSession,
	getSessionIDFromRequest
} = require('../server/src/security/session');
const originalSessionExpiresMinutes = process.env.SESSION_EXPIRES_MINUTES;

/**
 * Czyści mock modelu sesji po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetSessionModel() {
	process.env.SESSION_EXPIRES_MINUTES = originalSessionExpiresMinutes;
	delete mockSessionModel.deleteExpiredSessions;
	delete mockSessionModel.createSession;
	delete mockSessionModel.extendSession;
}

test.afterEach(() => {
	resetSessionModel();
});

/**
 * Testy getSessionIDFromRequest
 */
test('getSessionIDFromRequest zwraca identyfikator sesji z poprawnego nagłówka Bearer', () => {
	const req = {
		headers: {
			authorization: 'Bearer session-id-123'
		}
	};
	assert.equal(getSessionIDFromRequest(req), 'session-id-123');
});

test('getSessionIDFromRequest zwraca null dla brakującego lub błędnego nagłówka', () => {
	assert.equal(getSessionIDFromRequest({headers: {}}), null);
	assert.equal(getSessionIDFromRequest({headers: {authorization: 'Basic abc'}}), null);
	assert.equal(getSessionIDFromRequest({headers: {authorization: 'Bearer'}}), null);
});

/**
 * Testy createUserSession
 */
test('createUserSession usuwa wygasłe sesje i przekazuje poprawne dane do modelu', async () => {
	const calls = [];
	process.env.SESSION_EXPIRES_MINUTES = '30';
	mockSessionModel.deleteExpiredSessions = async () => {
		calls.push('deleteExpiredSessions');
		return 1;
	};
	mockSessionModel.createSession = async (session) => {
		calls.push('createSession');
		return session;
	};
	const before = Date.now();
	const session = await createUserSession(7);
	const after = Date.now();
	assert.deepEqual(calls, ['deleteExpiredSessions', 'createSession']);
	assert.equal(session.userId, 7);
	assert.equal(typeof session.sessionID, 'string');
	assert.ok(session.sessionID.length > 0);
	assert.ok(session.expiresAt instanceof Date);
	assert.ok(session.expiresAt.getTime() >= before + 29 * 60 * 1000);
	assert.ok(session.expiresAt.getTime() <= after + 31 * 60 * 1000);
});

test('createUserSession przekazuje błąd modelu dalej', async () => {
	const expectedError = new Error('Błąd czyszczenia sesji');
	mockSessionModel.deleteExpiredSessions = async () => {
		throw expectedError;
	};
	mockSessionModel.createSession = async () => {
		throw new Error('Nie powinno zostać wywołane');
	};
	await assert.rejects(createUserSession(7), expectedError);
});

/**
 * Testy extendUserSession
 */
test('extendUserSession aktualizuje datę wygaśnięcia sesji w modelu', async () => {
	let updatedSessionID = null;
	let updatedExpiresAt = null;
	process.env.SESSION_EXPIRES_MINUTES = '20';
	mockSessionModel.extendSession = async (sessionID, expiresAt) => {
		updatedSessionID = sessionID;
		updatedExpiresAt = expiresAt;
		return 1;
	};
	const before = Date.now();
	const expiresAt = await extendUserSession('session-id-123');
	const after = Date.now();
	assert.equal(updatedSessionID, 'session-id-123');
	assert.equal(updatedExpiresAt, expiresAt);
	assert.ok(expiresAt instanceof Date);
	assert.ok(expiresAt.getTime() >= before + 19 * 60 * 1000);
	assert.ok(expiresAt.getTime() <= after + 21 * 60 * 1000);
});

test('extendUserSession przekazuje błąd modelu dalej', async () => {
	const expectedError = new Error('Błąd przedłużenia sesji');
	mockSessionModel.extendSession = async () => {
		throw expectedError;
	};
	await assert.rejects(extendUserSession('session-id-123'), expectedError);
});
