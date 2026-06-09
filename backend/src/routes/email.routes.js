const express = require('express');
const emailController = require('../controllers/email.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public Tracking Webhooks
router.get('/track/open/:emailId', emailController.trackOpen);
router.get('/track/click/:emailId', emailController.trackClick);

// Protected Outreach Logs & Manual Sends
router.post('/send-single', authMiddleware, emailController.sendSingleEmail);
router.get('/history', authMiddleware, emailController.listEmailHistory);

module.exports = router;
