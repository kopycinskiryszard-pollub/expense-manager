export const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;
export const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
export const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+-=?]).{8,}$/;
export const positiveIntegerRegex = /^[1-9]\d*$/;
export const monthRegex = /^(?:[1-9]|1[0-2])$/;
export const yearRegex = /^\d{4}$/;
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const nonNegativeAmountRegex = /^\d{1,8}(?:\.\d{1,2})?$/;
export const positiveAmountRegex = /^(?!(?:0|0\.0{1,2})$)\d{1,8}(?:\.\d{1,2})?$/;
export const transactionNameRegex = /^.{1,30}$/u;
export const transactionDescriptionRegex = /^[\s\S]{0,300}$/u;
export const goalNameRegex = /^.{1,30}$/u;
export const goalDescriptionRegex = /^[\s\S]{0,500}$/u;

export function matchesTrimmed(value, regex) {
	return regex.test(String(value || '')
	.trim());
}

export function isBlank(value) {
	return String(value || '')
	.trim() === '';
}
