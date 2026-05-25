/**
 * Testy jednostkowe kontrolera transakcji z mockowanymi modelami transakcji i kategorii.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const MESSAGES = require('../server/src/utils/messages');

const mockTransactionModel = {};
const mockCategoryModel = {};
const transactionModelPath = require.resolve('../server/src/models/transaction.model');
const categoryModelPath = require.resolve('../server/src/models/category.model');

require.cache[transactionModelPath] = {
	id: transactionModelPath,
	filename: transactionModelPath,
	loaded: true,
	exports: mockTransactionModel
};
require.cache[categoryModelPath] = {
	id: categoryModelPath,
	filename: categoryModelPath,
	loaded: true,
	exports: mockCategoryModel
};

const TransactionController = require('../server/src/controllers/transaction.controller');

/**
 * Czyści: funkcje przypisane do mocków po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockTransactionModel)) {
		delete mockTransactionModel[key];
	}
	for (const key of Object.keys(mockCategoryModel)) {
		delete mockCategoryModel[key];
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
 * Uruchamia kontroler transakcji i przechwytuje odpowiedź oraz błąd przekazany do next.
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

/**
 * Tworzy przykładową transakcję zwracaną przez mock modelu.
 * @param {number} id - Identyfikator transakcji.
 * @returns {object} Transakcja testowa.
 */
function createTransactionFixture(id = 1) {
	return {
		id,
		categoryId: 2,
		category: {
			id: 2,
			code: 'food',
			name: 'Jedzenie',
			type: 1
		},
		name: 'Obiad',
		date: '2024-01-10',
		amount: 15.5,
		description: null,
		ownerId: 7,
		createdAt: new Date('2024-01-10T10:00:00.000Z')
	};
}

test.afterEach(() => {
	resetMocks();
});

/**
 * Testy listTransactions
 */
test('listTransactions zwraca listę transakcji z paginacją', async () => {
	const transactions = [createTransactionFixture()];
	let receivedOwnerId = null;
	let receivedPagination = null;
	mockTransactionModel.findTransactions = async (ownerId, filters, pagination) => {
		receivedOwnerId = ownerId;
		receivedPagination = pagination;
		return transactions;
	};
	mockTransactionModel.countTransactions = async () => 1;

	const {
		res,
		nextError
	} = await runController(TransactionController.listTransactions, {
		user: {
			id: 7
		},
		query: {
			page: '1',
			limit: '10'
		}
	});

	assert.equal(nextError, null);
	assert.equal(receivedOwnerId, 7);
	assert.deepEqual(receivedPagination, {
		page: 1,
		limit: 10,
		offset: 0
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.TRANSACTIONS_FETCHED,
		data: {
			transactions,
			pagination: {
				page: 1,
				limit: 10,
				total: 1,
				pages: 1
			}
		}
	});
});

/**
 * Testy createTransaction
 */
test('createTransaction tworzy transakcję właściciela i zwraca odpowiedź 201', async () => {
	const transaction = createTransactionFixture(10);
	let receivedData = null;
	mockCategoryModel.findCategoryById = async () => ({
		id: 2
	});
	mockTransactionModel.createTransaction = async (transactionData) => {
		receivedData = transactionData;
		return 10;
	};
	mockTransactionModel.findTransactionById = async () => transaction;

	const {
		res,
		nextError
	} = await runController(TransactionController.createTransaction, {
		user: {
			id: 7
		},
		body: {
			categoryId: '2',
			name: '  Obiad  ',
			date: '2024-01-10',
			amount: '15.5'
		}
	});

	assert.equal(nextError, null);
	assert.deepEqual(receivedData, {
		categoryId: 2,
		name: 'Obiad',
		date: '2024-01-10',
		amount: '15.50',
		description: null,
		ownerId: 7
	});
	assert.equal(res.statusCode, 201);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.TRANSACTION_CREATED,
		data: transaction
	});
});

test('createTransaction przekazuje błąd 400 dla niepoprawnych danych', async () => {
	const {
		res,
		nextError
	} = await runController(TransactionController.createTransaction, {
		user: {
			id: 7
		},
		body: {
			name: ''
		}
	});

	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.VALIDATION_ERROR);
	assert.ok(nextError.details.categoryId);
	assert.ok(nextError.details.name);
	assert.ok(nextError.details.date);
	assert.ok(nextError.details.amount);
});

test('createTransaction przekazuje błąd 404, gdy kategoria nie istnieje', async () => {
	mockCategoryModel.findCategoryById = async () => null;

	const {
		res,
		nextError
	} = await runController(TransactionController.createTransaction, {
		user: {
			id: 7
		},
		body: {
			categoryId: 999,
			name: 'Obiad',
			date: '2024-01-10',
			amount: '15.50'
		}
	});

	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 404);
	assert.equal(nextError.message, MESSAGES.CATEGORY_NOT_FOUND);
});

/**
 * Testy getTransaction
 */
test('getTransaction zwraca transakcję właściciela', async () => {
	const transaction = createTransactionFixture(5);
	mockTransactionModel.findTransactionById = async () => transaction;

	const {
		res,
		nextError
	} = await runController(TransactionController.getTransaction, {
		user: {
			id: 7
		},
		params: {
			id: '5'
		}
	});

	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.TRANSACTION_FETCHED,
		data: transaction
	});
});

/**
 * Testy updateTransaction
 */
test('updateTransaction aktualizuje istniejącą transakcję właściciela', async () => {
	const transaction = createTransactionFixture(5);
	const updatedTransaction = {
		...transaction,
		name: 'Kolacja'
	};
	let updateData = null;
	mockTransactionModel.findTransactionById = async () => updateData ? updatedTransaction : transaction;
	mockTransactionModel.updateTransaction = async (id, ownerId, data) => {
		updateData = data;
		return 1;
	};

	const {
		res,
		nextError
	} = await runController(TransactionController.updateTransaction, {
		user: {
			id: 7
		},
		params: {
			id: '5'
		},
		body: {
			name: '  Kolacja  '
		}
	});

	assert.equal(nextError, null);
	assert.deepEqual(updateData, {
		name: 'Kolacja'
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body.data, updatedTransaction);
});

/**
 * Testy deleteTransaction
 */
test('deleteTransaction usuwa istniejącą transakcję właściciela', async () => {
	let deletedId = null;
	mockTransactionModel.findTransactionById = async () => createTransactionFixture(5);
	mockTransactionModel.deleteTransaction = async (id) => {
		deletedId = id;
		return 1;
	};

	const {
		res,
		nextError
	} = await runController(TransactionController.deleteTransaction, {
		user: {
			id: 7
		},
		params: {
			id: '5'
		}
	});

	assert.equal(nextError, null);
	assert.equal(deletedId, 5);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.TRANSACTION_DELETED,
		data: null
	});
});
