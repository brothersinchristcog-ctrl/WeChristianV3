import { firestore, FieldValue } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface GlobalUser {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  primaryChurchId?: string;
  fcmToken?: string;
  createdAt?: any;
  lastLogin?: any;
  subscription?: {
    status: string; // 'trial', 'active', 'expired', etc.
    trialEndsAt?: any;
    planId?: string;
    plan?: string;
    validUntil?: string;
    lastPaymentId?: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  savings?: string;
}

export interface AppMember {
  id: string; // The uid
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  churchId: string;
  primaryChurchId?: string;
  joinDate?: string;
  accountId?: string;
  description?: string;
  mailingCity?: string;
  city?: string;
  village?: string;
  mailingState?: string;
  mailingStreet?: string;
  dob?: string;
  baptismDate?: string;
  anniversaryDate?: string;
}

export interface FirestorePromise {
  id: string;
  date: string; // YYYY-MM-DD
  verse: string;
  reference: string;
  devotionalNote: string;
  pastor: string;
  verseTelugu?: string;
  bgTheme?: string;
  createdAt: any;
}

export interface FirestoreVideo {
  id: string;
  youtubeId: string;
  title: string;
  duration: string;
  publishedAt: string;
  description?: string;
  isLive?: boolean;
}

export interface DailyPromise {
  id?: string;
  verse: string;
  verseTelugu?: string;
  date: string;
  devotionalNote?: string;
  pastor?: string;
  status?: string;
  youtubeId?: string;
  verseReference?: string;
  verseReferenceEn?: string;
  verseReferenceTe?: string;
  videoTitle?: string;
  duration?: string;
  imageUrl?: string;
}

export interface WorshipSong {
  id: string;
  title: string;
  titleTe?: string;
  artist: string;
  key: string;
  lyrics?: string;
  category?: string;
  youtubeId?: string;
  isThemeSong?: boolean;
}

export interface ScheduleEvent {
  id: string;
  name?: string;
  title: string;
  titleTelugu?: string;
  date: string;
  time?: string;
  startTime: string;
  endTime: string;
  location: string;
  address?: string;
  description: string;
  descEn?: string;
  category: string;
  image: string;
  bannerUrl?: string;
  youtubeId?: string;
}

export interface Sermon {
  id: string;
  title: string;
  titleTelugu?: string;
  youtubeId: string;
  date: string;
  pastor: string;
  duration: string;
  description?: string;
  scripture?: string;
  viewCount?: number;
  status?: string;
  series?: string;
  audioUrl?: string;
}

export interface ChurchExpense {
  id?: string;
  title?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  vendorName?: string;
  notes?: string;
  paidTo?: string;
  description?: string;
  status: 'Paid' | 'Pending';
  addedBy?: string;
  createdBy?: string;
  relatedMeeting?: string;
  lineItems?: Array<{ type: string; quantity: number; pricePerUnit: number; total: number }>;
  receiptUrl?: string | null;
  createdAt?: any;
}

export interface ChurchDonation {
  id?: string;
  donorName: string;
  donorPhone?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
  addedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ChurchInvoice {
  id: string; // The generated ID like EXP-2026-00028
  category: string;
  date: string;
  amount: number;
  preparedBy: string;
  expenseIds: string[]; // List of related expense IDs
  paymentMethod?: string;
  vendorName?: string;
  status?: 'Pending Approval' | 'Approved' | 'Rejected' | 'Changes Requested';
  reportedByUserId?: string; // Legacy
  reportedByName?: string; // Legacy
  reportedByUserIds?: string[]; // Multiple approvers
  reportedByNames?: string[]; // Multiple approvers
  approvalComments?: string;
  submitterPhone?: string;
  createdAt?: any;
}

// ─── Service Layer ────────────────────────────────────────────────────────────

class FirestoreService {
  private churchId: string | null = null;

  async setChurchId(id: string) {
    this.churchId = id;
    await AsyncStorage.setItem('@active_church_id', id);
  }

  async getChurchId(): Promise<string | null> {
    if (this.churchId) return this.churchId;
    this.churchId = await AsyncStorage.getItem('@active_church_id');
    return this.churchId;
  }

  // Helper to get church-scoped collection
  async getCollection(collectionName: string) {
    const id = await this.getChurchId();
    if (!id) throw new Error('Church ID not set');
    return firestore().collection('churches').doc(id).collection(collectionName);
  }

  // ─── Expenses ───────────────────────────────────────────────────────────────

  async getExpenses(limitNum = 200): Promise<ChurchExpense[]> {
    try {
      const expensesRef = await this.getCollection('expenses');
      const snapshot = await expensesRef.orderBy('date', 'desc').limit(limitNum).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChurchExpense));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async getExpense(id: string): Promise<ChurchExpense | null> {
    try {
      const expensesRef = await this.getCollection('expenses');
      const doc = await expensesRef.doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as ChurchExpense;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  async createExpense(data: Partial<ChurchExpense>): Promise<string> {
    try {
      const expensesRef = await this.getCollection('expenses');
      if (data.id) {
        await expensesRef.doc(data.id).set({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp()
        });
        return data.id;
      } else {
        const docRef = await expensesRef.add({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async updateExpense(id: string, data: Partial<ChurchExpense>): Promise<void> {
    try {
      const expensesRef = await this.getCollection('expenses');
      await expensesRef.doc(id).update(data);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      const expensesRef = await this.getCollection('expenses');
      await expensesRef.doc(id).delete();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // ─── Invoices ───────────────────────────────────────────────────────────────

  async getInvoices(limitNum = 200): Promise<ChurchInvoice[]> {
    try {
      const invoicesRef = await this.getCollection('invoices');
      const snapshot = await invoicesRef.orderBy('createdAt', 'desc').limit(limitNum).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChurchInvoice));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async saveInvoice(data: Partial<ChurchInvoice>): Promise<string> {
    try {
      const invoicesRef = await this.getCollection('invoices');
      // If the ID is explicitly provided (e.g. EXP-2026-00028), use it as the doc ID
      if (data.id) {
        await invoicesRef.doc(data.id).set({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp()
        });
        return data.id;
      } else {
        const docRef = await invoicesRef.add({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: Partial<ChurchInvoice>): Promise<void> {
    try {
      const invoicesRef = await this.getCollection('invoices');
      await invoicesRef.doc(id).set({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoicesRef = await this.getCollection('invoices');
      await invoicesRef.doc(id).delete();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // ─── End of Invoices & Expenses ───────────────────────────────────────────────


  // ─── Subscriptions ──────────────────────────────────────────────────────────
  
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = firestore().collection('subscription_plans');
      const snapshot = await plansRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  async getSubscribedMembers(churchId: string, limitNum: number = 20, lastDoc?: any, searchQuery?: string, statusFilter: string = 'all') {
    try {
      let membersRef = firestore().collection('churches').doc(churchId).collection('members');
      
      let query: any = membersRef;
      
      // For active/inactive, we can query directly
      if (statusFilter === 'active' || statusFilter === 'inactive') {
        query = query.where('subscription.status', '==', statusFilter);
      }
      
      if (searchQuery && searchQuery.trim().length > 0) {
         // Firestore doesn't support full-text search directly via simple queries for case-insensitive substrings.
         // For a simple implementation, we can order by name and use startAt/endAt.
         // Note: If 'name' is missing, it might use 'firstName'. This requires a composite index.
         // To avoid index issues and keep existing functionality undisturbed, we will fetch without search 
         // and filter locally if a search query is provided, or rely on a simple where clause if possible.
         // For now, we will fetch ordered by subscription.validUntil.
      }
      // If we are filtering for trial or searching, we fetch a larger batch because we have to filter locally
      // (since missing fields or partial strings can't be queried directly in Firestore).
      const fetchLimit = (statusFilter === 'trial' || (searchQuery && searchQuery.trim().length > 0)) ? 100 : limitNum;
      query = query.limit(fetchLimit);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      
      let docs = snapshot.docs;
      
      // Local filtering for trial (including missing status)
      if (statusFilter === 'trial') {
         docs = docs.filter((doc: any) => {
           const status = doc.data()?.subscription?.status;
           return status === 'trial' || !status;
         });
      }
      
      // Local search filter as fallback if search query is provided
      if (searchQuery && searchQuery.trim().length > 0) {
         const lowerSearch = searchQuery.toLowerCase();
         docs = docs.filter((doc: any) => {
           const data = doc.data();
           const name = (data.name || data.firstName || '').toLowerCase();
           return name.includes(lowerSearch);
         });
      }
      
      const members = docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        members,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
      };
    } catch (error) {
      console.error('Error fetching subscribed members:', error);
      return { members: [], lastDoc: null };
    }
  }

  async getMemberSubscriptionHistory(churchId: string, memberId: string) {
    try {
      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .doc(memberId)
        .collection('subscriptions')
        .orderBy('paidAt', 'desc')
        .get();
        
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching member subscription history:', error);
      return [];
    }
  }

  async deleteSubscriptionHistory(churchId: string, memberId: string, historyId: string) {
    try {
      await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .doc(memberId)
        .collection('subscriptions')
        .doc(historyId)
        .delete();
      return true;
    } catch (e) {
      console.error('Error deleting subscription history:', e);
      return false;
    }
  }

  async logCancelledSubscription(churchId: string, memberId: string, amount: number, plan: string) {
    try {
      await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .doc(memberId)
        .collection('subscriptions')
        .add({
          amount,
          plan,
          status: 'cancelled',
          paidAt: firestore.FieldValue.serverTimestamp()
        });
      return true;
    } catch (e) {
      console.warn('Error logging cancelled subscription:', e);
      return false;
    }
  }

  // --- 👤 Global User & Member Logic ---

  async getGlobalUser(uid: string): Promise<GlobalUser | null> {
    try {
      // Find the member across all churches to determine their primary church
      const snap = await firestore().collectionGroup('members').where('id', '==', uid).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        // The parent of the member doc is the 'members' collection. The parent of that is the church doc.
        const churchId = doc.ref.parent.parent?.id;
        return { uid: doc.id, primaryChurchId: churchId, ...doc.data() } as GlobalUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching global user from collectionGroup:', error);
      return null;
    }
  }

  async getMemberProfile(churchId: string, uid: string): Promise<AppMember | null> {
    try {
      const docSnap = await firestore().collection('churches').doc(churchId).collection('members').doc(uid).get();
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppMember;
      }
      return null;
    } catch (error) {
      console.error('Error fetching nested member profile:', error);
      return null;
    }
  }

  async checkContactExists(phone: string, churchId?: string, strictChurch?: boolean): Promise<any> {
    const rawDigits = phone.replace(/\D/g, '');
    const last10 = rawDigits.slice(-10);
    const plus91 = `+91${last10}`;
    const spaced1 = `+91 ${last10}`;
    const spaced2 = `+91 ${last10.slice(0,5)} ${last10.slice(5)}`;
    const format91 = `91${last10}`;
    const intFormat = parseInt(last10, 10);
    const intFormat91 = parseInt(format91, 10);
    
    // Array of possible formats that might be in Firestore (including integers), filter out invalid values
    const formats = [last10, plus91, format91, phone, spaced1, spaced2, intFormat, intFormat91];
    const possibleFormats = formats.filter(v => v !== undefined && v !== null && !Number.isNaN(v));
    
    try {
      if (!churchId) churchId = await this.getChurchId() || undefined;
      
      const auth = require('@react-native-firebase/auth').default;
      if (!auth().currentUser) {
        await auth().signInAnonymously();
      }

      // Helper for manual fallback
      const runManualFallback = async () => {
        console.log("Running manual fallback traversal...");
        const churchesSnap = await firestore().collection('churches').get();
        for (const churchDoc of churchesSnap.docs) {
          const queries = possibleFormats.map(format => 
            churchDoc.ref.collection('members').where('phone', '==', format).limit(1).get()
          );
          const results = await Promise.all(queries);
          for (const snap of results) {
            if (!snap.empty) {
              const doc = snap.docs[0];
              return { exists: true, member: { id: doc.id, ...doc.data() } };
            }
          }
        }
        return { exists: false };
      };

      if (!churchId) {
        try {
          console.log("Trying collectionGroup search...");
          const queries = possibleFormats.map(format => 
            firestore().collectionGroup('members').where('phone', '==', format).limit(1).get()
          );
          const results = await Promise.all(queries);
          for (const snap of results) {
            if (!snap.empty) {
              const doc = snap.docs[0];
              console.log("Found member in collectionGroup. From cache?", doc.metadata?.fromCache);
              return { exists: true, member: { id: doc.id, ...doc.data() } };
            }
          }
          return { exists: false };
        } catch (cgError: any) {
          console.log("Collection group index failed, falling back...", cgError.message);
          return await runManualFallback();
        }
      }

      // Enforce strictChurch using collectionGroup if specific query fails or to avoid index requirements
      if (strictChurch) {
        console.log(`Checking strict church: ${churchId} using collectionGroup fallback.`);
        try {
          const queries = possibleFormats.map(format => 
            firestore().collectionGroup('members').where('phone', '==', format).get({ source: 'server' })
          );
          const results = await Promise.all(queries);
          let foundAny = false;
          for (const snap of results) {
            for (const doc of snap.docs) {
              foundAny = true;
              const data = doc.data();
              console.log("Found matching member doc at path:", doc.ref.path, "with data:", JSON.stringify(data));
              // Ensure this member actually belongs to the requested church
              const parentChurchId = doc.ref.parent.parent?.id;
              console.log("Validating churchId. Parent churchId:", parentChurchId, "Data churchId:", data.churchId, "Expected:", churchId);
              if (parentChurchId === churchId || data.churchId === churchId) {
                return { exists: true, member: { id: doc.id, ...data } };
              }
            }
          }
          if (!foundAny) {
            console.log("Strict church mode: collectionGroup found absolutely no matching documents for any format.");
          } else {
            console.log("Strict church mode: member found, but it belonged to a different church.");
          }
          return { exists: false };
        } catch (err: any) {
          console.log("Strict church query failed:", err.message);
          return { exists: false };
        }
      }

      // If NOT strictChurch, try specific first, then global fallback
      try {
        console.log(`Checking specific church: ${churchId}`);
        const queries = possibleFormats.map(format => 
          firestore().collection('churches').doc(churchId!).collection('members').where('phone', '==', format).limit(1).get({ source: 'server' })
        );
        const results = await Promise.all(queries);
        for (const snap of results) {
          if (!snap.empty) {
            const doc = snap.docs[0];
            return { exists: true, member: { id: doc.id, ...doc.data() } };
          }
        }
      } catch (err: any) {
        console.log("Specific church query failed:", err.message);
      }

      // Fallback: Check all members collections
      try {
        console.log("Not found in specific church. Trying global collectionGroup search...");
        const globalQueries = possibleFormats.map(format => 
          firestore().collectionGroup('members').where('phone', '==', format).limit(1).get({ source: 'server' })
        );
        const globalResults = await Promise.all(globalQueries);
        for (const snap of globalResults) {
          if (!snap.empty) {
            const doc = snap.docs[0];
            return { exists: true, member: { id: doc.id, ...doc.data() } };
          }
        }
      } catch (cgError: any) {
         console.log("Global collection group index failed, falling back...", cgError.message);
         return await runManualFallback();
      }

      return { exists: false };
    } catch (error: any) {
      console.warn("Firestore search error:", error);
      return { exists: false, error: error?.message || 'Database error' };
    }
  }

  async adminAddMember(churchId: string, details: any) {
    try {
      const docRef = await firestore().collection('churches').doc(churchId).collection('members').add({
        ...details,
        joinDate: new Date().toISOString(),
        onboardingComplete: false,
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error adding member manually:", error);
      return { success: false, error: error.message };
    }
  }

  async adminUpdateMember(churchId: string, memberId: string, details: any) {
    try {
      await firestore().collection('churches').doc(churchId).collection('members').doc(memberId).update(details);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating member:", error);
      return { success: false, error: error.message };
    }
  }

  async adminRemoveMember(churchId: string, memberId: string) {
    try {
      await firestore().collection('churches').doc(churchId).collection('members').doc(memberId).delete();
      return { success: true };
    } catch (error: any) {
      console.error("Error removing member:", error);
      return { success: false, error: error.message };
    }
  }

  async updateMemberProfile(churchId: string, memberId: string, details: any) {
    try {
      await firestore().collection('churches').doc(churchId).collection('members').doc(memberId).set(details, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating member profile', error);
      throw error;
    }
  }

  async updateMemberRole(memberId: string, userType: string): Promise<boolean> {
    try {
      const col = await this.getCollection('members');
      await col.doc(memberId).update({ userType });
      return true;
    } catch (error) {
      console.error('Error updating member role', error);
      return false;
    }
  }

  async updateLastAppOpened(uid: string) {
    try {
      await firestore().collection('users').doc(uid).update({
        lastLogin: FieldValue.serverTimestamp()
      });
      
      const churchId = await this.getChurchId();
      if (churchId) {
        await firestore().collection('churches').doc(churchId).collection('members').doc(uid).update({
          lastAppOpened: FieldValue.serverTimestamp(),
          lastLogin: FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.warn('Error updating lastLogin globally', error);
    }
  }

  async syncMember(churchId: string, contactId: string, uid: string) {
    try {
      if (contactId === uid) return;
      
      const membersRef = firestore().collection('churches').doc(churchId).collection('members');
      const oldDoc = await membersRef.doc(contactId).get();
      
      if (oldDoc.exists()) {
        // Move data to new document with the correct UID
        await membersRef.doc(uid).set({ ...oldDoc.data(), uid }, { merge: true });
        // Delete the old document with the random ID
        await membersRef.doc(contactId).delete();
      } else {
        // Just in case it was already moved or we only have the uid to update
        await membersRef.doc(contactId).update({ uid }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error syncing member', e);
    }
  }

  async getRelatedContacts(churchId: string, accountId: string): Promise<any[]> {
    try {
      const snapshot = await firestore().collection('churches').doc(churchId).collection('members').where('accountId', '==', accountId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  }

  async addFamilyMember(churchId: string, accountId: string, newMember: any) {
    try {
      await firestore().collection('churches').doc(churchId).collection('members').add({ ...newMember, accountId });
      return true;
    } catch (e) {
      throw e;
    }
  }

  async createMember(churchId: string, data: any, customId?: string) {
    try {
      if (customId) {
        await firestore().collection('churches').doc(churchId).collection('members').doc(customId).set(data);
        return { success: true, id: customId };
      } else {
        const docRef = await firestore().collection('churches').doc(churchId).collection('members').add(data);
        return { success: true, id: docRef.id };
      }
    } catch (e) {
      throw e;
    }
  }
  async getAllMembers(): Promise<any[]> {
    try {
      const col = await this.getCollection('members');
      const snapshot = await col.get();
      return snapshot.docs.map((doc: any) => ({ 
        name: doc.data().name || doc.data().firstName || 'Unknown',
        email: doc.data().email || '',
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching all members:', error);
      return [];
    }
  }

  async getAdminMembers(): Promise<any[]> {
    try {
      const col = await this.getCollection('members');
      const snapshot = await col.where('userType', '==', 'Admin').get();
      return snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        name: doc.data().name || doc.data().firstName || 'Unknown',
        email: doc.data().email || '',
        ...doc.data() 
      }));
    } catch (error) {
      console.error('Error fetching admin members:', error);
      return [];
    }
  }

  // --- 🎥 Videos, Sermons, Promises ---



  async getDailyVideos(limit: number = 10): Promise<FirestoreVideo[]> {
    try {
      const col = await this.getCollection('dailyVideos');
      const snapshot = await col.orderBy('publishedAt', 'desc').limit(limit).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirestoreVideo[];
    } catch (error) {
      return [];
    }
  }

  async getSermons(limit = 50): Promise<Sermon[]> {
    try {
      const col = await this.getCollection('sermons');
      const snapshot = await col.orderBy('date', 'desc').limit(limit).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sermon[];
    } catch (error) {
      return [];
    }
  }

  async getWorshipSongs(): Promise<WorshipSong[]> {
    try {
      const col = await this.getCollection('worshipSongs');
      const snapshot = await col.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorshipSong[];
    } catch (error) {
      return [];
    }
  }

  async createSermon(data: any) {
    try {
      const col = await this.getCollection('sermons');
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      if (cleanData.id) {
        await col.doc(cleanData.id as string).set({ ...cleanData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return cleanData.id;
      } else {
        const docRef = await col.add({ ...cleanData, createdAt: FieldValue.serverTimestamp() });
        return docRef.id;
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteSermon(id: string) {
    try {
      const col = await this.getCollection('sermons');
      await col.doc(id).delete();
      return true;
    } catch (e) {
      throw e;
    }
  }

  async createWorshipSong(data: any) {
    try {
      const col = await this.getCollection('worshipSongs');
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      if (cleanData.id) {
        await col.doc(cleanData.id as string).set({ ...cleanData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return cleanData.id;
      } else {
        const docRef = await col.add({ ...cleanData, createdAt: FieldValue.serverTimestamp() });
        return docRef.id;
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteWorshipSong(id: string) {
    try {
      const col = await this.getCollection('worshipSongs');
      await col.doc(id).delete();
      return true;
    } catch (e) {
      throw e;
    }
  }

  async updateWorshipSong(id: string, data: any) {
    try {
      const col = await this.getCollection('worshipSongs');
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      await col.doc(id).update({ ...cleanData, updatedAt: FieldValue.serverTimestamp() });
      return true;
    } catch (e) {
      throw e;
    }
  }

  // --- 📅 Events ---



  async getPastEvents(limit = 5): Promise<ScheduleEvent[]> {
    try {
      const col = await this.getCollection('events');
      const today = new Date().toISOString().split('T')[0];
      const snapshot = await col.where('date', '<', today).orderBy('date', 'desc').limit(limit).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScheduleEvent[];
    } catch (error) {
      return [];
    }
  }

  // --- 🙏 Prayer Wall ---

  async getPrayerRequests(filters: any = {}) {
    try {
      const col = await this.getCollection('prayerRequests');
      let query: any = col;

      let rawItems: any[] = [];
      if (filters.isAdmin) {
        // Admin sees all requests
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        rawItems = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      } else {
        // Members see all approved requests
        let approvedQuery = query.where('isAnswered', '==', true);
        const approvedSnapshot = await approvedQuery.get();
        let list = approvedSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Plus member's own pending requests (so they see their request immediately after submitting)
        const userIdentifier = filters.contactId || filters.phone;
        if (userIdentifier) {
          let pendingQuery = query.where('isAnswered', '==', false);
          if (filters.contactId) {
            pendingQuery = pendingQuery.where('contactId', '==', filters.contactId);
          } else {
            pendingQuery = pendingQuery.where('phone', '==', filters.phone);
          }
          const pendingSnapshot = await pendingQuery.get();
          const pendingList = pendingSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

          // Merge lists and prevent duplicates
          const seen = new Set(list.map((p: any) => p.id));
          for (const p of pendingList) {
            if (!seen.has(p.id)) {
              list.push(p);
            }
          }
        }

        // Sort combined list by createdAt desc
        list.sort((a: any, b: any) => {
          const t1 = a.createdAt?.seconds || 0;
          const t2 = b.createdAt?.seconds || 0;
          return t2 - t1;
        });

        rawItems = list;
      }

      // Fetch comments for each request document in parallel
      const itemsWithComments = await Promise.all(rawItems.map(async (item: any) => {
        try {
          const commentsSnapshot = await col.doc(item.id).collection('comments').orderBy('createdAt', 'asc').get();
          const replies = commentsSnapshot.docs.map((cDoc: any) => {
            const cData = cDoc.data();
            return {
              id: cDoc.id,
              author: cData.authorName || cData.author || 'Anonymous',
              body: cData.comment || cData.body || '',
              date: cData.createdAt ? (cData.createdAt.toDate ? cData.createdAt.toDate().toISOString() : new Date(cData.createdAt).toISOString()) : new Date().toISOString()
            };
          });
          const createdAtStr = item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toISOString() : new Date(item.createdAt).toISOString()) : new Date().toISOString();
          return { ...item, createdAt: createdAtStr, replies };
        } catch (commentErr) {
          console.warn(`Error fetching comments for request ${item.id}:`, commentErr);
          return { ...item, replies: [] };
        }
      }));

      return itemsWithComments;
    } catch (error) {
      console.error('Error in getPrayerRequests:', error);
      return [];
    }
  }

  async submitPrayerRequest(data: any) {
    try {
      const col = await this.getCollection('prayerRequests');
      const textVal = data.text || data.request || data.requestEn || '';
      const textTeVal = data.textTe || data.requestTe || '';
      const authorIdVal = data.authorId || data.contactId || null;
      
      await col.add({
        ...data,
        text: textVal,
        request: textVal,
        requestEn: textVal,
        textTe: textTeVal,
        requestTe: textTeVal,
        authorId: authorIdVal,
        contactId: authorIdVal,
        isAnswered: data.isAnswered ?? false,
        prayCount: data.prayCount ?? 0,
        createdAt: FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async markAsAnswered(id: string) {
    try {
      const col = await this.getCollection('prayerRequests');
      await col.doc(id).update({
        isAnswered: true,
        updatedAt: FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      throw e;
    }
  }

  async addPrayerComment(requestId: string, comment: string, authorName: string) {
    try {
      const col = await this.getCollection('prayerRequests');
      await col.doc(requestId).collection('comments').add({
        comment,
        body: comment,
        authorName,
        author: authorName,
        createdAt: FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      throw e;
    }
  }

  async deletePrayerRequest(id: string) {
    try {
      const col = await this.getCollection('prayerRequests');
      await col.doc(id).delete();
      return true;
    } catch (e) {
      throw e;
    }
  }

  // --- 💸 Giving ---

  async getDonations(limitNum = 200): Promise<ChurchDonation[]> {
    try {
      const col = await this.getCollection('donations');
      const snapshot = await col.orderBy('createdAt', 'desc').limit(limitNum).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChurchDonation));
    } catch (error) {
      console.error('Error fetching donations:', error);
      return [];
    }
  }

  async saveDonation(data: Partial<ChurchDonation>): Promise<string> {
    try {
      const col = await this.getCollection('donations');
      if (data.id) {
        await col.doc(data.id).set({ ...data, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
        return data.id;
      } else {
        const docRef = await col.add({ ...data, createdAt: firestore.FieldValue.serverTimestamp() });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      throw error;
    }
  }

  async deleteDonation(id: string): Promise<void> {
    try {
      const col = await this.getCollection('donations');
      await col.doc(id).delete();
    } catch (error) {
      console.error('Error deleting donation:', error);
      throw error;
    }
  }

  async createDonation(data: any) {
    try {
      const col = await this.getCollection('donations');
      const docRef = await col.add({ ...data, createdAt: firestore.FieldValue.serverTimestamp() });
      return docRef.id;
    } catch (e) {
      throw e;
    }
  }

  async getMemberDonations(phone: string): Promise<any[]> {
    try {
      const col = await this.getCollection('donations');
      // Query where phone matches and order by createdAt desc
      // Assuming 'status' is tracked. For member history, we want successful donations.
      // If 'status' is consistently used: .where('status', '==', 'success')
      // but let's just fetch by phone first and filter on client if needed, or query both.
      const snapshot = await col
        .where('phone', '==', phone)
        .orderBy('createdAt', 'desc')
        .get();
        
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching member donations:', error);
      return [];
    }
  }

  // --- 📖 Bible Progress ---

  async getBibleProgress(churchId: string, memberId: string): Promise<any> {
    try {
      const doc = await firestore().collection('churches').doc(churchId).collection('members').doc(memberId).collection('bible').doc('progress').get();
      return doc.exists() ? doc.data() : null;
    } catch (e) {
      return null;
    }
  }

  async saveBibleProgress(churchId: string, memberId: string, progress: any) {
    try {
      await firestore().collection('churches').doc(churchId).collection('members').doc(memberId).collection('bible').doc('progress').set(progress, { merge: true });
      return true;
    } catch (e) {
      throw e;
    }
  }

  // --- 🌟 Promises ---

  async createDailyPromise(data: any) {
    try {
      const col = await this.getCollection('promises');
      // Strip undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      
      if (cleanData.id) {
        await col.doc(cleanData.id as string).set({ ...cleanData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return cleanData.id;
      } else {
        const docRef = await col.add({ ...cleanData, createdAt: FieldValue.serverTimestamp() });
        return docRef.id;
      }
    } catch (e) {
      throw e;
    }
  }

  async getDailyPromisesArchive(): Promise<DailyPromise[]> {
    try {
      const col = await this.getCollection('promises');
      const snapshot = await col.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyPromise));
    } catch (e) {
      return [];
    }
  }


  async getCalendarData(year: number, month: number): Promise<DailyPromise[]> {
    try {
      const col = await this.getCollection('promises');
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-31`;
      const snapshot = await col.where('date', '>=', startStr).where('date', '<=', endStr).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyPromise));
    } catch (e) {
      console.error('Error fetching calendar data:', e);
      return [];
    }
  }

  async getDailyPromise(): Promise<DailyPromise | null> {
    try {
      const col = await this.getCollection('promises');
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const snapshot = await col
        .where('date', '==', todayStr)
        .get();
      if (!snapshot.empty) {
        let promises = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DailyPromise));
        
        // Filter by Published or Scheduled status in JS to avoid composite index requirements
        promises = promises.filter(p => p.status === 'Published' || p.status === 'Scheduled');
        
        if (promises.length > 0) {
          promises.sort((a: any, b: any) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return tB - tA;
          });
          const withImage = promises.find(p => p.imageUrl && p.imageUrl.trim().length > 0);
          return withImage || promises[0];
        }
      }
      return null;
    } catch (e) {
      console.warn('Error fetching daily promise:', e);
      return null;
    }
  }

  // --- 📅 Events ---

  async getEvents(): Promise<ScheduleEvent[]> {
    try {
      const col = await this.getCollection('events');
      const snapshot = await col.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEvent));
    } catch (e) {
      console.error('Error fetching events:', e);
      return [];
    }
  }

  async getTodayEvents(): Promise<ScheduleEvent[]> {
    try {
      const col = await this.getCollection('events');
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const snapshot = await col.where('date', '==', todayStr).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEvent));
    } catch (e) {
      console.error('Error fetching today events:', e);
      return [];
    }
  }

  async getUpcomingEvents(limit: number = 3): Promise<ScheduleEvent[]> {
    try {
      const col = await this.getCollection('events');
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const snapshot = await col.where('date', '>=', todayStr).orderBy('date', 'asc').limit(limit).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEvent));
    } catch (e) {
      console.error('Error fetching upcoming events:', e);
      return [];
    }
  }

  private generateRecurringDates(startDateStr: string, recurringType: string, monthsAhead: number = 12): string[] {
    const dates: string[] = [];
    const [year, month, day] = startDateStr.split('-').map(Number);
    // Note: JavaScript months are 0-indexed
    let current = new Date(year, month - 1, day);
    const endDate = new Date(year, month - 1 + Number(monthsAhead), day);
    
    while (current <= endDate) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      
      const typeLower = (recurringType || '').toLowerCase();

      if (typeLower.includes('week') || typeLower.includes('every sunday')) {
        current.setDate(current.getDate() + 7);
      } else if (typeLower.includes('monthly') || typeLower === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else if (typeLower.includes('first sunday')) {
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
        while (current.getDay() !== 0) {
          current.setDate(current.getDate() + 1);
        }
      } else if (typeLower.includes('daily') || typeLower.includes('every day')) {
        current.setDate(current.getDate() + 1);
      } else {
        console.warn(`[FirestoreService] Unsupported recurrence type: ${recurringType}`);
        break; // Unsupported recurrence type
      }
    }
    return dates;
  }

  async createEvent(data: any) {
    try {
      const col = await this.getCollection('events');
      
      // Extract custom update mode if passed
      const updateMode = data.updateMode; // 'single' | 'future'
      delete data.updateMode;
      
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      
      if (cleanData.id) {
        // UPDATING EXISTING
        if (cleanData.recurringGroupId && updateMode === 'future') {
           const allDocs = await col.where('recurringGroupId', '==', cleanData.recurringGroupId).get();
           const batch = firestore().batch();
           allDocs.docs.forEach(doc => {
             const oldData = doc.data();
             if (oldData.date >= (cleanData.date as string)) {
               const docRef = col.doc(doc.id);
               // Preserve the original specific date of the future occurrence
               const updatePayload = { ...cleanData, date: oldData.date, id: doc.id, updatedAt: FieldValue.serverTimestamp() };
               batch.set(docRef, updatePayload, { merge: true });
             }
           });
           await batch.commit();
           return cleanData.id;
        } else {
           await col.doc(cleanData.id as string).set({ ...cleanData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
           return cleanData.id;
        }
      } else {
        // CREATING NEW
        const isRecurring = cleanData.recurring && cleanData.recurring !== 'One-time event';
        
        if (isRecurring && !cleanData.recurringGroupId) {
          const groupId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          cleanData.recurringGroupId = groupId;
          
          const monthsAhead = (cleanData.recurrenceDuration as number) || 1;
          const futureDates = this.generateRecurringDates(cleanData.date as string, cleanData.recurring as string, monthsAhead);
          const batch = firestore().batch();
          
          let firstId = '';
          futureDates.forEach((dateStr, index) => {
            const docRef = col.doc();
            if (index === 0) firstId = docRef.id;
            
            const instanceData = { 
              ...cleanData, 
              id: docRef.id, 
              date: dateStr, 
              createdAt: FieldValue.serverTimestamp() 
            };
            batch.set(docRef, instanceData);
          });
          
          await batch.commit();
          return firstId;
        } else {
          const docRef = await col.add({ ...cleanData, createdAt: FieldValue.serverTimestamp() });
          return docRef.id;
        }
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteEvent(id: string, deleteMode?: 'single' | 'future') {
    try {
      const col = await this.getCollection('events');
      
      if (deleteMode === 'future') {
        const doc = await col.doc(id).get();
        const data = doc.data();
        if (data) {
          if (data.recurringGroupId) {
             const allDocs = await col.where('recurringGroupId', '==', data.recurringGroupId).get();
             const batch = firestore().batch();
             allDocs.docs.forEach(d => {
               if (d.data().date >= data.date) {
                 batch.delete(d.ref);
               }
             });
             await batch.commit();
             return true;
          }
        }
      }
      
      await col.doc(id).delete();
      return true;
    } catch (e) {
      throw e;
    }
  }

  // --- 🔔 Notifications ---

  async getNotificationPrefs(uid: string) {
    try {
      const docSnap = await firestore().collection('users').doc(uid).get();
      if (docSnap.exists()) {
        return docSnap.data()?.notifications || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async saveNotificationPrefs(uid: string, prefs: any) {
    try {
      await firestore().collection('users').doc(uid).set({
        notifications: prefs,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  async createNotificationBroadcast(data: any) {
    try {
      const col = await this.getCollection('broadcasts');
      const docRef = await col.add({ ...data, createdAt: FieldValue.serverTimestamp() });
      return docRef.id;
    } catch (e) {
      throw e;
    }
  }

  // --- 🎉 Celebrations ---

  async getAllCelebrations(): Promise<any[]> {
    const normalizeDate = (dateStr: string) => {
      if (!dateStr) return null;
      const parts = dateStr.split(/[-/]/);
      if (parts.length < 3) return null;
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dateStr;
    };

    try {
      const col = await this.getCollection('members');
      const snapshot = await col.get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          Id: doc.id,
          Name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          Phone: data.phone || data.mobile,
          Birthdate: normalizeDate(data.dob || data.birthdate || data.dateOfBirth || data.birthday), // always YYYY-MM-DD
          allBirthdates: [normalizeDate(data.dob), normalizeDate(data.birthdate), normalizeDate(data.dateOfBirth), normalizeDate(data.birthday)].filter(Boolean),
          Anniversary_Date__c: normalizeDate(data.marriageDate || data.anniversaryDate || data.anniversary), // always YYYY-MM-DD
          Baptism_Date__c: normalizeDate(data.baptismDate || data.baptism), // always YYYY-MM-DD
          Gender__c: data.gender || data.Gender__c,
          AccountId: data.accountId || data.familyId || doc.id,
          ProfilePhoto: data.profilePhoto || data.photoURL || data.photoUrl || data.profileImageUrl || null
        };
      });
    } catch (e) {
      console.error('Error fetching celebrations:', e);
      return [];
    }
  }

  async getTodayBirthdays() {
    try {
      const all = await this.getAllCelebrations();
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      
      return all.filter(c => {
        if (!c.dob) return false;
        const parts = c.dob.split('-');
        if (parts.length < 3) return false;
        let month, day;
        if (parts[0].length === 4) { // YYYY-MM-DD
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else { // DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
        }
        return month === m && day === d;
      });
    } catch (e) {
      return [];
    }
  }

  async getTodayAnniversaries() {
    try {
      const all = await this.getAllCelebrations();
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();

      return all.filter(c => {
        if (!c.anniversaryDate) return false;
        const parts = c.anniversaryDate.split('-');
        if (parts.length < 3) return false;
        let month, day;
        if (parts[0].length === 4) { // YYYY-MM-DD
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else { // DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
        }
        return month === m && day === d;
      });
    } catch (e) {
      return [];
    }
  }

  async sendPersonalGreeting(contactId: string, phone: string, title: string, body: string, type: string) {
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      // Write to church-scoped broadcasts (not root)
      const col = await this.getCollection('broadcasts');
      await col.add({
        contactId,
        targetPhone: phone,
        title,
        content: body,
        date: dateStr,
        type: type,
        createdAt: FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('Error sending personal greeting:', e);
      return false;
    }
  }


  async getPastorEvents(): Promise<any[]> {
    try {
      const col = await this.getCollection('pastorEvents');
      const snapshot = await col.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (e) {
      console.error('Error fetching pastor events:', e);
      return [];
    }
  }

  async createPastorEvent(payload: any): Promise<{ success: boolean; id?: string }> {
    try {
      const col = await this.getCollection('pastorEvents');
      const docRef = await col.add({
        ...payload,
        createdAt: FieldValue.serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error('Error creating pastor event:', e);
      return { success: false };
    }
  }

  async updatePastorEvent(eventId: string, payload: any): Promise<{ success: boolean }> {
    try {
      const col = await this.getCollection('pastorEvents');
      await col.doc(eventId).update({
        ...payload,
        updatedAt: FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      console.error('Error updating pastor event:', e);
      return { success: false };
    }
  }

  async deletePastorEvent(eventId: string): Promise<{ success: boolean }> {
    try {
      const col = await this.getCollection('pastorEvents');
      await col.doc(eventId).delete();
      return { success: true };
    } catch (e) {
      console.error('Error deleting pastor event:', e);
      return { success: false };
    }
  }
  async query(soql: string): Promise<any> { return null; }
  extractYoutubeId(url: string): string { return url; }
  async getDashboardStats(): Promise<any> { return { members: 0, promises: 0 }; }
  async getEventMetadata(eventId: string): Promise<any> { return null; }
  async searchMembers(query: string): Promise<any[]> {
    try {
      const col = await this.getCollection('members');
      const snapshot = await col.get();
      const lowerQuery = query.toLowerCase();
      
      const results: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        const name = (data.name || data.firstName || '').toLowerCase();
        const phone = (data.phone || data.mobile || '').toLowerCase();
        
        if (name.includes(lowerQuery) || phone.includes(lowerQuery)) {
          results.push({
            id: doc.id,
            name: data.name || data.firstName || 'Unknown',
            phone: data.phone || data.mobile || '',
            ...data
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error in searchMembers:', error);
      return [];
    }
  }

  // --- 📝 Attendance ---

  async createAttendanceRequest(data: { title: string; date: string; description?: string; startTime?: string; endTime?: string }) {
    try {
      const col = await this.getCollection('attendanceRequests');
      const docRef = await col.add({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'Active'
      });
      return docRef.id;
    } catch (e) {
      console.error('Error creating attendance request:', e);
      throw e;
    }
  }

  async updateAttendanceRequest(requestId: string, data: { title: string; date: string; description?: string; startTime?: string; endTime?: string }) {
    try {
      const col = await this.getCollection('attendanceRequests');
      await col.doc(requestId).update(data);
      return true;
    } catch (e) {
      console.error('Error updating attendance request:', e);
      throw e;
    }
  }

  async getAttendanceRequests() {
    try {
      const col = await this.getCollection('attendanceRequests');
      const snapshot = await col.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching attendance requests:', e);
      return [];
    }
  }

  async deleteAttendanceRequest(requestId: string) {
    try {
      const col = await this.getCollection('attendanceRequests');
      await col.doc(requestId).delete();
      return true;
    } catch (e) {
      console.error('Error deleting attendance request:', e);
      throw e;
    }
  }

  async submitAttendanceResponse(requestId: string, memberId: string, memberName: string, response: 'Yes' | 'No', reason?: string) {
    try {
      const col = await this.getCollection('attendanceRequests');
      const requestRef = col.doc(requestId);
      const responsesCol = requestRef.collection('responses');
      
      // Update or set the response for this member
      await responsesCol.doc(memberId).set({
        memberId,
        memberName,
        response,
        reason: reason || null,
        submittedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (e) {
      console.error('Error submitting attendance response:', e);
      throw e;
    }
  }

  async getAttendanceResponses(requestId: string) {
    try {
      const col = await this.getCollection('attendanceRequests');
      const responsesCol = col.doc(requestId).collection('responses');
      const snapshot = await responsesCol.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching attendance responses:', e);
      return [];
    }
  }

  async getMemberAttendanceResponse(requestId: string, memberId: string) {
    try {
      const col = await this.getCollection('attendanceRequests');
      const responseDoc = await col.doc(requestId).collection('responses').doc(memberId).get();
      if (responseDoc.data() !== undefined) {
        return { id: responseDoc.id, ...responseDoc.data() };
      }
      return null;
    } catch (e) {
      console.error('Error fetching member attendance response:', e);
      return null;
    }
  }

  async getActiveAttendanceRequest() {
    try {
      const col = await this.getCollection('attendanceRequests');
      // Get the most recent active request
      const snapshot = await col.where('status', '==', 'Active').orderBy('createdAt', 'desc').limit(1).get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (e) {
      console.error('Error fetching active attendance request:', e);
      return null;
    }
  }

  async listenActiveAttendanceRequest(callback: (request: any) => void) {
    try {
      const col = await this.getCollection('attendanceRequests');
      return col.where('status', '==', 'Active').orderBy('createdAt', 'desc').limit(1).onSnapshot(snapshot => {
        if (snapshot && snapshot.docs && !snapshot.empty) {
          callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          callback(null);
        }
      }, (error: any) => {
        console.error('Active request snapshot error:', error);
        callback(null);
      });
    } catch (e) {
      console.error('Error listening to active attendance request:', e);
      return () => {};
    }
  }

  async listenAttendanceResponses(requestId: string, callback: (responses: any[]) => void) {
    try {
      const col = await this.getCollection('attendanceRequests');
      return col.doc(requestId).collection('responses').onSnapshot(snapshot => {
        if (!snapshot || !snapshot.docs) {
          callback([]);
          return;
        }
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        callback(data);
      }, (error: any) => {
        console.error('Responses snapshot error:', error);
        callback([]);
      });
    } catch (e) {
      console.error('Error listening to attendance responses:', e);
      return () => {};
    }
  }
}

export default new FirestoreService();
