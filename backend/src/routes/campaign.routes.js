const express = require('express');
const campaignController = require('../controllers/campaign.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const validate = require('../middlewares/validation.middleware');
const campaignValidation = require('../validations/campaign.validation');

const router = express.Router();

router.use(authMiddleware);

// Standard CRUD
router.post('/', validate(campaignValidation.createCampaign), campaignController.createCampaign);
router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', validate(campaignValidation.updateCampaign), campaignController.updateCampaign);
router.delete('/:id', adminMiddleware, campaignController.deleteCampaign);

// Campaign Control Actions
router.post('/:id/start', campaignController.startCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/cancel', campaignController.cancelCampaign);
router.get('/:id/followups', campaignController.getCampaignFollowups);

module.exports = router;
