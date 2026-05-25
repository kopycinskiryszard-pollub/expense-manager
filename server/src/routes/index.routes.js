/**
 * Podstawowe publiczne endpointy API, w tym informacja o działaniu backendu.
 */
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
router.get('/health', (req, res) => {
	return success(res, 200, MESSAGES.API_WORKS, {
		status: 'ok',
		app: 'expense_manager',
		env: process.env.NODE_ENV || 'development'
	});
});
module.exports = router;
