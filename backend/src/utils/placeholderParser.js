const { logger } = require('./logger');

/**
 * Replaces placeholder tokens in email templates with lead values.
 * Supported fields: name, company, industry, website, city, country, phone, linkedin.
 * @param {string} text - Template text (subject or body)
 * @param {object} lead - Lead object
 * @returns {string} - Personalized text
 */
const parsePlaceholders = (text, lead = {}) => {
  if (!text) return '';

  const fallbacks = {
    name: 'there',
    company: 'your company',
    industry: 'your space',
    city: 'your city',
    country: 'your country',
    website: 'your website',
    phone: '',
    linkedin: ''
  };

  return text.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
    const cleanField = fieldName.toLowerCase();

    // Check if lead has the property
    if (lead[cleanField] !== undefined && lead[cleanField] !== null && lead[cleanField].toString().trim() !== '') {
      return lead[cleanField].toString().trim();
    }

    // Fallback if field not found in lead or empty
    return fallbacks[cleanField] !== undefined ? fallbacks[cleanField] : '';
  });
};

module.exports = {
  parsePlaceholders
};
