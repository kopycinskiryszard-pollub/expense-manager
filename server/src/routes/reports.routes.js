/**
 * Routing raportów finansowych właściciela.
 */
const express = require('express');
const ReportController = require('../controllers/report.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();
router.get('/monthly', requireAuth, ReportController.getMonthlyReport);
router.get('/yearly/transactions', requireAuth, ReportController.getYearlyReportTransactions);
router.get('/yearly', requireAuth, ReportController.getYearlyReport);
module.exports = router;
