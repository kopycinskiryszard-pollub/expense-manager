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
	getCurrentBudgetPeriod,
	isBudgetPeriodInPlanningWindow,
	validateBudgetData,
	validateBudgetPlanningPeriod,
	normalizeBudgetData,
	normalizeBudgetQuery
} = require('../server/src/utils/validators/budget.validators');
const {
	validateGoalCreateData,
	validateGoalDetailsData,
	validateGoalAmountChangeData,
	normalizeGoalCreateData,
	normalizeGoalAmountChangeData,
	normalizeGoalListQuery
} = require('../server/src/utils/validators/goal.validators');
const {
	normalizeMonthlyReportQuery,
	normalizeYearlyReportQuery,
	validateYearlyReportTransactionsQuery,
	normalizeYearlyReportTransactionsQuery
} = require('../server/src/utils/validators/report.validators');
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
		limit: '20',
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
test('validateTransactionListQuery nie odrzuca błędnych filtrów kategorii, miesiąca, roku i zakresu dat', () => {
	const errors = validateTransactionListQuery({
		categoryId: 'x',
		month: '13',
		year: 'bad',
		dateFrom: '2024-02-10',
		dateTo: '2024-02-01'
	});
	assert.deepEqual(errors, {});
});
test('validateTransactionListQuery nadal zwraca błędy dla złego sortowania', () => {
	const errors = validateTransactionListQuery({
		sortBy: 'name',
		order: 'down'
	});
	assert.ok(errors.sortBy);
	assert.ok(errors.order);
});
test('normalizeTransactionListQuery ignoruje błędną kategorię i używa bieżącego miesiąca przy błędnym okresie', () => {
	const currentDate = new Date();
	const normalized = normalizeTransactionListQuery({
		categoryId: 'x',
		date: '2024-01-10',
		month: '13',
		dateFrom: '2024-02-10',
		dateTo: '2024-02-01'
	});
	assert.deepEqual(normalized.filters, {
		month: currentDate.getMonth() + 1,
		year: currentDate.getFullYear()
	});
});
/**
 * Testy walidatorów budżetów miesięcznych
 */
test('normalizeBudgetQuery używa bieżącego miesiąca przy błędnych filtrach', () => {
	const referenceDate = new Date('2026-05-25T10:00:00.000Z');
	assert.deepEqual(normalizeBudgetQuery({
		month: '13',
		year: 'bad'
	}, referenceDate), {
		month: 5,
		year: 2026
	});
	assert.deepEqual(normalizeBudgetQuery({
		month: '6',
		year: '2026'
	}, referenceDate), {
		month: 6,
		year: 2026
	});
});
test('validateBudgetData i normalizeBudgetData obsługują poprawny budżet', () => {
	const errors = validateBudgetData({
		month: '5',
		year: '2026',
		limitAmount: '1000.5'
	});
	assert.deepEqual(errors, {});
	assert.deepEqual(normalizeBudgetData({
		month: '5',
		year: '2026',
		limitAmount: '1000.5'
	}), {
		month: 5,
		year: 2026,
		limitAmount: '1000.50'
	});
});
test('validateBudgetPlanningPeriod pozwala planować maksymalnie 12 miesięcy w przód', () => {
	const referenceDate = new Date('2026-05-25T10:00:00.000Z');
	assert.equal(isBudgetPeriodInPlanningWindow(5, 2026, referenceDate), true);
	assert.equal(isBudgetPeriodInPlanningWindow(5, 2027, referenceDate), true);
	assert.equal(isBudgetPeriodInPlanningWindow(6, 2027, referenceDate), false);
	assert.deepEqual(validateBudgetPlanningPeriod(6, 2027, referenceDate), {
		period: 'Budzet mozna planowac od biezacego miesiaca do 12 miesiecy w przod.'
	});
});
test('getCurrentBudgetPeriod zwraca miesiąc i rok z daty referencyjnej', () => {
	assert.deepEqual(getCurrentBudgetPeriod(new Date('2026-12-01T00:00:00.000Z')), {
		month: 12,
		year: 2026
	});
});

/**
 * Zwraca datę przesuniętą względem dzisiaj w formacie YYYY-MM-DD.
 * @param {number} daysToAdd - Liczba dni przesunięcia.
 * @returns {string} Data w formacie YYYY-MM-DD.
 */
function getDateStringFromToday(daysToAdd) {
	const date = new Date();
	date.setDate(date.getDate() + daysToAdd);
	return `${date.getFullYear()}-${String(date.getMonth() + 1)
	.padStart(2, '0')}-${String(date.getDate())
	.padStart(2, '0')}`;
}

/**
 * Testy walidatorów celów oszczędnościowych
 */
test('validateGoalCreateData i normalizeGoalCreateData obsługują poprawny cel', () => {
	const deadline = getDateStringFromToday(30);
	const errors = validateGoalCreateData({
		name: '  Wakacje  ',
		targetAmount: '5000',
		currentAmount: '1200.5',
		deadline,
		description: '  Wyjazd rodzinny  '
	});
	assert.deepEqual(errors, {});
	assert.deepEqual(normalizeGoalCreateData({
		name: '  Wakacje  ',
		targetAmount: '5000',
		currentAmount: '1200.5',
		deadline,
		description: '  Wyjazd rodzinny  '
	}), {
		name: 'Wakacje',
		targetAmount: '5000.00',
		currentAmount: '1200.50',
		deadline,
		description: 'Wyjazd rodzinny'
	});
});
test('validateGoalCreateData wymaga przyszłego deadline', () => {
	assert.ok(validateGoalCreateData({
		name: 'Wakacje',
		targetAmount: '5000'
	}).deadline);
	assert.ok(validateGoalCreateData({
		name: 'Wakacje',
		targetAmount: '5000',
		deadline: getDateStringFromToday(0)
	}).deadline);
});
test('validateGoalDetailsData nie pozwala edytować currentAmount w edycji celu', () => {
	const errors = validateGoalDetailsData({
		currentAmount: '100'
	});
	assert.ok(errors.fields);
});
test('validateGoalDetailsData wymaga przyszłego deadline przy zmianie terminu', () => {
	const errors = validateGoalDetailsData({
		deadline: getDateStringFromToday(-1)
	});
	assert.ok(errors.deadline);
});
test('validateGoalAmountChangeData i normalizeGoalAmountChangeData obsługują zmianę kwoty', () => {
	const errors = validateGoalAmountChangeData({
		amount: '50.5',
		operation: 'increase'
	});
	assert.deepEqual(errors, {});
	assert.deepEqual(normalizeGoalAmountChangeData({
		amount: '50.5',
		operation: 'increase'
	}), {
		amount: 50.5,
		operation: 'increase'
	});
});
test('normalizeGoalListQuery ignoruje błędny rok i błędną paginację', () => {
	const normalized = normalizeGoalListQuery({
		year: 'bad',
		page: '2',
		limit: '15'
	});
	assert.deepEqual(normalized.filters, {});
	assert.deepEqual(normalized.pagination, {
		page: 1,
		limit: 10,
		offset: 0
	});
});
/**
 * Testy walidatorów raportów
 */
test('normalizeMonthlyReportQuery używa bieżącego miesiąca przy błędnym okresie', () => {
	const currentDate = new Date();
	const normalized = normalizeMonthlyReportQuery({
		month: '13',
		year: 'bad'
	});
	assert.deepEqual(normalized, {
		month: currentDate.getMonth() + 1,
		year: currentDate.getFullYear()
	});
});
test('normalizeYearlyReportQuery ustawia domyślne widoki raportu rocznego', () => {
	const normalized = normalizeYearlyReportQuery({
		year: '2026',
		incomeView: 'bad',
		expenseView: 'month'
	});
	assert.deepEqual(normalized, {
		year: 2026,
		incomeView: 'category',
		expenseView: 'month'
	});
});
test('validateYearlyReportTransactionsQuery wymaga typu i zakresu szczegółów', () => {
	const errors = validateYearlyReportTransactionsQuery({
		type: 'bad'
	});
	assert.ok(errors.type);
	assert.ok(errors.scope);
});
test('normalizeYearlyReportTransactionsQuery normalizuje szczegóły raportu rocznego', () => {
	const normalized = normalizeYearlyReportTransactionsQuery({
		year: '2026',
		type: 'income',
		month: '4'
	});
	assert.deepEqual(normalized, {
		year: 2026,
		type: 'income',
		month: 4
	});
});
