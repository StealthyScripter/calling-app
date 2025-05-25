import { auth, FirebaseService } from '../firebase/config';
import { Alert } from 'react-native';

export interface User {
  uid: string;
  phoneNumber: string;
  displayName?: string;
}

class AuthService {
  private currentUser: User | null = null;

  // Phone number verification
  async verifyPhoneNumber(phoneNumber: string) {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert('Error', 'Failed to send verification code');
      throw error;
    }
  }

  // Confirm verification code
  async confirmCode(confirmation: any, code: string, displayName: string) {
    try {
      const userCredential = await confirmation.confirm(code);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await FirebaseService.createUser(user.phoneNumber!, displayName);
      
      this.currentUser = {
        uid: user.uid,
        phoneNumber: user.phoneNumber!,
        displayName
      };
      
      return this.currentUser;
    } catch (error) {
      console.error('Code confirmation error:', error);
      Alert.alert('Error', 'Invalid verification code');
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Sign out
  async signOut() {
    try {
      if (this.currentUser) {
        await FirebaseService.updateUserStatus(this.currentUser.uid, false);
      }
      await auth().signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = {
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber!,
          displayName: firebaseUser.displayName || undefined
        };
        FirebaseService.updateUserStatus(firebaseUser.uid, true);
      } else {
        this.currentUser = null;
      }
      callback(this.currentUser);
    });
  }
}

export default new AuthService();