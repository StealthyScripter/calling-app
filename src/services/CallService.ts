import { Linking, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { FirebaseService } from '../firebase/config';
import AuthService from './AuthService';

const API_BASE_URL = 'http://localhost:3000/api'; // Replace with your backend URL

export interface CallSession {
  callId: string;
  toNumber: string;
  type?:string;
  startTime: Date;
  isActive: boolean;
}

class CallService {
  private activeCall: CallSession | null = null;

  // Check network connectivity
  async checkNetworkConnection(): Promise<boolean> {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected === true;
  }

  // Initiate a call
  async initiateCall(toNumber: string, callType: 'voice' | 'video' = 'voice') {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'Please login to make calls');
      return;
    }

    const isConnected = await this.checkNetworkConnection();

    if (isConnected) {
      // Internet-based call via Chime SDK
      return this.initiateInternetCall(toNumber, callType);
    } else {
      // PSTN call fallback
      return this.initiatePSTNCall(toNumber);
    }
  }

  // Internet-based call
  private async initiateInternetCall(toNumber: string, callType: 'voice' | 'video') {
    try {
      const response = await fetch(`${API_BASE_URL}/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          toPhoneNumber: toNumber,
          callType,
        }),
      });

      const callData = await response.json();

      if (response.ok) {
        this.activeCall = {
          callId: callData.callId,
          toNumber,
          startTime: new Date(),
          isActive: true,
        };

        // TODO: Integrate with Amazon Chime SDK React Native
        // await ChimeReactNative.joinMeeting(callData.meetingId);

        Alert.alert('Call Initiated', `Calling ${toNumber} via internet`);
        return this.activeCall;
      } else {
        throw new Error(callData.message || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Internet call error:', error);
      Alert.alert('Call Failed', 'Unable to connect via internet. Trying cellular...');
      return this.initiatePSTNCall(toNumber);
    }
  }

  // PSTN fallback call
  private async initiatePSTNCall(toNumber: string) {
    try {
      const callUrl = `tel:${toNumber}`;
      const canOpenURL = await Linking.canOpenURL(callUrl);

      if (canOpenURL) {
        await Linking.openURL(callUrl);

        // Log the call attempt
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          await FirebaseService.logCall(
            currentUser.uid,
            toNumber,
            0, // Duration will be updated when call ends
            'voice',
            'pstn_initiated'
          );
        }

        Alert.alert('Call Initiated', `Calling ${toNumber} via cellular network`);
        return { toNumber, type: 'pstn', startTime: new Date() };
      } else {
        throw new Error('Cannot make phone calls on this device');
      }
    } catch (error) {
      console.error('PSTN call error:', error);
      Alert.alert('Call Failed', 'Unable to make call');
      throw error;
    }
  }

  // End active call
  async endCall() {
    if (!this.activeCall) return;

    try {
      const duration = Math.floor((Date.now() - this.activeCall.startTime.getTime()) / 1000);

      // End call via backend
      await fetch(`${API_BASE_URL}/calls/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          callId: this.activeCall.callId,
          duration,
        }),
      });

      // Log call completion
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        await FirebaseService.logCall(
          currentUser.uid,
          this.activeCall.toNumber,
          duration,
          'voice',
          'completed'
        );
      }

      this.activeCall = null;
      Alert.alert('Call Ended', `Call duration: ${duration} seconds`);
    } catch (error) {
      console.error('End call error:', error);
    }
  }

  // Get current active call
  getActiveCall(): CallSession | null {
    return this.activeCall;
  }

  // Get call history
  async getCallHistory() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {return [];}

    try {
      return await FirebaseService.getCallHistory(currentUser.uid);
    } catch (error) {
      console.error('Get call history error:', error);
      return [];
    }
  }

  // Get auth token (placeholder - implement based on your auth system)
  private async getAuthToken(): Promise<string> {
    // TODO: Implement token retrieval
    return 'your-jwt-token';
  }
}

export default new CallService();