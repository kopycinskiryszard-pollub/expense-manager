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
 * Blokuje edycję budżetu z poprzednich miesięcy.
 * @param {object} budget - Budżet do sprawdzenia.
 * @returns {void} Nie zwraca wartości.
 */
function ensureBudgetEditable(budget) {
	if (isPastBudgetPeriod(budget.month, budget.year)) {
		throw new AppError(MESSAGES.BUDGET_PAST_LOCKED, 403);
	}
}

/**
 * Sprawdza, czy wskazany okres planowania jest dozwolony.
 * @param {number} month - Miesiąc budżetu.
 * @param {number} year - Rok budżetu.
 * @returns {void} Nie zwraca wartości.
 */
function ensurePlanningPeriodAllowed(month, year) {
	const periodErrors = validateBudgetPlanningPeriod(month, year);
	if (hasValidationErrors(periodErrors)) {
		throw new AppError(MESSAGES.VALIDATION_ERROR, 400, periodErrors);
	}
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
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
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
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		const budget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!budget) {
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		return success(res, 200, MESSAGES.BUDGET_FETCHED, addBudgetPermissions(budget));
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
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		const budgetData = normalizeBudgetData(req.body);
		ensurePlanningPeriodAllowed(budgetData.month, budgetData.year);
		const existingBudget = await BudgetModel.findBudgetByPeriod(req.user.id, budgetData.month, budgetData.year);
		if (existingBudget) {
			ensureBudgetEditable(existingBudget);
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
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		const validationErrors = validateBudgetData(req.body, true);
		if (hasValidationErrors(validationErrors)) {
			throw new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors);
		}
		const existingBudget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!existingBudget) {
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		ensureBudgetEditable(existingBudget);
		const budgetData = normalizeBudgetData(req.body);
		const targetMonth = Object.prototype.hasOwnProperty.call(budgetData, 'month') ? budgetData.month : existingBudget.month;
		const targetYear = Object.prototype.hasOwnProperty.call(budgetData, 'year') ? budgetData.year : existingBudget.year;
		ensurePlanningPeriodAllowed(targetMonth, targetYear);
		if (targetMonth !== existingBudget.month || targetYear !== existingBudget.year) {
			const conflictingBudget = await BudgetModel.findBudgetByPeriod(req.user.id, targetMonth, targetYear);
			if (conflictingBudget && conflictingBudget.id !== budgetId) {
				throw new AppError(MESSAGES.BUDGET_ALREADY_EXISTS, 409);
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
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		const existingBudget = await BudgetModel.findBudgetById(budgetId, req.user.id);
		if (!existingBudget) {
			throw new AppError(MESSAGES.BUDGET_NOT_FOUND, 404);
		}
		ensureBudgetEditable(existingBudget);
		await BudgetModel.deleteBudget(budgetId, req.user.id);
		return success(res, 200, MESSAGES.BUDGET_DELETED, null);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getBudgetForMonth,
	getBudget,
	createBudget,
	updateBudget,
	deleteBudget
};
