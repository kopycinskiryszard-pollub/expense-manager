const express = require('express');
const {success} = require('../utils/response');
const MESSAGES = require('../utils/messages');
const router = express.Router();
/*	Główna trasa testowa API.
	Pozwala sprawdzić, czy backend działa i czy routing jest poprawnie podpięty. */
router.get('/', (req, res) => {
	return success(res, 200, MESSAGES.API_WORKS, {
		app: 'expense_manager',
		version: '1.0.0'
	});
});
module.exports = router;