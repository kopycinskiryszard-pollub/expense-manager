/* Pomocnicza klasa błędu aplikacji */
class AppError
	extends Error {
	constructor(message, statusCode = 500, details = null) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
	}
}

/* EXPORT */
module.exports = AppError;