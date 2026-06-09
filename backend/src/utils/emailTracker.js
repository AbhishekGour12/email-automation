const { logger } = require('./logger');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Generates an HTML tracking pixel image tag.
 * @param {string} emailId 
 * @returns {string}
 */
const getTrackingPixelHtml = (emailId) => {
  return `<img src="${API_BASE_URL}/api/email/track/open/${emailId}" width="1" height="1" style="display:none !important;" alt="" />`;
};

/**
 * Rewrites HTTP/HTTPS links in the email body HTML to route through our click tracking endpoint.
 * @param {string} htmlBody 
 * @param {string} emailId 
 * @returns {string} - Modified HTML
 */
const rewriteLinksForClickTracking = (htmlBody, emailId) => {
  if (!htmlBody) return '';

  // Regex to find href="url" or href='url'
  // We only match http:// or https:// links and exclude mailto:, javascript:, anchors (#), etc.
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;

  return htmlBody.replace(hrefRegex, (match, url) => {
    // Avoid double tracking if the URL is already pointing to our tracking domain
    if (url.includes('/api/email/track/click/')) {
      return match;
    }
    
    const trackingUrl = `${API_BASE_URL}/api/email/track/click/${emailId}?url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
};

module.exports = {
  getTrackingPixelHtml,
  rewriteLinksForClickTracking
};
