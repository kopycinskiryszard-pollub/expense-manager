import {listCategories} from '../api/categories.api.js';
import {createTransaction, deleteTransaction, getTransaction, listTransactions, updateTransaction} from '../api/transactions.api.js';
import {validateTransactionData, validateTransactionFilters} from '../validators/transaction.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';
import {formatAmount, sanitizeAmount} from './form-utils.js';

const CATEGORY_TYPES = {
	income: 0,
	expense: 1,
	all: ''
};
const FORM_MODES = {
	create: 'create',
	edit: 'edit',
	view: 'view'
};
const state = {
	categories: [],
	transactions: [],
	selectedTransactionId: null,
	pagination: {
		page: 1,
		limit: 10,
		total: 0,
		pages: 1
	},
	filters: {},
	formType: CATEGORY_TYPES.expense,
	filterType: CATEGORY_TYPES.all,
	formMode: FORM_MODES.create
};

function getTodayDate() {
	return new Date()
	.toISOString()
	.slice(0, 10);
}

function getCategoriesByType(type) {
	if (type === CATEGORY_TYPES.all) {
		return state.categories;
	}
	return state.categories.filter((category) => Number(category.type) === Number(type));
}

function renderCategoryOptions(select, categories, emptyLabel) {
	const currentValue = select.value;
	select.replaceChildren();
	const emptyOption = document.createElement('option');
	emptyOption.value = '';
	emptyOption.textContent = emptyLabel;
	select.append(emptyOption);
	categories.forEach((category) => {
		const option = document.createElement('option');
		option.value = category.id;
		option.textContent = category.name;
		select.append(option);
	});
	if (categories.some((category) => String(category.id) === String(currentValue))) {
		select.value = currentValue;
	}
}

function updateTypeSwitch(switchName, selectedType) {
	document.querySelectorAll(`[data-type-switch="${switchName}"] .type-switch-button`)
			.forEach((button) => {
				const isSelected = String(button.dataset.typeValue) === String(selectedType);
				button.setAttribute('aria-pressed', String(isSelected));
			});
}

function setTypeSwitchDisabled(switchName, disabled) {
	document.querySelectorAll(`[data-type-switch="${switchName}"] .type-switch-button`)
			.forEach((button) => {
				button.setAttribute('aria-disabled', String(disabled));
				button.tabIndex = disabled ? -1 : 0;
			});
}

function refreshCategorySelects() {
	const transactionForm = document.querySelector('#transactionForm');
	const filtersForm = document.querySelector('#transactionFilters');
	if (transactionForm) {
		renderCategoryOptions(transactionForm.elements.categoryId, getCategoriesByType(state.formType), 'Wybierz kategorię');
		updateTypeSwitch('transaction', state.formType);
	}
	if (filtersForm) {
		const filterCategories = state.filterType === CATEGORY_TYPES.all ? [] : getCategoriesByType(state.filterType);
		renderCategoryOptions(filtersForm.elements.categoryId, filterCategories, 'Wszystkie');
		filtersForm.elements.type.value = String(state.filterType);
		updateTypeSwitch('filter', state.filterType);
	}
}

function setTransactionFormMode(form, mode) {
	const isViewMode = mode === FORM_MODES.view;
	const title = document.querySelector('#transactionFormTitle');
	const submitButton = form.querySelector('[type="submit"]');
	state.formMode = mode;
	form.classList.toggle('view-mode', isViewMode);
	form.elements.name.readOnly = isViewMode;
	form.elements.date.readOnly = isViewMode;
	form.elements.amount.readOnly = isViewMode;
	form.elements.description.readOnly = isViewMode;
	form.elements.categoryId.disabled = isViewMode;
	setTypeSwitchDisabled('transaction', isViewMode);
	if (mode === FORM_MODES.create) {
		title.textContent = 'Dodaj transakcję';
		submitButton.textContent = 'Zapisz';
		return;
	}
	if (mode === FORM_MODES.view) {
		title.textContent = 'Podgląd transakcji';
		submitButton.textContent = 'Edytuj';
		return;
	}
	title.textContent = 'Edytuj transakcję';
	submitButton.textContent = 'Aktualizuj';
}

function resetTransactionForm(form) {
	form.reset();
	form.elements.id.value = '';
	form.elements.date.value = getTodayDate();
	state.formType = CATEGORY_TYPES.expense;
	clearFieldErrors(form);
	refreshCategorySelects();
	setTransactionFormMode(form, FORM_MODES.create);
}

function fillTransactionForm(form, transaction, mode = FORM_MODES.edit) {
	clearFieldErrors(form);
	state.formType = Number(transaction.category?.type ?? CATEGORY_TYPES.expense);
	refreshCategorySelects();
	form.elements.id.value = transaction.id;
	form.elements.categoryId.value = transaction.categoryId;
	form.elements.name.value = transaction.name;
	form.elements.date.value = transaction.date;
	form.elements.amount.value = transaction.amount;
	form.elements.description.value = transaction.description || '';
	setTransactionFormMode(form, mode);
}

function getTransactionFormData(form) {
	const formData = new FormData(form);
	return {
		categoryId: formData.get('categoryId'),
		name: formData.get('name'),
		date: formData.get('date'),
		amount: formData.get('amount'),
		description: formData.get('description')
	};
}

function getFilterData(form) {
	const formData = new FormData(form);
	const [sortBy = 'date', order = 'desc'] = String(formData.get('sort') || 'date_desc')
	.split('_');
	const categoryId = formData.get('categoryId');
	return {
		month: formData.get('month'),
		year: formData.get('year'),
		categoryId,
		type: categoryId ? '' : formData.get('type'),
		sortBy,
		order
	};
}

function limitToDigits(input, length) {
	input.addEventListener('input', (event) => {
		event.currentTarget.value = String(event.currentTarget.value || '')
		.replace(/\D/g, '')
		.slice(0, length);
	});
}

function selectTransaction(transactionId) {
	state.selectedTransactionId = String(transactionId);
}

function getSelectedTransactionId(context) {
	if (!state.selectedTransactionId) {
		context.showToast('Zaznacz transakcję na liście.');
		return null;
	}
	return state.selectedTransactionId;
}

function renderPagination() {
	const pageInfo = document.querySelector('#transactionsPageInfo');
	const previousButton = document.querySelector('#previousTransactionsPage');
	const nextButton = document.querySelector('#nextTransactionsPage');
	const pages = state.pagination.pages || 1;
	pageInfo.textContent = `Strona ${state.pagination.page} z ${pages}`;
	previousButton.disabled = state.pagination.page <= 1;
	nextButton.disabled = state.pagination.page >= pages;
}

function renderTransactionsTable() {
	const tableBody = document.querySelector('#transactionsTableBody');
	if (state.transactions.length === 0) {
		tableBody.innerHTML = '<tr><td colspan="6">Brak transakcji do wyświetlenia.</td></tr>';
		renderPagination();
		return;
	}
	tableBody.replaceChildren();
	state.transactions.forEach((transaction) => {
		const row = document.createElement('tr');
		const selectCell = document.createElement('td');
		const selector = document.createElement('input');
		selector.type = 'radio';
		selector.name = 'selectedTransaction';
		selector.value = transaction.id;
		selector.checked = String(state.selectedTransactionId) === String(transaction.id);
		selector.title = 'Zaznacz transakcję.';
		selector.addEventListener('change', () => selectTransaction(transaction.id));
		selectCell.append(selector);
		row.append(selectCell);
		[
			transaction.date,
			transaction.name,
			transaction.category?.name || 'Brak kategorii',
			formatAmount(transaction.amount),
			transaction.description || ''
		].forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
	renderPagination();
}

async function loadTransactions(page = state.pagination.page) {
	const tableBody = document.querySelector('#transactionsTableBody');
	tableBody.innerHTML = '<tr><td colspan="6">Ładowanie transakcji...</td></tr>';
	try {
		const response = await listTransactions({
			... state.filters,
			page,
			limit: state.pagination.limit
		});
		state.transactions = response.data.transactions || [];
		if (state.selectedTransactionId && !state.transactions.some((transaction) => String(transaction.id) === state.selectedTransactionId)) {
			state.selectedTransactionId = null;
		}
		state.pagination = {
			... state.pagination, ... response.data.pagination
		};
		renderTransactionsTable();
	} catch (error) {
		tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
	}
}

async function handleDeleteTransaction(transactionID) {
	if (!window.confirm('Usunąć tę transakcję?')) {
		return;
	}
	try {
		await deleteTransaction(transactionID);
		state.selectedTransactionId = null;
		await loadTransactions();
	} catch (error) {
		window.alert(error.message);
	}
}

async function handleViewTransaction(form, transactionID) {
	try {
		const response = await getTransaction(transactionID);
		fillTransactionForm(form, response.data, FORM_MODES.view);
	} catch (error) {
		window.alert(error.message);
	}
}

async function handleEditTransaction(form, transactionID) {
	try {
		const response = await getTransaction(transactionID);
		fillTransactionForm(form, response.data, FORM_MODES.edit);
	} catch (error) {
		window.alert(error.message);
	}
}

async function handleSelectedTransactionAction(action, form, context) {
	const transactionID = getSelectedTransactionId(context);
	if (!transactionID) {
		return;
	}
	if (action === 'view') {
		await handleViewTransaction(form, transactionID);
		return;
	}
	if (action === 'edit') {
		await handleEditTransaction(form, transactionID);
		return;
	}
	await handleDeleteTransaction(transactionID);
}

async function handleTransactionSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	const submitButton = form.querySelector('[type="submit"]');
	if (state.formMode === FORM_MODES.view) {
		setTransactionFormMode(form, FORM_MODES.edit);
		return;
	}
	const transactionID = form.elements.id.value;
	const transactionData = getTransactionFormData(form);
	clearFieldErrors(form);
	if (showFieldErrors(form, validateTransactionData(transactionData))) {
		return;
	}
	submitButton.disabled = true;
	try {
		const response = transactionID ? await updateTransaction(transactionID, transactionData) : await createTransaction(transactionData);
		context.showToast(response.message || 'Transakcja została zapisana.');
		resetTransactionForm(form);
		await loadTransactions(state.pagination.page);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

function bindTypeSwitch(switchName, onChange) {
	document.querySelectorAll(`[data-type-switch="${switchName}"] .type-switch-button`)
			.forEach((control) => {
				const updateType = () => {
					if (control.getAttribute('aria-disabled') === 'true') {
						return;
					}
					onChange(control.dataset.typeValue);
				};
				control.addEventListener('click', updateType);
				control.addEventListener('keydown', (event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						updateType();
					}
				});
			});
}

async function applyFilters(form) {
	clearFieldErrors(form);
	state.filters = getFilterData(form);
	if (showFieldErrors(form, validateTransactionFilters(state.filters))) {
		return;
	}
	await loadTransactions(1);
}

async function init(context) {
	const transactionForm = document.querySelector('#transactionForm');
	const filtersForm = document.querySelector('#transactionFilters');
	if (!transactionForm || !filtersForm) {
		return;
	}
	transactionForm.elements.date.max = getTodayDate();
	transactionForm.elements.date.value = getTodayDate();
	try {
		const response = await listCategories();
		state.categories = response.data.categories || [];
		refreshCategorySelects();
	} catch (error) {
		showFormError(transactionForm, error.message);
	}
	transactionForm.elements.amount.addEventListener('input', (event) => {
		event.currentTarget.value = sanitizeAmount(event.currentTarget.value, 7);
	});
	limitToDigits(filtersForm.elements.month, 2);
	limitToDigits(filtersForm.elements.year, 4);
	bindTypeSwitch('transaction', (type) => {
		state.formType = Number(type);
		refreshCategorySelects();
	});
	bindTypeSwitch('filter', async (type) => {
		state.filterType = type;
		refreshCategorySelects();
		await applyFilters(filtersForm);
	});
	transactionForm.addEventListener('submit', (event) => handleTransactionSubmit(event, context));
	document.querySelector('#clearTransactionForm')
			.addEventListener('click', () => resetTransactionForm(transactionForm));
	filtersForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		await applyFilters(filtersForm);
	});
	document.querySelector('#clearTransactionFilters')
			.addEventListener('click', async () => {
				filtersForm.reset();
				clearFieldErrors(filtersForm);
				state.filterType = CATEGORY_TYPES.all;
				refreshCategorySelects();
				await applyFilters(filtersForm);
			});
	document.querySelector('#viewSelectedTransaction')
			.addEventListener('click', () => handleSelectedTransactionAction('view', transactionForm, context));
	document.querySelector('#editSelectedTransaction')
			.addEventListener('click', () => handleSelectedTransactionAction('edit', transactionForm, context));
	document.querySelector('#deleteSelectedTransaction')
			.addEventListener('click', () => handleSelectedTransactionAction('delete', transactionForm, context));
	document.querySelector('#previousTransactionsPage')
			.addEventListener('click', () => loadTransactions(state.pagination.page - 1));
	document.querySelector('#nextTransactionsPage')
			.addEventListener('click', () => loadTransactions(state.pagination.page + 1));
	state.filters = getFilterData(filtersForm);
	await loadTransactions(1);
}

export {
	init
};
