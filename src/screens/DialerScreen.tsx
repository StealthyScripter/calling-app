import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import CallService, { CallSession } from '../services/CallService';

const DialerScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  useEffect(() => {
    // Check for any active calls when screen loads
    const currentCall = CallService.getActiveCall();
    setActiveCall(currentCall);
  }, []);

  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  const handleNumberPress = (number: string) => {
    Vibration.vibrate(50); // Haptic feedback
    setPhoneNumber(prev => prev + number);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    try {
      const callSession = await CallService.initiateCall(phoneNumber);
      if (callSession) {
        setActiveCall(callSession);
      }
    } catch (error) {
      console.error('Call initiation error:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      await CallService.endCall();
      setActiveCall(null);
    } catch (error) {
      console.error('End call error:', error);
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const formatPhoneNumber = (number: string) => {
    // Simple formatting for display
    if (number.length === 0) {return '';}
    if (number.length <= 3) {return number;}
    if (number.length <= 6) {
      return `${number.slice(0, 3)}-${number.slice(3)}`;
    }
      return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6, 10)}`;
  };

  return (
    <View style={styles.container}>
      {/* Phone Number Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.phoneDisplay}>
          {formatPhoneNumber(phoneNumber) || 'Enter number'}
        </Text>
        {phoneNumber.length > 0 && (
          <TouchableOpacity onPress={handleBackspace} style={styles.backspaceButton}>
            <Text style={styles.backspaceText}>⌫</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Call Status */}
      {activeCall && (
        <View style={styles.callStatusContainer}>
          <Text style={styles.callStatusText}>📞 Active Call</Text>
          <Text style={styles.callNumberText}>{activeCall.toNumber}</Text>
          <Text style={styles.callTimeText}>
            Started: {activeCall.startTime.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Dialpad */}
      <View style={styles.dialpadContainer}>
        {dialpadNumbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.dialpadRow}>
            {row.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.dialpadButton}
                onPress={() => handleNumberPress(number)}
                activeOpacity={0.7}
              >
                <Text style={styles.dialpadButtonText}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!activeCall ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={handleCall}
              disabled={phoneNumber.length === 0}
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>

            {phoneNumber.length > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <Text style={styles.actionButtonText}>📞 End Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneDisplay: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backspaceButton: {
    padding: 10,
  },
  backspaceText: {
    fontSize: 20,
    color: '#666',
  },
  callStatusContainer: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  callStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callNumberText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 5,
  },
  callTimeText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 3,
  },
  dialpadContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dialpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dialpadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dialpadButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#333',
  },
  actionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DialerScreen;
