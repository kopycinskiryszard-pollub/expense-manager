const test = require('node:test');
const assert = require('node:assert/strict');
const MESSAGES = require('../server/src/utils/messages');
const {
	normalizeUserIdentifier,
	validateRegisterData,
	validateLoginData,
	hasValidationErrors
} = require('../server/src/utils/validators');

/**
 * Testy normalizeUserIdentifier
 */
test('normalizeUserIdentifier zwraca znormalizowany identyfikator użytkownika', () => {
	assert.equal(normalizeUserIdentifier('  User_Name  '), 'user_name');
	assert.equal(normalizeUserIdentifier('  TEST@Example.COM  '), 'test@example.com');
	assert.equal(normalizeUserIdentifier(null), '');
});

/**
 * Testy validateRegisterData
 */
test('validateRegisterData zwraca pusty obiekt dla poprawnych danych rejestracji', () => {
	const errors = validateRegisterData({
		login: 'valid_user',
		email: 'valid.user@example.com',
		password: 'Password1!'
	});
	assert.deepEqual(errors, {});
	assert.equal(hasValidationErrors(errors), false);
});

test('validateRegisterData zwraca komunikaty błędów dla niepoprawnych danych rejestracji', () => {
	const errors = validateRegisterData({
		login: 'bad',
		email: 'not-an-email',
		password: 'weak'
	});
	assert.deepEqual(errors, {
		login: MESSAGES.AUTH_REGISTER_LOGIN_REQUIREMENTS,
		email: MESSAGES.AUTH_REGISTER_EMAIL_REQUIREMENTS,
		password: MESSAGES.AUTH_REGISTER_PASSWORD_REQUIREMENTS
	});
	assert.equal(hasValidationErrors(errors), true);
});

/**
 * Testy validateLoginData
 */
test('validateLoginData zwraca pusty obiekt dla poprawnego loginu albo e-maila', () => {
	assert.deepEqual(validateLoginData({
		identifier: 'valid_user',
		password: 'Password1!'
	}), {});
	assert.deepEqual(validateLoginData({
		identifier: 'valid.user@example.com',
		password: 'Password1!'
	}), {});
});

test('validateLoginData zwraca komunikaty błędów dla niepoprawnego logowania', () => {
	const errors = validateLoginData({
		identifier: 'no',
		password: ''
	});
	assert.deepEqual(errors, {
		identifier: MESSAGES.AUTH_LOGIN_IDENTIFIER_REQUIREMENTS,
		password: MESSAGES.AUTH_LOGIN_INVALID_CREDENTIALS
	});
	assert.equal(hasValidationErrors(errors), true);
});
