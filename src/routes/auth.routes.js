const express = require('express');
const AuthController = require('../controllers/auth.controller');
const router = express.Router();
// Endpoint rejestracji nowego użytkownika.
router.post('/register', AuthController.register);
// Endpoint logowania użytkownika
router.post('/login', AuthController.login);
// Export
module.exports = router;