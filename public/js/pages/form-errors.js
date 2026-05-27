/**
 * Czyści błędy formularza.
 * @param {HTMLFormElement} form - Formularz.
 * @returns {void} Nie zwraca wartości.
 */
export function clearFieldErrors(form) {
	form.querySelectorAll('.form-error')
		.forEach((errorElement) => errorElement.remove());
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
	const errorElement = document.createElement('span');
	errorElement.className = 'form-error form-general-error';
	errorElement.textContent = message;
	form.prepend(errorElement);
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
			  const errorElement = document.createElement('span');
			  errorElement.className = 'form-error form-field-error';
			  errorElement.id = errorID;
			  errorElement.textContent = Array.isArray(message) ? message.join(' ') : String(message);
			  field.classList.add('has-error');
			  input.setAttribute('aria-invalid', 'true');
			  input.setAttribute('aria-describedby', errorID);
			  field.append(errorElement);
			  hasFieldError = true;
		  });
	return hasFieldError;
}
