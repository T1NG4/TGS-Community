'use strict';

const path = require('path');
const { createApp, setPaths } = require('./app');

const PORT = process.env.PORT || 3001;
const BASE_PATH = path.join(__dirname, '../../[TGS-Fivem-Pack]');
const OUTPUT_PATH = path.join(__dirname, '../../output');
const DIST_PATH = path.join(__dirname, '../../client/dist');

setPaths(BASE_PATH, OUTPUT_PATH, DIST_PATH);
const app = createApp(false); // dev mode — Vite serves frontend

app.listen(PORT, () => {
  console.log(`[Dev Server] http://localhost:${PORT}`);
});
