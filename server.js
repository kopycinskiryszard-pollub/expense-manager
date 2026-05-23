const express = require('express');
require('dotenv').config();
const {query} = require('./database/db');
/* Routes */
const apiRoutes = require('./src/routes/index.routes');
const authRoutes = require('./src/routes/auth.routes');
/*  */
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	success,
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
/* Main */
app.use(express.json()); // Obsługa żądań JSON
app.use(express.static('public')); // Obsługa statycznych plików dla frontend-u
/* Obsługa podstawowych endpointów API */
app.use('/api', apiRoutes); // Ogólny
app.use('/api/auth', authRoutes); // Uwierzytelnianie
app.get('/api/test-db', async (req, res, next) => {
	try {
		const result = await query('SELECT 1 AS test');
		return success(res, 200, MESSAGES.DB_CONNECTED, result[0]);
	} catch (err) {
		next(err);
	}
});
/* Obsługa nieistniejących endpointów */
app.use('/api', (req, res) => {
	return error(res, 404, MESSAGES.ROUTE_NOT_FOUND);
});
/* Globalna obsługa błędów */
app.use(errorMiddleware);
/* Uruchomienie serwera HTTP */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Serwer działa na porcie ${PORT}`);
});