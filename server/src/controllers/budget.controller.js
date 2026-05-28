/**
 * Kontroler budżetów: pobieranie i planowanie miesięcznych limitów właściciela.
 */
const BudgetModel = require('../models/budget.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	isPastBudgetPeriod,
	validateBudgetData,
	validateBudgetPlanningPeriod,
	normalizeBudgetData,
	normalizeBudgetQuery
} = require('../utils/validators/budget.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');

/**
 * Zamienia parametr id na liczbę całkowitą dodatnią.
 * @param {*} id - Identyfikator z parametrów trasy.
 * @returns {number|null} Identyfikator albo null.
 */
function parseBudgetId(id) {
	const budgetId = Number(id);
	return Number.isInteger(budgetId) && budgetId > 0 ? budgetId : null;
}

/**
 * Dodaje do budżetu informację, czy można go edytować.
 * @param {object} budget - Budżet z modelu.
 * @returns {object} Budżet z flagą edycji.
 */
function addBudgetPermissions(budget) {
	return {
		... budget,
		isEditable: !isPastBudgetPeriod(budget.month, budget.year)
	};
}

/**
 * Dodaje do statusu budżetu informację, czy można go edytować.
 * @param {object} budgetStatus - Budżet ze statusem.
 * @returns {object} Status budżetu z flagą edycji.
 */
function addBudgetStatusPermissions(budgetStatus) {
	return {
		... budgetStatus,
		isEditable: !isPastBudgetPeriod(budgetStatus.month, budgetStatus.year)
	};
}

/**
 * Zwraca błąd, jeśli budżet nie może być edytowany.
 * @param {object} budget - Budżet do sprawdzenia.
 * @returns {AppError|null} Błąd blokady edycji albo null.
 */
function getBudgetEditableError(budget) {
	if (isPastBudgetPeriod(budget.month, budget.year)) {
		return new AppError(MESSAGES.BUDGET_PAST_LOCKED, 403);
	}
	return null;
}

/**
 * Zwraca błąd, jeśli wskazany okres planowania nie jest dozwolony.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @returns {AppError|null} Błąd walidacji okresu albo null.
 */
function getPlanningPeriodError(month, year) {
	const periodErrors = validateBudgetPlanningPeriod(month, year);
	if (hasValidationErrors(periodErrors)) {
		return new AppError(MESSAGES.VALIDATION_ERROR, 400, periodErrors);
	}
	return null;
}

/**
 * Pobiera budżet dla miesiąca i roku z query. Niepoprawne filtry oznaczają bieżący miesiąc.
 * @param {object} req - Żądanie Express z filtrami month i year.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z budżetem.
 */
async function getBudgetForMonth(req, res, next) {
	try {
		const period = normalizeBudgetQuery(req.query);
		const budget = await BudgetModel.findBudgetByPeriod(req.user.id, period.month, period.year);
		if (!budget) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		return success(res, 200, MESSAGES.BUDGET_FETCHED, addBudgetPermissions(budget));
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera pojedynczy budżet właściciela po identyfikatorze.
 * @param {object} req - Żądanie Express z id budżetu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z budżetem.
 */
async function getBudget(req, res, next) {
	try {
		const budgetId = parseBudgetId(req.params.id);
		if (!budgetId) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		const budget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!budget) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		return success(res, 200, MESSAGES.BUDGET_FETCHED, addBudgetPermissions(budget));
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera listę budżetów właściciela ze statusami wykorzystania.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z listą budżetów.
 */
async function listBudgets(req, res, next) {
	try {
		const budgets = await BudgetModel.findBudgetsWithStatuses(req.user.id);
		return success(res, 200, MESSAGES.BUDGETS_FETCHED, {
			budgets: budgets.map(addBudgetStatusPermissions)
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Tworzy budżet miesięczny albo aktualizuje limit, jeśli budżet dla okresu już istnieje.
 * @param {object} req - Żądanie Express z danymi budżetu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z utworzonym albo zaktualizowanym budżetem.
 */
async function createBudget(req, res, next) {
	try {
		const validationErrors = validateBudgetData(req.body);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const budgetData = normalizeBudgetData(req.body);
		const planningPeriodError = getPlanningPeriodError(budgetData.month, budgetData.year);
		if (planningPeriodError) {
			return next(planningPeriodError);
		}
		const existingBudget = await BudgetModel.findBudgetByPeriod(req.user.id, budgetData.month, budgetData.year);
		if (existingBudget) {
			const budgetEditableError = getBudgetEditableError(existingBudget);
			if (budgetEditableError) {
				return next(budgetEditableError);
			}
			await BudgetModel.updateBudget(existingBudget.id, req.user.id, {
				limitAmount: budgetData.limitAmount
			});
			const budget = await BudgetModel.findBudgetById(existingBudget.id, req.user.id);
			return success(res, 200, MESSAGES.BUDGET_UPDATED, addBudgetPermissions(budget));
		}
		const budgetId = await BudgetModel.createBudget({
			... budgetData,
			ownerId: req.user.id
		});
		const budget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		return success(res, 201, MESSAGES.BUDGET_CREATED, addBudgetPermissions(budget));
	} catch (err) {
		next(err);
	}
}

/**
 * Aktualizuje budżet właściciela. Przeszłe budżety są tylko do odczytu.
 * @param {object} req - Żądanie Express z id budżetu i danymi do zmiany.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON ze zaktualizowanym budżetem.
 */
async function updateBudget(req, res, next) {
	try {
		const budgetId = parseBudgetId(req.params.id);
		if (!budgetId) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		const validationErrors = validateBudgetData(req.body, true);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const existingBudget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!existingBudget) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		const budgetEditableError = getBudgetEditableError(existingBudget);
		if (budgetEditableError) {
			return next(budgetEditableError);
		}
		const budgetData = normalizeBudgetData(req.body);
		const targetMonth = Object.prototype.hasOwnProperty.call(budgetData, 'month') ? budgetData.month : existingBudget.month;
		const targetYear = Object.prototype.hasOwnProperty.call(budgetData, 'year') ? budgetData.year : existingBudget.year;
		const planningPeriodError = getPlanningPeriodError(targetMonth, targetYear);
		if (planningPeriodError) {
			return next(planningPeriodError);
		}
		if (targetMonth !== existingBudget.month || targetYear !== existingBudget.year) {
			const conflictingBudget = await BudgetModel.findBudgetByPeriod(req.user.id, targetMonth, targetYear);
			if (conflictingBudget && conflictingBudget.id !== budgetId) {
				return next(new AppError(MESSAGES.BUDGET_ALREADY_EXISTS, 409));
			}
		}
		await BudgetModel.updateBudget(budgetId, req.user.id, budgetData);
		const budget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		return success(res, 200, MESSAGES.BUDGET_UPDATED, addBudgetPermissions(budget));
	} catch (err) {
		next(err);
	}
}

/**
 * Usuwa budżet właściciela. Przeszłe budżety są chronione przed zmianami.
 * @param {object} req - Żądanie Express z id budżetu.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z potwierdzeniem usunięcia.
 */
async function deleteBudget(req, res, next) {
	try {
		const budgetId = parseBudgetId(req.params.id);
		if (!budgetId) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		const existingBudget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!existingBudget) {
			return next(new AppError(MESSAGES.BUDGET_NOT_FOUND, 404));
		}
		const budgetEditableError = getBudgetEditableError(existingBudget);
		if (budgetEditableError) {
			return next(budgetEditableError);
		}
		await BudgetModel.deleteBudget(budgetId, req.user.id);
		return success(res, 200, MESSAGES.BUDGET_DELETED, null);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getBudgetForMonth,
	getBudget,
	listBudgets,
	createBudget,
	updateBudget,
	deleteBudget
};
