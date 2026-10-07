const config = require('./src/config');
const createApp = require('./src/app');

const app = createApp();

app.listen(config.port, config.host, () => {
  const modeLabel = config.isDemo ? 'DEMO' : 'FIREBASE';
  console.log(`[ALEX.IO] ${modeLabel} mode`);
  console.log(`[ALEX.IO] API listening on http://localhost:${config.port}`);
  if (config.isDemo) {
    console.log('[ALEX.IO] Running without Firebase. Data is stored in server/data/db.json.');
  }
});
