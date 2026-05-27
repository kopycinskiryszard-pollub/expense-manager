import {register} from '../api/auth.api.js';
import {validateRegisterData} from '../validators/auth.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';

/**
 * Podłącza akcje widoku rejestracji.
 * @param {object} context - Wspólne zależności UI.
 * @returns {void} Nie zwraca wartości.
 */
function init(context) {
	const form = document.querySelector('#registerForm');
	if (!form) {
		return;
	}
	const clearButton = document.querySelector('#clearRegister');
	clearButton?.addEventListener('click', () => {
		form.reset();
		clearFieldErrors(form);
	});
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const submitButton = form.querySelector('[type="submit"]');
		const formData = new FormData(form);
		const registerData = {
			login: formData.get('login'),
			email: formData.get('email'),
			password: formData.get('password')
		};
		clearFieldErrors(form);
		if (showFieldErrors(form, validateRegisterData(registerData))) {
			return;
		}
		submitButton.disabled = true;
		try {
			const response = await register(registerData);
			context.showToast(response.message || 'Konto zostało utworzone.');
			context.navigate('/login');
		} catch (error) {
			if (!showFieldErrors(form, error.details)) {
				showFormError(form, error.message);
			}
		} finally {
			submitButton.disabled = false;
		}
	});
}

export {
	init
};
