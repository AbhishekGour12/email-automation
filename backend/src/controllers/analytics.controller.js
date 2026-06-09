const analyticsService = require('../services/analytics.service');

const analyticsController = {
  async getGlobalStats(req, res, next) {
    try {
      const stats = await analyticsService.getGlobalStats();
      res.status(200).json({
        success: true,
        message: 'Global analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getCampaignStats(req, res, next) {
    try {
      const stats = await analyticsService.getCampaignStats(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Campaign analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getTimebasedStats(req, res, next) {
    try {
      const range = req.query.range || 'daily'; // daily, weekly, monthly
      const stats = await analyticsService.getTimebasedStats(range);
      res.status(200).json({
        success: true,
        message: 'Time-based analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = analyticsController;
