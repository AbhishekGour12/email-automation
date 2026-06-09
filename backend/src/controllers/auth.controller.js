const { auth: firebaseAuth, db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../middlewares/error.middleware');
const { logger } = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'abhi_services_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'abhi_services_refresh_key';
const ACCESS_TOKEN_EXPIRY = '10d';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateTokens = (user) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ uid: user.uid }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
};

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      // 1. Create user in Firebase Auth
      let firebaseUser;
      try {
        firebaseUser = await firebaseAuth.createUser({
          email,
          password,
          displayName: name
        });
      } catch (err) {
        logger.error('Firebase Auth registration error:', err);
        throw new ApiError(400, err.message || 'Registration failed.');
      }

      const uid = firebaseUser.uid;

      // 2. Hash password for local fallback database validation (bcrypt)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. Save to Firebase RTDB users node
      const userData = {
        uid,
        name,
        email,
        role: role || 'Team Member',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.ref(`users/${uid}`).set(userData);

      // Set Firebase custom user claims (optional, but good for security)
      await firebaseAuth.setCustomUserClaims(uid, { role: userData.role });

      // 4. Generate custom JWT tokens
      const tokens = generateTokens(userData);

      // Save refresh token to user node
      await db.ref(`users/${uid}/refreshToken`).set(tokens.refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            uid,
            name,
            email,
            role: userData.role
          },
          tokens
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Query user from RTDB
      const usersSnapshot = await db.ref('users')
        .orderByChild('email')
        .equalTo(email.trim().toLowerCase())
        .once('value');
      
      const usersData = usersSnapshot.val();
      if (!usersData) {
        throw new ApiError(401, 'Invalid email or password.');
      }

      const uid = Object.keys(usersData)[0];
      const user = usersData[uid];

      // 2. Verify password with bcrypt
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password.');
      }

      // 3. Generate tokens
      const tokens = generateTokens(user);

      // Save refresh token in database
      await db.ref(`users/${uid}/refreshToken`).set(tokens.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            uid,
            name: user.name,
            email: user.email,
            role: user.role
          },
          tokens
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required.');
      }

      // Verify token signature
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (err) {
        throw new ApiError(401, 'Invalid or expired refresh token.');
      }

      const uid = decoded.uid;

      // Check if refresh token matches database
      const dbTokenSnapshot = await db.ref(`users/${uid}/refreshToken`).once('value');
      const dbToken = dbTokenSnapshot.val();

      if (dbToken !== refreshToken) {
        throw new ApiError(401, 'Refresh token is revoked or invalid.');
      }

      // Fetch user profile to sign new access token
      const userSnapshot = await db.ref(`users/${uid}`).once('value');
      const user = userSnapshot.val();
      if (!user) {
        throw new ApiError(401, 'User not found.');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Save new refresh token
      await db.ref(`users/${uid}/refreshToken`).set(tokens.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Check if user exists
      const usersSnapshot = await db.ref('users')
        .orderByChild('email')
        .equalTo(email.trim().toLowerCase())
        .once('value');

      if (!usersSnapshot.exists()) {
        throw new ApiError(404, 'User with this email does not exist.');
      }

      // Generate password reset link using Firebase Admin
      const link = await firebaseAuth.generatePasswordResetLink(email);
      
      // In a real application, you'd send this link via email.
      // Here, we return it in the response for testability.
      logger.info(`Generated password reset link for ${email}: ${link}`);

      res.status(200).json({
        success: true,
        message: 'Password reset link generated. Check logs or verify link.',
        data: {
          resetLink: link
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      // Typically reset password would be verified on the client with Firebase SDK.
      // However, we expose a backend reset password by user ID for administrative support or custom flows.
      const { password } = req.body;
      const uid = req.user.uid; // Assumes they are authenticated or passing admin token

      // 1. Update Firebase Auth password
      await firebaseAuth.updateUser(uid, { password });

      // 2. Re-hash local password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. Update database
      await db.ref(`users/${uid}`).update({
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
