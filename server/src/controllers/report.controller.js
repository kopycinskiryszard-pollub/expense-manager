/**
 * Kontroler raportów finansowych: raport miesięczny, roczny i szczegóły transakcji.
 */
const ReportModel = require('../models/report.model');
const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const CategoryModel = require('../models/category.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	normalizeMonthlyReportQuery,
	normalizeYearlyReportQuery,
	validateYearlyReportTransactionsQuery,
	normalizeYearlyReportTransactionsQuery
} = require('../utils/validators/report.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');
const CATEGORY_TYPES = {
	income: 0,
	expense: 1
};

/**
 * Sumuje kwoty pozycji raportu.
 * @param {Array<{total: number}>} items - Pozycje raportu.
 * @returns {number} Suma pozycji.
 */
function sumReportItems(items) {
	return Number(items.reduce((sum, item) => sum + Number(item.total || 0), 0)
					   .toFixed(2));
}

/**
 * Sumuje kwoty transakcji.
 * @param {Array<{amount: number}>} transactions - Lista transakcji.
 * @returns {number} Suma transakcji.
 */
function sumTransactions(transactions) {
	return Number(transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
							  .toFixed(2));
}

/**
 * Tworzy podsumowanie rocznego raportu dla jednego typu transakcji.
 * @param {string} view - Widok raportu.
 * @param {Array<object>} items - Pozycje raportu.
 * @returns {{view: string, total: number, monthlyAverage: number, items: Array<object>}} Sekcja raportu.
 */
function buildYearlySection(view, items) {
	const total = sumReportItems(items);
	return {
		view,
		total,
		monthlyAverage: Number((
			total / 12
		).toFixed(2)),
		items
	};
}

/**
 * Grupuje wydatki z miesiąca po kategoriach.
 * @param {Array<object>} transactions - Transakcje wydatkowe.
 * @returns {Array<object>} Kategorie z podsumowaniem i transakcjami.
 */
function groupMonthlyExpensesByCategory(transactions) {
	const categories = new Map();
	for (const transaction of transactions) {
		const categoryId = transaction.category.id;
		if (!categories.has(categoryId)) {
			categories.set(categoryId, {
				category: transaction.category,
				total: 0,
				count: 0,
				transactions: []
			});
		}
		const categorySummary = categories.get(categoryId);
		categorySummary.total =
			Number((
				categorySummary.total + Number(transaction.amount || 0)
			).toFixed(2));
		categorySummary.count += 1;
		categorySummary.transactions.push(transaction);
	}
	return [... categories.values()]
	.sort((first, second) => second.total - first.total || first.category.name.localeCompare(second.category.name));
}

/**
 * Buduje proste porównanie wydatków z budżetem miesięcznym.
 * @param {object|null} budget - Budżet miesiąca.
 * @param {number} spentAmount - Suma wydatków.
 * @returns {object} Porównanie budżetu.
 */
function buildBudgetComparison(budget, spentAmount) {
	if (!budget) {
		return {
			exists: false
		};
	}
	const difference = Number((
		Number(budget.limitAmount) - spentAmount
	).toFixed(2));
	return {
		exists: true,
		limitAmount: Number(budget.limitAmount),
		spentAmount,
		difference,
		status: difference >= 0 ? 'within_limit' : 'exceeded'
	};
}

/**
 * Pobiera miesięczny raport finansowy.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja obsługi błędów.
 * @returns {Promise<unknown>} Odpowiedź JSON z raportem.
 */
async function getMonthlyReport(req, res, next) {
	try {
		const {
			month,
			year
		} = normalizeMonthlyReportQuery(req.query);
		const ownerId = req.user.id;
		const incomeTransactionsPromise = TransactionModel.findReportTransactions(ownerId, {
			type: CATEGORY_TYPES.income,
			month,
			year
		}, {
			sortBy: 'date',
			order: 'asc'
		});
		const expenseTransactionsPromise = TransactionModel.findReportTransactions(ownerId, {
			type: CATEGORY_TYPES.expense,
			month,
			year
		}, {
			sortBy: 'amount',
			order: 'desc'
		});
		const budgetPromise = BudgetModel.findBudgetByPeriod(ownerId, month, year);
		const incomeTransactions = await incomeTransactionsPromise;
		const expenseTransactions = await expenseTransactionsPromise;
		const budget = await budgetPromise;
		const incomeTotal = sumTransactions(incomeTransactions);
		const expenseTotal = sumTransactions(expenseTransactions);
		const report = {
			month,
			year,
			income: {
				total: incomeTotal,
				transactions: incomeTransactions
			},
			expenses: {
				total: expenseTotal,
				categories: groupMonthlyExpensesByCategory(expenseTransactions)
			},
			budget: buildBudgetComparison(budget, expenseTotal),
			balance: Number((
				incomeTotal - expenseTotal
			).toFixed(2))
		};
		return success(res, 200, MESSAGES.REPORT_FETCHED, report);
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera sekcję raportu rocznego.
 * @param {number} ownerId - Identyfikator właściciela.
 * @param {number} type - Typ kategorii.
 * @param {number} year - Rok raportu.
 * @param {string} view - Widok raportu.
 * @returns {Promise<object>} Sekcja raportu.
 */
async function getYearlySection(ownerId, type, year, view) {
	const items = view === 'month' ? await ReportModel.getYearlyByMonth(ownerId, type, year) : await ReportModel.getYearlyByCategory(ownerId, type, year);
	return buildYearlySection(view, items);
}

/**
 * Pobiera roczny raport finansowy.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja obsługi błędów.
 * @returns {Promise<unknown>} Odpowiedź JSON z raportem.
 */
async function getYearlyReport(req, res, next) {
	try {
		const {
			year,
			incomeView,
			expenseView
		} = normalizeYearlyReportQuery(req.query);
		const ownerId = req.user.id;
		const incomePromise = getYearlySection(ownerId, CATEGORY_TYPES.income, year, incomeView);
		const expensesPromise = getYearlySection(ownerId, CATEGORY_TYPES.expense, year, expenseView);
		const income = await incomePromise;
		const expenses = await expensesPromise;
		return success(res, 200, MESSAGES.REPORT_FETCHED, {
			year,
			income,
			expenses,
			balance: Number((
				income.total - expenses.total
			).toFixed(2))
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera listę transakcji z wybranej kategorii albo miesiąca raportu rocznego.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja obsługi błędów.
 * @returns {Promise<unknown>} Odpowiedź JSON z listą transakcji.
 */
async function getYearlyReportTransactions(req, res, next) {
	try {
		const validationErrors = validateYearlyReportTransactionsQuery(req.query);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const filters = normalizeYearlyReportTransactionsQuery(req.query);
		if (filters.categoryId) {
			const category = await CategoryModel.findCategoryById(filters.categoryId);
			if (!category || category.type !== CATEGORY_TYPES[filters.type]) {
				return next(new AppError(MESSAGES.CATEGORY_NOT_FOUND, 404));
			}
		}
		const transactions = await TransactionModel.findReportTransactions(req.user.id, {
			year: filters.year,
			month: filters.month,
			categoryId: filters.categoryId,
			type: CATEGORY_TYPES[filters.type]
		}, {
			sortBy: 'amount',
			order: 'desc'
		});
		return success(res, 200, MESSAGES.TRANSACTIONS_FETCHED, {
			year: filters.year,
			type: filters.type,
			categoryId: filters.categoryId,
			month: filters.month,
			transactions
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getMonthlyReport,
	getYearlyReport,
	getYearlyReportTransactions
};
