const firebaseHelper = require('../utils/firebaseHelper');
const { logger } = require('../utils/logger');
const { triggerWebhook } = require('../utils/webhookDispatcher');

const INTERESTED_KEYWORDS = [
  'interested', 'call', 'meet', 'meeting', 'calendar', 'schedule',
  'zoom', 'chat', 'discuss', 'phone', 'talk', 'yes', 'sure', 'details'
];

const NOT_INTERESTED_KEYWORDS = [
  'not interested', 'remove', 'unsubscribe', 'stop', "don't email",
  'delete', 'no thanks', 'not for us', 'please stop'
];

const replyService = {
  /**
   * Simple rule-based classifier to tag replies
   * @param {string} body - Email reply content
   * @returns {string} - Tag ('Interested' | 'Not Interested' | 'Meeting Requested' | 'Need Followup')
   */
  classifyReply(body) {
    if (!body) return 'Need Followup';
    
    const cleanBody = body.toLowerCase();

    // Check for meeting requests first (strongest interest signal)
    const isMeetingRequest = ['meet', 'meeting', 'calendar', 'schedule', 'zoom', 'appointment'].some(
      keyword => cleanBody.includes(keyword)
    );
    if (isMeetingRequest) {
      return 'Meeting Requested';
    }

    // Check for general interest
    const isInterested = INTERESTED_KEYWORDS.some(keyword => cleanBody.includes(keyword));
    if (isInterested) {
      return 'Interested';
    }

    // Check for lack of interest / unsubscribe
    const isNotInterested = NOT_INTERESTED_KEYWORDS.some(keyword => cleanBody.includes(keyword));
    if (isNotInterested) {
      return 'Not Interested';
    }

    return 'Need Followup';
  },

  /**
   * Processes a newly received email reply.
   * Updates lead status, records the reply, and stops future followups.
   */
  async handleIncomingReply({ fromEmail, body, subject = '', receivedAt = new Date().toISOString() }) {
    logger.info(`Processing incoming reply from email: ${fromEmail}`);

    try {
      // Clean email if it contains name (e.g., "Name <email@domain.com>")
      let cleanEmail = fromEmail.trim().toLowerCase();
      const emailMatch = cleanEmail.match(/<([^>]+)>/);
      if (emailMatch) {
        cleanEmail = emailMatch[1];
      }

      logger.info(`Extracted clean email: "${cleanEmail}" for database lookup.`);

      // 1. Find the lead by email
      const leadsMap = await firebaseHelper.queryByChild('leads', 'email', cleanEmail) || {};
      logger.info(`Database lookup result: ${JSON.stringify(leadsMap)}`);
      const leadId = Object.keys(leadsMap)[0];

      if (!leadId) {
        logger.warn(`Received reply from ${fromEmail} but no corresponding lead was found.`);
        return { success: false, reason: 'Lead not found' };
      }

      const lead = leadsMap[leadId];

      // 2. Classify reply
      const replyTag = this.classifyReply(body);
      
      // Determine new lead status based on tag
      let newLeadStatus = 'Replied';
      if (replyTag === 'Interested' || replyTag === 'Meeting Requested') {
        newLeadStatus = 'Interested';
      } else if (replyTag === 'Not Interested') {
        newLeadStatus = 'Unsubscribed'; // Automatically opt them out
      }

      // 3. Store Reply Record
      const replyRecord = {
        leadId,
        email: fromEmail,
        subject,
        body,
        tag: replyTag,
        receivedAt,
        createdAt: new Date().toISOString()
      };
      const pushResult = await firebaseHelper.push('replies', replyRecord);

      // 4. Update Lead Status
      await firebaseHelper.update(`leads/${leadId}`, {
        status: newLeadStatus,
        updatedAt: new Date().toISOString()
      });

      // 5. Update Email logs that might be linked to this lead to 'Replied'
      const emailsMap = await firebaseHelper.get('emails') || {};
      const lastEmailRecord = Object.entries(emailsMap)
        .filter(([_, email]) => email.leadId === leadId && email.status === 'Sent')
        .sort(([_, a], [__, b]) => new Date(b.sentAt) - new Date(a.sentAt))[0];

      if (lastEmailRecord) {
        const [lastEmailId] = lastEmailRecord;
        await firebaseHelper.update(`emails/${lastEmailId}`, {
          repliedAt: receivedAt,
          updatedAt: new Date().toISOString()
        });
        
        // Increment reply count in campaign stats
        const campaignId = lastEmailRecord[1].campaignId;
        await firebaseHelper.transaction(`campaigns/${campaignId}/replyCount`, (count) => (count || 0) + 1);
        await firebaseHelper.transaction(`analytics/${campaignId}/replyCount`, (count) => (count || 0) + 1);
        
        if (replyTag === 'Interested' || replyTag === 'Meeting Requested') {
          await firebaseHelper.transaction(`campaigns/${campaignId}/interestedCount`, (count) => (count || 0) + 1);
          await firebaseHelper.transaction(`analytics/${campaignId}/interestedCount`, (count) => (count || 0) + 1);
        }
      }

      // 6. Stop/Cancel all pending followups for this lead
      await this.stopFollowupsForLead(leadId);

      // Trigger outgoing webhooks (asynchronously so they don't block the email processing)
      triggerWebhook('reply.received', {
        replyId: pushResult.id,
        leadId,
        email: fromEmail,
        subject,
        body,
        tag: replyTag,
        receivedAt
      });

      if (lead.status !== newLeadStatus) {
        triggerWebhook('lead.status_updated', {
          leadId,
          email: fromEmail,
          oldStatus: lead.status || 'New',
          newStatus: newLeadStatus,
          reason: 'Reply received'
        });
      }

      return {
        success: true,
        replyId: pushResult.id,
        leadId,
        tag: replyTag,
        status: newLeadStatus
      };

    } catch (error) {
      logger.error('Error handling incoming email reply:', error);
      throw error;
    }
  },

  /**
   * Cancels all pending followups for a specific lead.
   */
  async stopFollowupsForLead(leadId) {
    try {
      const followupsMap = await firebaseHelper.get('followups') || {};
      const pendingFollowups = Object.entries(followupsMap).filter(
        ([_, followup]) => followup.leadId === leadId && followup.status === 'pending'
      );

      if (pendingFollowups.length > 0) {
        const updates = {};
        pendingFollowups.forEach(([id]) => {
          updates[`followups/${id}/status`] = 'cancelled';
          updates[`followups/${id}/updatedAt`] = new Date().toISOString();
        });
        await firebaseHelper.db.ref().update(updates);
        logger.info(`Cancelled ${pendingFollowups.length} pending followups for lead ${leadId}`);
      }
    } catch (error) {
      logger.error(`Error stopping followups for lead ${leadId}:`, error);
    }
  }
};

module.exports = replyService;
