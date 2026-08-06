import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

import FirestoreService, { AppMember } from '../services/FirestoreService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  member: AppMember | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  setMember: (member: AppMember | null) => void;
  viewMode: 'admin' | 'member';
  setViewMode: (mode: 'admin' | 'member') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [member, setMember] = useState<AppMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'admin' | 'member'>('member');
  const memberListenerRef = useRef<(() => void) | null>(null);

  const updateMember = (newMember: AppMember | null) => {
    setMember(newMember);
    if (newMember) {
      AsyncStorage.setItem('@cached_member', JSON.stringify(newMember));
    } else {
      AsyncStorage.removeItem('@cached_member');
    }
  };

  useEffect(() => {
    // Attempt to load cached member instantly on boot
    const loadCachedMember = async () => {
      try {
        const cachedStr = await AsyncStorage.getItem('@cached_member');
        if (cachedStr) {
          const cachedMember = JSON.parse(cachedStr);
          console.log('👤 [Auth] Loaded cached member:', cachedMember.name);
          setMember(cachedMember);
        }
      } catch (e) {
        // Ignore cache errors
      }
    };
    loadCachedMember();

    // Handle user state changes
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      if (userState && userState.isAnonymous) {
        try {
          const intentStr = await AsyncStorage.getItem('@guest_intent');
          if (intentStr !== 'true') {
            console.log('🤫 [Auth] Anonymous user detected, but guest intent not set. Suppressing global auth state.');
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore
        }
      }
      
      setUser(userState);
      
      if (userState && !userState.isAnonymous) {
        try {
          console.log('🔐 [Auth] User Logged In:', userState.uid);
          
          // CRITICAL FIX: Force token refresh immediately after login
          // This ensures the native Firestore SDK receives the Auth token properly
          // which prevents [firestore/permission-denied] errors.
          await userState.getIdToken(true);

          // Fetch GLOBAL profile from Firestore
          const globalUser = await FirestoreService.getGlobalUser(userState.uid);
          
          if (globalUser) {
            console.log('🌍 [Auth] Global User Loaded:', globalUser.name);
            
            // FCM Setup
            try {
              const authStatus = await messaging().requestPermission();
              const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

              if (enabled) {
                const token = await messaging().getToken();
                console.log('🔔 [FCM] Token acquired:', token);
                if (globalUser?.primaryChurchId) {
                  await require('../services/firebaseConfig').firestore()
                    .collection('churches').doc(globalUser.primaryChurchId)
                    .collection('members').doc(userState.uid).update({
                      fcmToken: token
                  });
                }
              }
            } catch (err) {
              console.log('❌ [FCM] Error setting up notifications:', err);
            }
            
            if (globalUser.primaryChurchId) {
              // 1. Verify the church actually still exists
              const churchDetails = await require('../services/ChurchService').default.getChurchDetails(globalUser.primaryChurchId);
              
              if (!churchDetails) {
                console.warn('⚠️ [Auth] User primary church was deleted. Clearing from profile.');
                // We do not need to delete from a root users collection anymore.
                setMember(null);
              } else {
                // Fetch NESTED member profile using the actual document ID
                const memberProfile = await FirestoreService.getMemberProfile(globalUser.primaryChurchId, globalUser.uid);
                
                if (memberProfile) {
                  console.log('✅  [Auth] Nested Member Profile Loaded:', memberProfile.name);
                  // Merge them into the active member state
                  const combinedMember: AppMember = { ...globalUser, ...memberProfile, id: globalUser.uid, churchId: globalUser.primaryChurchId };
                  setMember(combinedMember);
                  AsyncStorage.setItem('@cached_member', JSON.stringify(combinedMember));

                  // 📡 Real-time listener on this member's church profile 📡
                  // Cancels any previous listener first.
                  if (memberListenerRef.current) memberListenerRef.current();
                  memberListenerRef.current = firestore()
                    .collection('churches')
                    .doc(globalUser.primaryChurchId)
                    .collection('members')
                    .doc(globalUser.uid)
                    .onSnapshot(async snap => {
                      if (snap.exists() && snap.data()) {
                        const updated = snap.data() as AppMember;
                        setMember(prev => {
                          const next = { ...prev, ...updated, id: globalUser.uid, churchId: globalUser.primaryChurchId } as AppMember;
                          AsyncStorage.setItem('@cached_member', JSON.stringify(next));
                          return next;
                        });
                        console.log('✅ [Auth] Member profile updated in real-time:', updated.userType);
                      } else {
                        console.warn('⚠️ [Auth] Member was deleted by admin. Logging out.');
                        // Root users collection is no longer used.
                        
                        try {
                          if (auth().currentUser) {
                            await auth().signOut();
                          }
                        } catch (e) {}
                        
                        setMember(null);
                        AsyncStorage.removeItem('@cached_member');
                      }
                    }, err => console.warn('⚠️ [Auth] Member listener error:', err));
                } else {
                  console.warn('⚠️ [Auth] No nested member profile found for church:', globalUser.primaryChurchId);
                  // Member has been removed from this church! Log them out immediately.
                  // Root users collection is no longer used.
                  
                  try {
                    if (auth().currentUser) {
                      await auth().signOut();
                    }
                  } catch (e) {}
                  
                  setMember(null);
                  AsyncStorage.removeItem('@cached_member');
                }
              }
            } else {
              console.warn('⚠️ [Auth] Global user has no primaryChurchId.');
              setMember(null);
            }
          } else {
            console.warn('⚠️ [Auth] No global user found.');
            setMember(null);
          }
        } catch (err) {
          console.error('❌ [Auth] Profile Fetch Failed:', err);
        }
      } else {
        // Cancel member listener when user logs out
        if (memberListenerRef.current) {
          memberListenerRef.current();
          memberListenerRef.current = null;
        }
        setMember(null);
        AsyncStorage.removeItem('@cached_member');
      }
      
      // Always clear loading — never block the user
      setLoading(false);
    });
    return subscriber; 
  }, []);

  const signInAnonymously = async () => {
    try {
      const cred = await auth().signInAnonymously();
      setUser(cred.user);
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@cached_member');
      await AsyncStorage.removeItem('@guest_intent');
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, signInAnonymously, signOut, setMember: updateMember, viewMode, setViewMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
