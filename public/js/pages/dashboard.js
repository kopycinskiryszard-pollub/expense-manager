import {getDashboardSummary} from '../api/dashboard.api.js';
import {formatAmount} from './form-utils.js';

function getPeriodLabel(summary) {
	return `${summary.month}.${summary.year}`;
}

function renderSummary(container, summary) {
	container.querySelector('[data-dashboard-value="income"]').textContent = formatAmount(summary.income);
	container.querySelector('[data-dashboard-value="expenses"]').textContent = formatAmount(summary.expenses);
	container.querySelector('[data-dashboard-value="balance"]').textContent = formatAmount(summary.balance);
	container.querySelector('[data-dashboard-value="transactionsCount"]').textContent = String(summary.transactionsCount || 0);
	const title = container.closest('.dashboard-period')
						   ?.querySelector('h2');
	if (title) {
		title.textContent = `${title.textContent.split(' - ')[0]} - ${getPeriodLabel(summary)}`;
	}
}

async function init(context) {
	try {
		const response = await getDashboardSummary();
		renderSummary(document.querySelector('#currentMonthSummary'), response.data.current);
		renderSummary(document.querySelector('#previousMonthSummary'), response.data.previous);
	} catch (error) {
		context.showToast(error.message);
	}
}

export {
	init
};
