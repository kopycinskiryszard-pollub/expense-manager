import {apiGet} from './client.js';

export function getDashboardSummary() {
	return apiGet('/api/dashboard/summary');
}
