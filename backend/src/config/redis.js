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
    const options = { ...redisConfig };
    if (process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.includes('upstash.io')) {
      options.tls = { rejectUnauthorized: false };
    }
    redisConnection = new Redis(process.env.REDIS_URL, options);
  } else {
    logger.info('Initializing Redis connection via host/port config...');
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const options = {
      host,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      ...redisConfig
    };
    if (host.includes('upstash.io') || process.env.REDIS_PASSWORD) {
      options.tls = { rejectUnauthorized: false };
    }
    redisConnection = new Redis(options);
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
