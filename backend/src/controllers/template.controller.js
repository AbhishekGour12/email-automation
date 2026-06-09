const templateService = require('../services/template.service');

const templateController = {
  async createTemplate(req, res, next) {
    try {
      const template = await templateService.createTemplate(req.body);
      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  },

  async getTemplate(req, res, next) {
    try {
      const template = await templateService.getTemplate(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Template retrieved successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  },

  async listTemplates(req, res, next) {
    try {
      const templates = await templateService.getAllTemplates();
      res.status(200).json({
        success: true,
        message: 'Templates retrieved successfully',
        data: templates
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTemplate(req, res, next) {
    try {
      const template = await templateService.updateTemplate(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteTemplate(req, res, next) {
    try {
      await templateService.deleteTemplate(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  },

  async duplicateTemplate(req, res, next) {
    try {
      const template = await templateService.duplicateTemplate(req.params.id);
      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  },

  async previewTemplate(req, res, next) {
    try {
      const sampleLead = req.body || {};
      const result = await templateService.previewTemplate(req.params.id, sampleLead);
      res.status(200).json({
        success: true,
        message: 'Template preview rendered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = templateController;
