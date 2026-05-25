/**
 * Globalny middleware błędów zamieniający wyjątki na odpowiedzi JSON.
 */
const {error} = require('../utils/response');
const MESSAGES = require('../utils/messages');

/**
 * Zamienia błędy aplikacji na ujednoliconą odpowiedź JSON.
 * @param {Error & {statusCode?: number, details?: *}} err - Błąd przekazany przez kontroler lub middleware.
 * @param {object} req - Żądanie Express.
 * @param {object} res - Odpowiedź Express.
 * @param {Function} next - Funkcja kolejnego middleware, wymagana przez Express.
 * @returns {*} Odpowiedź JSON z błędem.
 */
function errorMiddleware(err, req, res, next) {
	console.error(err);
	const statusCode = err.statusCode || 500;
	const message = err.message || MESSAGES.SERVER_ERROR;
	const details = err.details || null;
	return error(res, statusCode, message, details);
}

module.exports = errorMiddleware;
