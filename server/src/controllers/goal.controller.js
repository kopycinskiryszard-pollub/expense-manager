/**
 * Kontroler celów oszczędnościowych: listy, historia, CRUD, zmiana kwoty i zamykanie zbiórek.
 */
const GoalModel = require('../models/goal.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateGoalCreateData,
	validateGoalDetailsData,
	validateGoalAmountChangeData,
	normalizeGoalCreateData,
	normalizeGoalDetailsData,
	normalizeGoalAmountChangeData,
	normalizeGoalListQuery
} = require('../utils/validators/goal.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');

/**
 * Zamienia parametr id na dodatnią liczbę całkowitą.
 * @param {*} id - Identyfikator z parametrów trasy.
 * @returns {number|null} Identyfikator albo null.
 */
function parseGoalId(id) {
	const goalId = Number(id);
	return Number.isInteger(goalId) && goalId > 0 ? goalId : null;
}

/**
 * Zwraca bieżącą datę w formacie YYYY-MM-DD.
 * @returns {string} Dzisiejsza data.
 */
function getTodayDateString() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1)
	.padStart(2, '0');
	const day = String(today.getDate())
	.padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Wylicza datę ukończenia na podstawie aktualnej i docelowej kwoty.
 * @param {number} currentAmount - Aktualnie zebrana kwota.
 * @param {number} targetAmount - Kwota docelowa.
 * @param {string|null} existingFinishedAt - Dotychczasowa data ukończenia.
 * @returns {string|null} Data ukończenia albo null.
 */
function resolveFinishedAt(currentAmount, targetAmount, existingFinishedAt = null) {
	if (currentAmount >= targetAmount) {
		return existingFinishedAt || getTodayDateString();
	}
	return null;
}

/**
 * Zwraca cel właściciela.
 * @param {number} goalId - Identyfikator celu.
 * @param {number} ownerId - Identyfikator właściciela.
 * @returns {Promise<object|null>} Cel właściciela albo null.
 */
async function findExistingGoal(goalId, ownerId) {
	return GoalModel.findGoalById(goalId, ownerId);
}

/**
 * Zwraca błąd, jeśli zbiórka jest zamknięta.
 * @param {object} goal - Cel do sprawdzenia.
 * @returns {AppError|null} Błąd blokady albo null.
 */
function getGoalOpenError(goal) {
	if (goal.isClosed) {
		return new AppError(MESSAGES.GOAL_CLOSED_LOCKED, 403);
	}
	return null;
}

/**
 * Waliduje dane żądania, pobiera cel i sprawdza, czy zbiórka jest otwarta.
 * @param {object} req - Żądanie Express z danymi body.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @param {Function} validateData - Walidator danych body.
 * @param {number} goalId - Identyfikator celu.
 * @returns {Promise<object|null>} Cel gotowy do modyfikacji albo null, jeśli błąd trafił do next.
 */
async function getEditableGoalFromRequest(req, next, validateData, goalId) {
	const validationErrors = validateData(req.body);
	if (hasValidationErrors(validationErrors)) {
		next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		return null;
	}
	const existingGoal = await findExistingGoal(goalId, req.user.id);
	if (!existingGoal) {
		next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		return null;
	}
	const goalOpenError = getGoalOpenError(existingGoal);
	if (goalOpenError) {
		next(goalOpenError);
		return null;
	}
	return existingGoal;
}

/**
 * Buduje dane paginacji zwracane przez API.
 * @param {{page: number, limit: number}} pagination - Parametry paginacji.
 * @param {number} total - Liczba rekordów.
 * @returns {{page: number, limit: number, total: number, pages: number}} Dane paginacji.
 */
function buildPaginationResponse(pagination, total) {
	return {
		page: pagination.page,
		limit: pagination.limit,
		total,
		pages: Math.ceil(total / pagination.limit)
	};
}

/**
 * Pobiera aktywne, niezrealizowane cele użytkownika.
 * @param {object} req - Żądanie Express z filtrami w query.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z listą celów.
 */
async function listGoals(req, res, next) {
	try {
		const {
			filters,
			pagination
		} = normalizeGoalListQuery(req.query);
		const goalsPromise = GoalModel.findGoals(req.user.id, filters, pagination);
		const totalPromise = GoalModel.countGoals(req.user.id, filters);
		const goals = await goalsPromise;
		const total = await totalPromise;
		return success(res, 200, MESSAGES.GOALS_FETCHED, {
			goals,
			pagination: buildPaginationResponse(pagination, total)
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera historię zrealizowanych celów użytkownika.
 * @param {object} req - Żądanie Express z filtrami w query.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z historią celów.
 */
async function listGoalHistory(req, res, next) {
	try {
		const {
			filters,
			pagination
		} = normalizeGoalListQuery(req.query);
		const goalsPromise = GoalModel.findGoalHistory(req.user.id, filters, pagination);
		const totalPromise = GoalModel.countGoalHistory(req.user.id, filters);
		const goals = await goalsPromise;
		const total = await totalPromise;
		return success(res, 200, MESSAGES.GOALS_FETCHED, {
			goals,
			pagination: buildPaginationResponse(pagination, total)
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera pojedynczy cel użytkownika.
 * @param {object} req - Żądanie Express z id celu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z celem.
 */
async function getGoal(req, res, next) {
	try {
		const goalId = parseGoalId(req.params.id);
		if (!goalId) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const goal = await findExistingGoal(goalId, req.user.id);
		if (!goal) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		return success(res, 200, MESSAGES.GOAL_FETCHED, goal);
	} catch (err) {
		next(err);
	}
}

/**
 * Tworzy nowy cel użytkownika.
 * @param {object} req - Żądanie Express z danymi celu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z utworzonym celem.
 */
async function createGoal(req, res, next) {
	try {
		const validationErrors = validateGoalCreateData(req.body);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const goalData = normalizeGoalCreateData(req.body);
		const finishedAt = resolveFinishedAt(Number(goalData.currentAmount), Number(goalData.targetAmount));
		const goalId = await GoalModel.createGoal({
			... goalData,
			finishedAt,
			isClosed: false,
			ownerId: req.user.id
		});
		const goal = await GoalModel.findGoalById(goalId, req.user.id);
		return success(res, 201, MESSAGES.GOAL_CREATED, goal);
	} catch (err) {
		next(err);
	}
}

/**
 * Aktualizuje dane celu bez zmiany zebranej kwoty.
 * @param {object} req - Żądanie Express z id celu i danymi do zmiany.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON ze zaktualizowanym celem.
 */
async function updateGoal(req, res, next) {
	try {
		const goalId = parseGoalId(req.params.id);
		if (!goalId) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const existingGoal = await getEditableGoalFromRequest(req, next, validateGoalDetailsData, goalId);
		if (!existingGoal) {
			return null;
		}
		const goalData = normalizeGoalDetailsData(req.body);
		const targetAmount = Object.prototype.hasOwnProperty.call(goalData, 'targetAmount') ? Number(goalData.targetAmount) : existingGoal.targetAmount;
		if (Object.prototype.hasOwnProperty.call(goalData, 'deadline') && (
			existingGoal.finishedAt || existingGoal.currentAmount >= targetAmount
		)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, {
				deadline: 'Termin celu można zmienić tylko przed osiągnięciem celu.'
			}));
		}
		goalData.finishedAt = resolveFinishedAt(existingGoal.currentAmount, targetAmount, existingGoal.finishedAt);
		await GoalModel.updateGoal(goalId, req.user.id, goalData);
		const goal = await GoalModel.findGoalById(goalId, req.user.id);
		return success(res, 200, MESSAGES.GOAL_UPDATED, goal);
	} catch (err) {
		next(err);
	}
}

/**
 * Zwiększa albo zmniejsza zebraną kwotę celu.
 * @param {object} req - Żądanie Express z id celu i zmianą kwoty.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON ze zaktualizowanym celem.
 */
async function updateGoalAmount(req, res, next) {
	try {
		const goalId = parseGoalId(req.params.id);
		if (!goalId) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const existingGoal = await getEditableGoalFromRequest(req, next, validateGoalAmountChangeData, goalId);
		if (!existingGoal) {
			return null;
		}
		const amountData = normalizeGoalAmountChangeData(req.body);
		const nextAmount = amountData.operation === 'increase' ? existingGoal.currentAmount + amountData.amount : existingGoal.currentAmount
																												  - amountData.amount;
		if (nextAmount < 0) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, {
				currentAmount: 'Zebrana kwota nie może spaść poniżej zera.'
			}));
		}
		await GoalModel.updateGoal(goalId, req.user.id, {
			currentAmount: nextAmount.toFixed(2),
			finishedAt: resolveFinishedAt(nextAmount, existingGoal.targetAmount, existingGoal.finishedAt)
		});
		const goal = await GoalModel.findGoalById(goalId, req.user.id);
		return success(res, 200, MESSAGES.GOAL_AMOUNT_UPDATED, goal);
	} catch (err) {
		next(err);
	}
}

/**
 * Zamyka zbiórkę celu, jeśli cel został osiągnięty.
 * @param {object} req - Żądanie Express z id celu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z zamkniętym celem.
 */
async function closeGoal(req, res, next) {
	try {
		const goalId = parseGoalId(req.params.id);
		if (!goalId) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const existingGoal = await findExistingGoal(goalId, req.user.id);
		if (!existingGoal) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		if (existingGoal.isClosed) {
			return success(res, 200, MESSAGES.GOAL_CLOSED, existingGoal);
		}
		if (existingGoal.currentAmount < existingGoal.targetAmount) {
			return next(new AppError(MESSAGES.GOAL_TARGET_NOT_REACHED, 400));
		}
		await GoalModel.updateGoal(goalId, req.user.id, {
			isClosed: true,
			finishedAt: existingGoal.finishedAt || getTodayDateString()
		});
		const goal = await GoalModel.findGoalById(goalId, req.user.id);
		return success(res, 200, MESSAGES.GOAL_CLOSED, goal);
	} catch (err) {
		next(err);
	}
}

/**
 * Usuwa cel użytkownika, jeśli zbiórka nie jest zamknięta.
 * @param {object} req - Żądanie Express z id celu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z potwierdzeniem usunięcia.
 */
async function deleteGoal(req, res, next) {
	try {
		const goalId = parseGoalId(req.params.id);
		if (!goalId) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const existingGoal = await findExistingGoal(goalId, req.user.id);
		if (!existingGoal) {
			return next(new AppError(MESSAGES.GOAL_NOT_FOUND, 404));
		}
		const goalOpenError = getGoalOpenError(existingGoal);
		if (goalOpenError) {
			return next(goalOpenError);
		}
		await GoalModel.deleteGoal(goalId, req.user.id);
		return success(res, 200, MESSAGES.GOAL_DELETED, null);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	listGoals,
	listGoalHistory,
	getGoal,
	createGoal,
	updateGoal,
	updateGoalAmount,
	closeGoal,
	deleteGoal
};
