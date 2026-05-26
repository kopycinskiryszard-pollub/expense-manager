/**
 * Testy jednostkowe kontrolera celów z mockowanym modelem celów.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const mockGoalModel = {};
const goalModelPath = require.resolve('../server/src/models/goal.model');
const goalModelMock = new Module(goalModelPath);
goalModelMock.filename = goalModelPath;
goalModelMock.loaded = true;
goalModelMock.exports = mockGoalModel;
require.cache[goalModelPath] = goalModelMock;
const GoalController = require('../server/src/controllers/goal.controller');

/**
 * Czyści funkcje przypisane do mocka modelu po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockGoalModel)) {
		delete mockGoalModel[key];
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
 * Uruchamia kontroler celu i przechwytuje odpowiedź oraz błąd przekazany do next.
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
 * Zwraca dzisiejszą datę w formacie YYYY-MM-DD.
 * @returns {string} Dzisiejsza data.
 */
function getTodayDateString() {
	const today = new Date();
	return `${today.getFullYear()}-${String(today.getMonth() + 1)
	.padStart(2, '0')}-${String(today.getDate())
	.padStart(2, '0')}`;
}

/**
 * Zwraca przyszłą datę w formacie YYYY-MM-DD.
 * @param {number} daysToAdd - Liczba dni dodawanych do dzisiejszej daty.
 * @returns {string} Przyszła data.
 */
function getFutureDateString(daysToAdd = 30) {
	const date = new Date();
	date.setDate(date.getDate() + daysToAdd);
	return `${date.getFullYear()}-${String(date.getMonth() + 1)
	.padStart(2, '0')}-${String(date.getDate())
	.padStart(2, '0')}`;
}

/**
 * Tworzy przykładowy cel zwracany przez mock modelu.
 * @param {object} overrides - Nadpisane pola celu.
 * @returns {object} Cel testowy.
 */
function createGoalFixture(overrides = {}) {
	return {
		id: 1,
		ownerId: 7,
		name: 'Wakacje',
		description: null,
		targetAmount: 1000,
		currentAmount: 100,
		deadline: getFutureDateString(),
		finishedAt: null,
		isClosed: false,
		progress: 10,
		isCompleted: false,
		createdAt: new Date('2026-05-26T10:00:00.000Z'), ... overrides
	};
}

test.afterEach(() => {
	resetMocks();
});
/**
 * Testy listGoals
 */
test('listGoals zwraca najbliższe aktywne cele i domyślną paginację przy błędnych parametrach', async () => {
	const goals = [createGoalFixture()];
	let receivedFilters = null;
	let receivedPagination = null;
	mockGoalModel.findGoals = async (ownerId, filters, pagination) => {
		receivedFilters = filters;
		receivedPagination = pagination;
		return goals;
	};
	mockGoalModel.countGoals = async () => 1;
	const {
		res,
		nextError
	} = await runController(GoalController.listGoals, {
		user: {
			id: 7
		},
		query: {
			year: 'bad',
			page: '2',
			limit: '15'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(receivedFilters, {});
	assert.deepEqual(receivedPagination, {
		page: 1,
		limit: 10,
		offset: 0
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.GOALS_FETCHED,
		data: {
			goals,
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
 * Testy listGoalHistory
 */
test('listGoalHistory pobiera historię z filtrem roku i paginacją', async () => {
	let receivedFilters = null;
	let receivedPagination = null;
	mockGoalModel.findGoalHistory = async (ownerId, filters, pagination) => {
		receivedFilters = filters;
		receivedPagination = pagination;
		return [];
	};
	mockGoalModel.countGoalHistory = async () => 0;
	const {
		res,
		nextError
	} = await runController(GoalController.listGoalHistory, {
		user: {
			id: 7
		},
		query: {
			year: '2026',
			page: '2',
			limit: '20'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(receivedFilters, {
		year: 2026
	});
	assert.deepEqual(receivedPagination, {
		page: 2,
		limit: 20,
		offset: 20
	});
	assert.equal(res.statusCode, 200);
});
/**
 * Testy createGoal
 */
test('createGoal tworzy cel z opisem i domyślnie otwartą zbiórką', async () => {
	let createdData = null;
	mockGoalModel.createGoal = async (goalData) => {
		createdData = goalData;
		return 10;
	};
	mockGoalModel.findGoalById = async () => createGoalFixture({
		id: 10,
		description: 'Wyjazd rodzinny',
		targetAmount: 5000,
		currentAmount: 0
	});
	const {
		res,
		nextError
	} = await runController(GoalController.createGoal, {
		user: {
			id: 7
		},
		body: {
			name: '  Wakacje  ',
			targetAmount: '5000',
			deadline: getFutureDateString(),
			description: '  Wyjazd rodzinny  '
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(createdData, {
		ownerId: 7,
		name: 'Wakacje',
		targetAmount: '5000.00',
		currentAmount: '0.00',
		deadline: getFutureDateString(),
		description: 'Wyjazd rodzinny',
		finishedAt: null,
		isClosed: false
	});
	assert.equal(res.statusCode, 201);
	assert.equal(res.body.message, MESSAGES.GOAL_CREATED);
});
/**
 * Testy updateGoal
 */
test('updateGoal blokuje edycję zamkniętej zbiórki', async () => {
	let updateCalled = false;
	mockGoalModel.findGoalById = async () => createGoalFixture({
		isClosed: true
	});
	mockGoalModel.updateGoal = async () => {
		updateCalled = true;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(GoalController.updateGoal, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		},
		body: {
			name: 'Nowa nazwa'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(updateCalled, false);
	assert.equal(nextError.statusCode, 403);
	assert.equal(nextError.message, MESSAGES.GOAL_CLOSED_LOCKED);
});
test('updateGoal blokuje zmianę deadline, gdy cel został osiągnięty', async () => {
	let updateCalled = false;
	mockGoalModel.findGoalById = async () => createGoalFixture({
		targetAmount: 1000,
		currentAmount: 1000,
		finishedAt: getTodayDateString()
	});
	mockGoalModel.updateGoal = async () => {
		updateCalled = true;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(GoalController.updateGoal, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		},
		body: {
			deadline: getFutureDateString()
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(updateCalled, false);
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.VALIDATION_ERROR);
	assert.ok(nextError.details.deadline);
});
/**
 * Testy updateGoalAmount
 */
test('updateGoalAmount zwiększa kwotę i ustawia finishedAt po osiągnięciu celu', async () => {
	let updateData = null;
	mockGoalModel.findGoalById = async () => updateData ? createGoalFixture({
		currentAmount: 1000,
		finishedAt: updateData.finishedAt,
		progress: 100,
		isCompleted: true
	}) : createGoalFixture({
		targetAmount: 1000,
		currentAmount: 900
	});
	mockGoalModel.updateGoal = async (id, ownerId, goalData) => {
		updateData = goalData;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(GoalController.updateGoalAmount, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		},
		body: {
			amount: '100',
			operation: 'increase'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(updateData, {
		currentAmount: '1000.00',
		finishedAt: getTodayDateString()
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.GOAL_AMOUNT_UPDATED);
});
test('updateGoalAmount zmniejsza kwotę i usuwa finishedAt, gdy cel przestaje być osiągnięty', async () => {
	let updateData = null;
	mockGoalModel.findGoalById = async () => updateData ? createGoalFixture({
		currentAmount: 900,
		finishedAt: null,
		progress: 90,
		isCompleted: false
	}) : createGoalFixture({
		targetAmount: 1000,
		currentAmount: 1000,
		finishedAt: '2026-05-26'
	});
	mockGoalModel.updateGoal = async (id, ownerId, goalData) => {
		updateData = goalData;
		return 1;
	};
	const {
		nextError
	} = await runController(GoalController.updateGoalAmount, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		},
		body: {
			amount: '100',
			operation: 'decrease'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(updateData, {
		currentAmount: '900.00',
		finishedAt: null
	});
});
/**
 * Testy closeGoal
 */
test('closeGoal odrzuca zamknięcie, gdy cel nie został osiągnięty', async () => {
	mockGoalModel.findGoalById = async () => createGoalFixture({
		targetAmount: 1000,
		currentAmount: 900
	});
	const {
		res,
		nextError
	} = await runController(GoalController.closeGoal, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		}
	});
	assert.equal(res.statusCode, null);
	assert.equal(nextError.statusCode, 400);
	assert.equal(nextError.message, MESSAGES.GOAL_TARGET_NOT_REACHED);
});
test('closeGoal zamyka zbiórkę osiągniętego celu', async () => {
	let updateData = null;
	mockGoalModel.findGoalById = async () => updateData ? createGoalFixture({
		currentAmount: 1000,
		finishedAt: updateData.finishedAt,
		isClosed: true
	}) : createGoalFixture({
		targetAmount: 1000,
		currentAmount: 1000,
		finishedAt: null
	});
	mockGoalModel.updateGoal = async (id, ownerId, goalData) => {
		updateData = goalData;
		return 1;
	};
	const {
		res,
		nextError
	} = await runController(GoalController.closeGoal, {
		user: {
			id: 7
		},
		params: {
			id: '1'
		}
	});
	assert.equal(nextError, null);
	assert.deepEqual(updateData, {
		isClosed: true,
		finishedAt: getTodayDateString()
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.GOAL_CLOSED);
});
