import {apiRequest} from './client.js';

/**
 * Loguje użytkownika.
 * @param {object} credentials - Dane logowania.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function login(credentials) {
	return apiRequest('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

/**
 * Rejestruje użytkownika.
 * @param {object} userData - Dane rejestracji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function register(userData) {
	return apiRequest('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify(userData)
	});
}

/**
 * Wylogowuje użytkownika.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function logout() {
	return apiRequest('/api/auth/logout', {
		method: 'POST'
	});
}

/**
 * Pobiera aktualną sesję użytkownika.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getCurrentSession() {
	return apiRequest('/api/auth/session');
}
