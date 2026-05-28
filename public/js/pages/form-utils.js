/**
 * Formatuje kwotę do widoku.
 * @param {number|string} amount - Kwota.
 * @returns {string} Kwota w PLN.
 */
export function formatAmount(amount) {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency: 'PLN'
	})
	.format(Number(amount || 0));
}

/**
 * Ogranicza wpisywaną kwotę do formatu obsługiwanego przez API.
 * @param {string} value - Wartość pola kwoty.
 * @param {number} maxIntegerDigits - Maksymalna liczba cyfr przed kropką.
 * @returns {string} Oczyszczona wartość.
 */
export function sanitizeAmount(value, maxIntegerDigits = 8) {
	const normalized = String(value || '')
	.replace(',', '.')
	.replace(/[^\d.]/g, '');
	const [integerPart = '', decimalPart = ''] = normalized.split('.');
	const integer = integerPart.replace(/^0+(?=\d)/, '')
							   .slice(0, maxIntegerDigits);
	const decimals = decimalPart.slice(0, 2);
	return normalized.includes('.') ? `${integer || '0'}.${decimals}` : integer;
}
