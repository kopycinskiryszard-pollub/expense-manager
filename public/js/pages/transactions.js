import {listCategories} from '../api/categories.api.js';
import {createTransaction, deleteTransaction, getTransaction, listTransactions, updateTransaction} from '../api/transactions.api.js';
import {validateTransactionData} from '../validators/transaction.validators.js';
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
const MIN_FILTER_YEAR = 2000;
const state = {
	categories: [],
	transactions: [],
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

/**
 * Zwraca dzisiejszą datę w formacie YYYY-MM-DD.
 * @returns {string} Dzisiejsza data.
 */
function getTodayDate() {
	return new Date()
	.toISOString()
	.slice(0, 10);
}

/**
 * Filtruje kategorie po typie.
 * @param {number|string} type - Typ kategorii albo pusty tekst dla wszystkich.
 * @returns {Array<object>} Kategorie wybranego typu.
 */
function getCategoriesByType(type) {
	if (type === CATEGORY_TYPES.all) {
		return state.categories;
	}
	return state.categories.filter((category) => Number(category.type) === Number(type));
}

/**
 * Wypełnia select kategoriami.
 * @param {HTMLSelectElement} select - Pole wyboru kategorii.
 * @param {Array<object>} categories - Kategorie.
 * @param {string} emptyLabel - Etykieta pustej opcji.
 * @returns {void} Nie zwraca wartości.
 */
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

/**
 * Odświeża stan wizualny przełączników dochód/wydatek.
 * @param {string} switchName - Nazwa przełącznika.
 * @param {number} selectedType - Wybrany typ.
 * @returns {void} Nie zwraca wartości.
 */
function updateTypeSwitch(switchName, selectedType) {
	document.querySelectorAll(`[data-type-switch="${switchName}"] .type-switch-button`)
			.forEach((button) => {
				const isSelected = String(button.dataset.typeValue) === String(selectedType);
				button.setAttribute('aria-pressed', String(isSelected));
			});
}

/**
 * Blokuje albo odblokowuje przełącznik typu kategorii.
 * @param {string} switchName - Nazwa przełącznika.
 * @param {boolean} disabled - Czy przełącznik ma być zablokowany.
 * @returns {void} Nie zwraca wartości.
 */
function setTypeSwitchDisabled(switchName, disabled) {
	document.querySelectorAll(`[data-type-switch="${switchName}"] .type-switch-button`)
			.forEach((button) => {
				button.setAttribute('aria-disabled', String(disabled));
				button.tabIndex = disabled ? -1 : 0;
			});
}

/**
 * Aktualizuje listy kategorii w formularzu i filtrach.
 * @returns {void} Nie zwraca wartości.
 */
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

/**
 * Ustawia tryb formularza transakcji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @param {string} mode - Tryb formularza.
 * @returns {void} Nie zwraca wartości.
 */
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

/**
 * Wypełnia listy miesięcy i lat.
 * @param {HTMLFormElement} form - Formularz filtrów.
 * @returns {void} Nie zwraca wartości.
 */
function populatePeriodFilters(form) {
	const monthSelect = form.elements.month;
	const yearSelect = form.elements.year;
	for (let month = 1; month <= 12; month += 1) {
		const option = document.createElement('option');
		option.value = String(month);
		option.textContent = String(month);
		monthSelect.append(option);
	}
	for (let year = new Date().getFullYear(); year >= MIN_FILTER_YEAR; year -= 1) {
		const option = document.createElement('option');
		option.value = String(year);
		option.textContent = String(year);
		yearSelect.append(option);
	}
}

/**
 * Czyści formularz transakcji i ustawia tryb dodawania.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @returns {void} Nie zwraca wartości.
 */
function resetTransactionForm(form) {
	form.reset();
	form.elements.id.value = '';
	form.elements.date.value = getTodayDate();
	state.formType = CATEGORY_TYPES.expense;
	clearFieldErrors(form);
	refreshCategorySelects();
	setTransactionFormMode(form, FORM_MODES.create);
}

/**
 * Wypełnia formularz danymi transakcji do edycji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @param {object} transaction - Transakcja.
 * @returns {void} Nie zwraca wartości.
 */
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

/**
 * Odczytuje dane formularza transakcji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @returns {object} Dane transakcji.
 */
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

/**
 * Odczytuje filtry listy transakcji.
 * @param {HTMLFormElement} form - Formularz filtrów.
 * @returns {object} Filtry listy.
 */
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

/**
 * Renderuje informacje o paginacji.
 * @returns {void} Nie zwraca wartości.
 */
function renderPagination() {
	const pageInfo = document.querySelector('#transactionsPageInfo');
	const previousButton = document.querySelector('#previousTransactionsPage');
	const nextButton = document.querySelector('#nextTransactionsPage');
	const pages = state.pagination.pages || 1;
	pageInfo.textContent = `Strona ${state.pagination.page} z ${pages}`;
	previousButton.disabled = state.pagination.page <= 1;
	nextButton.disabled = state.pagination.page >= pages;
}

/**
 * Renderuje tabelę transakcji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @returns {void} Nie zwraca wartości.
 */
function renderTransactionsTable(form) {
	const tableBody = document.querySelector('#transactionsTableBody');
	if (state.transactions.length === 0) {
		tableBody.innerHTML = '<tr><td colspan="6">Brak transakcji do wyświetlenia.</td></tr>';
		renderPagination();
		return;
	}
	tableBody.replaceChildren();
	state.transactions.forEach((transaction) => {
		const row = document.createElement('tr');
		const categoryLabel = transaction.category?.name || 'Brak kategorii';
		[transaction.date, transaction.name, categoryLabel, formatAmount(transaction.amount), transaction.description || '']
		.forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		const actionsCell = document.createElement('td');
		const actions = document.createElement('div');
		const viewButton = document.createElement('button');
		const editButton = document.createElement('button');
		const deleteButton = document.createElement('button');
		actions.className = 'toolbar';
		viewButton.className = 'button';
		viewButton.type = 'button';
		viewButton.textContent = 'Wyświetl';
		viewButton.addEventListener('click', () => handleViewTransaction(form, transaction.id));
		editButton.className = 'button';
		editButton.type = 'button';
		editButton.textContent = 'Edytuj';
		editButton.addEventListener('click', () => handleEditTransaction(form, transaction.id));
		deleteButton.className = 'button';
		deleteButton.type = 'button';
		deleteButton.textContent = 'Usuń';
		deleteButton.addEventListener('click', () => handleDeleteTransaction(transaction.id));
		actions.append(viewButton, editButton, deleteButton);
		actionsCell.append(actions);
		row.append(actionsCell);
		tableBody.append(row);
	});
	renderPagination();
}

/**
 * Pobiera i renderuje listę transakcji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @param {number} page - Numer strony.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function loadTransactions(form, page = state.pagination.page) {
	const tableBody = document.querySelector('#transactionsTableBody');
	tableBody.innerHTML = '<tr><td colspan="6">Ładowanie transakcji...</td></tr>';
	try {
		const response = await listTransactions({
			... state.filters,
			page,
			limit: state.pagination.limit
		});
		state.transactions = response.data.transactions || [];
		state.pagination = {
			... state.pagination, ... response.data.pagination
		};
		renderTransactionsTable(form);
	} catch (error) {
		tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
	}
}

/**
 * Usuwa wskazaną transakcję po potwierdzeniu.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function handleDeleteTransaction(transactionID) {
	if (!window.confirm('Usunąć tę transakcję?')) {
		return;
	}
	try {
		await deleteTransaction(transactionID);
		await loadTransactions(document.querySelector('#transactionForm'));
	} catch (error) {
		window.alert(error.message);
	}
}

/**
 * Pobiera świeże dane transakcji i przełącza formularz w tryb podglądu.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function handleViewTransaction(form, transactionID) {
	try {
		const response = await getTransaction(transactionID);
		fillTransactionForm(form, response.data, FORM_MODES.view);
	} catch (error) {
		window.alert(error.message);
	}
}

/**
 * Pobiera świeże dane transakcji i przełącza formularz w tryb edycji.
 * @param {HTMLFormElement} form - Formularz transakcji.
 * @param {number|string} transactionID - Identyfikator transakcji.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function handleEditTransaction(form, transactionID) {
	try {
		const response = await getTransaction(transactionID);
		fillTransactionForm(form, response.data, FORM_MODES.edit);
	} catch (error) {
		window.alert(error.message);
	}
}

/**
 * Obsługuje zapis formularza transakcji.
 * @param {SubmitEvent} event - Zdarzenie submit.
 * @param {object} context - Wspólne zależności UI.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
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
		await loadTransactions(form, state.pagination.page);
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

/**
 * Podpina przełącznik typów kategorii.
 * @param {string} switchName - Nazwa przełącznika.
 * @param {Function} onChange - Reakcja na zmianę.
 * @returns {void} Nie zwraca wartości.
 */
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

/**
 * Inicjalizuje stronę transakcji.
 * @param {object} context - Wspólne zależności UI.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function init(context) {
	const transactionForm = document.querySelector('#transactionForm');
	const filtersForm = document.querySelector('#transactionFilters');
	if (!transactionForm || !filtersForm) {
		return;
	}
	transactionForm.elements.date.max = getTodayDate();
	transactionForm.elements.date.value = getTodayDate();
	populatePeriodFilters(filtersForm);
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
	bindTypeSwitch('transaction', (type) => {
		state.formType = Number(type);
		refreshCategorySelects();
	});
	bindTypeSwitch('filter', async (type) => {
		state.filterType = type;
		refreshCategorySelects();
		state.filters = getFilterData(filtersForm);
		await loadTransactions(transactionForm, 1);
	});
	transactionForm.addEventListener('submit', (event) => handleTransactionSubmit(event, context));
	document.querySelector('#clearTransactionForm')
			.addEventListener('click', () => resetTransactionForm(transactionForm));
	filtersForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		state.filters = getFilterData(filtersForm);
		await loadTransactions(transactionForm, 1);
	});
	document.querySelector('#clearTransactionFilters')
			.addEventListener('click', async () => {
				filtersForm.reset();
				state.filterType = CATEGORY_TYPES.all;
				refreshCategorySelects();
				state.filters = getFilterData(filtersForm);
				await loadTransactions(transactionForm, 1);
			});
	document.querySelector('#previousTransactionsPage')
			.addEventListener('click', () => loadTransactions(transactionForm, state.pagination.page - 1));
	document.querySelector('#nextTransactionsPage')
			.addEventListener('click', () => loadTransactions(transactionForm, state.pagination.page + 1));
	state.filters = getFilterData(filtersForm);
	await loadTransactions(transactionForm, 1);
}

export {
	init
};
