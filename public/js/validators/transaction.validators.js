import {dateRegex, isBlank, matchesTrimmed, monthRegex, positiveAmountRegex, positiveIntegerRegex, transactionDescriptionRegex, transactionNameRegex, yearRegex} from './regex.js';
const messages = {
	required: 'Pole wymagane.',
	categoryId: 'Błędna kategoria.',
	name: 'Błędna nazwa.',
	date: 'Błędna data.',
	amount: 'Błędna kwota.',
	description: 'Błędny opis.'
};

/**
 * Waliduje dane formularza transakcji po stronie klienta.
 * Frontend sprawdza obecność pól i format regex; reguły biznesowe sprawdza backend.
 * @param {object} transactionData - Dane transakcji.
 * @returns {{categoryId?: string, name?: string, date?: string, amount?: string, description?: string}} Błędy pól.
 */
export function validateTransactionData(transactionData) {
	const errors = {};
	const data = transactionData || {};
	if (isBlank(data.categoryId)) {
		errors.categoryId = messages.required;
	} else if (!matchesTrimmed(data.categoryId, positiveIntegerRegex)) {
		errors.categoryId = messages.categoryId;
	}
	if (isBlank(data.name)) {
		errors.name = messages.required;
	} else if (!matchesTrimmed(data.name, transactionNameRegex)) {
		errors.name = messages.name;
	}
	if (isBlank(data.date)) {
		errors.date = messages.required;
	} else if (!matchesTrimmed(data.date, dateRegex)) {
		errors.date = messages.date;
	}
	if (isBlank(data.amount)) {
		errors.amount = messages.required;
	} else if (!matchesTrimmed(data.amount, positiveAmountRegex)) {
		errors.amount = messages.amount;
	}
	if (!transactionDescriptionRegex.test(String(data.description || ''))) {
		errors.description = messages.description;
	}
	return errors;
}

/**
 * Waliduje filtry listy transakcji. Puste pola oznaczaja brak danego filtra.
 * @param {object} filterData - Dane filtrów.
 * @returns {{month?: string, year?: string}} Błędy pól.
 */
export function validateTransactionFilters(filterData) {
	const errors = {};
	const data = filterData || {};
	if (!isBlank(data.month) && !matchesTrimmed(data.month, monthRegex)) {
		errors.month = 'Błędny miesiąc.';
	}
	if (!isBlank(data.year) && !matchesTrimmed(data.year, yearRegex)) {
		errors.year = 'Błędny rok.';
	}
	return errors;
}
