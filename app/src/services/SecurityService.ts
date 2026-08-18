import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@cog_biometric_enabled';

class SecurityService {
  /**
   * Check if the device supports biometric authentication
   */
  async isBiometricAvailable() {
    try {
      if (!LocalAuthentication.hasHardwareAsync) {
        console.warn('Native biometric module not found.');
        return false;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (e) {
      return false;
    }
  }

  /**
   * Set user preference for biometric login
   */
  async setBiometricPreference(enabled: boolean) {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error('Error saving biometric preference:', e);
    }
  }

  /**
   * Get user preference for biometric login
   */
  async isBiometricEnabled() {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return val ? JSON.parse(val) : false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Authenticate the user using biometrics (Fingerprint/FaceID) 
   * or fallback to Device Passcode/Pattern
   */
  async authenticate(churchName: string = 'Church of GOD') {
    try {
      if (!LocalAuthentication.authenticateAsync) {
        return true; // Fallback if module is missing
      }

      const results = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock ${churchName}`,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return results.success;
    } catch (error) {
      console.error('Biometric Auth Error:', error);
      return false;
    }
  }

  /**
   * Comprehensive security check that respects user preference
   */
  async performSecurityCheck(churchName?: string): Promise<boolean> {
    const isEnabled = await this.isBiometricEnabled();
    const isAvailable = await this.isBiometricAvailable();
    
    if (!isEnabled || !isAvailable) {
      return true; // Skip if disabled or not available
    }

    return await this.authenticate(churchName);
  }
}

export default new SecurityService();

