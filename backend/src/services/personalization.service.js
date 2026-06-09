const fs = require('fs');
const path = require('path');
const { parsePlaceholders } = require('../utils/placeholderParser');
const { logger } = require('../utils/logger');

let industryHooks = {};

try {
  const hooksPath = path.join(__dirname, '../templates/industryHooks.json');
  if (fs.existsSync(hooksPath)) {
    industryHooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  } else {
    logger.warn('industryHooks.json not found. Falling back to empty hooks.');
  }
} catch (error) {
  logger.error('Failed to load industry hooks configuration:', error);
}

/**
 * Service to handle rule-based email content personalization.
 */
const personalizationService = {
  /**
   * Retrieves specific hook texts based on industry name.
   * @param {string} industry 
   * @returns {object} - { intro, value, cta }
   */
  getHooksForIndustry(industry) {
    if (!industry) return industryHooks['Other'];
    
    // Normalize and match (e.g. "real estate" -> "Real Estate")
    const cleanIndustry = industry.trim().toLowerCase();
    
    const matchedKey = Object.keys(industryHooks).find(
      (key) => key.toLowerCase() === cleanIndustry
    );

    return matchedKey ? industryHooks[matchedKey] : industryHooks['Other'];
  },

  /**
   * Personalize subject and body templates with lead values and industry hooks.
   * Supports:
   *   {{intro_hook}}, {{value_hook}}, {{cta_hook}}
   *   {{name}}, {{company}}, {{industry}}, {{website}}, {{city}}, {{country}}, {{phone}}, {{linkedin}}
   * @param {object} template - { subject, body } or any text
   * @param {object} lead - Lead object
   * @returns {object} - { subject, body } personalized
   */
  personalize(template, lead = {}) {
    let { subject, body } = template;
    
    // Get industry hooks
    const hooks = this.getHooksForIndustry(lead.industry);
    
    // Create copy of lead and append the hooks so placeholderParser can parse them
    const leadWithHooks = {
      ...lead,
      intro_hook: hooks?.intro || '',
      value_hook: hooks?.value || '',
      cta_hook: hooks?.cta || '',
      industry_hook: `${hooks?.intro || ''} ${hooks?.value || ''} ${hooks?.cta || ''}`
    };

    // First replace placeholders in subject
    const personalizedSubject = parsePlaceholders(subject, leadWithHooks);
    
    // Replace placeholders in body
    const personalizedBody = parsePlaceholders(body, leadWithHooks);

    return {
      subject: personalizedSubject,
      body: personalizedBody
    };
  }
};

module.exports = personalizationService;
