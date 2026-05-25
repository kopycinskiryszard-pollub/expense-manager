/**
 * Kontroler kategorii transakcji: udostępnia listę kategorii wspólnych dla wszystkich użytkowników.
 */
const CategoryModel = require('../models/category.model');
const {success} = require('../utils/response');
const MESSAGES = require('../utils/messages');

/**
 * Zamienia parametr query type na wartość zapisywaną w bazie danych.
 * Niepoprawny typ jest traktowany jak brak filtra.
 * @param {*} type - Wartość parametru query type.
 * @returns {number|null} Typ kategorii: 0 dla dochodu, 1 dla wydatku albo null dla wszystkich.
 */
function parseCategoryType(type) {
	if (type === undefined || type === null || type === '') {
		return null;
	}
	const normalizedType = String(type)
	.trim()
	.toLowerCase();
	if (normalizedType === '0' || normalizedType === 'income') {
		return 0;
	}
	if (normalizedType === '1' || normalizedType === 'expense') {
		return 1;
	}
	return null;
}

/**
 * Zwraca listę kategorii transakcji z opcjonalnym filtrowaniem po typie.
 * @param {object} req - Żądanie Express z opcjonalnym parametrem query type.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja przekazująca błędy do middleware.
 * @returns {Promise<unknown>} Odpowiedź JSON z listą kategorii.
 */
async function getCategories(req, res, next) {
	try {
		const type = parseCategoryType(req.query.type);
		const categories = await CategoryModel.findCategories(type);
		return success(res, 200, MESSAGES.CATEGORIES_FETCHED, {
			categories
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getCategories
};
