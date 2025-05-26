const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ChimeService = require('../services/ChimeService');

const router = express.Router();

// Store active calls in memory (use Redis in production)
const activeCalls = new Map();

// Initiate a call
router.post('/initiate', async (req, res) => {
  try {
    const { toPhoneNumber, callType = 'voice' } = req.body;
    const userId = req.user?.uid || 'test-user'; // Fallback for testing

    if (!toPhoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate unique call ID
    const callId = uuidv4();

    // For now, we'll simulate a successful call initiation
    // TODO: Implement actual Chime SDK integration
    const mockMeeting = {
      Meeting: {
        MeetingId: `meeting-${callId}`,
        MediaRegion: 'us-east-1'
      }
    };

    const mockAttendee = {
      Attendee: {
        AttendeeId: `attendee-${userId}`,
        ExternalUserId: userId
      }
    };

    // Store call session
    activeCalls.set(callId, {
      callId,
      toPhoneNumber,
      callType,
      userId,
      startTime: new Date(),
      meetingId: mockMeeting.Meeting.MeetingId,
      status: 'initiated',
    });

    res.json({
      callId,
      meetingId: mockMeeting.Meeting.MeetingId,
      meetingResponse: mockMeeting.Meeting,
      attendeeResponse: mockAttendee.Attendee,
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

    // TODO: End Chime meeting when implemented
    console.log(`Ending call ${callId} with duration ${duration}s`);

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

// Get active calls (for debugging)
router.get('/active', (req, res) => {
  const calls = Array.from(activeCalls.values());
  res.json({ activeCalls: calls });
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
