import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export { auth, firestore };

export const collections = {
  users: 'users',
  callLogs: 'callLogs',
  contacts: 'contacts'
};

// Firebase service functions
export const FirebaseService = {
  // Create user profile
  async createUser(phoneNumber: string, displayName: string) {
    const userRef = firestore().collection(collections.users).doc();
    await userRef.set({
      phoneNumber,
      displayName,
      isOnline: true,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    return userRef.id;
  },

  // Log call
  async logCall(fromUserId: string, toNumber: string, duration: number, callType: 'voice' | 'video', status: string) {
    await firestore().collection(collections.callLogs).add({
      fromUserId,
      toNumber,
      duration,
      callType,
      status,
      timestamp: firestore.FieldValue.serverTimestamp()
    });
  },

  // Get call history
  async getCallHistory(userId: string) {
    const snapshot = await firestore()
      .collection(collections.callLogs)
      .where('fromUserId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update user online status
  async updateUserStatus(userId: string, isOnline: boolean) {
    await firestore()
      .collection(collections.users)
      .doc(userId)
      .update({ isOnline });
  }
};