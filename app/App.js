import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import RootNavigator from './src/navigation/RootNavigator';

// Import Firebase config to initialize it on app start
import './src/services/firebaseConfig';

export const navigationRef = createNavigationContainerRef();

export default function App() {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // In-app alert for foreground notifications
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || 'You have a new message.'
      );
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>

  );
}
