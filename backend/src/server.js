const app = require('./app');
const { logger } = require('./utils/logger');
require('dotenv').config();

// Port configuration
const PORT = process.env.PORT || 5000;

// Import queues and workers to initialize them on startup
require('./config/firebase'); // Init Firebase connection
require('./config/redis');    // Init Redis connection
require('./config/bullmq');   // Init Queues

// Initialize background queue workers
require('./workers/email.worker');
require('./workers/followup.worker');
require('./workers/retry.worker');

const server = app.listen(PORT, () => {
  logger.info(`==================================================`);
  logger.info(`Server is running on port: ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Outreach workers initialized and listening to BullMQ queues...`);
  logger.info(`==================================================`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');

    // Close Redis connection
    const { redisConnection } = require('./config/redis');
    if (redisConnection) {
      await redisConnection.quit();
      logger.info('Redis connection closed.');
    }

    process.exit(0);
  });

  // Force close after 10s if not shutdown
  setTimeout(() => {
    logger.error('Force shutting down due to timeout...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});
