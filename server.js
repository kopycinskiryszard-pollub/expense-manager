const express = require('express');
require('dotenv')
.config();
const {query} = require('./database/db');
/* IMPORT  */
const apiRoutes = require('./src/routes/index.routes');
const authRoutes = require('./src/routes/auth.routes');
/* Import modułów błędów i odpowiedzi. */
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	success,
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
/* Główna konfiguracja i obsługa JSON. */
app.use(express.json());
/* Obsługa statycznych plików frontendu. */
app.use(express.static('public'));
/* Obsługa podstawowych endpointów API. */
app.use('/api', apiRoutes);
/* Obsługa endpointów uwierzytelniania. */
app.use('/api/auth', authRoutes);
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