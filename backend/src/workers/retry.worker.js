const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const firebaseHelper = require('../utils/firebaseHelper');
const { emailQueue, followupQueue } = require('../config/bullmq');
const { queueLogger } = require('../utils/logger');

const retryWorker = new Worker('retryQueue', async (job) => {
  const { type, targetId } = job.data;
  queueLogger.info(`Processing retry queue job: ${job.id} for type ${type}, ID: ${targetId}`);

  try {
    if (type === 'email') {
      const email = await firebaseHelper.get(`emails/${targetId}`);
      if (!email) {
        queueLogger.warn(`Email record ${targetId} not found for retry.`);
        return { success: false, reason: 'Email record not found' };
      }

      // Reset email status in DB
      await firebaseHelper.update(`emails/${targetId}`, {
        status: 'Sending',
        error: null,
        updatedAt: new Date().toISOString()
      });

      // Re-queue in emailQueue
      const jobName = `retry_send_email_${email.campaignId}_${email.leadId}_${email.followupStep}`;
      await emailQueue.add(jobName, {
        campaignId: email.campaignId,
        leadId: email.leadId,
        followupStep: email.followupStep
      });

      queueLogger.info(`Re-queued email ${targetId} back to emailQueue.`);
      return { success: true, emailId: targetId };

    } else if (type === 'followup') {
      const followup = await firebaseHelper.get(`followups/${targetId}`);
      if (!followup) {
        queueLogger.warn(`Followup record ${targetId} not found for retry.`);
        return { success: false, reason: 'Followup record not found' };
      }

      // Reset status in DB
      await firebaseHelper.update(`followups/${targetId}`, {
        status: 'pending',
        notes: null,
        updatedAt: new Date().toISOString()
      });

      // Re-queue in followupQueue
      const delayMs = Math.max(0, new Date(followup.scheduledAt).getTime() - Date.now());
      const jobName = `retry_followup_email_${followup.campaignId}_${followup.leadId}_step_${followup.step}`;
      
      await followupQueue.add(jobName, {
        campaignId: followup.campaignId,
        leadId: followup.leadId,
        followupId: targetId,
        followupStep: followup.step === 1 ? 'followup1' : followup.step === 2 ? 'followup2' : 'followup3'
      }, {
        delay: delayMs
      });

      queueLogger.info(`Re-queued followup ${targetId} back to followupQueue (delay: ${delayMs / 1000}s).`);
      return { success: true, followupId: targetId };
    } else {
      queueLogger.warn(`Unknown retry type: ${type}`);
      return { success: false, reason: `Unknown type: ${type}` };
    }
  } catch (error) {
    queueLogger.error(`Error in retry worker job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2
});

retryWorker.on('completed', (job, result) => {
  queueLogger.info(`Retry Worker job ${job.id} completed. Result:`, result);
});

retryWorker.on('failed', (job, err) => {
  queueLogger.error(`Retry Worker job ${job.id} failed:`, err);
});

module.exports = retryWorker;
