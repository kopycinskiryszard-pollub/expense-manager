import {createGoal, deleteGoal, getGoal, listGoalHistory, listGoals, updateGoal, updateGoalAmount} from '../api/goals.api.js';
import {validateGoalAmountData, validateGoalData} from '../validators/goal.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';
import {formatAmount, sanitizeAmount} from './form-utils.js';

const FORM_MODES = {
	create: 'create',
	edit: 'edit',
	view: 'view'
};
const state = {
	activeGoals: [],
	finishedGoals: [],
	selectedGoalId: null,
	selectedGoalList: 'active',
	formMode: FORM_MODES.create
};

function getGoalById(goalId) {
	return [... state.activeGoals, ... state.finishedGoals].find((goal) => String(goal.id) === String(goalId)) || null;
}

function getGoalFormData(form) {
	const targetAmount = state.formMode === FORM_MODES.create ? form.elements.targetAmount.value : form.elements.targetAmountDetails.value;
	return {
		name: form.elements.name.value,
		targetAmount,
		deadline: form.elements.deadline.value,
		description: form.elements.description.value
	};
}

function setFieldLock(form, locked) {
	form.elements.name.readOnly = locked;
	form.elements.deadline.disabled = locked;
	form.elements.description.readOnly = locked;
	form.elements.targetAmount.readOnly = locked;
	form.elements.targetAmountDetails.readOnly = locked;
}

function syncTargetAmountFields(form, value = '') {
	form.elements.targetAmount.value = value;
	form.elements.targetAmountDetails.value = value;
}

function setGoalFormMode(form, mode) {
	const title = document.querySelector('#goalFormTitle');
	const createAmountLayout = document.querySelector('[data-goal-amount-layout="create"]');
	const detailsAmountLayout = document.querySelector('[data-goal-amount-layout="details"]');
	const amountForm = document.querySelector('#goalAmountForm');
	const submitButton = form.querySelector('[type="submit"]');
	state.formMode = mode;
	const isCreate = mode === FORM_MODES.create;
	const isView = mode === FORM_MODES.view;
	createAmountLayout.classList.toggle('hidden', !isCreate);
	detailsAmountLayout.classList.toggle('hidden', isCreate);
	amountForm.classList.toggle('hidden', !isView || !form.elements.id.value);
	form.elements.targetAmount.disabled = !isCreate;
	form.elements.targetAmountDetails.disabled = isCreate;
	setFieldLock(form, isView);
	if (isCreate) {
		title.textContent = 'Nowy cel';
		submitButton.textContent = 'Zapisz';
		return;
	}
	if (isView) {
		title.textContent = 'Wyświetl cel';
		submitButton.textContent = 'Edytuj';
		return;
	}
	title.textContent = 'Edytuj cel';
	submitButton.textContent = 'Aktualizuj';
}

function resetGoalForm(form) {
	form.reset();
	form.elements.id.value = '';
	form.elements.currentAmount.value = '';
	syncTargetAmountFields(form, '');
	clearFieldErrors(form);
	clearFieldErrors(document.querySelector('#goalAmountForm'));
	setGoalFormMode(form, FORM_MODES.create);
}

function fillGoalForm(form, goal, mode) {
	clearFieldErrors(form);
	clearFieldErrors(document.querySelector('#goalAmountForm'));
	form.elements.id.value = goal.id;
	form.elements.name.value = goal.name || '';
	form.elements.currentAmount.value = formatAmount(goal.currentAmount);
	syncTargetAmountFields(form, String(goal.targetAmount ?? ''));
	form.elements.deadline.value = goal.deadline || '';
	form.elements.description.value = goal.description || '';
	setGoalFormMode(form, mode);
}

function getSelectedGoalId(context) {
	if (!state.selectedGoalId) {
		context.showToast('Zaznacz cel na liście.');
		return null;
	}
	return state.selectedGoalId;
}

function selectGoal(goalId, listName) {
	state.selectedGoalId = String(goalId);
	state.selectedGoalList = listName;
}

function renderGoalRows(goals, tableBody, listName) {
	if (goals.length === 0) {
		tableBody.innerHTML = '<tr><td colspan="6">Brak celów do wyświetlenia.</td></tr>';
		return;
	}
	tableBody.replaceChildren();
	goals.forEach((goal) => {
		const row = document.createElement('tr');
		const selectCell = document.createElement('td');
		const selector = document.createElement('input');
		selector.type = 'radio';
		selector.name = 'selectedGoal';
		selector.value = goal.id;
		selector.checked = String(state.selectedGoalId) === String(goal.id);
		selector.title = 'Zaznacz cel.';
		selector.addEventListener('change', () => selectGoal(goal.id, listName));
		selectCell.append(selector);
		row.append(selectCell);
		const values = [
			goal.name,
			formatAmount(goal.currentAmount),
			formatAmount(goal.targetAmount),
			`${goal.progress || 0}%`,
			listName === 'active' ? (
				goal.deadline || 'Brak'
			) : (
				goal.finishedAt || 'Brak'
			)
		];
		values.forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
}

function renderGoalsTables() {
	renderGoalRows(state.activeGoals, document.querySelector('#activeGoalsTableBody'), 'active');
	renderGoalRows(state.finishedGoals, document.querySelector('#finishedGoalsTableBody'), 'finished');
}

async function loadGoals() {
	const activeBody = document.querySelector('#activeGoalsTableBody');
	const finishedBody = document.querySelector('#finishedGoalsTableBody');
	activeBody.innerHTML = '<tr><td colspan="6">Ładowanie celów...</td></tr>';
	finishedBody.innerHTML = '<tr><td colspan="6">Ładowanie celów...</td></tr>';
	const [activeResponse, finishedResponse] = await Promise.all([
		listGoals({
			limit: 50
		}),
		listGoalHistory({
			limit: 50
		})
	]);
	state.activeGoals = activeResponse.data.goals || [];
	state.finishedGoals = finishedResponse.data.goals || [];
	if (state.selectedGoalId && !getGoalById(state.selectedGoalId)) {
		state.selectedGoalId = null;
	}
	renderGoalsTables();
}

function switchGoalsTab(tabName) {
	document.querySelectorAll('[data-goal-tab]')
			.forEach((button) => button.setAttribute('aria-selected', String(button.dataset.goalTab === tabName)));
	document.querySelectorAll('[data-goal-panel]')
			.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.goalPanel !== tabName));
}

async function showGoal(form, goalId, mode) {
	const response = await getGoal(goalId);
	fillGoalForm(form, response.data, mode);
	selectGoal(goalId, getGoalById(goalId)?.finishedAt ? 'finished' : state.selectedGoalList);
	renderGoalsTables();
}

function normalizeGoalErrors(details) {
	if (!details) {
		return details;
	}
	if (details.targetAmount && state.formMode !== FORM_MODES.create) {
		const {
			targetAmount,
			... rest
		} = details;
		return {
			... rest,
			targetAmountDetails: targetAmount
		};
	}
	return details;
}

async function handleGoalSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	if (state.formMode === FORM_MODES.view) {
		setGoalFormMode(form, FORM_MODES.edit);
		return;
	}
	const goalId = form.elements.id.value;
	const isEdit = Boolean(goalId);
	const submitButton = form.querySelector('[type="submit"]');
	const goalData = getGoalFormData(form);
	const validationData = state.formMode === FORM_MODES.create ? goalData : {
		... goalData,
		targetAmountDetails: goalData.targetAmount
	};
	clearFieldErrors(form);
	if (showFieldErrors(form, normalizeGoalErrors(validateGoalData(validationData, false)))) {
		return;
	}
	submitButton.disabled = true;
	try {
		const response = isEdit ? await updateGoal(goalId, goalData) : await createGoal(goalData);
		context.showToast(response.message || 'Cel został zapisany.');
		fillGoalForm(form, response.data, FORM_MODES.view);
		selectGoal(response.data.id, response.data.finishedAt ? 'finished' : 'active');
		await loadGoals();
	} catch (error) {
		if (!showFieldErrors(form, normalizeGoalErrors(error.details))) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

async function handleAmountSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	const goalForm = document.querySelector('#goalForm');
	const goalId = goalForm.elements.id.value;
	const amountData = {
		amount: form.elements.amount.value,
		operation: 'increase'
	};
	clearFieldErrors(form);
	if (showFieldErrors(form, validateGoalAmountData(amountData))) {
		return;
	}
	const submitButton = form.querySelector('[type="submit"]');
	submitButton.disabled = true;
	try {
		const response = await updateGoalAmount(goalId, amountData);
		context.showToast(response.message || 'Kwota celu została zaktualizowana.');
		form.reset();
		fillGoalForm(goalForm, response.data, FORM_MODES.view);
		selectGoal(response.data.id, response.data.finishedAt ? 'finished' : 'active');
		await loadGoals();
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

async function handleSelectedAction(action, context) {
	const goalId = getSelectedGoalId(context);
	if (!goalId) {
		return;
	}
	const form = document.querySelector('#goalForm');
	try {
		if (action === 'view') {
			await showGoal(form, goalId, FORM_MODES.view);
			return;
		}
		if (action === 'edit') {
			await showGoal(form, goalId, FORM_MODES.edit);
			return;
		}
		if (!window.confirm('Usunąć ten cel?')) {
			return;
		}
		const response = await deleteGoal(goalId);
		context.showToast(response.message || 'Cel został usunięty.');
		resetGoalForm(form);
		state.selectedGoalId = null;
		await loadGoals();
	} catch (error) {
		context.showToast(error.message);
	}
}

async function init(context) {
	const goalForm = document.querySelector('#goalForm');
	const amountForm = document.querySelector('#goalAmountForm');
	if (!goalForm || !amountForm) {
		return;
	}
	goalForm.elements.targetAmount.addEventListener('input', (event) => {
		event.currentTarget.value = sanitizeAmount(event.currentTarget.value, 8);
	});
	goalForm.elements.targetAmountDetails.addEventListener('input', (event) => {
		event.currentTarget.value = sanitizeAmount(event.currentTarget.value, 8);
	});
	amountForm.elements.amount.addEventListener('input', (event) => {
		event.currentTarget.value = sanitizeAmount(event.currentTarget.value, 8);
	});
	goalForm.addEventListener('submit', (event) => handleGoalSubmit(event, context));
	amountForm.addEventListener('submit', (event) => handleAmountSubmit(event, context));
	document.querySelector('#clearGoalForm')
			.addEventListener('click', () => resetGoalForm(goalForm));
	document.querySelector('#viewSelectedGoal')
			.addEventListener('click', () => handleSelectedAction('view', context));
	document.querySelector('#editSelectedGoal')
			.addEventListener('click', () => handleSelectedAction('edit', context));
	document.querySelector('#deleteSelectedGoal')
			.addEventListener('click', () => handleSelectedAction('delete', context));
	document.querySelectorAll('[data-goal-tab]')
			.forEach((button) => {
				button.addEventListener('click', () => switchGoalsTab(button.dataset.goalTab));
			});
	setGoalFormMode(goalForm, FORM_MODES.create);
	await loadGoals()
	.catch((error) => {
		showFormError(goalForm, error.message);
	});
}

export {
	init
};
