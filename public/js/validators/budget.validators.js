import {isBlank, matchesTrimmed, monthRegex, nonNegativeAmountRegex, yearRegex} from './regex.js';
const messages = {
	required: 'Pole wymagane.',
	month: 'Błędny miesiąc.',
	year: 'Błędny rok.',
	limitAmount: 'Błędna kwota.'
};

/**
 * Waliduje budżet po stronie klienta: obecność pól i format regex.
 * Reguły planowania okresu sprawdza backend.
 * @param {object} budgetData - Dane budżetu.
 * @returns {{month?: string, year?: string, limitAmount?: string}} Błędy pól.
 */
export function validateBudgetData(budgetData) {
	const errors = {};
	const data = budgetData || {};
	if (isBlank(data.month)) {
		errors.month = messages.required;
	} else if (!matchesTrimmed(data.month, monthRegex)) {
		errors.month = messages.month;
	}
	if (isBlank(data.year)) {
		errors.year = messages.required;
	} else if (!matchesTrimmed(data.year, yearRegex)) {
		errors.year = messages.year;
	}
	if (isBlank(data.limitAmount)) {
		errors.limitAmount = messages.required;
	} else if (!matchesTrimmed(data.limitAmount, nonNegativeAmountRegex)) {
		errors.limitAmount = messages.limitAmount;
	}
	return errors;
}
