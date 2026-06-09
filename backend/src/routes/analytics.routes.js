const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/global', analyticsController.getGlobalStats);
router.get('/campaign/:id', analyticsController.getCampaignStats);
router.get('/timebased', analyticsController.getTimebasedStats);

module.exports = router;
