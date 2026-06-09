const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
require('dotenv').config();

// Helper to create transport config from dynamic inputs or env variables
const getSmtpConfig = (customSettings = null) => {
  if (customSettings && customSettings.host) {
    return {
      /** 
      host: customSettings.host,
      port: parseInt(customSettings.port, 10),
      secure: customSettings.secure === true || customSettings.secure === 'true',
      */
      service: "gmail",
      auth: {
        user: customSettings.auth?.user || customSettings.user,
        pass: customSettings.auth?.pass || customSettings.pass
      }
    };
  }

  return {
    /** 
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    
    secure: process.env.SMTP_SECURE !== 'false', // default to true (SSL)
    */
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER || 'a',
      pass: process.env.SMTP_PASS || ''
    }
  };
};

const createTransporter = (customSettings = null) => {
  const config = getSmtpConfig(customSettings);
  return nodemailer.createTransport(config);
};

// Default transporter using environment variables
const defaultTransporter = createTransporter();

// Test the connection helper
const verifyConnection = async (transporter = defaultTransporter) => {
  try {
    await transporter.verify();
    logger.info('SMTP Connection verified successfully.');
    return true;
  } catch (error) {
    logger.error('SMTP Connection verification failed:', error);
    return false;
  }
};

module.exports = {
  createTransporter,
  defaultTransporter,
  verifyConnection
};
