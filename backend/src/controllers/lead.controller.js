const leadService = require('../services/lead.service');
const { ApiError } = require('../middlewares/error.middleware');

const leadController = {
  async createLead(req, res, next) {
    try {
      const lead = await leadService.createLead(req.body);
      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  },

  async getLead(req, res, next) {
    try {
      const lead = await leadService.getLead(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Lead retrieved successfully',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  },

  async updateLead(req, res, next) {
    try {
      const lead = await leadService.updateLead(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteLead(req, res, next) {
    try {
      await leadService.deleteLead(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async listLeads(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const search = req.query.search || '';
      const status = req.query.status || '';
      const industry = req.query.industry || '';

      const result = await leadService.listLeads({ page, limit, search, status, industry });
      res.status(200).json({
        success: true,
        message: 'Leads retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async importLeads(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'Please upload a CSV or Excel file.');
      }

      const result = await leadService.importLeadsFromFile(req.file.path, req.file.originalname);
      res.status(200).json({
        success: true,
        message: 'Leads file uploaded and parsed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = leadController;
