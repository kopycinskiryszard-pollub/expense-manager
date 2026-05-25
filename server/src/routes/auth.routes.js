const express = require('express');
const AuthController = require('../controllers/auth.controller');
const {requireAuth} = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/session', requireAuth, AuthController.session);

module.exports = router;
