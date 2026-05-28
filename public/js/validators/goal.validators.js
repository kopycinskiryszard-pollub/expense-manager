import {dateRegex, goalDescriptionRegex, goalNameRegex, isBlank, matchesTrimmed, positiveAmountRegex} from './regex.js';

const messages = {
	required: 'Pole wymagane.',
	name: 'Błędna nazwa.',
	targetAmount: 'Błędna kwota.',
	deadline: 'Błędna data.',
	description: 'Błędny opis.',
	amount: 'Błędna kwota.'
};

/**
 * Waliduje podstawowe dane celu po stronie klienta.
 * Reguły biznesowe, w tym przyszłość terminu, sprawdza backend.
 * @param {object} goalData - Dane celu.
 * @param {boolean} partial - Czy walidować tylko przesłane pola.
 * @returns {{name?: string, targetAmount?: string, deadline?: string, description?: string}} Błędy pól.
 */
export function validateGoalData(goalData, partial = false) {
	const errors = {};
	const data = goalData || {};
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'name')) && isBlank(data.name)) {
		errors.name = messages.required;
	} else if (Object.prototype.hasOwnProperty.call(data, 'name') && !matchesTrimmed(data.name, goalNameRegex)) {
		errors.name = messages.name;
	}
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'targetAmount')) && isBlank(data.targetAmount)) {
		errors.targetAmount = messages.required;
	} else if (Object.prototype.hasOwnProperty.call(data, 'targetAmount') && !matchesTrimmed(data.targetAmount, positiveAmountRegex)) {
		errors.targetAmount = messages.targetAmount;
	}
	if ((!partial || Object.prototype.hasOwnProperty.call(data, 'deadline')) && isBlank(data.deadline)) {
		errors.deadline = messages.required;
	} else if (Object.prototype.hasOwnProperty.call(data, 'deadline') && !matchesTrimmed(data.deadline, dateRegex)) {
		errors.deadline = messages.deadline;
	}
	if (Object.prototype.hasOwnProperty.call(data, 'description') && !goalDescriptionRegex.test(String(data.description || ''))) {
		errors.description = messages.description;
	}
	return errors;
}

/**
 * Waliduje zmianę zebranej kwoty.
 * @param {object} amountData - Dane kwoty.
 * @returns {{amount?: string}} Błędy pól.
 */
export function validateGoalAmountData(amountData) {
	const data = amountData || {};
	if (isBlank(data.amount)) {
		return {
			amount: messages.required
		};
	}
	if (!matchesTrimmed(data.amount, positiveAmountRegex)) {
		return {
			amount: messages.amount
		};
	}
	return {};
}
