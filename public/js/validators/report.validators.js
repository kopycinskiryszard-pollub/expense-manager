import {isBlank, matchesTrimmed, monthRegex, yearRegex} from './regex.js';

const messages = {
	required: 'Pole wymagane.',
	month: 'Błędny miesiąc.',
	year: 'Błędny rok.'
};

export function validateMonthlyReportFilters(data) {
	const errors = {};
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
	return errors;
}

export function validateYearlyReportFilters(data) {
	const errors = {};
	if (isBlank(data.year)) {
		errors.year = messages.required;
	} else if (!matchesTrimmed(data.year, yearRegex)) {
		errors.year = messages.year;
	}
	return errors;
}
