import {getCurrentSession, logout} from './api/auth.api.js';
import {getSession, getSessionID, setSession} from './state/session.js';
const app = document.querySelector('#app');
const menuButton = document.querySelector('#menuButton');
const mainNavigation = document.querySelector('#mainNavigation');
const accountMenuButton = document.querySelector('#accountMenuButton');
const accountActions = document.querySelector('#accountActions');
const themeButtons = document.querySelectorAll('[data-theme-option]');
const contrastButtons = document.querySelectorAll('[data-contrast-option]');
const logoutButton = document.querySelector('#logoutButton');
const toastRegion = document.querySelector('#toastRegion');
const preferencesKey = 'expense-manager-ui-preferences';
const sessionExpiredMessageKey = 'expense-manager-session-expired-message';
const authRoutes = new Set(['/login', '/register']);
const publicRoutes = new Set(['/about', '/login', '/register']);
const routes = {
	'/about': '/pages/about.html',
	'/dashboard': '/pages/dashboard.html',
	'/transactions': '/pages/transactions.html',
	'/budgets': '/pages/budgets.html',
	'/goals': '/pages/goals.html',
	'/reports': '/pages/reports.html',
	'/profile': '/pages/profile.html',
	'/login': '/pages/login.html',
	'/register': '/pages/register.html'
};
const defaultPreferences = {
	theme: 'red',
	contrast: 'none'
};

/**
 * Pobiera zapisane preferencje wyglądu.
 * @returns {{theme: string, contrast: string}} Preferencje interfejsu.
 */
function getPreferences() {
	try {
		const savedPreferences = JSON.parse(localStorage.getItem(preferencesKey) || '{}');
		return {
			... defaultPreferences, ... savedPreferences
		};
	} catch (error) {
		return defaultPreferences;
	}
}

/**
 * Zapisuje preferencje wyglądu.
 * @param {object} preferences - Preferencje do zapisu.
 * @returns {void} Nie zwraca wartości.
 */
function savePreferences(preferences) {
	localStorage.setItem(preferencesKey, JSON.stringify(preferences));
}

/**
 * Stosuje preferencje wyglądu do dokumentu.
 * @param {object} preferences - Preferencje interfejsu.
 * @returns {void} Nie zwraca wartości.
 */
function applyPreferences(preferences) {
	const isContrastMode = preferences.contrast !== 'none';
	document.body.classList.toggle('theme-green', !isContrastMode && preferences.theme === 'green');
	document.body.classList.toggle('theme-blue', !isContrastMode && preferences.theme === 'blue');
	document.body.classList.toggle('contrast-high', preferences.contrast === 'high');
	themeButtons.forEach((button) => {
		const isActive = !isContrastMode && button.dataset.themeOption === preferences.theme;
		button.setAttribute('aria-pressed', String(isActive));
	});
	contrastButtons.forEach((button) => {
		const isActive = button.dataset.contrastOption === preferences.contrast;
		button.setAttribute('aria-pressed', String(isActive));
	});
}

/**
 * Aktualizuje widoczność akcji zależnych od sesji.
 * @returns {void} Nie zwraca wartości.
 */
function updateAuthActions() {
	const hasSession = Boolean(getSession());
	document.querySelectorAll('[data-guest-action]')
			.forEach((element) => element.classList.toggle('hidden', hasSession));
	document.querySelectorAll('[data-user-action]')
			.forEach((element) => element.classList.toggle('hidden', !hasSession));
	closeAccountMenu();
}

/**
 * Sprawdza, czy bieżąca trasa wymaga zalogowania.
 * @param {string} route - Aktywna trasa.
 * @returns {boolean} Czy widok jest chroniony.
 */
function isProtectedRoute(route) {
	return !publicRoutes.has(route);
}

/**
 * Wyświetla krótki komunikat statusu.
 * @param {string} message - Treść komunikatu.
 * @returns {void} Nie zwraca wartości.
 */
function showToast(message) {
	const toast = document.createElement('div');
	toast.className = 'toast';
	toast.textContent = message;
	toastRegion.append(toast);
	setTimeout(() => {
		toast.remove();
	}, 3000);
}

/**
 * Zwraca aktywną ścieżkę routingu.
 * @returns {string} Ścieżka widoku.
 */
function getCurrentRoute() {
	const hash = window.location.hash.replace('#', '');
	return routes[hash] ? hash : '/about';
}

/**
 * Przechodzi do wskazanej trasy.
 * @param {string} route - Trasa aplikacji.
 * @returns {void} Nie zwraca wartości.
 */
function navigate(route) {
	window.location.hash = `#${route}`;
}

/**
 * Zamyka rozwijane menu nawigacji.
 * @returns {void} Nie zwraca wartości.
 */
function closeMainNavigation() {
	mainNavigation.classList.remove('open');
	menuButton.setAttribute('aria-expanded', 'false');
}

/**
 * Zamyka rozwijane menu użytkownika.
 * @returns {void} Nie zwraca wartości.
 */
function closeAccountMenu() {
	accountActions.classList.remove('open');
	accountMenuButton.setAttribute('aria-expanded', 'false');
}

/**
 * Zamyka wszystkie rozwijane menu poza opcjonalnie wskazanym.
 * @param {string|null} except - Menu, które ma pozostać otwarte.
 * @returns {void} Nie zwraca wartości.
 */
function closeDropdowns(except = null) {
	if (except !== 'navigation') {
		closeMainNavigation();
	}
	if (except !== 'account') {
		closeAccountMenu();
	}
}

/**
 * Odświeża dane zapisanej sesji na podstawie backendu.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function refreshSession() {
	if (!getSessionID()) {
		setSession(null);
		updateAuthActions();
		return;
	}
	try {
		const response = await getCurrentSession();
		setSession(response.data);
	} catch (error) {
		setSession(null);
		if (isProtectedRoute(getCurrentRoute())) {
			sessionStorage.setItem(
				sessionExpiredMessageKey,
				'Nastąpiło automatyczne wylogowanie z powodu braku aktywności.'
			);
			navigate('/login');
		}
	}
	updateAuthActions();
}

/**
 * Ustawia aktywny link nawigacji.
 * @param {string} route - Aktywna trasa.
 * @returns {void} Nie zwraca wartości.
 */
function updateActiveNavigation(route) {
	document.querySelectorAll('[data-route-link]')
			.forEach((link) => {
				if (link.dataset.routeLink === route) {
					link.setAttribute('aria-current', 'page');
				} else {
					link.removeAttribute('aria-current');
				}
			});
}

/**
 * Pobiera plik HTML widoku.
 * @param {string} route - Aktywna trasa.
 * @returns {Promise<string>} HTML widoku.
 */
async function loadPage(route) {
	const response = await fetch(routes[route], {
		cache: 'no-cache'
	});
	if (!response.ok) {
		throw new Error('Nie udało się pobrać widoku.');
	}
	return response.text();
}

/**
 * Ładuje moduł JS potrzebny dla aktywnego widoku.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function loadPageModule() {
	const moduleHost = app.querySelector('[data-module]');
	const modulePath = moduleHost?.dataset.module;
	if (!modulePath) {
		return;
	}
	const module = await import(modulePath);
	module.init?.({
		navigate,
		showToast,
		sessionExpiredMessageKey,
		updateAuthActions
	});
}

/**
 * Renderuje wskazany widok w głównej części strony.
 * @returns {Promise<void>} Nie zwraca wartości.
 */
async function renderRoute() {
	const route = getCurrentRoute();
	const hasSession = Boolean(getSession());
	if (isProtectedRoute(route) && !hasSession) {
		navigate('/login');
		return;
	}
	if (authRoutes.has(route) && hasSession) {
		navigate('/dashboard');
		return;
	}
	updateActiveNavigation(route);
	closeDropdowns();
	try {
		app.innerHTML = await loadPage(route);
		await loadPageModule();
	} catch (error) {
		app.innerHTML = `
			<header class="box-surface page-header">
				<h3>Błąd</h3>
				<h1>Nie udało się załadować strony</h1>
				<p class="lead">Spróbuj odświeżyć stronę albo wrócić do pulpitu.</p>
			</header>
		`;
	}
}

menuButton.addEventListener('click', () => {
	const shouldOpen = !mainNavigation.classList.contains('open');
	closeDropdowns('navigation');
	mainNavigation.classList.toggle('open', shouldOpen);
	menuButton.setAttribute('aria-expanded', String(shouldOpen));
});
accountMenuButton.addEventListener('click', () => {
	const shouldOpen = !accountActions.classList.contains('open');
	closeDropdowns('account');
	accountActions.classList.toggle('open', shouldOpen);
	accountMenuButton.setAttribute('aria-expanded', String(shouldOpen));
});
document.addEventListener('click', (event) => {
	if (menuButton.contains(event.target) || mainNavigation.contains(event.target) || accountMenuButton.contains(event.target)
		|| accountActions.contains(event.target)) {
		return;
	}
	closeDropdowns();
});
mainNavigation.addEventListener('click', (event) => {
	if (event.target.closest('a')) {
		closeMainNavigation();
	}
});
accountActions.addEventListener('click', (event) => {
	if (event.target.closest('a, button')) {
		closeAccountMenu();
	}
});
contrastButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const currentPreferences = getPreferences();
		const contrast = currentPreferences.contrast === button.dataset.contrastOption ? 'none' : button.dataset.contrastOption;
		const preferences = {
			... currentPreferences,
			contrast
		};
		savePreferences(preferences);
		applyPreferences(preferences);
	});
});
themeButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const preferences = {
			... getPreferences(),
			theme: button.dataset.themeOption,
			contrast: 'none'
		};
		savePreferences(preferences);
		applyPreferences(preferences);
	});
});
logoutButton.addEventListener('click', async () => {
	logoutButton.disabled = true;
	try {
		const response = await logout();
		showToast(response.message || 'Wylogowano.');
	} catch (error) {
		showToast(error.message);
	} finally {
		setSession(null);
		updateAuthActions();
		logoutButton.disabled = false;
		navigate('/login');
	}
});
window.addEventListener('hashchange', renderRoute);
applyPreferences(getPreferences());
refreshSession()
.finally(renderRoute);
