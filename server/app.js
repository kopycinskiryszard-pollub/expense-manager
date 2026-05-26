/**
 * Konfiguracja aplikacji Express: parser JSON, pliki statyczne, routing API i globalna obsługa błędów.
 */
const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/index.routes');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/users.routes');
const categoryRoutes = require('./src/routes/categories.routes');
const transactionRoutes = require('./src/routes/transactions.routes');
const budgetRoutes = require('./src/routes/budgets.routes');
const goalRoutes = require('./src/routes/goals.routes');
const reportRoutes = require('./src/routes/reports.routes');
const errorMiddleware = require('./src/middleware/error.middleware');
const {
	error
} = require('./src/utils/response');
const MESSAGES = require('./src/utils/messages');
const app = express();
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.json());
app.use(express.static(publicPath));
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', (req, res) => {
	return error(res, 404, MESSAGES.ROUTE_NOT_FOUND);
});
app.use(errorMiddleware);
module.exports = app;
