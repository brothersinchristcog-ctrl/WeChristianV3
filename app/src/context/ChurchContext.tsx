import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChurchService, { ChurchDetails } from '../services/ChurchService';
import { useAuth } from './AuthContext';

interface ChurchContextType {
  activeChurch: ChurchDetails | null;
  churchId: string | null;
  setChurchId: (id: string) => Promise<void>;
  setActiveChurch: (church: ChurchDetails | null) => void;
  loading: boolean;
  // Multi-branch impersonation
  originalChurchId: string | null;
  isImpersonating: boolean;
  impersonatedBranchName: string | null;
  startImpersonation: (branchId: string, branchName: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { member } = useAuth();
  const [activeChurch, setActiveChurch] = useState<ChurchDetails | null>(null);
  const [churchId, setChurchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Multi-branch impersonation state
  const [originalChurchId, setOriginalChurchId] = useState<string | null>(null);
  const [impersonatedBranchName, setImpersonatedBranchName] = useState<string | null>(null);
  const isImpersonating = !!originalChurchId;

  // When auth state changes, if the member has a churchId, use it.
  useEffect(() => {
    if (member && member.churchId) {
      setChurchId(member.churchId);
    }
  }, [member]);

  // Load selected churchId from cache on boot if not logged in
  useEffect(() => {
    const loadCachedChurch = async () => {
      try {
        const cachedId = await AsyncStorage.getItem('@cached_church_id');
        if (cachedId && !churchId) {
          await setChurchId(cachedId);
        }
      } catch (e) {
        // ignore
      } finally {
        if (!churchId) {
          setLoading(false);
        }
      }
    };
    if (!member) {
      loadCachedChurch();
    }
  }, [member]);

  const setChurchId = async (id: string) => {
    setLoading(true);
    try {
      const details = await ChurchService.getChurchDetails(id);
      if (details) {
        if (churchId && churchId !== id) {
          await require('../services/NotificationService').default.unsubscribeFromChurchTopic(churchId);
        }
        setActiveChurch(details);
        setChurchIdState(id);
        await AsyncStorage.setItem('@cached_church_id', id);
        // Sync with FirestoreService singleton
        await require('../services/FirestoreService').default.setChurchId(id);
        await require('../services/NotificationService').default.subscribeToChurchTopic(id);
      } else {
        console.warn('Church not found for id:', id);
        if (churchId) {
          await require('../services/NotificationService').default.unsubscribeFromChurchTopic(churchId);
        }
        setActiveChurch(null);
        setChurchIdState(null);
        await AsyncStorage.removeItem('@cached_church_id');
      }
    } catch (e) {
      console.error('Error setting churchId', e);
    } finally {
      setLoading(false);
    }
  };

  const startImpersonation = async (branchId: string, branchName: string) => {
    setLoading(true);
    try {
      const details = await ChurchService.getChurchDetails(branchId);
      if (details) {
        if (!originalChurchId) {
          setOriginalChurchId(churchId);
        }
        setImpersonatedBranchName(branchName);
        setActiveChurch(details);
        setChurchIdState(branchId);
        await require('../services/FirestoreService').default.setChurchId(branchId);
      }
    } catch (e) {
      console.error('Error starting impersonation', e);
    } finally {
      setLoading(false);
    }
  };

  const stopImpersonation = async () => {
    if (originalChurchId) {
      setLoading(true);
      try {
        const details = await ChurchService.getChurchDetails(originalChurchId);
        if (details) {
          setActiveChurch(details);
          setChurchIdState(originalChurchId);
          await require('../services/FirestoreService').default.setChurchId(originalChurchId);
          setOriginalChurchId(null);
          setImpersonatedBranchName(null);
        }
      } catch (e) {
        console.error('Error stopping impersonation', e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ChurchContext.Provider value={{ 
      activeChurch, churchId, setChurchId, setActiveChurch, loading,
      originalChurchId, isImpersonating, impersonatedBranchName,
      startImpersonation, stopImpersonation
    }}>
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
};
