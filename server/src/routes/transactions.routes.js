/**
 * Routing transakcji właściciela: CRUD, filtrowanie, sortowanie i paginacja.
 */
const express = require('express');
const TransactionController = require('../controllers/transaction.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();
router.get('/', requireAuth, TransactionController.listTransactions);
router.post('/', requireAuth, TransactionController.createTransaction);
router.get('/:id', requireAuth, TransactionController.getTransaction);
router.patch('/:id', requireAuth, TransactionController.updateTransaction);
router.delete('/:id', requireAuth, TransactionController.deleteTransaction);
module.exports = router;
