/**
 * Definicja błędu aplikacyjnego przenoszącego kod HTTP i szczegóły błędu.
 */
/**
 * Błąd aplikacji przekazywany do globalnego middleware obsługi błędów.
 */
class AppError
	extends Error {
	/**
	 * Tworzy błąd aplikacji z kodem HTTP i opcjonalnymi szczegółami.
	 * @param {string} message - Komunikat błędu.
	 * @param {number} statusCode - Kod statusu HTTP.
	 * @param {*} details - Dodatkowe szczegóły błędu.
	 */
	constructor(message, statusCode = 500, details = null) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
	}
}

module.exports = AppError;
