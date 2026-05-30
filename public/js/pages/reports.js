import {getMonthlyReport, getYearlyReport, getYearlyReportTransactions} from '../api/reports.api.js';
import {validateMonthlyReportFilters, validateYearlyReportFilters} from '../validators/report.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';
import {formatAmount} from './form-utils.js';

const MONTH_NAMES = [
	'styczeń',
	'luty',
	'marzec',
	'kwiecień',
	'maj',
	'czerwiec',
	'lipiec',
	'sierpień',
	'wrzesień',
	'październik',
	'listopad',
	'grudzień'
];

const state = {
	monthlyReport: null,
	yearlyReport: null
};

function getCurrentPeriod() {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear()
	};
}

function limitToDigits(input, length = 4) {
	input.addEventListener('input', (event) => {
		event.currentTarget.value = String(event.currentTarget.value || '')
		.replace(/\D/g, '')
		.slice(0, length);
	});
}

function populateMonthSelect(select) {
	for (let month = 1; month <= 12; month += 1) {
		const option = document.createElement('option');
		option.value = String(month);
		option.textContent = String(month);
		select.append(option);
	}
}

function getFormData(form) {
	return Object.fromEntries(new FormData(form).entries());
}

function setEmpty(tableBody, colspan, message) {
	tableBody.innerHTML = `<tr><td colspan="${colspan}">${message}</td></tr>`;
}

function renderSummary(container, items) {
	container.replaceChildren();
	items.forEach((item) => {
		const element = document.createElement('div');
		element.className = 'report-summary-item';
		const label = document.createElement('span');
		const value = document.createElement('strong');
		label.textContent = item.label;
		value.textContent = item.value;
		element.append(label, value);
		container.append(element);
	});
}

function renderTransactionRows(tableBody, transactions, emptyMessage) {
	if (!transactions.length) {
		setEmpty(tableBody, 4, emptyMessage);
		return;
	}
	tableBody.replaceChildren();
	transactions.forEach((transaction) => {
		const row = document.createElement('tr');
		[
			transaction.date,
			transaction.name,
			transaction.category?.name || 'Brak kategorii',
			formatAmount(transaction.amount)
		].forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
}

function renderMonthlyExpenseRows(categories) {
	const tableBody = document.querySelector('#monthlyExpensesBody');
	if (!categories.length) {
		setEmpty(tableBody, 3, 'Brak wydatków w tym miesiącu.');
		return;
	}
	tableBody.replaceChildren();
	categories.forEach((categorySummary) => {
		const row = document.createElement('tr');
		row.className = 'clickable-row';
		row.title = 'Pokaż transakcje kategorii.';
		row.addEventListener('click', () => renderMonthlyDetails(categorySummary));
		[
			categorySummary.category?.name || 'Brak kategorii',
			categorySummary.count,
			formatAmount(categorySummary.total)
		].forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
}

function renderMonthlyDetails(categorySummary) {
	const categoryName = categorySummary.category?.name || 'Brak kategorii';
	document.querySelector('#monthlyDetailsTitle').textContent = `Szczegóły kategorii: ${categoryName}`;
	renderTransactionRows(document.querySelector('#monthlyDetailsBody'), categorySummary.transactions || [], 'Brak transakcji.');
}

function getBudgetLabel(budget) {
	if (!budget?.exists) {
		return 'Brak budżetu';
	}
	return budget.status === 'within_limit' ? 'W limicie' : 'Przekroczony';
}

function renderMonthlyReport(report) {
	state.monthlyReport = report;
	document.querySelector('#monthlyReportTitle').textContent = `Raport miesięczny: ${report.month}.${report.year}`;
	renderSummary(document.querySelector('#monthlyReportSummary'), [
		{
			label: 'Dochody',
			value: formatAmount(report.income.total)
		},
		{
			label: 'Wydatki',
			value: formatAmount(report.expenses.total)
		},
		{
			label: 'Saldo',
			value: formatAmount(report.balance)
		},
		{
			label: 'Budżet',
			value: report.budget?.exists ? `${getBudgetLabel(report.budget)} (${formatAmount(report.budget.difference)})` : getBudgetLabel(report.budget)
		}
	]);
	renderTransactionRows(document.querySelector('#monthlyIncomeBody'), report.income.transactions || [], 'Brak dochodów w tym miesiącu.');
	renderMonthlyExpenseRows(report.expenses.categories || []);
	setEmpty(document.querySelector('#monthlyDetailsBody'), 4, 'Wybierz kategorię wydatków.');
	document.querySelector('#monthlyDetailsTitle').textContent = 'Szczegóły kategorii';
}

function getYearlyItemLabel(section, item) {
	if (section.view === 'month') {
		return MONTH_NAMES[(Number(item.month) || 1) - 1] || String(item.month);
	}
	return item.category?.name || 'Brak kategorii';
}

function renderYearlyRows(tableBody, section, type) {
	if (!section.items.length) {
		setEmpty(tableBody, 3, 'Brak danych.');
		return;
	}
	tableBody.replaceChildren();
	section.items.forEach((item) => {
		const row = document.createElement('tr');
		row.className = 'clickable-row';
		row.title = 'Pokaż transakcje.';
		row.addEventListener('click', () => loadYearlyDetails(type, section.view, item));
		[
			getYearlyItemLabel(section, item),
			item.count,
			formatAmount(item.total)
		].forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
}

function renderYearlyReport(report) {
	state.yearlyReport = report;
	const transactionCount = (report.income.items || [])
	.reduce((sum, item) => sum + Number(item.count || 0), 0) + (report.expenses.items || [])
	.reduce((sum, item) => sum + Number(item.count || 0), 0);
	document.querySelector('#yearlyReportTitle').textContent = `Raport roczny: ${report.year}`;
	renderSummary(document.querySelector('#yearlyReportSummary'), [
		{
			label: 'Dochody',
			value: formatAmount(report.income.total)
		},
		{
			label: 'Wydatki',
			value: formatAmount(report.expenses.total)
		},
		{
			label: 'Średnia dochodów',
			value: formatAmount(report.income.monthlyAverage)
		},
		{
			label: 'Średnia wydatków',
			value: formatAmount(report.expenses.monthlyAverage)
		},
		{
			label: 'Ilość transakcji',
			value: String(transactionCount)
		},
		{
			label: 'Saldo',
			value: formatAmount(report.balance)
		}
	]);
	renderYearlyRows(document.querySelector('#yearlyIncomeBody'), report.income, 'income');
	renderYearlyRows(document.querySelector('#yearlyExpensesBody'), report.expenses, 'expense');
	setEmpty(document.querySelector('#yearlyDetailsBody'), 4, 'Wybierz wiersz raportu rocznego.');
	document.querySelector('#yearlyDetailsTitle').textContent = 'Szczegóły';
}

async function loadMonthlyReport(form) {
	clearFieldErrors(form);
	const data = getFormData(form);
	if (showFieldErrors(form, validateMonthlyReportFilters(data))) {
		return;
	}
	try {
		const response = await getMonthlyReport(data);
		renderMonthlyReport(response.data);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	}
}

async function loadYearlyReport(form) {
	clearFieldErrors(form);
	const data = getFormData(form);
	if (showFieldErrors(form, validateYearlyReportFilters(data))) {
		return;
	}
	try {
		const response = await getYearlyReport(data);
		renderYearlyReport(response.data);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	}
}

async function loadYearlyDetails(type, view, item) {
	const tableBody = document.querySelector('#yearlyDetailsBody');
	const query = {
		year: state.yearlyReport.year,
		type
	};
	if (view === 'month') {
		query.month = item.month;
	} else {
		query.categoryId = item.category?.id;
	}
	document.querySelector('#yearlyDetailsTitle').textContent = `Szczegóły: ${type === 'income' ? 'dochody' : 'wydatki'} - ${getYearlyItemLabel({view}, item)}`;
	setEmpty(tableBody, 4, 'Ładowanie transakcji...');
	try {
		const response = await getYearlyReportTransactions(query);
		renderTransactionRows(tableBody, response.data.transactions || [], 'Brak transakcji.');
	} catch (error) {
		setEmpty(tableBody, 4, error.message);
	}
}

async function init() {
	const monthlyForm = document.querySelector('#monthlyReportForm');
	const yearlyForm = document.querySelector('#yearlyReportForm');
	if (!monthlyForm || !yearlyForm) {
		return;
	}
	const current = getCurrentPeriod();
	populateMonthSelect(monthlyForm.elements.month);
	monthlyForm.elements.month.value = String(current.month);
	monthlyForm.elements.year.value = String(current.year);
	yearlyForm.elements.year.value = String(current.year);
	limitToDigits(monthlyForm.elements.year);
	limitToDigits(yearlyForm.elements.year);
	monthlyForm.addEventListener('submit', (event) => {
		event.preventDefault();
		loadMonthlyReport(monthlyForm);
	});
	yearlyForm.addEventListener('submit', (event) => {
		event.preventDefault();
		loadYearlyReport(yearlyForm);
	});
	await Promise.all([
		loadMonthlyReport(monthlyForm),
		loadYearlyReport(yearlyForm)
	]);
}

export {
	init
};
