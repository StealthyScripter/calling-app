const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Initialize Firebase Admin (do this once in your app)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        // Add your Firebase service account credentials here
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.log('Firebase Admin initialization skipped:', error.message);
  }
}

// Verify phone number (placeholder - Firebase handles this client-side)
router.post('/verify-phone', (req, res) => {
  res.json({
    message: 'Phone verification handled by Firebase client SDK',
  });
});

// Middleware to verify Firebase auth token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check for auth
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Auth service is running',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;