const {success} = require('../utils/response');
const express = require('express');
const MESSAGES = require('../utils/messages');
const router = express.Router();
/* Główny endpoint testowy API. */
router.get('/', (req, res) => {
	return success(res, 200, MESSAGES.API_WORKS, {
		app: 'expense_manager',
		version: '1.0.0'
	});
});
/* EXPORT */
module.exports = router;