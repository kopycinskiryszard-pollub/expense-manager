const express = require('express');
require('dotenv').config();
const {query} = require('./database/db');
const apiRoutes = require('./src/routes/index.routes');
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	success,
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
// Obsługa danych JSON przesyłanych w body żądania
app.use(express.json());
// Obsługa plików statycznych frontendu
app.use(express.static('public'));
// Obsługa podstawowych endpointów API
app.use('/api', apiRoutes);
// Test połączenia z bazą danych
app.get('/api/test-db', async (req, res, next) => {
	try {
		const result = await query('SELECT 1 AS test');
		return success(res, 200, MESSAGES.DB_CONNECTED, result[0]);
	} catch (err) {
		next(err);
	}
});
// Obsługa nieistniejących endpointów
app.use('/api', (req, res) => {
	return error(res, 404, MESSAGES.ROUTE_NOT_FOUND);
});
// Globalna obsługa błędów
app.use(errorMiddleware);
// Uruchomienie serwera HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Serwer działa na porcie ${PORT}`);
});