const { followupQueue } = require('../config/bullmq');
const { queueLogger } = require('../utils/logger');

const followupQueueWrapper = {
  /**
   * Add a delayed followup task
   * @param {object} data - { campaignId, leadId, followupStep }
   * @param {number} delayMs - Delay in milliseconds
   */
  async addFollowupJob(data, delayMs) {
    try {
      const jobName = `followup_email_${data.campaignId}_${data.leadId}_step_${data.followupStep}`;
      const job = await followupQueue.add(jobName, data, {
        delay: delayMs,
        // Ensure failed followup attempts are retried
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      });
      queueLogger.info(`Added delayed job ${job.id} to followupQueue: ${jobName} (delay: ${delayMs / 1000}s)`);
      return job;
    } catch (error) {
      queueLogger.error('Failed to add job to followupQueue:', error);
      throw error;
    }
  }
};

module.exports = followupQueueWrapper;
