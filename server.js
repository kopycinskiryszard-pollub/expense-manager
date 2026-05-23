const express = require('express');
require('dotenv').config();
const {query} = require('./database/db');
/* Import modułów routes. */
const apiRoutes = require('./src/routes/index.routes');
const authRoutes = require('./src/routes/auth.routes');
/* Import modułów błędów i komunikacji. */
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	success,
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
/* Główna konfiguracja i obsługa JSON. */
app.use(express.json());
app.use(express.static('public'));
/* Obsługa podstawowych endpointów API. */
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.get('/api/test-db', async (req, res, next) => {
	try {
		const result = await query('SELECT 1 AS test');
		return success(res, 200, MESSAGES.DB_CONNECTED, result[0]);
	} catch (err) {
		next(err);
	}
});
/* Obsługa nieistniejących endpointów. */
app.use('/api', (req, res) => {
	return error(res, 404, MESSAGES.ROUTE_NOT_FOUND);
});
/* Globalna obsługa błędów. */
app.use(errorMiddleware);
/* Uruchomienie serwera HTTP. */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Serwer działa na porcie ${PORT}`);
});