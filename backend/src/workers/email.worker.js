const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const firebaseHelper = require('../utils/firebaseHelper');
const emailService = require('../services/email.service');
const { addFollowupJob } = require('../queues/followup.queue');
const { queueLogger } = require('../utils/logger');

// Retrieve delay settings (defaults to real-world days, but easily modifiable)
const getDelayForStep = async (step) => {
  const settings = await firebaseHelper.get('settings/followup') || {};
  
  // Return values in milliseconds.
  // For testing, users can set delay in seconds, but default is standard days.
  const isTestingMode = process.env.TESTING_MODE === 'true';

  if (isTestingMode) {
    // Under testing, delays are: step 1: 15s, step 2: 30s, step 3: 45s
    const testDelays = {
      1: 15000,
      2: 15000, // 15 seconds after step 1
      3: 15000  // 15 seconds after step 2
    };
    return testDelays[step];
  }

  // Real world delays
  const days = {
    1: parseInt(settings.delay3 || '3', 10),  // Day 3
    2: parseInt(settings.delay7 || '4', 10),  // Day 7 (4 days from f1)
    3: parseInt(settings.delay14 || '7', 10)  // Day 14 (7 days from f2)
  };
  
  return (days[step] || 3) * 24 * 60 * 60 * 1000;
};

const emailWorker = new Worker('emailQueue', async (job) => {
  const { campaignId, leadId, followupStep } = job.data;
  queueLogger.info(`Processing email queue job: ${job.id} for lead ${leadId}`);

  try {
    // 1. Fetch Campaign
    const campaign = await firebaseHelper.get(`campaigns/${campaignId}`);
    if (!campaign) {
      queueLogger.warn(`Campaign ${campaignId} not found. Skipping email send.`);
      return { success: false, reason: 'Campaign not found' };
    }

    if (campaign.status !== 'Running') {
      queueLogger.warn(`Campaign ${campaignId} is in status ${campaign.status} (not Running). Skipping email send.`);
      return { success: false, reason: 'Campaign not active' };
    }

    // 2. Fetch Lead
    const lead = await firebaseHelper.get(`leads/${leadId}`);
    if (!lead) {
      queueLogger.warn(`Lead ${leadId} not found. Skipping email send.`);
      return { success: false, reason: 'Lead not found' };
    }

    // Check stop criteria
    const stopStatuses = ['Replied', 'Interested', 'Closed', 'Unsubscribed'];
    if (stopStatuses.includes(lead.status)) {
      queueLogger.info(`Lead ${leadId} has status ${lead.status}. Skipping email send.`);
      return { success: false, reason: `Lead stopped outreach: ${lead.status}` };
    }

    // 3. Fetch Template
    const template = await firebaseHelper.get(`templates/${campaign.templateId}`);
    if (!template) {
      queueLogger.error(`Template ${campaign.templateId} not found for campaign ${campaignId}.`);
      throw new Error(`Template not found: ${campaign.templateId}`);
    }

    // 4. Resolve Template Content based on step
    let rawTemplate = { subject: template.subject, body: '' };
    if (followupStep === 'initial') {
      rawTemplate.body = template.body;
    } else if (followupStep === 'followup1') {
      rawTemplate.subject = `Re: ${template.subject}`;
      rawTemplate.body = template.followup1;
    } else if (followupStep === 'followup2') {
      rawTemplate.subject = `Re: ${template.subject}`;
      rawTemplate.body = template.followup2;
    } else if (followupStep === 'followup3') {
      rawTemplate.subject = `Re: ${template.subject}`;
      rawTemplate.body = template.followup3;
    }

    if (!rawTemplate.body) {
      queueLogger.info(`Empty template body for step ${followupStep}. Skipping send.`);
      return { success: false, reason: `Empty template for step ${followupStep}` };
    }

    // 5. Send outreach email
    const sendResult = await emailService.sendOutreachEmail({
      leadId,
      campaignId,
      template: rawTemplate,
      customSmtp: campaign.customSmtp,
      senderName: campaign.senderName,
      senderEmail: campaign.senderEmail,
      followupStep
    });

    if (!sendResult.success) {
      throw new Error(`Outreach send failed: ${sendResult.error}`);
    }

    // 6. Schedule next followup if applicable
    let nextStep = null;
    let nextTemplateField = '';

    if (followupStep === 'initial') {
      nextStep = 1;
      nextTemplateField = 'followup1';
    } else if (followupStep === 'followup1') {
      nextStep = 2;
      nextTemplateField = 'followup2';
    } else if (followupStep === 'followup2') {
      nextStep = 3;
      nextTemplateField = 'followup3';
    }

    if (nextStep && template[nextTemplateField]) {
      const delayMs = await getDelayForStep(nextStep);
      const scheduledAt = new Date(Date.now() + delayMs).toISOString();

      // Write followup record to DB first
      const followupRecord = {
        campaignId,
        leadId,
        step: nextStep,
        scheduledAt,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const pushResult = await firebaseHelper.push('followups', followupRecord);
      const followupId = pushResult.id;

      // Add delayed job to BullMQ followupQueue
      await addFollowupJob({
        campaignId,
        leadId,
        followupId,
        followupStep: nextStep === 1 ? 'followup1' : nextStep === 2 ? 'followup2' : 'followup3'
      }, delayMs);

      queueLogger.info(`Scheduled Followup Step ${nextStep} for lead ${leadId} in ${delayMs / 1000}s`);
    } else if (followupStep === 'followup3') {
      // Completed last step of outreach, mark campaign completed check
      queueLogger.info(`Final followup email sent to lead ${leadId}. Outreach complete.`);
    }

    return { success: true, emailId: sendResult.emailId };

  } catch (error) {
    queueLogger.error(`Error in email worker job ${job.id}:`, error);
    throw error; // Re-throw to trigger BullMQ retry logic
  }
}, {
  connection: redisConnection,
  concurrency: 5 // Process up to 5 sends in parallel
});

emailWorker.on('completed', (job, result) => {
  queueLogger.info(`Email Worker job ${job.id} completed successfully. Result:`, result);
});

emailWorker.on('failed', (job, err) => {
  queueLogger.error(`Email Worker job ${job.id} failed:`, err);
});

module.exports = emailWorker;
