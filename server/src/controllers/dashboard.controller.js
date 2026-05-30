/**
 * Kontroler pulpitu: podsumowanie aktualnego i poprzedniego miesiaca.
 */
const DashboardModel = require('../models/dashboard.model');
const {success} = require('../utils/response');
const MESSAGES = require('../utils/messages');

const CATEGORY_TYPES = {
	income: 0,
	expense: 1
};

function getDashboardPeriods(referenceDate = new Date()) {
	const current = {
		month: referenceDate.getMonth() + 1,
		year: referenceDate.getFullYear()
	};
	const previousDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
	return {
		current,
		previous: {
			month: previousDate.getMonth() + 1,
			year: previousDate.getFullYear()
		}
	};
}

function buildEmptySummary(period) {
	return {
		... period,
		income: 0,
		expenses: 0,
		balance: 0,
		transactionsCount: 0
	};
}

function buildDashboardSummary(periods, rows) {
	const summaries = {
		current: buildEmptySummary(periods.current),
		previous: buildEmptySummary(periods.previous)
	};
	for (const row of rows) {
		const target = Object.values(summaries)
							 .find((summary) => summary.month === row.month && summary.year === row.year);
		if (!target) {
			continue;
		}
		if (row.type === CATEGORY_TYPES.income) {
			target.income = row.total;
		}
		if (row.type === CATEGORY_TYPES.expense) {
			target.expenses = row.total;
		}
		target.transactionsCount += row.count;
		target.balance = Number((target.income - target.expenses).toFixed(2));
	}
	return summaries;
}

async function getSummary(req, res, next) {
	try {
		const periods = getDashboardPeriods();
		const rows = await DashboardModel.getMonthlySummaries(req.user.id, [periods.current, periods.previous]);
		return success(res, 200, MESSAGES.DASHBOARD_FETCHED, buildDashboardSummary(periods, rows));
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getSummary,
	getDashboardPeriods,
	buildDashboardSummary
};
