import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Modal, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { Bell } from 'lucide-react-native';
import RootNavigator from './src/navigation/RootNavigator';
import * as Application from 'expo-application';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once at app startup (before any screen mounts)
// In @react-native-google-signin v14+, webClientId is auto-read from google-services.json
// Passing it manually was causing DEVELOPER_ERROR in production builds
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
  offlineAccess: true,
});

import SpInAppUpdates, {
  IAUUpdateKind,
} from 'sp-react-native-in-app-updates/lib/commonjs/index';

// Import Firebase config to initialize it on app start
import './src/services/firebaseConfig';

const inAppUpdates = new SpInAppUpdates(false);

export const navigationRef = createNavigationContainerRef();
const { width } = Dimensions.get('window');

export default function App() {
  const [notification, setNotification] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const firestore = require('@react-native-firebase/firestore').default;
        const configDoc = await firestore().collection('public_settings').doc('app_config').get();
        const configData = configDoc.data() || {};
        const forceUpdate = configData.forceUpdate === true;
        const latestVersionCode = configData.latestAndroidVersionCode || 0;
        
        // 1. Safe way to get current version code (Android)
        let currentVersionCode = 0;
        if (Platform.OS === 'android' && Application.nativeBuildVersion) {
          currentVersionCode = parseInt(Application.nativeBuildVersion, 10);
        }

        // 2. Database-driven Update Check (Fallback / Override)
        // This is a bulletproof way to force an update if Play Store hasn't propagated yet
        if (Platform.OS === 'android' && currentVersionCode > 0 && latestVersionCode > currentVersionCode) {
          console.log('Update forced by Firebase settings');
          setUpdateAvailable(true);
          return; // Stop here, show the custom modal
        }
        
        // 3. Official Google Play In-App Updates Check
        const result = await inAppUpdates.checkNeedsUpdate();
        if (result.shouldUpdate) {
          if (Platform.OS === 'android') {
            const updateOptions = {
              updateType: forceUpdate ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE,
            };
            inAppUpdates.startUpdate(updateOptions).catch(err => {
              console.log('Native update failed, showing fallback modal:', err);
              setUpdateAvailable(true);
            });
          } else {
            // iOS or other platforms fallback
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.log('In-app update check failed:', err);
        // Do not force show modal here to prevent soft-locking the app if offline
      }
    };
    
    checkUpdates();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'New Notification';
      const body = remoteMessage.notification?.body || 'You have a new message.';
      
      setNotification({ title, body });
      
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: Platform.OS === 'ios' ? 60 : 40,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(4000),
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 350,
          useNativeDriver: true,
        })
      ]).start(() => setNotification(null));
    });
    return unsubscribe;
  }, [slideAnim]);

  const linking = {
    prefixes: ['wechristian://', 'https://wechristian.app'],
    config: {
      screens: {
        Auth: {
          screens: {
            ChurchSelection: 'invite',
          }
        }
      }
    }
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <StatusBar style="light" />
      <RootNavigator />
      
      {notification && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={() => {
            Animated.timing(slideAnim, { toValue: -150, duration: 250, useNativeDriver: true }).start(() => setNotification(null));
          }}>
            <View style={styles.toastIconBox}>
              <Bell size={24} color="#1a2d5a" />
            </View>
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle} numberOfLines={1}>{notification.title}</Text>
              <Text style={styles.toastBody} numberOfLines={3}>{notification.body}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Fallback Update Modal */}
      <Modal visible={updateAvailable} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.updateCard}>
            <View style={styles.updateIconContainer}>
              <Bell size={32} color="#fff" />
            </View>
            <Text style={styles.updateTitle}>Update Available!</Text>
            <Text style={styles.updateText}>
              A new version of We Christian is available. Please update to get the latest features and improvements.
            </Text>
            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={() => {
                // Link to Play Store / App Store
                const link = Platform.OS === 'ios' 
                  ? 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID' 
                  : 'market://details?id=com.wechristian.app';
                Linking.openURL(link).catch(() => {
                  alert('Please open your app store to update.');
                });
              }}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.updateCancelButton} 
              onPress={() => setUpdateAvailable(false)}
            >
              <Text style={styles.updateCancelText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toastCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.06)',
  },
  toastIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toastContent: {
    flex: 1,
    paddingTop: 2,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2d5a',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  toastBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  updateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a2d5a',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: '#1a2d5a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  updateCancelButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  updateCancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  }
});
