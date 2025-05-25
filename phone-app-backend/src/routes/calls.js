const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ChimeService = require('../services/chimeService');

express.Router();

// Store active calls in memory (use Redis in production)
const activeCalls = new Map();

// Initiate a call
router.post('/initiate', async (req, res) => {
  try {
    const { toPhoneNumber, callType = 'voice' } = req.body;
    const userId = req.user?.uid; // From auth middleware

    if (!toPhoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate unique call ID
    const callId = uuidv4();

    // Create Chime meeting
    const meeting = await ChimeService.createMeeting(callId, userId);
    const attendee = await ChimeService.createAttendee(meeting.Meeting.MeetingId, userId);

    // Store call session
    activeCalls.set(callId, {
      callId,
      toPhoneNumber,
      callType,
      userId,
      startTime: new Date(),
      meetingId: meeting.Meeting.MeetingId,
      status: 'initiated',
    });

    res.json({
      callId,
      meetingId: meeting.Meeting.MeetingId,
      meetingResponse: meeting.Meeting,
      attendeeResponse: attendee.Attendee,
      message: 'Call initiated successfully',
    });

  } catch (error) {
    console.error('Call initiation error:', error);
    res.status(500).json({
      error: 'Failed to initiate call',
      details: error.message,
    });
  }
});

// End a call
router.post('/end', async (req, res) => {
  try {
    const { callId, duration = 0 } = req.body;

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    const callSession = activeCalls.get(callId);
    if (!callSession) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    // End Chime meeting
    await ChimeService.deleteMeeting(callSession.meetingId);

    // Update call session
    callSession.endTime = new Date();
    callSession.duration = duration;
    callSession.status = 'completed';

    // Remove from active calls
    activeCalls.delete(callId);

    res.json({
      message: 'Call ended successfully',
      duration,
      callId,
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      error: 'Failed to end call',
      details: error.message,
    });
  }
});

// Webhook for Chime callbacks
router.post('/webhook', (req, res) => {
  try {
    const { eventType, callId, data } = req.body;

    console.log('Chime webhook received:', { eventType, callId, data });

    // Handle different webhook events
    switch (eventType) {
      case 'call.started':
        console.log(`Call ${callId} started`);
        break;
      case 'call.ended':
        console.log(`Call ${callId} ended`);
        break;
      default:
        console.log(`Unknown event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;

// ../phone-app-backend/src/routes/auth.js
require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Initialize Firebase Admin (do this once in your app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // Add your Firebase service account credentials here
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
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

module.exports = router;
