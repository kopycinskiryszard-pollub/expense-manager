const bcrypt = require('bcryptjs');

/*	Moduł odpowiedzialny za bezpieczeństwo haseł. */
async function hashPassword(password) {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
}

/* Porównanie zaszyfrowanych haseł. */
async function comparePassword(password, hash) {
	return await bcrypt.compare(password, hash);
}

/* EXPORT */
module.exports = {
	hashPassword,
	comparePassword
};