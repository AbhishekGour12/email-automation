const firebaseHelper = require('../utils/firebaseHelper');
const { emailQueue } = require('../config/bullmq');
const { ApiError } = require('../middlewares/error.middleware');
const { logger } = require('../utils/logger');
const emailService = require('./email.service');

const campaignService = {
  async createCampaign(data) {
    const campaignData = {
      name: data.name,
      templateId: data.templateId,
      status: 'Draft', // Draft, Running, Paused, Completed, Failed
      leadIds: data.leadIds || [], // Array of lead IDs assigned
      senderName: data.settings?.senderName || '',
      senderEmail: data.settings?.senderEmail || '',
      customSmtp: data.settings?.smtpSettings || null,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      replyCount: 0,
      interestedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await firebaseHelper.push('campaigns', campaignData);
    
    // Initialize analytics node for this campaign
    await firebaseHelper.set(`analytics/${result.id}`, {
      campaignId: result.id,
      campaignName: campaignData.name,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      replyCount: 0,
      interestedCount: 0,
      updatedAt: new Date().toISOString()
    });

    return result.data;
  },

  async getCampaign(id) {
    const campaign = await firebaseHelper.get(`campaigns/${id}`);
    if (!campaign) {
      throw new ApiError(404, `Campaign with ID ${id} not found.`);
    }
    return campaign;
  },

  async getAllCampaigns() {
    const campaigns = await firebaseHelper.get('campaigns');
    return campaigns ? Object.values(campaigns) : [];
  },

  async updateCampaign(id, data) {
    await this.getCampaign(id); // Throws if not exists
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await firebaseHelper.update(`campaigns/${id}`, updateData);
    return this.getCampaign(id);
  },

  async deleteCampaign(id) {
    await this.getCampaign(id); // Throws if not exists
    await firebaseHelper.remove(`campaigns/${id}`);
    await firebaseHelper.remove(`analytics/${id}`);
    return { success: true };
  },

  /**
   * Starts or triggers a campaign.
   * Queues all initial outreach jobs to BullMQ emailQueue.
   */
  async startCampaign(id) {
    const campaign = await this.getCampaign(id);
    
    if (campaign.status === 'Completed' || campaign.status === 'Running') {
      throw new ApiError(400, `Campaign is already in status: ${campaign.status}`);
    }

    if (!campaign.leadIds || campaign.leadIds.length === 0) {
      throw new ApiError(400, 'Cannot start campaign: No leads assigned to this campaign.');
    }

    // Verify SMTP connection before starting to prevent queueing emails with invalid credentials
    const savedSmtp = await firebaseHelper.get('settings/smtp');
    const smtpConfig = campaign.customSmtp || savedSmtp;
    const isSmtpValid = await emailService.testSmtpConnection(smtpConfig);
    if (!isSmtpValid) {
      throw new ApiError(400, 'Cannot start campaign: SMTP credentials verification failed. Please check your Hostinger SMTP credentials in Settings.');
    }

    // 1. Update status to Running
    await this.updateCampaign(id, { status: 'Running' });

    // 2. Queue initial emails for each lead
    logger.info(`Starting campaign ${id} (${campaign.name}) with ${campaign.leadIds.length} leads.`);
    
    const jobs = campaign.leadIds.map((leadId) => {
      return {
        name: `initial_email_${campaign.name}_${leadId}`,
        data: {
          campaignId: id,
          leadId: leadId,
          followupStep: 'initial' // starting step
        }
      };
    });

    // Add all jobs to BullMQ emailQueue
    // We add them in bulk for higher efficiency
    await emailQueue.addBulk(jobs);

    return { success: true, message: `Campaign started. Queued ${jobs.length} emails.` };
  },

  async pauseCampaign(id) {
    const campaign = await this.getCampaign(id);
    if (campaign.status !== 'Running') {
      throw new ApiError(400, `Only running campaigns can be paused. Current status: ${campaign.status}`);
    }
    await this.updateCampaign(id, { status: 'Paused' });
    logger.info(`Campaign ${id} has been paused.`);
    return { success: true };
  },

  async resumeCampaign(id) {
    const campaign = await this.getCampaign(id);
    if (campaign.status !== 'Paused') {
      throw new ApiError(400, `Only paused campaigns can be resumed. Current status: ${campaign.status}`);
    }
    await this.updateCampaign(id, { status: 'Running' });
    logger.info(`Campaign ${id} has been resumed.`);
    return { success: true };
  },

  async cancelCampaign(id) {
    const campaign = await this.getCampaign(id);
    await this.updateCampaign(id, { status: 'Draft' });
    logger.info(`Campaign ${id} has been cancelled and reset to Draft status.`);
    return { success: true };
  },

  async getCampaignFollowups(campaignId) {
    const followups = await firebaseHelper.get('followups') || {};
    const campaignFollowups = Object.values(followups).filter(f => f.campaignId === campaignId);
    campaignFollowups.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return campaignFollowups;
  }
};

module.exports = campaignService;
