const firebaseHelper = require('../utils/firebaseHelper');

const analyticsService = {
  /**
   * Helper to format rates as percentages
   */
  calculateRate(numerator, denominator) {
    if (!denominator) return 0;
    return parseFloat(((numerator / denominator) * 100).toFixed(2));
  },

  /**
   * Get global metrics across the entire workspace
   */
  async getGlobalStats() {
    const leads = await firebaseHelper.get('leads') || {};
    const emails = await firebaseHelper.get('emails') || {};
    const campaigns = await firebaseHelper.get('campaigns') || {};

    const totalLeads = Object.keys(leads).length;
    const leadsList = Object.values(leads);
    
    // Group leads by status
    const statusBreakdown = {
      New: 0,
      Contacted: 0,
      Opened: 0,
      Clicked: 0,
      Replied: 0,
      Interested: 0,
      Closed: 0,
      Unsubscribed: 0
    };

    leadsList.forEach(lead => {
      if (statusBreakdown[lead.status] !== undefined) {
        statusBreakdown[lead.status]++;
      }
    });

    const emailsList = Object.values(emails);
    const sentEmails = emailsList.filter(e => e.status === 'Sent');
    const totalSent = sentEmails.length;
    
    const totalOpened = emailsList.filter(e => e.openedAt).length;
    const totalClicked = emailsList.filter(e => e.clickedAt).length;
    const totalReplied = emailsList.filter(e => e.repliedAt).length;
    const totalInterested = leadsList.filter(l => l.status === 'Interested').length;

    return {
      totalLeads,
      totalCampaigns: Object.keys(campaigns).length,
      emailsSent: totalSent,
      rates: {
        openRate: this.calculateRate(totalOpened, totalSent),
        clickRate: this.calculateRate(totalClicked, totalSent),
        replyRate: this.calculateRate(totalReplied, totalSent),
        interestedRate: this.calculateRate(totalInterested, totalSent)
      },
      counts: {
        opened: totalOpened,
        clicked: totalClicked,
        replied: totalReplied,
        interested: totalInterested
      },
      statusBreakdown
    };
  },

  /**
   * Get metrics for a specific campaign
   */
  async getCampaignStats(campaignId) {
    const campaign = await firebaseHelper.get(`campaigns/${campaignId}`);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found.`);
    }

    const emails = await firebaseHelper.get('emails') || {};
    const campaignEmails = Object.values(emails).filter(e => e.campaignId === campaignId);
    
    const sentCount = campaignEmails.filter(e => e.status === 'Sent').length;
    const openCount = campaignEmails.filter(e => e.openedAt).length;
    const clickCount = campaignEmails.filter(e => e.clickedAt).length;
    const replyCount = campaignEmails.filter(e => e.repliedAt).length;
    
    // Fetch interested leads of this campaign
    const leads = await firebaseHelper.get('leads') || {};
    const campaignLeads = Object.values(leads).filter(l => campaign.leadIds?.includes(l.id));
    const interestedCount = campaignLeads.filter(l => l.status === 'Interested').length;

    return {
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      totalLeads: campaign.leadIds?.length || 0,
      sentCount,
      openCount,
      clickCount,
      replyCount,
      interestedCount,
      rates: {
        openRate: this.calculateRate(openCount, sentCount),
        clickRate: this.calculateRate(clickCount, sentCount),
        replyRate: this.calculateRate(replyCount, sentCount),
        interestedRate: this.calculateRate(interestedCount, sentCount)
      }
    };
  },

  /**
   * Fetch daily, weekly, or monthly aggregations of emails sent and actions taken
   */
  async getTimebasedStats(range = 'daily') {
    const emails = await firebaseHelper.get('emails') || {};
    const emailsList = Object.values(emails).filter(e => e.status === 'Sent' && e.sentAt);

    const stats = {};

    emailsList.forEach((email) => {
      const date = new Date(email.sentAt);
      let key = '';

      if (range === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (range === 'weekly') {
        // Simple year-week representation
        const onejan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else if (range === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      if (!stats[key]) {
        stats[key] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
      }

      stats[key].sent++;
      if (email.openedAt) stats[key].opened++;
      if (email.clickedAt) stats[key].clicked++;
      if (email.repliedAt) stats[key].replied++;
    });

    // Convert to sorted array
    return Object.entries(stats)
      .map(([timeUnit, data]) => ({
        timeUnit,
        ...data,
        openRate: this.calculateRate(data.opened, data.sent),
        clickRate: this.calculateRate(data.clicked, data.sent),
        replyRate: this.calculateRate(data.replied, data.sent)
      }))
      .sort((a, b) => a.timeUnit.localeCompare(b.timeUnit));
  }
};

module.exports = analyticsService;
