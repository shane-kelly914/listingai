import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import * as firebaseService from '../services/firebase';
import * as storageService from '../services/storage';
import { verifySubscription } from '../services/api';
import { FREE_LIMIT, LOCAL_PROMO_CODES } from '../constants/data';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usageCount, setUsageCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [hasPromo, setHasPromo] = useState(false);
  const [userData, setUserData] = useState(null);

  // Initialize auth state and load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      try {
        if (currentUser) {
          setUser(currentUser);
          const data = await firebaseService.getUserData(currentUser.uid);
          if (data) {
            setUserData(data);
            setUsageCount(data.usageCount || 0);
            setIsPro(data.isPro || false);
            setHasPromo(data.promoCode || false);
          } else {
            // Create new user if doesn't exist
            await firebaseService.createUser(
              currentUser.uid,
              currentUser.email,
              currentUser.displayName || ''
            );
            setUsageCount(0);
            setIsPro(false);
            setHasPromo(false);
          }
        } else {
          // Anonymous user
          setUser(null);
          setUserData(null);
          const anonCount = await storageService.getAnonUsageCount();
          setUsageCount(anonCount);

          // Check for saved promo code
          const savedPromo = await storageService.getPromoCode();
          if (savedPromo && LOCAL_PROMO_CODES.includes(savedPromo)) {
            setHasPromo(true);
          }
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const canGenerate = () => {
    if (isPro) return true;
    if (hasPromo) return true;
    return usageCount < FREE_LIMIT;
  };

  const incrementUsage = async () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);

    if (user) {
      // Update Firestore for signed-in users
      try {
        await firebaseService.updateUsageCount(user.uid);
      } catch (error) {
        console.error('Error updating usage in Firestore:', error);
      }
    } else {
      // Update localStorage for anonymous users
      try {
        await storageService.incrementAnonUsageCount();
      } catch (error) {
        console.error('Error updating usage in storage:', error);
      }
    }
  };

  const redeemPromoCode = async code => {
    if (!LOCAL_PROMO_CODES.includes(code)) {
      throw new Error('Invalid promo code');
    }

    setHasPromo(true);
    await storageService.savePromoCode(code);

    if (user) {
      try {
        // Pass the actual code string so we can reconcile
        // commission/referral attribution later.
        await firebaseService.updateUserPromoCode(user.uid, code);
      } catch (error) {
        console.error('Error updating promo code in Firestore:', error);
      }
    }
  };

  const upgradeToPro = async () => {
    setIsPro(true);
    if (user) {
      try {
        await firebaseService.updateUserProStatus(user.uid, true);
      } catch (error) {
        console.error('Error updating pro status:', error);
      }
    }
  };

  // Ask the backend whether this user has an active Stripe subscription,
  // and if so, persist isPro to Firestore. Safe to call repeatedly — it
  // only flips state when Stripe confirms an active/trialing sub.
  const refreshProStatus = async () => {
    if (!user) return { isPro: false };
    try {
      const result = await verifySubscription(user.uid);
      if (result?.isPro && !isPro) {
        setIsPro(true);
        try {
          await firebaseService.updateUserProStatus(user.uid, true);
        } catch (e) {
          console.error('Error persisting pro status:', e);
        }
      }
      return result;
    } catch (error) {
      console.error('Error refreshing pro status:', error);
      return { isPro: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    usageCount,
    isPro,
    hasPromo,
    userData,
    canGenerate,
    incrementUsage,
    redeemPromoCode,
    upgradeToPro,
    refreshProStatus,
    remainingGenerations: Math.max(0, FREE_LIMIT - usageCount),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
