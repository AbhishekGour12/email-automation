const { Queue } = require('bullmq');
const { redisConnection } = require('./redis');
const { queueLogger } = require('../utils/logger');

if (!redisConnection) {
  queueLogger.error('Redis connection is not initialized. BullMQ cannot start.');
}

const defaultQueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // Retry starting from 5 seconds
    },
    removeOnComplete: true, // Keep clean
    removeOnFail: false    // Keep failed jobs for the Dead Letter Queue analysis
  }
};

const emailQueue = new Queue('emailQueue', defaultQueueOptions);
const followupQueue = new Queue('followupQueue', defaultQueueOptions);
const retryQueue = new Queue('retryQueue', defaultQueueOptions);

// Log queue initialization
queueLogger.info('BullMQ queues (emailQueue, followupQueue, retryQueue) initialized.');

module.exports = {
  emailQueue,
  followupQueue,
  retryQueue,
  defaultQueueOptions
};
