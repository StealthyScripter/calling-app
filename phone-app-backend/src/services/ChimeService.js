const { 
  ChimeSDKMeetings,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  DeleteMeetingCommand 
} = require('@aws-sdk/client-chime-sdk-meetings');

class ChimeService {
  constructor() {
    this.chimeClient = new ChimeSDKMeetings({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createMeeting(callId, userId) {
    try {
      const meetingRequest = {
        ClientRequestToken: callId,
        MediaRegion: process.env.AWS_REGION || 'us-east-1',
        ExternalMeetingId: `call-${userId}-${Date.now()}`,
        MeetingFeatures: {
          Audio: {
            EchoReduction: 'AVAILABLE'
          }
        }
      };

      const command = new CreateMeetingCommand(meetingRequest);
      const meeting = await this.chimeClient.send(command);
      
      console.log('Meeting created:', meeting.Meeting.MeetingId);
      return meeting;
    } catch (error) {
      console.error('Create meeting error:', error);
      throw error;
    }
  }

  async createAttendee(meetingId, userId) {
    try {
      const attendeeRequest = {
        MeetingId: meetingId,
        ExternalUserId: userId,
        Capabilities: {
          Audio: 'SendReceive',
          Video: 'None'
        }
      };

      const command = new CreateAttendeeCommand(attendeeRequest);
      const attendee = await this.chimeClient.send(command);
      
      console.log('Attendee created:', attendee.Attendee.AttendeeId);
      return attendee;
    } catch (error) {
      console.error('Create attendee error:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId) {
    try {
      const command = new DeleteMeetingCommand({ MeetingId: meetingId });
      await this.chimeClient.send(command);
      
      console.log('Meeting deleted:', meetingId);
    } catch (error) {
      console.error('Delete meeting error:', error);
      throw error;
    }
  }
}

module.exports = new ChimeService();

// ../phone-app-backend/package.json
{
  "name": "phone-app-backend",
  "version": "1.0.0",
  "description": "Backend API for Phone Calling App",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "firebase-admin": "^11.11.1",
    "@aws-sdk/client-chime-sdk-meetings": "^3.454.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "keywords": ["phone", "calling", "chime", "firebase"],
  "author": "Your Name",
  "license": "MIT"
}

// ../phone-app-backend/.env.example
# Server Configuration
PORT=3000
NODE_ENV=development

# AWS Configuration for Chime SDK
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com