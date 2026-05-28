import {login} from '../api/auth.api.js';
import {setSession} from '../state/session.js';
import {validateLoginData} from '../validators/auth.validators.js';
import {clearFieldErrors, showFieldErrors, showFormError} from './form-errors.js';

/**
 * Podłącza akcje widoku logowania.
 * @param {object} context - Wspólne zależności UI.
 * @returns {void} Nie zwraca wartości.
 */
function init(context) {
	const form = document.querySelector('#loginForm');
	if (!form) {
		return;
	}
	const expiredSessionMessage = context.sessionExpiredMessageKey ? sessionStorage.getItem(context.sessionExpiredMessageKey) : null;
	if (expiredSessionMessage) {
		showFormError(form, expiredSessionMessage);
		sessionStorage.removeItem(context.sessionExpiredMessageKey);
	}
	const cancelButton = document.querySelector('#cancelLogin');
	cancelButton?.addEventListener('click', () => {
		form.reset();
		clearFieldErrors(form);
		context.navigate('/about');
	});
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const submitButton = form.querySelector('[type="submit"]');
		const formData = new FormData(form);
		const loginData = {
			identifier: formData.get('identifier'),
			password: formData.get('password')
		};
		clearFieldErrors(form);
		if (showFieldErrors(form, validateLoginData(loginData))) {
			return;
		}
		submitButton.disabled = true;
		try {
			const response = await login(loginData);
			setSession(response.data);
			context.updateAuthActions();
			context.showToast(response.message || 'Zalogowano.');
			context.navigate('/dashboard');
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
