const UserModel = require('../models/user.model');
const {success} = require('../utils/response');

async function getUsers(req, res, next) {
	try {
		const users = await UserModel.findAllUsers();
		return success(res, 200, 'Lista użytkowników została pobrana.', users);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getUsers
};