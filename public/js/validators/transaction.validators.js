const categoryIdRegex = /^[1-9]\d*$/;
const nameRegex = /^.{1,31}$/u;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const amountRegex = /^(?!(?:0|0\.0{1,2})$)\d{1,7}(?:\.\d{1,2})?$/;
const descriptionRegex = /^[\s\S]{0,255}$/u;
const messages = {
	categoryId: 'Kategoria transakcji jest wymagana.',
	name: 'Nazwa transakcji jest wymagana i może mieć maksymalnie 31 znaków.',
	date: 'Data transakcji musi mieć format YYYY-MM-DD.',
	amount: 'Kwota transakcji musi być dodatnia, nie większa niż 9999999,99 i mieć maksymalnie dwa miejsca po przecinku.',
	description: 'Opis transakcji może mieć maksymalnie 255 znaków.'
};

/**
 * Sprawdza tekst przez wyrażenie regularne po przycięciu spacji z brzegów.
 * @param {*} value - Sprawdzana wartość.
 * @param {RegExp} regex - Wyrażenie regularne.
 * @returns {boolean} Czy wartość pasuje do wzorca.
 */
function matchesTrimmed(value, regex) {
	return regex.test(String(value || '')
	.trim());
}

/**
 * Waliduje dane formularza transakcji po stronie klienta.
 * Frontend sprawdza obecność pól i format regex; reguły biznesowe sprawdza backend.
 * @param {object} transactionData - Dane transakcji.
 * @returns {{categoryId?: string, name?: string, date?: string, amount?: string, description?: string}} Błędy pól.
 */
export function validateTransactionData(transactionData) {
	const errors = {};
	const data = transactionData || {};
	if (!matchesTrimmed(data.categoryId, categoryIdRegex)) {
		errors.categoryId = messages.categoryId;
	}
	if (!matchesTrimmed(data.name, nameRegex)) {
		errors.name = messages.name;
	}
	if (!matchesTrimmed(data.date, dateRegex)) {
		errors.date = messages.date;
	}
	if (!matchesTrimmed(data.amount, amountRegex)) {
		errors.amount = messages.amount;
	}
	if (!descriptionRegex.test(String(data.description || ''))) {
		errors.description = messages.description;
	}
	return errors;
}
