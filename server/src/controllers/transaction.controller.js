/**
 * Kontroler transakcji: CRUD właściciela oraz historia z filtrami, sortowaniem i paginacją.
 */
const TransactionModel = require('../models/transaction.model');
const CategoryModel = require('../models/category.model');
const {success} = require('../utils/response');
const AppError = require('../utils/errors');
const MESSAGES = require('../utils/messages');
const {
	validateTransactionData,
	normalizeTransactionData,
	validateTransactionListQuery,
	normalizeTransactionListQuery
} = require('../utils/validators/transaction.validators');
const {
	hasValidationErrors
} = require('../utils/validators/general.validators');

/**
 * Zamienia parametr ścieżki id na dodatnią liczbę całkowitą.
 * @param {*} id - Identyfikator z parametrów trasy.
 * @returns {number|null} Identyfikator albo null.
 */
function parseTransactionId(id) {
	const transactionId = Number(id);
	return Number.isInteger(transactionId) && transactionId > 0 ? transactionId : null;
}

/**
 * Zwraca błąd, jeśli wskazana kategoria transakcji nie istnieje.
 * @param {number} categoryId - Identyfikator kategorii.
 * @returns {Promise<AppError|null>} Błąd braku kategorii albo null.
 */
async function getCategoryError(categoryId) {
	const category = await CategoryModel.findCategoryById(categoryId);
	if (!category) {
		return new AppError(MESSAGES.CATEGORY_NOT_FOUND, 404);
	}
	return null;
}

/**
 * Pobiera listę transakcji aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z filtrami w query.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z listą transakcji i paginacją.
 */
async function listTransactions(req, res, next) {
	try {
		const validationErrors = validateTransactionListQuery(req.query);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const {
			filters,
			pagination,
			sorting
		} = normalizeTransactionListQuery(req.query);
		const transactionsPromise = TransactionModel.findTransactions(req.user.id, filters, pagination, sorting);
		const totalPromise = TransactionModel.countTransactions(req.user.id, filters);
		const transactions = await transactionsPromise;
		const total = await totalPromise;
		return success(res, 200, MESSAGES.TRANSACTIONS_FETCHED, {
			transactions,
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
				total,
				pages: Math.ceil(total / pagination.limit)
			}
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Pobiera pojedynczą transakcję aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z id transakcji w parametrach.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z transakcją.
 */
async function getTransaction(req, res, next) {
	try {
		const transactionId = parseTransactionId(req.params.id);
		if (!transactionId) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		const transaction = await TransactionModel.findTransactionById(transactionId, req.user.id);
		if (!transaction) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		return success(res, 200, MESSAGES.TRANSACTION_FETCHED, transaction);
	} catch (err) {
		next(err);
	}
}

/**
 * Tworzy nową transakcję aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z danymi transakcji w body.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z utworzoną transakcją.
 */
async function createTransaction(req, res, next) {
	try {
		const validationErrors = validateTransactionData(req.body);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const transactionData = normalizeTransactionData(req.body);
		const categoryError = await getCategoryError(transactionData.categoryId);
		if (categoryError) {
			return next(categoryError);
		}
		const transactionId = await TransactionModel.createTransaction({
			... transactionData,
			description: Object.prototype.hasOwnProperty.call(transactionData, 'description') ? transactionData.description : null,
			ownerId: req.user.id
		});
		const transaction = await TransactionModel.findTransactionById(transactionId, req.user.id);
		return success(res, 201, MESSAGES.TRANSACTION_CREATED, transaction);
	} catch (err) {
		next(err);
	}
}

/**
 * Aktualizuje transakcję aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z id transakcji i danymi do zmiany.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON ze zaktualizowaną transakcją.
 */
async function updateTransaction(req, res, next) {
	try {
		const transactionId = parseTransactionId(req.params.id);
		if (!transactionId) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		const validationErrors = validateTransactionData(req.body, true);
		if (hasValidationErrors(validationErrors)) {
			return next(new AppError(MESSAGES.VALIDATION_ERROR, 400, validationErrors));
		}
		const existingTransaction = await TransactionModel.findTransactionById(transactionId, req.user.id);
		if (!existingTransaction) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		const transactionData = normalizeTransactionData(req.body);
		if (Object.prototype.hasOwnProperty.call(transactionData, 'categoryId')) {
			const categoryError = await getCategoryError(transactionData.categoryId);
			if (categoryError) {
				return next(categoryError);
			}
		}
		await TransactionModel.updateTransaction(transactionId, req.user.id, transactionData);
		const transaction = await TransactionModel.findTransactionById(transactionId, req.user.id);
		return success(res, 200, MESSAGES.TRANSACTION_UPDATED, transaction);
	} catch (err) {
		next(err);
	}
}

/**
 * Usuwa transakcję aktualnie zalogowanego użytkownika.
 * @param {object} req - Żądanie Express z id transakcji w parametrach.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z potwierdzeniem usunięcia.
 */
async function deleteTransaction(req, res, next) {
	try {
		const transactionId = parseTransactionId(req.params.id);
		if (!transactionId) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		const existingTransaction = await TransactionModel.findTransactionById(transactionId, req.user.id);
		if (!existingTransaction) {
			return next(new AppError(MESSAGES.TRANSACTION_NOT_FOUND, 404));
		}
		await TransactionModel.deleteTransaction(transactionId, req.user.id);
		return success(res, 200, MESSAGES.TRANSACTION_DELETED, null);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	listTransactions,
	getTransaction,
	createTransaction,
	updateTransaction,
	deleteTransaction
};
