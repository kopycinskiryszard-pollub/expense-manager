/**
 * Punkt startowy backendu: ładuje konfigurację środowiska i uruchamia serwer HTTP.
 */
require('dotenv')
.config();
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Serwer działa na porcie ${PORT}`);
});
