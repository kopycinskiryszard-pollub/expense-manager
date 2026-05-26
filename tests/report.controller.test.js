/**
 * Testy jednostkowe kontrolera raportów z mockowanymi modelami.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const mockReportModel = {};
const mockTransactionModel = {};
const mockBudgetModel = {};
const mockCategoryModel = {};
const reportModelPath = require.resolve('../server/src/models/report.model');
const transactionModelPath = require.resolve('../server/src/models/transaction.model');
const budgetModelPath = require.resolve('../server/src/models/budget.model');
const categoryModelPath = require.resolve('../server/src/models/category.model');
const reportModelMock = new Module(reportModelPath);
reportModelMock.filename = reportModelPath;
reportModelMock.loaded = true;
reportModelMock.exports = mockReportModel;
require.cache[reportModelPath] = reportModelMock;
const transactionModelMock = new Module(transactionModelPath);
transactionModelMock.filename = transactionModelPath;
transactionModelMock.loaded = true;
transactionModelMock.exports = mockTransactionModel;
require.cache[transactionModelPath] = transactionModelMock;
const budgetModelMock = new Module(budgetModelPath);
budgetModelMock.filename = budgetModelPath;
budgetModelMock.loaded = true;
budgetModelMock.exports = mockBudgetModel;
require.cache[budgetModelPath] = budgetModelMock;
const categoryModelMock = new Module(categoryModelPath);
categoryModelMock.filename = categoryModelPath;
categoryModelMock.loaded = true;
categoryModelMock.exports = mockCategoryModel;
require.cache[categoryModelPath] = categoryModelMock;
const ReportController = require('../server/src/controllers/report.controller');

/**
 * Czyści funkcje przypisane do mocków po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const mock of [mockReportModel, mockTransactionModel, mockBudgetModel, mockCategoryModel]) {
		for (const key of Object.keys(mock)) {
			delete mock[key];
		}
	}
}

/**
 * Tworzy uproszczony mock odpowiedzi Express.
 * @returns {object} Mock odpowiedzi HTTP.
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
 * Uruchamia kontroler raportu i przechwytuje wynik.
 * @param {Function} controller - Testowana funkcja kontrolera.
 * @param {object} req - Mock żądania Express.
 * @returns {Promise<{res: object, nextError: Error|null}>} Wynik kontrolera.
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
 * Testy getMonthlyReport
 */
test('getMonthlyReport zwraca dochody, wydatki i porównanie z budżetem', async () => {
	const incomeTransactions = [{
		id: 1,
		amount: 3000
	}];
	const expenseTransactions = [{
		id: 2,
		categoryId: 5,
		category: {
			id: 5,
			name: 'Jedzenie',
			type: 1
		},
		amount: 250
	}];
	let transactionCalls = 0;
	mockTransactionModel.findReportTransactions = async (ownerId, filters, sorting) => {
		transactionCalls += 1;
		assert.equal(ownerId, 7);
		if (filters.type === 0) {
			assert.deepEqual(filters, {
				type: 0,
				month: 5,
				year: 2026
			});
			assert.deepEqual(sorting, {
				sortBy: 'date',
				order: 'asc'
			});
			return incomeTransactions;
		}
		assert.deepEqual(filters, {
			type: 1,
			month: 5,
			year: 2026
		});
		assert.deepEqual(sorting, {
			sortBy: 'amount',
			order: 'desc'
		});
		return expenseTransactions;
	};
	mockBudgetModel.findBudgetByPeriod =
		async () => (
			{
				limitAmount: 500
			}
		);
	const {
		res,
		nextError
	} = await runController(ReportController.getMonthlyReport, {
		user: {
			id: 7
		},
		query: {
			month: '5',
			year: '2026'
		}
	});
	assert.equal(nextError, null);
	assert.equal(transactionCalls, 2);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.REPORT_FETCHED);
	assert.deepEqual(mockReportModel, {});
	assert.deepEqual(res.body.data.budget, {
		exists: true,
		limitAmount: 500,
		spentAmount: 250,
		difference: 250,
		status: 'within_limit'
	});
	assert.equal(res.body.data.income.total, 3000);
	assert.equal(res.body.data.expenses.total, 250);
	assert.equal(res.body.data.expenses.categories[0].total, 250);
	assert.equal(res.body.data.expenses.categories[0].count, 1);
	assert.deepEqual(res.body.data.expenses.categories[0].transactions, expenseTransactions);
	assert.equal(res.body.data.balance, 2750);
});
/**
 * Testy getYearlyReport
 */
test('getYearlyReport zwraca raport roczny z wybranymi widokami', async () => {
	mockReportModel.getYearlyByMonth = async (ownerId, type, year) => {
		assert.equal(ownerId, 7);
		assert.equal(year, 2026);
		return [{
			month: 1,
			total: type === 0 ? 1200 : 800,
			count: 2
		}];
	};
	mockReportModel.getYearlyByCategory = async (ownerId, type, year) => {
		assert.equal(ownerId, 7);
		assert.equal(type, 1);
		assert.equal(year, 2026);
		return [{
			category: {
				id: 2,
				name: 'Jedzenie',
				type: 1
			},
			total: 800,
			count: 2
		}];
	};
	const {
		res,
		nextError
	} = await runController(ReportController.getYearlyReport, {
		user: {
			id: 7
		},
		query: {
			year: '2026',
			incomeView: 'month',
			expenseView: 'category'
		}
	});
	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.data.income.view, 'month');
	assert.equal(res.body.data.income.monthlyAverage, 100);
	assert.equal(res.body.data.expenses.view, 'category');
	assert.equal(res.body.data.balance, 400);
});
/**
 * Testy getYearlyReportTransactions
 */
test('getYearlyReportTransactions pobiera szczegóły kategorii raportu', async () => {
	const transactions = [{
		id: 1,
		amount: 100
	}];
	let receivedFilters = null;
	mockCategoryModel.findCategoryById =
		async () => (
			{
				id: 2,
				type: 1
			}
		);
	mockTransactionModel.findReportTransactions = async (ownerId, filters, sorting) => {
		receivedFilters = filters;
		assert.deepEqual(sorting, {
			sortBy: 'amount',
			order: 'desc'
		});
		return transactions;
	};
	const {
		res,
		nextError
	} = await runController(ReportController.getYearlyReportTransactions, {
		user: {
			id: 7
		},
		query: {
			year: '2026',
			type: 'expense',
			categoryId: '2'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(receivedFilters, {
		year: 2026,
		month: undefined,
		categoryId: 2,
		type: 1
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body.data.transactions, transactions);
});
test('getYearlyReportTransactions odrzuca brak zakresu szczegółów', async () => {
	const {
		nextError
	} = await runController(ReportController.getYearlyReportTransactions, {
		user: {
			id: 7
		},
		query: {
			year: '2026',
			type: 'expense'
		}
	});
	assert.equal(nextError.statusCode, 400);
	assert.ok(nextError.details.scope);
});

test('getYearlyReportTransactions odrzuca kategorię niezgodną z typem raportu', async () => {
	mockCategoryModel.findCategoryById =
		async () => (
			{
				id: 2,
				type: 0
			}
		);
	mockTransactionModel.findReportTransactions = async () => {
		throw new Error('Nie powinno zostać wywołane');
	};

	const {
		nextError
	} = await runController(ReportController.getYearlyReportTransactions, {
		user: {
			id: 7
		},
		query: {
			year: '2026',
			type: 'expense',
			categoryId: '2'
		}
	});

	assert.equal(nextError.statusCode, 404);
	assert.equal(nextError.message, MESSAGES.CATEGORY_NOT_FOUND);
});
