/**
 * Routing danych pulpitu zalogowanego uzytkownika.
 */
const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/summary', requireAuth, DashboardController.getSummary);

module.exports = router;
