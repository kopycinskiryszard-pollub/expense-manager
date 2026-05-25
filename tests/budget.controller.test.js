/**
 * Testy jednostkowe kontrolera budzetow z mockowanym modelem budzetu.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const MESSAGES = require('../server/src/utils/messages');
const {
	getCurrentBudgetPeriod
} = require('../server/src/utils/validators/budget.validators');

const mockBudgetModel = {};
const budgetModelPath = require.resolve('../server/src/models/budget.model');

require.cache[budgetModelPath] = {
	id: budgetModelPath,
	filename: budgetModelPath,
	loaded: true,
	exports: mockBudgetModel
};

const BudgetController = require('../server/src/controllers/budget.controller');

/**
 * Czysci funkcje przypisane do mocka modelu po kazdym tescie.
 * @returns {void} Nie zwraca wartosci.
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
 * Uruchamia kontroler budzetu i przechwytuje odpowiedz oraz blad przekazany do next.
 * @param {Function} controller - Testowana funkcja kontrolera.
 * @param {object} req - Mock zadania Express.
 * @returns {Promise<{res: object, nextError: Error|null}>} Wynik dzialania kontrolera.
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
 * Przesuwa okres budzetowy o podana liczbe miesiecy.
 * @param {{month: number, year: number}} period - Okres bazowy.
 * @param {number} offset - Przesuniecie miesiecy.
 * @returns {{month: number, year: number}} Przesuniety okres.
 */
function addMonths(period, offset) {
	const index = period.year * 12 + period.month - 1 + offset;
	return {
		month: index % 12 + 1,
		year: Math.floor(index / 12)
	};
}

/**
 * Tworzy przykladowy budzet zwracany przez mock modelu.
 * @param {object} overrides - Nadpisane pola budzetu.
 * @returns {object} Budzet testowy.
 */
function createBudgetFixture(overrides = {}) {
	const current = getCurrentBudgetPeriod();
	return {
		id: 1,
		ownerId: 7,
		month: current.month,
		year: current.year,
		limitAmount: 1000,
		createdAt: new Date('2026-05-25T10:00:00.000Z'),
		... overrides
	};
}

test.afterEach(() => {
	resetMocks();
});

test('getBudgetForMonth szuka biezacego miesiaca przy blednych filtrach', async () => {
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

test('createBudget odrzuca budzet dalej niz 12 miesiecy w przod', async () => {
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

test('createBudget tworzy budzet dla biezacego miesiaca', async () => {
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

test('updateBudget blokuje edycje budzetu z poprzedniego miesiaca', async () => {
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
