import {getProfile, updatePassword, updateProfile} from '../api/users.api.js';
import {validatePasswordData, validateProfileData} from '../validators/profile.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';

function getFormData(form) {
	return Object.fromEntries(new FormData(form).entries());
}

function formatDate(value) {
	return value ? String(value).slice(0, 10) : '';
}

function fillProfileForm(form, profile) {
	document.querySelector('#profileLogin').textContent = profile.login || '-';
	document.querySelector('#profileEmail').textContent = profile.email || '-';
	form.elements.name.value = profile.name || '';
	form.elements.surname.value = profile.surname || '';
	form.elements.birthdate.value = formatDate(profile.birthdate);
	form.elements.city.value = profile.city || '';
	form.elements.country.value = profile.country || '';
}

async function loadProfile(form) {
	try {
		const response = await getProfile();
		fillProfileForm(form, response.data);
	} catch (error) {
		showFormError(form, error.message);
	}
}

async function handleProfileSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	const submitButton = form.querySelector('[type="submit"]');
	const profileData = getFormData(form);
	clearFieldErrors(form);
	if (showFieldErrors(form, validateProfileData(profileData))) {
		return;
	}
	submitButton.disabled = true;
	try {
		const response = await updateProfile(profileData);
		fillProfileForm(form, response.data);
		context.showToast(response.message || 'Profil został zapisany.');
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

function validatePasswordForm(data) {
	const errors = validatePasswordData(data);
	if (data.confirmChange !== 'yes') {
		errors.confirmChange = 'Pole wymagane.';
	}
	return errors;
}

async function handlePasswordSubmit(event, context) {
	event.preventDefault();
	const form = event.currentTarget;
	const submitButton = form.querySelector('[type="submit"]');
	const passwordData = getFormData(form);
	clearFieldErrors(form);
	if (showFieldErrors(form, validatePasswordForm(passwordData))) {
		return;
	}
	submitButton.disabled = true;
	try {
		const {
			confirmChange,
			... apiPasswordData
		} = passwordData;
		const response = await updatePassword(apiPasswordData);
		form.reset();
		context.showToast(response.message || 'Hasło zostało zmienione.');
	} catch (error) {
		if (!showFieldErrors(form, error.details)) {
			showFormError(form, error.message);
		}
	} finally {
		submitButton.disabled = false;
	}
}

async function init(context) {
	const profileForm = document.querySelector('#profileForm');
	const passwordForm = document.querySelector('#passwordForm');
	if (!profileForm || !passwordForm) {
		return;
	}
	profileForm.elements.birthdate.max = new Date()
	.toISOString()
	.slice(0, 10);
	profileForm.addEventListener('submit', (event) => handleProfileSubmit(event, context));
	passwordForm.addEventListener('submit', (event) => handlePasswordSubmit(event, context));
	await loadProfile(profileForm);
}

export {
	init
};
