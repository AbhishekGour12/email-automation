const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const firebaseHelper = require('../utils/firebaseHelper');
const { emailQueue } = require('../config/bullmq');
const { queueLogger } = require('../utils/logger');

const followupWorker = new Worker('followupQueue', async (job) => {
  const { campaignId, leadId, followupId, followupStep } = job.data;
  queueLogger.info(`Processing followup queue job: ${job.id} for followup ${followupId}`);

  try {
    // 1. Fetch Followup Record
    const followup = await firebaseHelper.get(`followups/${followupId}`);
    if (!followup) {
      queueLogger.warn(`Followup record ${followupId} not found in database. Skipping.`);
      return { success: false, reason: 'Followup record not found' };
    }

    if (followup.status === 'cancelled' || followup.status === 'sent') {
      queueLogger.info(`Followup ${followupId} has already been ${followup.status}. Skipping queue trigger.`);
      return { success: false, reason: `Followup already ${followup.status}` };
    }

    // 2. Fetch Lead
    const lead = await firebaseHelper.get(`leads/${leadId}`);
    if (!lead) {
      // Mark followup as cancelled since lead is missing
      await firebaseHelper.update(`followups/${followupId}`, {
        status: 'cancelled',
        notes: 'Lead not found',
        updatedAt: new Date().toISOString()
      });
      queueLogger.warn(`Lead ${leadId} not found for followup ${followupId}. Cancelling followup.`);
      return { success: false, reason: 'Lead not found' };
    }

    // Check stop criteria
    const stopStatuses = ['Replied', 'Interested', 'Closed', 'Unsubscribed'];
    if (stopStatuses.includes(lead.status)) {
      // Mark followup as cancelled in database
      await firebaseHelper.update(`followups/${followupId}`, {
        status: 'cancelled',
        notes: `Cancelled due to lead status: ${lead.status}`,
        updatedAt: new Date().toISOString()
      });
      queueLogger.info(`Lead ${leadId} is in stop status: ${lead.status}. Cancelling followup ${followupId}.`);
      return { success: true, reason: `Cancelled: lead ${lead.status}` };
    }

    // 3. Fetch Campaign Status
    const campaign = await firebaseHelper.get(`campaigns/${campaignId}`);
    if (!campaign) {
      await firebaseHelper.update(`followups/${followupId}`, {
        status: 'cancelled',
        notes: 'Campaign not found',
        updatedAt: new Date().toISOString()
      });
      throw new Error(`Campaign ${campaignId} not found.`);
    }

    if (campaign.status === 'Paused') {
      // Throw error to trigger BullMQ retry backoff so the job stays in queue and retries when campaign is resumed
      queueLogger.warn(`Campaign ${campaignId} is paused. Backing off followup job.`);
      throw new Error(`Campaign ${campaignId} is paused. Retrying followup job later.`);
    }

    if (campaign.status !== 'Running') {
      await firebaseHelper.update(`followups/${followupId}`, {
        status: 'cancelled',
        notes: `Campaign status is ${campaign.status}`,
        updatedAt: new Date().toISOString()
      });
      queueLogger.warn(`Campaign ${campaignId} is not running (status: ${campaign.status}). Cancelling followup.`);
      return { success: false, reason: `Campaign status: ${campaign.status}` };
    }

    // 4. Update Followup Record in DB to 'sent'
    await firebaseHelper.update(`followups/${followupId}`, {
      status: 'sent',
      updatedAt: new Date().toISOString()
    });

    // 5. Queue actual email send job in emailQueue immediately
    const jobName = `send_email_${campaignId}_${leadId}_${followupStep}`;
    await emailQueue.add(jobName, {
      campaignId,
      leadId,
      followupStep
    });

    queueLogger.info(`Successfully triggered send of ${followupStep} for lead ${leadId} (Followup ID: ${followupId})`);
    return { success: true, followupId };

  } catch (error) {
    queueLogger.error(`Error in followup worker job ${job.id}:`, error);
    throw error; // Re-throw for BullMQ exponential retry/backoff
  }
}, {
  connection: redisConnection,
  concurrency: 5
});

followupWorker.on('completed', (job, result) => {
  queueLogger.info(`Followup Worker job ${job.id} completed. Result:`, result);
});

followupWorker.on('failed', (job, err) => {
  queueLogger.error(`Followup Worker job ${job.id} failed:`, err);
});

module.exports = followupWorker;
