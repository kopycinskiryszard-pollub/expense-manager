/**
 * Routing celów oszczędnościowych właściciela.
 */
const express = require('express');
const GoalController = require('../controllers/goal.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();
router.get('/history', requireAuth, GoalController.listGoalHistory);
router.get('/', requireAuth, GoalController.listGoals);
router.post('/', requireAuth, GoalController.createGoal);
router.get('/:id', requireAuth, GoalController.getGoal);
router.patch('/:id', requireAuth, GoalController.updateGoal);
router.patch('/:id/amount', requireAuth, GoalController.updateGoalAmount);
router.patch('/:id/close', requireAuth, GoalController.closeGoal);
router.delete('/:id', requireAuth, GoalController.deleteGoal);
module.exports = router;
