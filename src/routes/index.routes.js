const {success} = require('../utils/response');
const express = require('express');
const MESSAGES = require('../utils/messages');
const router = express.Router();
router.get('/', (req, res) => {
	return success(res, 200, MESSAGES.API_WORKS, {
		app: 'expense_manager',
		version: '1.0.0'
	});
});
module.exports = router;