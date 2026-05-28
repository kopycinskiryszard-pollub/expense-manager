/**
 * Routing budżetów miesięcznych właściciela.
 */
const express = require('express');
const BudgetController = require('../controllers/budget.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();
router.get('/', requireAuth, BudgetController.getBudgetForMonth);
router.post('/', requireAuth, BudgetController.createBudget);
router.get('/statuses', requireAuth, BudgetController.listBudgets);
router.get('/:id', requireAuth, BudgetController.getBudget);
router.patch('/:id', requireAuth, BudgetController.updateBudget);
router.delete('/:id', requireAuth, BudgetController.deleteBudget);
module.exports = router;
