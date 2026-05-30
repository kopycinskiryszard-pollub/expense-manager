import {dateRegex, isBlank, matchesTrimmed, passwordRegex} from './regex.js';

const optionalText50Regex = /^[\s\S]{0,50}$/u;
const optionalText100Regex = /^[\s\S]{0,100}$/u;

export function validateProfileData(data) {
	const errors = {};
	const profile = data || {};
	if (!optionalText50Regex.test(String(profile.name || ''))) {
		errors.name = 'Błędne imię.';
	}
	if (!optionalText50Regex.test(String(profile.surname || ''))) {
		errors.surname = 'Błędne nazwisko.';
	}
	if (!isBlank(profile.birthdate) && !matchesTrimmed(profile.birthdate, dateRegex)) {
		errors.birthdate = 'Błędna data.';
	}
	if (!optionalText100Regex.test(String(profile.city || ''))) {
		errors.city = 'Błędne miasto.';
	}
	if (!optionalText100Regex.test(String(profile.country || ''))) {
		errors.country = 'Błędny kraj.';
	}
	return errors;
}

export function validatePasswordData(data) {
	const errors = {};
	const passwordData = data || {};
	if (isBlank(passwordData.currentPassword)) {
		errors.currentPassword = 'Pole wymagane.';
	} else if (!passwordRegex.test(String(passwordData.currentPassword))) {
		errors.currentPassword = 'Błędne hasło.';
	}
	if (isBlank(passwordData.newPassword)) {
		errors.newPassword = 'Pole wymagane.';
	} else if (!passwordRegex.test(String(passwordData.newPassword))) {
		errors.newPassword = 'Błędne hasło.';
	}
	if (isBlank(passwordData.confirmPassword)) {
		errors.confirmPassword = 'Pole wymagane.';
	} else if (String(passwordData.newPassword || '') !== String(passwordData.confirmPassword || '')) {
		errors.confirmPassword = 'Hasła nie są zgodne.';
	}
	return errors;
}
