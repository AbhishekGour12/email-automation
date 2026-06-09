const express = require('express');
const leadService = require('../services/lead.service');
const campaignService = require('../services/campaign.service');
const replyService = require('../services/reply.service');
const firebaseHelper = require('../utils/firebaseHelper');
const { ApiError } = require('../middlewares/error.middleware');
const { logger } = require('../utils/logger');
const { triggerWebhook } = require('../utils/webhookDispatcher');
require('dotenv').config();

const router = express.Router();

// Webhook authentication middleware
const webhookAuth = (req, res, next) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return next();

  const clientSecret = req.headers['x-webhook-secret'] || req.query.secret || req.body.secret;
  if (clientSecret === secret) return next();

  logger.warn('n8n Webhook authorization failure.');
  return res.status(401).json({
    success: false,
    message: 'Unauthorized webhook access.',
    data: {}
  });
};

router.use(webhookAuth);

/**
 * 1. Webhook: Import Leads
 * Payload: [ { name, email, phone, ... }, ... ]
 */
router.post('/import-leads', async (req, res, next) => {
  try {
    const leads = Array.isArray(req.body) ? req.body : [req.body];
    
    if (leads.length === 0) {
      throw new ApiError(400, 'Payload must be a lead object or array of leads.');
    }

    const imported = [];
    const skipped = [];

    // Process leads
    for (const lead of leads) {
      if (!lead.email) {
        skipped.push({ lead, reason: 'Email missing' });
        continue;
      }

      try {
        const existing = await firebaseHelper.queryByChild('leads', 'email', lead.email.toLowerCase());
        if (Object.keys(existing).length > 0) {
          skipped.push({ lead, reason: 'Duplicate email' });
          continue;
        }

        const created = await leadService.createLead(lead);
        imported.push(created);
      } catch (err) {
        skipped.push({ lead, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Leads processed from n8n webhook',
      data: {
        importedCount: imported.length,
        skippedCount: skipped.length,
        imported,
        skipped
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 2. Webhook: Send Campaign
 * Payload: { campaignId }
 */
router.post('/send-campaign', async (req, res, next) => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) {
      throw new ApiError(400, 'campaignId is required.');
    }

    const result = await campaignService.startCampaign(campaignId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. Webhook: Reply Received
 * Payload: { fromEmail, body, subject, date }
 */
router.post('/reply-received', async (req, res, next) => {
  try {
    const fromEmail = req.body.fromEmail || req.body.from;
    const body = req.body.body || req.body.text || '';
    const subject = req.body.subject || '';
    
    if (!fromEmail) {
      throw new ApiError(400, 'fromEmail is required.');
    }

    const result = await replyService.handleIncomingReply({
      fromEmail,
      body,
      subject
    });

    res.status(200).json({
      success: true,
      message: 'Reply logged and processed via n8n webhook',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 4. Webhook: Stop Followup
 * Payload: { leadId } or { email }
 */
router.post('/stop-followup', async (req, res, next) => {
  try {
    const { leadId, email } = req.body;
    let targetLeadId = leadId;

    if (!targetLeadId && email) {
      const leadsMap = await firebaseHelper.queryByChild('leads', 'email', email.trim().toLowerCase());
      targetLeadId = Object.keys(leadsMap)[0];
    }

    if (!targetLeadId) {
      throw new ApiError(400, 'leadId or valid email is required.');
    }

    const lead = await firebaseHelper.get(`leads/${targetLeadId}`) || {};
    const oldStatus = lead.status || 'New';

    await replyService.stopFollowupsForLead(targetLeadId);

    // Also set lead status to unsubscribed or stopped
    await firebaseHelper.update(`leads/${targetLeadId}`, {
      status: 'Unsubscribed',
      updatedAt: new Date().toISOString()
    });

    if (oldStatus !== 'Unsubscribed') {
      triggerWebhook('lead.status_updated', {
        leadId: targetLeadId,
        email: lead.email,
        oldStatus,
        newStatus: 'Unsubscribed',
        reason: 'Stop follow-up webhook'
      });
    }

    res.status(200).json({
      success: true,
      message: `Followups stopped successfully for lead ID: ${targetLeadId}`,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. Webhook: Update Status
 * Payload: { leadId, status }
 */
router.post('/update-status', async (req, res, next) => {
  try {
    const { leadId, status } = req.body;
    if (!leadId || !status) {
      throw new ApiError(400, 'leadId and status are required.');
    }

    // Verify lead exists and get old status
    const lead = await leadService.getLead(leadId);
    const oldStatus = lead.status || 'New';

    const updated = await firebaseHelper.update(`leads/${leadId}`, {
      status,
      updatedAt: new Date().toISOString()
    });

    if (oldStatus !== status) {
      triggerWebhook('lead.status_updated', {
        leadId,
        email: lead.email,
        oldStatus,
        newStatus: status,
        reason: 'Update status webhook'
      });
    }

    res.status(200).json({
      success: true,
      message: `Lead status updated to ${status} successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
