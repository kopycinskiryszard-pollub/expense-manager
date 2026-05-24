const BlockadeModel = require('../models/blockade.model');

/**
 * Pobranie maksymalnej liczby błędnych prób logowania z konfiguracji.
 */
function getLoginMaxAttempts() {
	return Number(process.env.LOGIN_MAX_ATTEMPTS) || 3;
}

/**
 * Pobranie czasu blokady logowania z konfiguracji.
 */
function getLoginLockMinutes() {
	return Number(process.env.LOGIN_LOCK_MINUTES) || 10;
}

/**
 * Normalizacja identyfikatora logowania.
 */
function normalizeIdentifier(identifier) {
	return String(identifier || '')
	.trim()
	.toLowerCase();
}

/**
 * Wyliczenie daty zakończenia blokady.
 */
function getLockedUntil() {
	const lockedUntil = new Date();
	lockedUntil.setMinutes(lockedUntil.getMinutes() + getLoginLockMinutes());
	return lockedUntil;
}

/**
 * Czyszczenie przedawnionych blokad logowania.
 */
async function cleanExpiredBlockades() {
	return await BlockadeModel.deleteExpiredBlockades();
}

/**
 * Sprawdzenie, czy identyfikator jest aktualnie zablokowany.
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
 * Obsługa nieudanego logowania.
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
 * Obsługa poprawnego logowania.
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