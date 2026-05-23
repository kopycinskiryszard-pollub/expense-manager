const MESSAGES = {
	/* Uwierzytelnienie */
	AUTH_REGISTER_SUCCESS: 'Konto zostało utworzone.',
	AUTH_LOGIN_EXISTS: 'Podany login jest już zajęty.',
	AUTH_LOGIN_REQUIREMENTS: 'Login musi mieć 6-20 znaków, litery, cyfry oraz _ .',
	AUTH_EMAIL_EXISTS: 'Podany e-mail jest już zajęty.',
	AUTH_EMAIL_REQUIREMENTS: 'Podany e-mail ma nieprawidłowy format.',
	AUTH_PASSWORD_REQUIREMENTS: 'Hasło musi mieć co najmniej 8 znaków, w tym małą i dużą literę, cyfrę oraz znak specjalny !@#$%^&*()_+-=? .',
	AUTH_LOGIN_SUCCESS: 'Zalogowano pomyślnie.',
	AUTH_LOGOUT_SUCCESS: 'Wylogowano pomyślnie.',
	AUTH_INVALID_CREDENTIALS: 'Nieprawidłowy login lub hasło.',
	AUTH_ACCOUNT_LOCKED: 'Konto zostało tymczasowo zablokowane.',
	AUTH_REQUIRED: 'Musisz być zalogowany.',
	AUTH_FORBIDDEN: 'Brak uprawnień do wykonania tej operacji.', //
	// /* Użytkownik */
	USER_UPDATED: 'Dane użytkownika zostały zaktualizowane.', //
	// /* Transakcje */
	TRANSACTION_CREATED: 'Transakcja została dodana.',
	TRANSACTION_UPDATED: 'Transakcja została zaktualizowana.',
	TRANSACTION_DELETED: 'Transakcja została usunięta.',
	TRANSACTION_NOT_FOUND: 'Nie znaleziono transakcji.', //
	// /* Budżet */
	BUDGET_CREATED: 'Budżet został utworzony.',
	BUDGET_UPDATED: 'Budżet został zaktualizowany.',
	BUDGET_DELETED: 'Budżet został usunięty.',
	BUDGET_NOT_FOUND: 'Nie znaleziono budżetu.', //
	// /* Cele */
	GOAL_CREATED: 'Cel został utworzony.',
	GOAL_UPDATED: 'Cel został zaktualizowany.',
	GOAL_DELETED: 'Cel został usunięty.',
	GOAL_NOT_FOUND: 'Nie znaleziono celu.',//
	/* API */
	API_WORKS: 'API działa poprawnie.',
	DB_CONNECTED: 'Połączenie z bazą danych działa poprawnie.',
	ROUTE_NOT_FOUND: 'Nie znaleziono wskazanej ścieżki API.', //
	/* Inne */
	CATEGORY_NOT_FOUND: 'Nie znaleziono kategorii.',
	VALIDATION_ERROR: 'Przesłane dane są nieprawidłowe.',
	SERVER_ERROR: 'Wystąpił błąd serwera.',
	DB_ERROR: 'Wystąpił błąd bazy danych.'
};
/* Export */
module.exports = MESSAGES;