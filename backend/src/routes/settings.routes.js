const express = require('express');
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const router = express.Router();

router.use(authMiddleware);

// Only admins can retrieve or modify global settings
router.get('/', adminMiddleware, settingsController.getSettings);
router.put('/:section', adminMiddleware, settingsController.updateSettingsSection);
router.post('/test-smtp', adminMiddleware, settingsController.testSmtpSettings);

module.exports = router;
