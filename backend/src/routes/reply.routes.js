const express = require('express');
const replyController = require('../controllers/reply.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { logger } = require('../utils/logger');
require('dotenv').config();

const router = express.Router();

// Webhook Secret Validation Middleware (for n8n or external services)
const webhookAuth = (req, res, next) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    // If secret is not set, allow access (default behavior for development)
    return next();
  }

  const clientSecret = req.headers['x-webhook-secret'] || req.query.secret;
  if (clientSecret === secret) {
    return next();
  }

  logger.warn('Unauthorized webhook access attempt rejected.');
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Invalid webhook secret token.',
    data: {}
  });
};

// Public webhook route (secured with optional webhook secret token)
router.post('/webhook', webhookAuth, replyController.receiveReply);

// Protected UI/Management routes
router.get('/', authMiddleware, replyController.listReplies);
router.put('/:id/tag', authMiddleware, replyController.tagReply);

module.exports = router;
