const sessionKey = 'expense-manager-session';

/**
 * Pobiera dane sesji zapisane w przeglądarce.
 * @returns {object|null} Dane sesji albo null.
 */
export function getSession() {
	try {
		return JSON.parse(localStorage.getItem(sessionKey) || 'null');
	} catch (error) {
		return null;
	}
}

/**
 * Zapisuje lub usuwa dane sesji.
 * @param {object|null} session - Dane sesji albo null.
 * @returns {void} Nie zwraca wartości.
 */
export function setSession(session) {
	if (!session) {
		localStorage.removeItem(sessionKey);
		return;
	}
	localStorage.setItem(sessionKey, JSON.stringify(session));
}

/**
 * Zwraca identyfikator zapisanej sesji.
 * @returns {string|null} Identyfikator sesji albo null.
 */
export function getSessionID() {
	const savedSession = getSession();
	return savedSession?.session?.sessionID || savedSession?.sessionID || null;
}
