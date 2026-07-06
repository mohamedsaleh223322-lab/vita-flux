import http from 'http';
import app from './app.js';
import { initSockets } from './sockets/index.js';
import { initCronJobs } from './cron/index.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Sockets
initSockets(server);

// Initialize Cron Jobs
initCronJobs();

// Start Server
async function startServer() {
  try {
    await runMigrations();
    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

startServer();



