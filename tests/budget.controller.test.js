/**
 * Testy jednostkowe kontrolera budżetów z mockowanym modelem budżetu.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const {
	getCurrentBudgetPeriod
} = require('../server/src/utils/validators/budget.validators');
const mockBudgetModel = {};
const budgetModelPath = require.resolve('../server/src/models/budget.model');
const budgetModelMock = new Module(budgetModelPath);
budgetModelMock.filename = budgetModelPath;
budgetModelMock.loaded = true;
budgetModelMock.exports = mockBudgetModel;
require.cache[budgetModelPath] = budgetModelMock;
const BudgetController = require('../server/src/controllers/budget.controller');

/**
 * Czyści funkcje przypisane do mocka modelu po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockBudgetModel)) {
		delete mockBudgetModel[key];
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
 * Uruchamia kontroler budżetu i przechwytuje odpowiedź oraz błąd przekazany do next.
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
 * Przesuwa okres budżetowy o podaną liczbę miesięcy.
 * @param {{month: number, year: number}} period - Okres bazowy.
 * @param {number} offset - Przesunięcie miesięcy.
 * @returns {{month: number, year: number}} Przesunięty okres.
 */
function addMonths(period, offset) {
	const index = period.year * 12 + period.month - 1 + offset;
	return {
		month: index % 12 + 1,
		year: Math.floor(index / 12)
	};
}

/**
 * Tworzy przykładowy budżet zwracany przez mock modelu.
 * @param {object} overrides - Nadpisane pola budżetu.
 * @returns {object} Budżet testowy.
 */
function createBudgetFixture(overrides = {}) {
	const current = getCurrentBudgetPeriod();
	return {
		id: 1,
		ownerId: 7,
		month: current.month,
		year: current.year,
		limitAmount: 1000,
		createdAt: new Date('2026-05-25T10:00:00.000Z'), ... overrides
	};
}

test.afterEach(() => {
	resetMocks();
});
/**
 * Testy getBudgetForMonth
 */
test('getBudgetForMonth szuka bieżącego miesiąca przy błędnych filtrach', async () => {
	const current = getCurrentBudgetPeriod();
	let receivedPeriod = null;
	mockBudgetModel.findBudgetByPeriod = async (ownerId, month, year) => {
		receivedPeriod = {
			ownerId,
			month,
			year
		};
		return createBudgetFixture({
			month,
			year
		});
	};
	const {
		res,
		nextError
	} = await runController(BudgetController.getBudgetForMonth, {
		user: {
			id: 7
		},
		query: {
			month: '13',
			year: 'bad'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(receivedPeriod, {
		ownerId: 7,
		month: current.month,
		year: current.year
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.BUDGET_FETCHED);
	assert.equal(res.body.data.month, current.month);
	assert.equal(res.body.data.year, current.year);
});

/**
 * Testy getBudget
 */
test('getBudget zwraca pojedynczy budżet właściciela', async () => {
	const budget = createBudgetFixture({
		id: 12,
		limitAmount: 750
	});
	mockBudgetModel.findBudgetById = async (budgetId, ownerId) => {
		assert.equal(budgetId, 12);
		assert.equal(ownerId, 7);
		return budget;
	};

	const {
		res,
		nextError
	} = await runController(BudgetController.getBudget, {
		user: {
			id: 7
		},
		params: {
			id: '12'
		}
	});

	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.BUDGET_FETCHED);
	assert.equal(res.body.data.id, 12);
});
/**
 * Testy createBudget
 */
test('createBudget odrzuca budżet dalej niż 12 miesięcy w przód', async () => {
	const future = addMonths(getCurrentBudgetPeriod(), 13);
	const {
		res,
		nextError
	} = await runController(BudgetController.createBudget, {
		user: {
			id: 7
		},
		body: {
			month: String(future.month),
			year: String(future.year),
			limitAmount: '1200.00'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.VALIDATION_ERROR);
	assert.ok(nextError.details.period);
});
test('createBudget tworzy budżet dla bieżącego miesiąca', async () => {
	const current = getCurrentBudgetPeriod();
	let createdData = null;
	mockBudgetModel.findBudgetByPeriod = async () => null;
	mockBudgetModel.createBudget = async (budgetData) => {
		createdData = budgetData;
		return 10;
	};
	mockBudgetModel.findBudgetById = async () => createBudgetFixture({
		id: 10,
		month: current.month,
		year: current.year,
		limitAmount: 500
	});
	const {
		res,
		nextError
	} = await runController(BudgetController.createBudget, {
		user: {
			id: 7
		},
		body: {
			month: String(current.month),
			year: String(current.year),
			limitAmount: '500'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(createdData, {
		ownerId: 7,
		month: current.month,
		year: current.year,
		limitAmount: '500.00'
	});
	assert.equal(res.statusCode, 201);
	assert.equal(res.body.message, MESSAGES.BUDGET_CREATED);
	assert.equal(res.body.data.isEditable, true);
});
/**
 * Testy updateBudget
 */
test('updateBudget blokuje edycję budżetu z poprzedniego miesiąca', async () => {
	const past = addMonths(getCurrentBudgetPeriod(), -1);
	let updateCalled = false;
	mockBudgetModel.findBudgetById = async () => createBudgetFixture({
		month: past.month,
		year: past.year
	});
	mockBudgetModel.updateBudget = async () => {
		updateCalled = true;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(BudgetController.updateBudget, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		},
		body: {
			limitAmount: '900.00'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(updateCalled, false);
	assert.equal(nextError.statusCode, 403);
	assert.equal(nextError.message, MESSAGES.BUDGET_PAST_LOCKED);
});

/**
 * Testy deleteBudget
 */
test('deleteBudget usuwa edytowalny budżet właściciela', async () => {
	let deletedBudgetId = null;
	mockBudgetModel.findBudgetById = async () => createBudgetFixture();
	mockBudgetModel.deleteBudget = async (budgetId, ownerId) => {
		deletedBudgetId = budgetId;
		assert.equal(ownerId, 7);
		return 1;
	};

	const {
		res,
		nextError
	} = await runController(BudgetController.deleteBudget, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		}
	});

	assert.equal(nextError, null);
	assert.equal(deletedBudgetId, 1);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.BUDGET_DELETED);
});
