"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserStorage, StorageAlert } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getUserStorage, recalculateUserStorage } from '@/lib/firebase/firebase-storage';
import { checkStorageAlerts, getStoragePercentage } from '@/lib/storage/storage-utils';
import { useToast } from '@/hooks/use-toast';

interface StorageContextType {
  userStorage: UserStorage | null;
  storageAlert: StorageAlert | null;
  storagePercentage: number;
  isLoading: boolean;
  refreshStorage: () => Promise<void>;
  checkStorageLimit: (noteSize: number) => boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [userStorage, setUserStorage] = useState<UserStorage | null>(null);
  const [storageAlert, setStorageAlert] = useState<StorageAlert | null>(null);
  const [storagePercentage, setStoragePercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAlertShown, setLastAlertShown] = useState<number>(0);
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Initialize storage when user changes
  useEffect(() => {
    if (user) {
      loadUserStorage();
    } else {
      setUserStorage(null);
      setStorageAlert(null);
      setStoragePercentage(0);
    }
  }, [user, isAdmin]);

  // Check for storage alerts when storage changes
  useEffect(() => {
    if (userStorage) {
      const alert = checkStorageAlerts(userStorage);
      setStorageAlert(alert);
      setStoragePercentage(getStoragePercentage(userStorage));
      
      // Show toast for storage alerts (but not too frequently)
      if (alert && Date.now() - lastAlertShown > 60000) { // Only show once per minute
        toast({
          title: alert.type === 'error' ? "Storage Full!" : "Storage Warning",
          description: alert.message,
          variant: alert.type === 'error' ? "destructive" : "default",
        });
        setLastAlertShown(Date.now());
      }
    }
  }, [userStorage, toast, lastAlertShown]);

  const loadUserStorage = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const storage = await getUserStorage(user.uid, isAdmin);
      setUserStorage(storage);
    } catch (error) {
      console.error('Error loading user storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStorage = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const storage = await recalculateUserStorage(user.uid, isAdmin);
      setUserStorage(storage);
    } catch (error) {
      console.error('Error refreshing user storage:', error);
      toast({
        title: "Error",
        description: "Failed to refresh storage information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStorageLimit = (noteSize: number): boolean => {
    if (!userStorage || isAdmin) return true; // Admins have no limits
    return (userStorage.totalStorage + noteSize) <= userStorage.maxStorage;
  };

  return (
    <StorageContext.Provider
      value={{
        userStorage,
        storageAlert,
        storagePercentage,
        isLoading,
        refreshStorage,
        checkStorageLimit,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
