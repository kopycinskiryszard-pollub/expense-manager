import {apiGet, apiPost} from './client.js';

/**
 * Loguje użytkownika.
 * @param {object} credentials - Dane logowania.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function login(credentials) {
	return apiPost('/api/auth/login', credentials);
}

/**
 * Rejestruje użytkownika.
 * @param {object} userData - Dane rejestracji.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function register(userData) {
	return apiPost('/api/auth/register', userData);
}

/**
 * Wylogowuje użytkownika.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function logout() {
	return apiPost('/api/auth/logout');
}

/**
 * Pobiera aktualną sesję użytkownika.
 * @returns {Promise<object>} Odpowiedź API.
 */
export function getCurrentSession() {
	return apiGet('/api/auth/session');
}
