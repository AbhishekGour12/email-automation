const { emailQueue } = require('../config/bullmq');
const { queueLogger } = require('../utils/logger');

const emailQueueWrapper = {
  /**
   * Add a new email sending job to the queue
   * @param {object} data - { campaignId, leadId, followupStep }
   */
  async addEmailJob(data) {
    try {
      const jobName = `send_email_${data.campaignId}_${data.leadId}_${data.followupStep}`;
      const job = await emailQueue.add(jobName, data);
      queueLogger.info(`Added job ${job.id} to emailQueue: ${jobName}`);
      return job;
    } catch (error) {
      queueLogger.error('Failed to add job to emailQueue:', error);
      throw error;
    }
  }
};

module.exports = emailQueueWrapper;
