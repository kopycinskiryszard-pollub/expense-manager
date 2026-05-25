/**
 * Kontroler budzetow: pobieranie i planowanie miesiecznych limitow wlasciciela.
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
 * Zamienia parametr id na dodatnia liczbe calkowita.
 * @param {*} id - Identyfikator z parametrow trasy.
 * @returns {number|null} Identyfikator albo null.
 */
function parseBudgetId(id) {
	const budgetId = Number(id);
	return Number.isInteger(budgetId) && budgetId > 0 ? budgetId : null;
}

/**
 * Dodaje do budzetu informacje, czy mozna go edytowac.
 * @param {object} budget - Budzet z modelu.
 * @returns {object} Budzet z flaga edycji.
 */
function addBudgetPermissions(budget) {
	return {
		... budget,
		isEditable: !isPastBudgetPeriod(budget.month, budget.year)
	};
}

/**
 * Blokuje edycje budzetu z poprzednich miesiecy.
 * @param {object} budget - Budzet do sprawdzenia.
 * @returns {void} Nie zwraca wartosci.
 */
function ensureBudgetEditable(budget) {
	if (isPastBudgetPeriod(budget.month, budget.year)) {
		throw new AppError(MESSAGES.BUDGET_PAST_LOCKED, 403);
	}
}

/**
 * Sprawdza, czy wskazany okres planowania jest dozwolony.
 * @param {number} month - Miesiac budzetu.
 * @param {number} year - Rok budzetu.
 * @returns {void} Nie zwraca wartosci.
 */
function ensurePlanningPeriodAllowed(month, year) {
	const periodErrors = validateBudgetPlanningPeriod(month, year);
	if (hasValidationErrors(periodErrors)) {
		throw new AppError(MESSAGES.VALIDATION_ERROR, 400, periodErrors);
	}
}

/**
 * Pobiera budzet dla miesiaca i roku z query. Niepoprawne filtry oznaczaja biezacy miesiac.
 * @param {object} req - Zadanie Express z filtrami month i year.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON z budzetem.
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
 * Pobiera pojedynczy budzet wlasciciela po identyfikatorze.
 * @param {object} req - Zadanie Express z id budzetu.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON z budzetem.
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
 * Tworzy budzet miesieczny albo aktualizuje limit, jesli budzet dla okresu juz istnieje.
 * @param {object} req - Zadanie Express z danymi budzetu.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON z utworzonym albo zaktualizowanym budzetem.
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
 * Aktualizuje budzet wlasciciela. Przeszle budzety sa tylko do odczytu.
 * @param {object} req - Zadanie Express z id budzetu i danymi do zmiany.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON ze zaktualizowanym budzetem.
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
 * Usuwa budzet wlasciciela. Przeszle budzety sa chronione przed zmianami.
 * @param {object} req - Zadanie Express z id budzetu.
 * @param {object} res - Odpowiedz Express.
 * @param {Function} next - Funkcja przekazujaca bledy do middleware.
 * @returns {Promise<unknown>} Odpowiedz JSON z potwierdzeniem usuniecia.
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
