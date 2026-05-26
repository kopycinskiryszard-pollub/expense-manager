/**
 * Agregator walidatorów: udostępnia wszystkie moduły walidacji przez jeden import.
 */
module.exports = {
	... require('./general.validators'),
	... require('./auth.validators'),
	... require('./user.validators'),
	... require('./transaction.validators'),
	... require('./budget.validators'),
	... require('./goal.validators')
};
