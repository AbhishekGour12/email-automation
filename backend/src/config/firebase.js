const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
require('dotenv').config();

const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
  logger.error('FIREBASE_DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

try {
  let serviceAccount = null;

  // 1. Check for individual environment variables first
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    logger.info('Initializing Firebase using individual environment variables.');
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  } 
  // 2. Fallback to stringified/base64 JSON environment variable
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let rawCreds = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      
      // Strip surrounding quotes if Render wrapped it in them
      if ((rawCreds.startsWith("'") && rawCreds.endsWith("'")) || (rawCreds.startsWith('"') && rawCreds.endsWith('"'))) {
        rawCreds = rawCreds.slice(1, -1).trim();
      }
      
      // If it looks like base64 (not starting with '{'), try decoding it
      if (!rawCreds.startsWith('{')) {
        logger.info('FIREBASE_SERVICE_ACCOUNT does not start with JSON brace. Attempting Base64 decode...');
        const decoded = Buffer.from(rawCreds, 'base64').toString('utf8').trim();
        if (decoded.startsWith('{')) {
          rawCreds = decoded;
        }
      }
      
      serviceAccount = JSON.parse(rawCreds);
    } catch (err) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable as JSON.', err);
    }
  } 
  // 3. Fallback to path-based configuration (only if file exists)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(resolvedPath)) {
      try {
        serviceAccount = require(resolvedPath);
      } catch (err) {
        logger.error(`Failed to load Firebase service account from path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`, err);
      }
    } else {
      logger.warn(`Firebase service account file not found at path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}. Skipping path-based load.`);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });
    logger.info('Firebase Admin initialized successfully using service account.');
  } else {
    // If no credentials provided, initialize with application default credentials or try local emulator
    // In production this will throw if no environment default credentials exist, which is correct
    admin.initializeApp({
      databaseURL: databaseURL
    });
    logger.warn('Firebase Admin initialized without explicit service account (using default credentials/emulator).');
  }
} catch (error) {
  logger.error('Firebase Admin initialization failed:', error);
  process.exit(1);
}

const db = admin.database();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth
};
