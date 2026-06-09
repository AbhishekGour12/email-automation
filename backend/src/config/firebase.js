const admin = require('firebase-admin');
const path = require('path');
const { logger } = require('../utils/logger');
require('dotenv').config();

const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
  logger.error('FIREBASE_DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

try {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable as JSON.', err);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    } catch (err) {
      logger.error(`Failed to load Firebase service account from path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`, err);
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
