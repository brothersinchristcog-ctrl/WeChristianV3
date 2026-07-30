import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { Bell } from 'lucide-react-native';
import RootNavigator from './src/navigation/RootNavigator';

// Import Firebase config to initialize it on app start
import './src/services/firebaseConfig';

export const navigationRef = createNavigationContainerRef();
const { width } = Dimensions.get('window');

export default function App() {
  const [notification, setNotification] = useState(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
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

  return (
    <NavigationContainer ref={navigationRef}>
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
  }
});
