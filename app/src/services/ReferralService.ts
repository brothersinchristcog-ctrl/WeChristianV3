import { firestore } from './firebaseConfig';
import { Platform } from 'react-native';
// @ts-ignore
import PlayInstallReferrer from 'react-native-play-install-referrer';

export interface ReferralDetails {
  uid: string;
  name: string;
  churchId?: string;
  code: string;
  createdAt: any;
}

class ReferralService {
  /**
   * Generates a random alphanumeric 6-character code
   */
  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'WE-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Gets a user's existing referral code, or generates a new one if it doesn't exist.
   */
  async getOrCreateReferralCode(uid: string, name: string, churchId?: string): Promise<string> {
    try {
      // 1. Check if the user already has a code
      const snapshot = await firestore().collection('referral_codes').where('uid', '==', uid).limit(1).get();
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id; // The document ID is the code
      }

      // 2. Generate a unique code
      let isUnique = false;
      let newCode = '';
      
      while (!isUnique) {
        newCode = this.generateShortCode();
        const doc = await firestore().collection('referral_codes').doc(newCode).get();
        if (!doc.exists()) {
          isUnique = true;
        }
      }

      // 3. Save the new code
      const referralData: Omit<ReferralDetails, 'code'> = {
        uid,
        name,
        churchId: churchId || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('referral_codes').doc(newCode).set(referralData);
      return newCode;
    } catch (error) {
      console.error('Error getting/creating referral code:', error);
      throw error;
    }
  }

  /**
   * Validates a referral code and returns the referrer's details.
   */
  async validateReferralCode(code: string): Promise<ReferralDetails | null> {
    if (!code || code.trim() === '') return null;
    
    try {
      // Ensure uppercase formatting just in case
      const normalizedCode = code.trim().toUpperCase();
      
      const doc = await firestore().collection('referral_codes').doc(normalizedCode).get();
      if (doc.exists()) {
        const data = doc.data() as Omit<ReferralDetails, 'code'>;
        return {
          ...data,
          code: normalizedCode,
        };
      }
      return null;
    } catch (error) {
      console.error('Error validating referral code:', error);
      throw error;
    }
  }

  /**
   * Attempts to retrieve a referral code passed through the Google Play Store installation.
   * This relies on the 'referrer' parameter being passed in the Play Store URL.
   * Only works on Android devices.
   */
  async getInstallReferrerCode(): Promise<string | null> {
    if (Platform.OS !== 'android') return null;

    return new Promise((resolve) => {
      try {
        (PlayInstallReferrer as any).getInstallReferrerInfo((error: any, result: any) => {
          if (error || !result || !result.installReferrer) {
            resolve(null);
            return;
          }

          const refStr = result.installReferrer;
          console.log('Play Store Install Referrer:', refStr);

          // The referrer could be raw "WE-A1B2C" or encoded like "utm_source=...&referrer=WE-A1B2C"
          // We look for our specific code format: WE- followed by 5 alphanumeric uppercase characters.
          const match = refStr.match(/WE-[A-Z0-9]{5}/i);
          if (match) {
            resolve(match[0].toUpperCase());
          } else {
            resolve(null);
          }
        });
      } catch (err) {
        console.warn('Error reading install referrer:', err);
        resolve(null);
      }
    });
  }
}

export default new ReferralService();
