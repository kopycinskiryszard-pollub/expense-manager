const AppError = require('../utils/errors');

function requireAdmin(req, res, next) {
	if (!req.user) {
		return next(new AppError('Wymagane logowanie.', 401));
	}
	if (req.user.role !== 'admin') {
		return next(new AppError('Brak uprawnień administratora.', 403));
	}
	next();
}

module.exports = requireAdmin;