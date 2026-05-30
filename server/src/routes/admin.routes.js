const express = require('express');
const AdminController = require('../controllers/admin.controller');
const requireAdmin = require('../middleware/admin.middleware');
const router = express.Router();
router.get('/users', requireAdmin, AdminController.getUsers);
module.exports = router;