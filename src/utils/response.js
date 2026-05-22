/* Generowanie pozytywnej odpowiedzi JSON */
function success(res, statusCode = 200, message = 'Operacja zakończona pomyślnie.', data = null) {
	return res.status(statusCode).json({
		success: true,
		message,
		data
	});
}

/* Generowanie negatywnej odpowiedzi JSON */
function error(res, statusCode = 500, message = 'Wystąpił błąd serwera.', details = null) {
	return res.status(statusCode).json({
		success: false,
		message,
		details
	});
}

module.exports = {
	success,
	error
};