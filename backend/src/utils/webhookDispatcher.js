const firebaseHelper = require('./firebaseHelper');
const { logger } = require('./logger');

/**
 * Dispatches an outgoing event payload to configured webhook URLs.
 * Uses native fetch available in Node.js 18+.
 * 
 * @param {string} event - Event name (e.g., 'reply.received', 'lead.status_updated')
 * @param {object} payload - Event payload data
 */
async function triggerWebhook(event, payload) {
  try {
    const webhooks = await firebaseHelper.get('settings/webhooks');
    if (!webhooks) {
      return; // No webhooks configured
    }

    // Map the event to the configured URL field
    let urlKey = '';
    if (event === 'reply.received') {
      urlKey = 'replyReceivedUrl';
    } else if (event === 'lead.status_updated') {
      urlKey = 'statusUpdatedUrl';
    }

    const targetUrl = urlKey ? webhooks[urlKey] : null;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      return; // No URL configured for this specific event
    }

    logger.info(`Dispatching outgoing webhook event [${event}] to: ${targetUrl}`);

    const response = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-crm-event': event
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    if (!response.ok) {
      logger.warn(`Outgoing webhook [${event}] failed with status: ${response.status}`);
    } else {
      logger.info(`Outgoing webhook [${event}] successfully sent.`);
    }
  } catch (error) {
    logger.error(`Error sending outgoing webhook [${event}]:`, error);
  }
}

module.exports = { triggerWebhook };
