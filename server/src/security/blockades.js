const BlockadeModel = require('../models/blockade.model');

/**
 * Pobiera maksymalną liczbę błędnych prób logowania z konfiguracji.
 * @returns {number} Maksymalna liczba błędnych prób logowania.
 */
function getLoginMaxAttempts() {
	return Number(process.env.LOGIN_MAX_ATTEMPTS) || 3;
}

/**
 * Pobiera czas blokady logowania z konfiguracji.
 * @returns {number} Czas blokady w minutach.
 */
function getLoginLockMinutes() {
	return Number(process.env.LOGIN_LOCK_MINUTES) || 10;
}

/**
 * Normalizuje identyfikator logowania przed zapisem lub porównaniem.
 * @param {*} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {string} Znormalizowany identyfikator.
 */
function normalizeIdentifier(identifier) {
	return String(identifier || '')
	.trim()
	.toLowerCase();
}

/**
 * Wylicza datę zakończenia blokady logowania.
 * @returns {Date} Data zakończenia blokady.
 */
function getLockedUntil() {
	const lockedUntil = new Date();
	lockedUntil.setMinutes(lockedUntil.getMinutes() + getLoginLockMinutes());
	return lockedUntil;
}

/**
 * Czyści przedawnione blokady logowania.
 * @returns {Promise<number>} Liczba usuniętych blokad.
 */
async function cleanExpiredBlockades() {
	return await BlockadeModel.deleteExpiredBlockades();
}

/**
 * Sprawdza, czy identyfikator jest aktualnie zablokowany.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<boolean>} True, jeśli identyfikator jest zablokowany.
 */
async function isIdentifierLocked(identifier) {
	const normalizedIdentifier = normalizeIdentifier(identifier);
	const blockade = await BlockadeModel.findBlockadeByIdentifier(normalizedIdentifier);
	if (!blockade || !blockade.lockedUntil) {
		return false;
	}
	return new Date(blockade.lockedUntil) > new Date();
}

/**
 * Rejestruje nieudaną próbę logowania i zakłada blokadę po przekroczeniu limitu.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function registerFailedLogin(identifier) {
	const normalizedIdentifier = normalizeIdentifier(identifier);
	const blockade = await BlockadeModel.findBlockadeByIdentifier(normalizedIdentifier);
	const maxAttempts = getLoginMaxAttempts();
	if (!blockade) {
		await BlockadeModel.createBlockade(normalizedIdentifier);
		if (maxAttempts <= 1) {
			await BlockadeModel.lockIdentifier(normalizedIdentifier, getLockedUntil());
		}
		return;
	}
	const nextCount = Number(blockade.count) + 1;
	await BlockadeModel.incrementBlockadeCount(normalizedIdentifier);
	if (nextCount >= maxAttempts) {
		await BlockadeModel.lockIdentifier(normalizedIdentifier, getLockedUntil());
	}
}

/**
 * Czyści licznik błędnych prób po poprawnym logowaniu.
 * @param {string} identifier - Login albo e-mail użyty podczas logowania.
 * @returns {Promise<number>} Liczba usuniętych wpisów blokad.
 */
async function clearFailedLogins(identifier) {
	const normalizedIdentifier = normalizeIdentifier(identifier);
	return await BlockadeModel.deleteBlockade(normalizedIdentifier);
}

module.exports = {
	normalizeIdentifier,
	cleanExpiredBlockades,
	isIdentifierLocked,
	registerFailedLogin,
	clearFailedLogins
};
