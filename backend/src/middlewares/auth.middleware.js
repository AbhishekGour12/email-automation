const jwt = require('jsonwebtoken');
const { auth: firebaseAuth, db } = require('../config/firebase');
const { ApiError } = require('./error.middleware');
const { logger } = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'abhi_services_secret_key';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token required. Access denied.');
    }

    const token = authHeader.split(' ')[1];
    
    // First, try verifying as a custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Contains { uid, email, role }
      return next();
    } catch (jwtError) {
      // If it's a expired token error and not a standard signature error, pass it
      if (jwtError.name === 'TokenExpiredError') {
        throw new ApiError(401, 'JWT Access Token expired.');
      }
      
      // If signature is invalid, try verifying via Firebase ID Token
      logger.debug('Custom JWT verification failed. Attempting Firebase ID token verification.');
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        const { uid, email } = decodedToken;
        
        // Fetch user role from Firebase Realtime Database
        const userSnapshot = await db.ref(`users/${uid}`).once('value');
        const userData = userSnapshot.val();
        
        const role = userData?.role || 'Team Member';
        const name = userData?.name || decodedToken.name || '';
        
        req.user = {
          uid,
          email,
          role,
          name
        };
        return next();
      } catch (firebaseError) {
        logger.error('Firebase token verification failed:', firebaseError);
        throw new ApiError(401, 'Invalid or expired authentication token.');
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
