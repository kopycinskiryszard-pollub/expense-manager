import {apiGet, apiPatch} from './client.js';

export function getProfile() {
	return apiGet('/api/users/me');
}

export function updateProfile(profileData) {
	return apiPatch('/api/users/me', profileData);
}

export function updatePassword(passwordData) {
	return apiPatch('/api/users/me/password', passwordData);
}
