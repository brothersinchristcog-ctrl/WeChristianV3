import { firestore } from './firebaseConfig';

export interface ChurchTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface ChurchDetails {
  id: string;
  name: string;
  tagline?: string;
  subdomain: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  aboutUs?: string;
  theme: ChurchTheme;
  whatsappIntegrationEnabled?: boolean;
  automatedWhatsappWishesEnabled?: boolean;
  automatedWeCelebrationTemplate?: {
    themeId?: string;
    themeColor?: string;
    imageUrl?: string;
    message?: string;
    verseRef?: string;
    verseText?: string;
  };
  monthlyCelebrationTemplates?: Record<string, {
    themeId?: string;
    themeColor?: string;
    message?: string;
    verseRef?: string;
    verseText?: string;
  }>;
  features: {
    hasSermons: boolean;
    hasDailyPromises: boolean;
    hasWorshipSongs: boolean;
    hasGiving: boolean;
    hasWhatsAppAutomation?: boolean;
  };
  customThemes?: any[];
  subscription?: {
    status: string;
    trialEndsAt?: any;
    validUntil?: string;
    plan?: string;
  };
  socialLinks?: {
    youtube?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  givingDetails?: {
    upiId?: string;
    phonepeNumber?: string;
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upis?: { id: string; name?: string; upiId: string; phonepeNumber?: string }[];
    banks?: { id: string; name?: string; accountName: string; bankName: string; accountNumber: string; ifscCode: string }[];
  };
  subscriptionTier?: 'free' | 'standard' | 'premium';
  memberCount?: number;
}

class ChurchService {
  /**
   * Fetch details for a specific church tenant
   */
  async getChurchDetails(churchId: string): Promise<ChurchDetails | null> {
    try {
      const docSnap = await firestore().collection('churches').doc(churchId).get();
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ChurchDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching church details:', error);
      return null;
    }
  }

  /**
   * Fetch all registered churches (for selection screen)
   */
  async getAllChurches(): Promise<ChurchDetails[]> {
    try {
      const snapshot = await firestore().collection('churches').orderBy('name').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChurchDetails[];
    } catch (error) {
      console.error('Error fetching all churches:', error);
      return [];
    }
  }

  /**
   * Fetch church by subdomain/slug
   */
  async getChurchBySubdomain(subdomain: string): Promise<ChurchDetails | null> {
    try {
      const snapshot = await firestore()
        .collection('churches')
        .where('subdomain', '==', subdomain)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ChurchDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching church by subdomain:', error);
      return null;
    }
  }

  /**
   * Update church details
   */
  async updateChurch(churchId: string, updates: Partial<ChurchDetails>): Promise<void> {
    try {
      // Don't accidentally write the ID field into the document
      const { id, ...dataToUpdate } = updates as any;
      await firestore().collection('churches').doc(churchId).update(dataToUpdate);
    } catch (error) {
      console.error('Error updating church details:', error);
      throw error;
    }
  }

  /**
   * Create a new church (Super Admin only)
   */
  async createChurch(data: Omit<ChurchDetails, 'id'>): Promise<string> {
    try {
      const docRef = await firestore().collection('churches').add(data);
      return docRef.id;
    } catch (error) {
      console.error('Error creating church:', error);
      throw error;
    }
  }

  /**
   * Fetch church secrets (e.g., payment gateway keys)
   */
  async getChurchSecrets(churchId: string): Promise<{ phonePeMerchantId?: string; phonePeSaltKey?: string; phonePeSaltIndex?: string; whatsappAccessToken?: string; whatsappPhoneId?: string; useWeChristianWhatsApp?: boolean } | null> {
    try {
      const docSnap = await firestore().collection('churches').doc(churchId).collection('secrets').doc('payment').get();
      if (docSnap.exists()) {
        return docSnap.data() as any;
      }
      return null;
    } catch (error) {
      console.error('Error fetching church secrets:', error);
      return null;
    }
  }

  /**
   * Update church secrets
   */
  async updateChurchSecrets(churchId: string, secrets: { phonePeMerchantId?: string; phonePeSaltKey?: string; phonePeSaltIndex?: string; whatsappAccessToken?: string; whatsappPhoneId?: string; useWeChristianWhatsApp?: boolean }): Promise<boolean> {
    try {
      await firestore().collection('churches').doc(churchId).collection('secrets').doc('payment').set(secrets, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating church secrets:', error);
      return false;
    }
  }
}

export default new ChurchService();
