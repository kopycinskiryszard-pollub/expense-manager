const express = require('express');
const AuthController = require('../controllers/auth.controller');
const router = express.Router();
/* Endpoint rejestracji nowego użytkownika. */
router.post('/register', AuthController.register);
/* EXPORT */
module.exports = router;