/**
 * Testy jednostkowe kontrolera kategorii transakcji z mockowanym modelem kategorii.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');
const mockCategoryModel = {};
const categoryModelPath = require.resolve('../server/src/models/category.model');
const categoryModelMock = new Module(categoryModelPath);
categoryModelMock.filename = categoryModelPath;
categoryModelMock.loaded = true;
categoryModelMock.exports = mockCategoryModel;
require.cache[categoryModelPath] = categoryModelMock;
const CategoryController = require('../server/src/controllers/category.controller');

/**
 * Czyści: funkcje przypisane do mocka modelu kategorii po każdym teście.
 * @returns {void} Nie zwraca wartości.
 */
function resetMocks() {
	for (const key of Object.keys(mockCategoryModel)) {
		delete mockCategoryModel[key];
	}
}

/**
 * Tworzy uproszczony mock odpowiedzi Express z metodami status i json.
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
 * Uruchamia kontroler kategorii i przechwytuje odpowiedź oraz błąd przekazany do next.
 * @param {object} req - Mock żądania Express.
 * @returns {Promise<{res: object, nextError: Error|null}>} Wynik działania kontrolera.
 */
async function runGetCategories(req) {
	const res = createResponse();
	let nextError = null;
	await CategoryController.getCategories(req, res, (err) => {
		nextError = err;
	});
	return {
		res,
		nextError
	};
}

test.afterEach(() => {
	resetMocks();
});
/**
 * Testy getCategories
 */
test('getCategories zwraca wszystkie kategorie bez filtra typu', async () => {
	let receivedType = 'not-called';
	const categories = [{
		id: 1,
		code: 'salary',
		name: 'Wynagrodzenie',
		description: 'Dochód z pracy.',
		type: 0
	}];
	mockCategoryModel.findCategories = async (type) => {
		receivedType = type;
		return categories;
	};
	const {
		res,
		nextError
	} = await runGetCategories({
		query: {}
	});
	assert.equal(nextError, null);
	assert.equal(receivedType, null);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.CATEGORIES_FETCHED,
		data: {
			categories
		}
	});
});
test('getCategories zamienia typ income na 0 i pobiera kategorie dochodów', async () => {
	let receivedType = null;
	mockCategoryModel.findCategories = async (type) => {
		receivedType = type;
		return [];
	};
	const {
		res,
		nextError
	} = await runGetCategories({
		query: {
			type: 'income'
		}
	});
	assert.equal(nextError, null);
	assert.equal(receivedType, 0);
	assert.equal(res.statusCode, 200);
});
test('getCategories zamienia typ 1 na kategorie wydatków', async () => {
	let receivedType = null;
	mockCategoryModel.findCategories = async (type) => {
		receivedType = type;
		return [];
	};
	const {
		res,
		nextError
	} = await runGetCategories({
		query: {
			type: '1'
		}
	});
	assert.equal(nextError, null);
	assert.equal(receivedType, 1);
	assert.equal(res.statusCode, 200);
});
test('getCategories traktuje niepoprawny typ kategorii jak brak filtra', async () => {
	let receivedType = 'not-called';
	const categories = [{
		id: 2,
		code: 'food',
		name: 'Jedzenie',
		description: 'Zakupy spożywcze.',
		type: 1
	}];
	mockCategoryModel.findCategories = async (type) => {
		receivedType = type;
		return categories;
	};
	const {
		res,
		nextError
	} = await runGetCategories({
		query: {
			type: 'exp'
		}
	});
	assert.equal(nextError, null);
	assert.equal(receivedType, null);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		success: true,
		message: MESSAGES.CATEGORIES_FETCHED,
		data: {
			categories
		}
	});
});
