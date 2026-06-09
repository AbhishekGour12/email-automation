const replyService = require('../services/reply.service');
const firebaseHelper = require('../utils/firebaseHelper');
const { ApiError } = require('../middlewares/error.middleware');
const { triggerWebhook } = require('../utils/webhookDispatcher');

const replyController = {
  /**
   * Webhook endpoint to receive an incoming reply.
   * Typically triggered by email processors or n8n workflows.
   */
  async receiveReply(req, res, next) {
    try {
      // support various incoming payload formats (n8n standard or custom fields)
      const fromEmail = req.body.fromEmail || req.body.from || req.body.sender;
      const body = req.body.body || req.body.text || req.body.html || '';
      const subject = req.body.subject || '';
      const receivedAt = req.body.receivedAt || req.body.date || new Date().toISOString();

      if (!fromEmail) {
        throw new ApiError(400, 'Sender email (fromEmail) is required.');
      }

      const result = await replyService.handleIncomingReply({
        fromEmail,
        body,
        subject,
        receivedAt
      });

      res.status(200).json({
        success: true,
        message: 'Reply received and processed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async listReplies(req, res, next) {
    try {
      const replies = await firebaseHelper.get('replies') || {};
      const repliesList = Object.values(replies);
      
      // Sort by newest first
      repliesList.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

      res.status(200).json({
        success: true,
        message: 'Replies retrieved successfully',
        data: repliesList
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually updates the tag of a reply (e.g., changing from 'Need Followup' to 'Interested')
   * Updates lead status accordingly.
   */
  async tagReply(req, res, next) {
    try {
      const { id } = req.params;
      const { tag } = req.body; // Interested, Not Interested, Meeting Requested, Need Followup, Closed

      const validTags = ['Interested', 'Not Interested', 'Meeting Requested', 'Need Followup', 'Closed'];
      if (!validTags.includes(tag)) {
        throw new ApiError(400, `Invalid tag. Must be one of: ${validTags.join(', ')}`);
      }

      // 1. Fetch reply
      const reply = await firebaseHelper.get(`replies/${id}`);
      if (!reply) {
        throw new ApiError(404, `Reply with ID ${id} not found.`);
      }

      const lead = await firebaseHelper.get(`leads/${reply.leadId}`) || {};
      const oldStatus = lead.status || 'New';

      // 2. Update tag in reply record
      await firebaseHelper.update(`replies/${id}`, {
        tag,
        updatedAt: new Date().toISOString()
      });

      // 3. Update related Lead status based on tag
      let newLeadStatus = 'Replied';
      if (tag === 'Interested' || tag === 'Meeting Requested') {
        newLeadStatus = 'Interested';
      } else if (tag === 'Not Interested') {
        newLeadStatus = 'Unsubscribed';
      } else if (tag === 'Closed') {
        newLeadStatus = 'Closed';
      }

      await firebaseHelper.update(`leads/${reply.leadId}`, {
        status: newLeadStatus,
        updatedAt: new Date().toISOString()
      });

      if (oldStatus !== newLeadStatus) {
        triggerWebhook('lead.status_updated', {
          leadId: reply.leadId,
          email: lead.email,
          oldStatus,
          newStatus: newLeadStatus,
          reason: `Reply tagged as ${tag}`
        });
      }

      // 4. If tag was changed to Interested/Closed, stop followups (in case they weren't stopped yet)
      if (['Interested', 'Meeting Requested', 'Closed', 'Not Interested'].includes(tag)) {
        await replyService.stopFollowupsForLead(reply.leadId);
      }

      res.status(200).json({
        success: true,
        message: 'Reply tagged and lead status updated successfully',
        data: {
          replyId: id,
          tag,
          leadId: reply.leadId,
          leadStatus: newLeadStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = replyController;
