/**
 * Routing profilu użytkownika dostępny po uwierzytelnieniu sesją.
 */
const express = require('express');
const UserController = require('../controllers/user.controller');
const {requireAuth} = require('../middleware/auth.middleware');
const router = express.Router();
router.get('/me', requireAuth, UserController.getMe);
router.patch('/me', requireAuth, UserController.updateMe);
router.patch('/me/password', requireAuth, UserController.updatePassword);
module.exports = router;
