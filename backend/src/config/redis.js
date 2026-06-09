const Redis = require('ioredis');
const { logger } = require('../utils/logger');
require('dotenv').config();

const redisConfig = {
  maxRetriesPerRequest: null // Required by BullMQ
};

let redisConnection;

try {
  if (process.env.REDIS_URL) {
    logger.info('Initializing Redis connection via REDIS_URL...');
    redisConnection = new Redis(process.env.REDIS_URL, redisConfig);
  } else {
    logger.info('Initializing Redis connection via host/port config...');
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      ...redisConfig
    });
  }

  redisConnection.on('connect', () => {
    logger.info('Connected to Redis server.');
  });

  redisConnection.on('error', (err) => {
    logger.error('Redis Connection Error:', err);
  });
} catch (error) {
  logger.error('Failed to initialize Redis:', error);
}

module.exports = {
  redisConnection
};
