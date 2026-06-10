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

// Helper to sanitize quotes and whitespace from environment variables
const sanitizeEnvVar = (val) => {
  if (!val) return val;
  let cleaned = val.trim();
  if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

try {
  let serviceAccount = null;

  const rawProjectId = process.env.FIREBASE_PROJECT_ID;
  const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  const projectId = sanitizeEnvVar(rawProjectId);
  const clientEmail = sanitizeEnvVar(rawClientEmail);
  const privateKey = sanitizeEnvVar(rawPrivateKey);

  // 1. Check for individual environment variables first
  if (projectId && clientEmail && privateKey) {
    logger.info('Initializing Firebase using individual environment variables.');
    serviceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n')
    };
  } 
  // If some but not all individual env vars are provided, log a detailed error
  else if (rawProjectId || rawClientEmail || rawPrivateKey) {
    logger.error('Incomplete Firebase credentials provided in individual environment variables: ' +
      `FIREBASE_PROJECT_ID: ${projectId ? 'PRESENT' : 'MISSING'}, ` +
      `FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'PRESENT' : 'MISSING'}, ` +
      `FIREBASE_PRIVATE_KEY: ${privateKey ? 'PRESENT' : 'MISSING'}.`
    );
  }

  // 2. Fallback to stringified/base64 JSON environment variable (only if individual variables were not used)
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
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

  // 3. Fallback to path-based configuration (only if file exists and credentials not loaded yet)
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
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
    // In production, we MUST have a service account credential to connect to Realtime Database. Fail fast.
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Firebase service account credentials are missing or invalid in production environment. ' +
        'Realtime Database connections cannot be authorized. Please configure either individual environment variables ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) or stringified JSON (FIREBASE_SERVICE_ACCOUNT).');
      process.exit(1);
    } else {
      // If no credentials provided in development, initialize with default configuration (e.g. for emulator)
      admin.initializeApp({
        databaseURL: databaseURL
      });
      logger.warn('Firebase Admin initialized without explicit service account (using default credentials/emulator).');
    }
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
