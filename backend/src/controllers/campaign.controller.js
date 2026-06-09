const campaignService = require('../services/campaign.service');

const campaignController = {
  async createCampaign(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.body);
      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });
    } catch (error) {
      next(error);
    }
  },

  async getCampaign(req, res, next) {
    try {
      const campaign = await campaignService.getCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign retrieved successfully',
        data: campaign
      });
    } catch (error) {
      next(error);
    }
  },

  async listCampaigns(req, res, next) {
    try {
      const campaigns = await campaignService.getAllCampaigns();
      res.status(200).json({
        success: true,
        message: 'Campaigns retrieved successfully',
        data: campaigns
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCampaign(req, res, next) {
    try {
      const campaign = await campaignService.updateCampaign(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCampaign(req, res, next) {
    try {
      await campaignService.deleteCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async startCampaign(req, res, next) {
    try {
      const result = await campaignService.startCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async pauseCampaign(req, res, next) {
    try {
      await campaignService.pauseCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign paused successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async resumeCampaign(req, res, next) {
    try {
      await campaignService.resumeCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign resumed successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelCampaign(req, res, next) {
    try {
      await campaignService.cancelCampaign(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign cancelled and reset to Draft',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async getCampaignFollowups(req, res, next) {
    try {
      const followups = await campaignService.getCampaignFollowups(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign followups retrieved successfully',
        data: followups
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = campaignController;
