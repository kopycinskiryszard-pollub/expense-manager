const express = require('express');
require('dotenv')
.config();
const {query} = require('./database/db');
const apiRoutes = require('./src/routes/index.routes');
const authRoutes = require('./src/routes/auth.routes');
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	success,
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', (req, res) => {
	return error(res, 404, MESSAGES.ROUTE_NOT_FOUND);
});
app.use(errorMiddleware);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Serwer działa na porcie ${PORT}`);
});