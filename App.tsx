import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthService, { User } from './src/services/AuthService';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import DialerScreen from './src/screens/DialerScreen';
import CallHistoryScreen from './src/screens/CallHistoryScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Dialer: undefined;
  CallHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null; // Show loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user === null ? (
          // User is not logged in
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // User is logged in
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Phone App' }}
            />
            <Stack.Screen
              name="Dialer"
              component={DialerScreen}
              options={{ title: 'Dialer' }}
            />
            <Stack.Screen
              name="CallHistory"
              component={CallHistoryScreen}
              options={{ title: 'Call History' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
