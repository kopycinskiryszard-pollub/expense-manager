import {deleteBudget, listBudgetStatuses, saveBudget, updateBudget} from '../api/budgets.api.js';
import {validateBudgetData} from '../validators/budget.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';
import {formatAmount, sanitizeAmount} from './form-utils.js';
const state = {
	budgets: []
};

/**
 * Zwraca bieżący okres.
 * @returns {{month: number, year: number}} Bieżący miesiąc i rok.
 */
function getCurrentPeriod() {
	const now = new Date();
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear()
	};
}

/**
 * Wypełnia domyślny okres budżetu.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @returns {void} Nie zwraca wartości.
 */
function populatePeriodFields(form) {
	const current = getCurrentPeriod();
	const monthSelect = form.elements.month;
	for (let month = 1; month <= 12; month += 1) {
		const option = document.createElement('option');
		option.value = String(month);
		option.textContent = String(month);
		monthSelect.append(option);
	}
	monthSelect.value = String(current.month);
	form.elements.year.value = String(current.year);
}

/**
 * Odczytuje dane formularza budżetu.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @returns {{month: FormDataEntryValue|null, year: FormDataEntryValue|null, limitAmount: FormDataEntryValue|null}} Dane formularza.
 */
function getBudgetFormData(form) {
	const formData = new FormData(form);
	return {
		month: formData.get('month'),
		year: formData.get('year'),
		limitAmount: formData.get('limitAmount')
	};
}

/**
 * Czyści formularz i ustawia dodawanie.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @returns {void} Nie zwraca wartości.
 */
function resetBudgetForm(form) {
	const current = getCurrentPeriod();
	form.reset();
	form.elements.id.value = '';
	form.elements.month.disabled = false;
	form.elements.year.disabled = false;
	form.elements.limitAmount.readOnly = false;
	form.elements.month.value = String(current.month);
	form.elements.year.value = String(current.year);
	clearFieldErrors(form);
	document.querySelector('#budgetFormTitle').textContent = 'Dodaj budżet';
	const submitButton = form.querySelector('[type="submit"]');
	submitButton.textContent = 'Zapisz';
	submitButton.classList.remove('hidden');
	document.querySelector('#deleteBudget')
			.classList
			.add('hidden');
}

/**
 * Wypełnia formularz wybranym budżetem.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @param {object} budget - Budżet.
 * @returns {void} Nie zwraca wartości.
 */
function fillBudgetForm(form, budget) {
	const isEditable = Boolean(budget.isEditable);
	clearFieldErrors(form);
	form.elements.id.value = budget.id;
	form.elements.month.value = String(budget.month);
	form.elements.year.value = String(budget.year);
	form.elements.limitAmount.value = String(budget.limitAmount);
	form.elements.month.disabled = !isEditable;
	form.elements.year.disabled = !isEditable;
	form.elements.limitAmount.readOnly = !isEditable;
	document.querySelector('#budgetFormTitle').textContent = isEditable ? 'Edytuj budżet' : 'Podgląd budżetu';
	const submitButton = form.querySelector('[type="submit"]');
	submitButton.textContent = 'Aktualizuj';
	submitButton.classList.toggle('hidden', !isEditable);
	document.querySelector('#deleteBudget')
			.classList
			.toggle('hidden', !isEditable);
}

/**
 * Renderuje tabelę statusów budżetów.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @returns {void} Nie zwraca wartości.
 */
function renderBudgetsTable(form) {
	const tableBody = document.querySelector('#budgetsTableBody');
	if (state.budgets.length === 0) {
		tableBody.innerHTML = '<tr><td colspan="6">Brak budżetów do wyświetlenia.</td></tr>';
		return;
	}
	tableBody.replaceChildren();
	state.budgets.forEach((budget) => {
		const row = document.createElement('tr');
		const values = [`${budget.month}.${budget.year}`, formatAmount(budget.limitAmount), formatAmount(budget.spentAmount), formatAmount(budget.difference),
						budget.status === 'within_limit' ? 'W limicie' : 'Przekroczony'];
		values.forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		const actionsCell = document.createElement('td');
		const actions = document.createElement('div');
		const editButton = document.createElement('button');
		actions.className = 'toolbar';
		editButton.className = 'button';
		editButton.type = 'button';
		editButton.textContent = budget.isEditable ? 'Edytuj' : 'Wyświetl';
		editButton.addEventListener('click', () => fillBudgetForm(form, budget));
		actions.append(editButton);
		actionsCell.append(actions);
		row.append(actionsCell);
		tableBody.append(row);
	});
}

/**
 * Pobiera budżety i renderuje tabelę.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function loadBudgetStatuses(form) {
	const tableBody = document.querySelector('#budgetsTableBody');
	tableBody.innerHTML = '<tr><td colspan="6">Ładowanie budżetów...</td></tr>';
	try {
		const response = await listBudgetStatuses();
		state.budgets = response.data.budgets || [];
		renderBudgetsTable(form);
	} catch (error) {
		tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
	}
}

/**
 * Obsługuje zapis budżetu.
 * @param {SubmitEvent} event - Zdarzenie submit.
 * @param {object} context - Wspólne zależności UI.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function handleBudgetSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	const submitButton = form.querySelector('[type="submit"]');
	const budgetId = form.elements.id.value;
	const budgetData = getBudgetFormData(form);
	clearFieldErrors(form);
	if (showFieldErrors(form, validateBudgetData(budgetData))) {
		return;
	}
	submitButton.disabled = true;
	try {
		const response = budgetId ? await updateBudget(budgetId, budgetData) : await saveBudget(budgetData);
		context.showToast(response.message || 'Budżet został zapisany.');
		resetBudgetForm(form);
		await loadBudgetStatuses(form);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

/**
 * Obsługuje usuwanie budżetu.
 * @param {HTMLFormElement} form - Formularz budżetu.
 * @param {object} context - Wspólne zależności UI.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function handleBudgetDelete(form, context) {
	const budgetId = form.elements.id.value;
	if (!budgetId || !window.confirm('Usunąć ten budżet?')) {
		return;
	}
	try {
		const response = await deleteBudget(budgetId);
		context.showToast(response.message || 'Budżet został usunięty.');
		resetBudgetForm(form);
		await loadBudgetStatuses(form);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	}
}

/**
 * Inicjalizuje stronę budżetów.
 * @param {object} context - Wspólne zależności UI.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function init(context) {
	const form = document.querySelector('#budgetForm');
	if (!form) {
		return;
	}
	populatePeriodFields(form);
	form.elements.limitAmount.addEventListener('input', (event) => {
		event.currentTarget.value = sanitizeAmount(event.currentTarget.value, 8);
	});
	form.elements.year.addEventListener('input', (event) => {
		event.currentTarget.value = String(event.currentTarget.value || '')
		.replace(/\D/g, '')
		.slice(0, 4);
	});
	form.addEventListener('submit', (event) => handleBudgetSubmit(event, context));
	document.querySelector('#clearBudgetForm')
			.addEventListener('click', () => resetBudgetForm(form));
	document.querySelector('#deleteBudget')
			.addEventListener('click', () => handleBudgetDelete(form, context));
	await loadBudgetStatuses(form);
}

export {
	init
};
