const express = require('express');
const templateController = require('../controllers/template.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', templateController.createTemplate);
router.get('/', templateController.listTemplates);
router.get('/:id', templateController.getTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', adminMiddleware, templateController.deleteTemplate);

// Duplicate & Preview Actions
router.post('/:id/duplicate', templateController.duplicateTemplate);
router.post('/:id/preview', templateController.previewTemplate);

module.exports = router;
