/**
 * Czyści błędy formularza.
 * @param {HTMLFormElement} form - Formularz.
 * @returns {void} Nie zwraca wartości.
 */
export function clearFieldErrors(form) {
	form.querySelectorAll('.form-error')
		.forEach((errorElement) => {
			errorElement.textContent = '';
		});
	form.querySelectorAll('.form-field.has-error')
		.forEach((field) => field.classList.remove('has-error'));
	form.querySelectorAll('[aria-invalid="true"]')
		.forEach((input) => {
			input.removeAttribute('aria-invalid');
			input.removeAttribute('aria-describedby');
		});
}

/**
 * Wyświetla błąd ogólny formularza.
 * @param {HTMLFormElement} form - Formularz.
 * @param {string} message - Komunikat błędu.
 * @returns {void} Nie zwraca wartości.
 */
export function showFormError(form, message) {
	const errorElement = form.querySelector('[data-form-error], .form-general-error');
	if (!errorElement) {
		return;
	}
	errorElement.textContent = message;
}

/**
 * Wyświetla błędy przy konkretnych polach formularza.
 * @param {HTMLFormElement} form - Formularz.
 * @param {object|null} details - Błędy API pogrupowane po nazwach pól.
 * @returns {boolean} Czy pokazano przynajmniej jeden błąd pola.
 */
export function showFieldErrors(form, details) {
	if (!details || typeof details !== 'object') {
		return false;
	}
	let hasFieldError = false;
	Object.entries(details)
		  .forEach(([fieldName, message]) => {
			  const input = form.elements[fieldName];
			  if (!input) {
				  return;
			  }
			  const field = input.closest('.form-field');
			  if (!field) {
				  return;
			  }
			  const errorID = `${input.id || fieldName}Error`;
			  const errorElement = field.querySelector(`#${CSS.escape(errorID)}, [data-field-error-for="${fieldName}"]`);
			  if (!errorElement) {
				  return;
			  }
			  errorElement.textContent = Array.isArray(message) ? message.join(' ') : String(message);
			  field.classList.add('has-error');
			  input.setAttribute('aria-invalid', 'true');
			  if (errorElement.id) {
				  input.setAttribute('aria-describedby', errorElement.id);
			  }
			  hasFieldError = true;
		  });
	return hasFieldError;
}
