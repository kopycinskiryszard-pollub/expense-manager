async function getAdminUsers() {
	const response = await fetch('/api/admin/users');
	const result = await response.json();
	if (!response.ok) {
		throw new Error(result.message || 'Nie udało się pobrać użytkowników.');
	}
	return result;
}

function renderUsers(users) {
	const tableBody = document.querySelector('#usersTableBody');
	if (!users.length) {
		tableBody.innerHTML = `
			<tr>
				<td colspan="5">Brak użytkowników.</td>
			</tr>
		`;
		return;
	}
	tableBody.replaceChildren();
	users.forEach((user) => {
		const row = document.createElement('tr');
		[user.login, user.email, user.name || '-', user.surname || '-', user.role].forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.append(cell);
		});
		tableBody.append(row);
	});
}

async function loadUsers() {
	const tableBody = document.querySelector('#usersTableBody');
	try {
		const response = await getAdminUsers();
		renderUsers(response.data || []);
	} catch (error) {
		tableBody.innerHTML = `
			<tr>
				<td colspan="5">${error.message}</td>
			</tr>
		`;
	}
}

async function init() {
	const tableBody = document.querySelector('#usersTableBody');
	if (!tableBody) {
		return;
	}
	await loadUsers();
}

export {init};