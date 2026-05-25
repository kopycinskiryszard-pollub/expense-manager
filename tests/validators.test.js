/**
 * Testy jednostkowe walidatorów danych wejściowych i normalizacji profilu użytkownika.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const MESSAGES = require('../server/src/utils/messages');
const {
	normalizeUserIdentifier,
	validateRegisterData,
	validateLoginData
} = require('../server/src/utils/validators/auth.validators');
const {
	validateProfileData,
	normalizeProfileData
} = require('../server/src/utils/validators/user.validators');
const {
	validateTransactionData,
	normalizeTransactionData,
	validateTransactionListQuery,
	normalizeTransactionListQuery
} = require('../server/src/utils/validators/transaction.validators');
const {
	hasValidationErrors
} = require('../server/src/utils/validators/general.validators');

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

/**
 * Testy validateProfileData i normalizeProfileData
 */
test('validateProfileData akceptuje poprawne opcjonalne dane profilu', () => {
	const errors = validateProfileData({
		name: 'Jan',
		surname: 'Kowalski',
		birthdate: '2000-01-15',
		city: 'Lublin',
		country: 'Polska'
	});
	assert.deepEqual(errors, {});
	assert.equal(hasValidationErrors(errors), false);
});

test('validateProfileData zwraca błędy dla niepoprawnych danych profilu', () => {
	const errors = validateProfileData({
		name: 'a'.repeat(51),
		birthdate: '2999-01-01',
		unknown: 'value'
	});
	assert.ok(errors.name);
	assert.ok(errors.birthdate);
	assert.ok(errors.fields);
});

test('normalizeProfileData przycina tekst i zamienia puste wartości na null', () => {
	const profileData = normalizeProfileData({
		name: '  Jan  ',
		surname: '',
		birthdate: null,
		city: '  Lublin  '
	});
	assert.deepEqual(profileData, {
		name: 'Jan',
		surname: null,
		birthdate: null,
		city: 'Lublin'
	});
});

/**
 * Testy validateTransactionData i normalizeTransactionData
 */
test('validateTransactionData akceptuje poprawne dane nowej transakcji', () => {
	const errors = validateTransactionData({
		categoryId: 1,
		name: 'Zakupy',
		date: '2024-01-10',
		amount: '25.50',
		description: 'Sklep'
	});
	assert.deepEqual(errors, {});
});

test('validateTransactionData zwraca błędy dla niepoprawnej transakcji', () => {
	const errors = validateTransactionData({
		categoryId: 'bad',
		name: '',
		date: '2999-01-01',
		amount: '10.999',
		description: 'a'.repeat(256)
	});
	assert.ok(errors.categoryId);
	assert.ok(errors.name);
	assert.ok(errors.date);
	assert.ok(errors.amount);
	assert.ok(errors.description);
});

test('normalizeTransactionData normalizuje dane do zapisu w bazie', () => {
	const data = normalizeTransactionData({
		categoryId: '2',
		name: '  Obiad  ',
		date: '2024-01-10',
		amount: '15.5',
		description: ''
	});
	assert.deepEqual(data, {
		categoryId: 2,
		name: 'Obiad',
		date: '2024-01-10',
		amount: '15.50',
		description: null
	});
});

/**
 * Testy validateTransactionListQuery i normalizeTransactionListQuery
 */
test('normalizeTransactionListQuery ustawia domyślną paginację przy błędnych wartościach', () => {
	const normalized = normalizeTransactionListQuery({
		page: 'bad',
		limit: '15',
		sortBy: 'amount',
		order: 'ASC'
	});
	assert.deepEqual(normalized.pagination, {
		page: 1,
		limit: 10,
		offset: 0
	});
	assert.deepEqual(normalized.sorting, {
		sortBy: 'amount',
		order: 'asc'
	});
});

test('validateTransactionListQuery zwraca błędy dla niepoprawnych filtrów', () => {
	const errors = validateTransactionListQuery({
		categoryId: 'x',
		month: '13',
		dateFrom: '2024-02-10',
		dateTo: '2024-02-01',
		sortBy: 'name',
		order: 'down'
	});
	assert.ok(errors.categoryId);
	assert.ok(errors.month);
	assert.ok(errors.dateTo);
	assert.ok(errors.sortBy);
	assert.ok(errors.order);
});
