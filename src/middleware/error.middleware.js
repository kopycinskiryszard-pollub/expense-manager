const {error} = require('../utils/response');
const MESSAGES = require('../utils/messages');

/**
 * Obsługa błędów.
 */
function errorMiddleware(err, req, res, next) {
	console.error(err);
	const statusCode = err.statusCode || 500;
	const message = err.message || MESSAGES.SERVER_ERROR;
	const details = err.details || null;
	return error(res, statusCode, message, details);
}

module.exports = errorMiddleware;