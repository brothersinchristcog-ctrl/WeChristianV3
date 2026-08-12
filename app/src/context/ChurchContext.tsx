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
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { member } = useAuth();
  const [activeChurch, setActiveChurch] = useState<ChurchDetails | null>(null);
  const [churchId, setChurchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ChurchContext.Provider value={{ activeChurch, churchId, setChurchId, setActiveChurch, loading }}>
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
