const { createTransporter, defaultTransporter } = require('../config/smtp');
const firebaseHelper = require('../utils/firebaseHelper');
const personalizationService = require('./personalization.service');
const { getTrackingPixelHtml, rewriteLinksForClickTracking } = require('../utils/emailTracker');
const { emailLogger, logger } = require('../utils/logger');

const emailService = {
  /**
   * Test SMTP Settings
   * @param {object} smtpSettings 
   */
  async testSmtpConnection(smtpSettings = null) {
    try {
      const transporter = smtpSettings ? createTransporter(smtpSettings) : defaultTransporter;
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP test connection failed:', error);
      return false;
    }
  },

  /**
   * Sends a personalized email to a lead.
   * Logs details in Firebase.
   * @param {object} params
   * @param {string} params.leadId - Lead ID
   * @param {string} params.campaignId - Campaign ID
   * @param {object} params.template - { subject, body } raw template
   * @param {object} [params.customSmtp] - Optional campaign-specific SMTP settings
   * @param {string} [params.senderName] - Optional sender display name
   * @param {string} [params.senderEmail] - Optional sender email (must align with SMTP auth)
   * @param {string} [params.followupStep] - 'initial', 'followup1', 'followup2', 'followup3'
   */
  async sendOutreachEmail({ leadId, campaignId, template, customSmtp = null, senderName = '', senderEmail = '', followupStep = 'initial' }) {
    const emailRefPath = `emails`;
    let emailId = null;

    try {
      // 1. Fetch Lead Details
      const lead = await firebaseHelper.get(`leads/${leadId}`);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found.`);
      }

      if (lead.status === 'Unsubscribed') {
        emailLogger.warn(`Skipping email to unsubscribed lead ${lead.email}`);
        return { success: false, reason: 'Unsubscribed' };
      }

      // 2. Personalize Template content
      const { subject, body: rawBody } = personalizationService.personalize(template, lead);

      // 3. Create a unique email record in Firebase to get an emailId
      const emailRecord = {
        campaignId,
        leadId,
        email: lead.email,
        subject,
        status: 'Sending',
        followupStep,
        sentAt: null,
        createdAt: new Date().toISOString()
      };
      
      const pushResult = await firebaseHelper.push(emailRefPath, emailRecord);
      emailId = pushResult.id;

      // 4. Inject open and click tracking
      let trackedBody = rawBody;
      
      // If it contains HTML, rewrite links and append tracking pixel
      // We wrap the email body in basic HTML structure if it's plaintext to support pixels
      const isHtml = /<[a-z][\s\S]*>/i.test(trackedBody);
      if (!isHtml) {
        trackedBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">${trackedBody.replace(/\n/g, '<br />')}</div>`;
      }

      // Rewrite links for click tracking
      trackedBody = rewriteLinksForClickTracking(trackedBody, emailId);
      
      // Append transparent pixel
      trackedBody += getTrackingPixelHtml(emailId);

      // 5. Build Nodemailer configuration
      let transporter;
      if (customSmtp) {
        transporter = createTransporter(customSmtp);
      } else {
        const savedSmtp = await firebaseHelper.get('settings/smtp');
        if (savedSmtp && savedSmtp.host) {
          transporter = createTransporter(savedSmtp);
        } else {
          transporter = defaultTransporter;
        }
      }
      
      // Determine sender header
      const fromEmail = senderEmail || (transporter.options && transporter.options.auth && transporter.options.auth.user) || process.env.SMTP_USER || 'no-reply@domain.com';
      const fromName = senderName || process.env.SMTP_FROM_NAME || 'Outreach Manager';
      const fromHeader = `"${fromName}" <${fromEmail}>`;

      // 6. Send via SMTP
      const mailOptions = {
        from: fromHeader,
        to: lead.email,
        subject: subject,
        html: trackedBody
      };

      const info = await transporter.sendMail(mailOptions);
      emailLogger.info(`Email sent to ${lead.email}. MessageId: ${info.messageId}, emailId: ${emailId}`);

      // 7. Update Email Record to 'Sent'
      const updatedRecord = {
        status: 'Sent',
        sentAt: new Date().toISOString(),
        messageId: info.messageId,
        body: trackedBody // store final personalized html body
      };
      await firebaseHelper.update(`emails/${emailId}`, updatedRecord);

      // 8. Update Lead Status if new
      if (lead.status === 'New') {
        await firebaseHelper.update(`leads/${leadId}`, {
          status: 'Contacted',
          updatedAt: new Date().toISOString()
        });
      }

      // 9. Update Campaign Analytics
      await this.incrementCampaignAnalytics(campaignId, 'sentCount');

      return { success: true, emailId };

    } catch (error) {
      emailLogger.error(`Failed to send email to lead ${leadId} in campaign ${campaignId}:`, error);
      
      if (emailId) {
        await firebaseHelper.update(`emails/${emailId}`, {
          status: 'Failed',
          error: error.message,
          updatedAt: new Date().toISOString()
        });
      }

      return { success: false, error: error.message };
    }
  },

  /**
   * Helper to increment campaign stats in Firebase transactionally
   */
  async incrementCampaignAnalytics(campaignId, fieldName) {
    if (!campaignId) return;
    try {
      await firebaseHelper.transaction(`campaigns/${campaignId}/${fieldName}`, (currentVal) => {
        return (currentVal || 0) + 1;
      });
      // Also update overall analytics node
      await firebaseHelper.transaction(`analytics/${campaignId}/${fieldName}`, (currentVal) => {
        return (currentVal || 0) + 1;
      });
    } catch (err) {
      logger.error(`Error incrementing campaign ${campaignId} field ${fieldName}:`, err);
    }
  }
};

module.exports = emailService;
