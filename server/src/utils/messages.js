/**
 * Centralny słownik komunikatów tekstowych zwracanych przez API.
 */
/**
 * Centralny zestaw komunikatów zwracanych przez API.
 * @type {Record<string, string>}
 */
const MESSAGES = {
	AUTH_REGISTER_SUCCESS: 'Konto zostało utworzone.',
	AUTH_REGISTER_LOGIN_EXISTS: 'Podany login jest już zajęty.',
	AUTH_REGISTER_LOGIN_REQUIREMENTS: 'Login musi mieć 6-20 znaków, litery, cyfry oraz _ .',
	AUTH_REGISTER_EMAIL_EXISTS: 'Podany e-mail jest już zajęty.',
	AUTH_REGISTER_EMAIL_REQUIREMENTS: 'Podany e-mail ma nieprawidłowy format.',
	AUTH_REGISTER_PASSWORD_REQUIREMENTS: 'Hasło musi mieć co najmniej 8 znaków, w tym małą i dużą literę, cyfrę oraz znak specjalny !@#$%^&*()_+-=? .',
	AUTH_LOGIN_SUCCESS: 'Zalogowano pomyślnie.',
	AUTH_LOGIN_IDENTIFIER_REQUIREMENTS: 'Podaj poprawny login albo e-mail.',
	AUTH_LOGIN_INVALID_CREDENTIALS: 'Nieprawidłowy login lub hasło.',
	AUTH_LOGIN_ACCOUNT_LOCKED: 'Konto zostało tymczasowo zablokowane.',
	AUTH_LOGOUT_SUCCESS: 'Wylogowano pomyślnie.',
	AUTH_REQUIRED: 'Musisz być zalogowany.',
	AUTH_FORBIDDEN: 'Brak uprawnień do wykonania tej operacji.',
	AUTH_SESSION_ACTIVE: 'Sesja użytkownika jest aktywna.',
	AUTH_SESSION_EXPIRED: 'Sesja wygasła. Zaloguj się ponownie.',
	AUTH_SESSION_INVALID: 'Nieprawidłowa sesja użytkownika.',
	USER_CREATED: 'Nowy użytkownik został utworzony.',
	USER_PROFILE_FETCHED: 'Dane użytkownika zostały pobrane.',
	USER_UPDATED: 'Dane użytkownika zostały zaktualizowane.',
	TRANSACTION_CREATED: 'Transakcja została dodana.',
	TRANSACTION_UPDATED: 'Transakcja została zaktualizowana.',
	TRANSACTION_DELETED: 'Transakcja została usunięta.',
	TRANSACTION_NOT_FOUND: 'Nie znaleziono transakcji.',
	BUDGET_CREATED: 'Budżet został utworzony.',
	BUDGET_UPDATED: 'Budżet został zaktualizowany.',
	BUDGET_DELETED: 'Budżet został usunięty.',
	BUDGET_NOT_FOUND: 'Nie znaleziono budżetu.',
	GOAL_CREATED: 'Cel został utworzony.',
	GOAL_UPDATED: 'Cel został zaktualizowany.',
	GOAL_DELETED: 'Cel został usunięty.',
	GOAL_NOT_FOUND: 'Nie znaleziono celu.',
	API_WORKS: 'API działa poprawnie.',
	DB_CONNECTED: 'Połączenie z bazą danych działa poprawnie.',
	ROUTE_NOT_FOUND: 'Nie znaleziono wskazanej ścieżki API.',
	CATEGORY_NOT_FOUND: 'Nie znaleziono kategorii.',
	VALIDATION_ERROR: 'Przesłane dane są nieprawidłowe.',
	SERVER_ERROR: 'Wystąpił błąd serwera.',
	DB_ERROR: 'Wystąpił błąd bazy danych.'
};

module.exports = MESSAGES;
