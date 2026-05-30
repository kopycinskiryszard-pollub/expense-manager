/**
 * Testy jednostkowe kontrolera pulpitu z mockowanym modelem.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const MESSAGES = require('../server/src/utils/messages');

const mockDashboardModel = {};
const dashboardModelPath = require.resolve('../server/src/models/dashboard.model');
const dashboardModelMock = new Module(dashboardModelPath);
dashboardModelMock.filename = dashboardModelPath;
dashboardModelMock.loaded = true;
dashboardModelMock.exports = mockDashboardModel;
require.cache[dashboardModelPath] = dashboardModelMock;

const DashboardController = require('../server/src/controllers/dashboard.controller');

function resetMocks() {
	for (const key of Object.keys(mockDashboardModel)) {
		delete mockDashboardModel[key];
	}
}

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

test.afterEach(() => {
	resetMocks();
});

test('buildDashboardSummary zwraca dochody, wydatki i saldo dla obu miesiecy', () => {
	const summary = DashboardController.buildDashboardSummary({
		current: {
			month: 5,
			year: 2026
		},
		previous: {
			month: 4,
			year: 2026
		}
	}, [
		{
			month: 5,
			year: 2026,
			type: 0,
			total: 3000,
			count: 1
		},
		{
			month: 5,
			year: 2026,
			type: 1,
			total: 1200,
			count: 3
		},
		{
			month: 4,
			year: 2026,
			type: 1,
			total: 700,
			count: 2
		}
	]);
	assert.deepEqual(summary.current, {
		month: 5,
		year: 2026,
		income: 3000,
		expenses: 1200,
		balance: 1800,
		transactionsCount: 4
	});
	assert.deepEqual(summary.previous, {
		month: 4,
		year: 2026,
		income: 0,
		expenses: 700,
		balance: -700,
		transactionsCount: 2
	});
});

test('getSummary pobiera podsumowanie pulpitu dla zalogowanego uzytkownika', async () => {
	mockDashboardModel.getMonthlySummaries = async (ownerId, periods) => {
		assert.equal(ownerId, 7);
		assert.equal(periods.length, 2);
		return [];
	};
	const {
		res,
		nextError
	} = await runController(DashboardController.getSummary, {
		user: {
			id: 7
		}
	});
	assert.equal(nextError, null);
	assert.equal(res.statusCode, 200);
	assert.equal(res.body.message, MESSAGES.DASHBOARD_FETCHED);
	assert.ok(res.body.data.current);
	assert.ok(res.body.data.previous);
});
