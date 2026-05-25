/**
 * Pomocnicze funkcje budujące ujednolicone odpowiedzi JSON API.
 */
/**
 * Wysyła odpowiedź JSON dla zakończonej powodzeniem operacji API.
 * @param {object} res - Odpowiedź Express.
 * @param {number} statusCode - Kod statusu HTTP.
 * @param {string} message - Komunikat dla klienta API.
 * @param {*} data - Dane zwracane w odpowiedzi.
 * @returns {*} Wynik wywołania res.json.
 */
function success(res, statusCode = 200, message = 'Operacja zakończona pomyślnie.', data = null) {
	return res.status(statusCode)
			  .json({
				  success: true,
				  message,
				  data
			  });
}

/**
 * Wysyła odpowiedź JSON dla błędu API.
 * @param {object} res - Odpowiedź Express.
 * @param {number} statusCode - Kod statusu HTTP.
 * @param {string} message - Komunikat błędu dla klienta API.
 * @param {*} details - Szczegóły błędu, np. błędy walidacji.
 * @returns {*} Wynik wywołania res.json.
 */
function error(res, statusCode = 500, message = 'Wystąpił błąd serwera.', details = null) {
	return res.status(statusCode)
			  .json({
				  success: false,
				  message,
				  details
			  });
}

module.exports = {
	success,
	error
};
