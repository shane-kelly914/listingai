import React, { useState, useEffect, useRef } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator,
  AppState, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuth } from '../../src/context/AuthContext';
import { signOutUser, signInUser, signUpUser } from '../../src/services/firebase';
import { createCheckoutSession } from '../../src/services/api';
import { PromoModal } from '../../src/components/PromoModal';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isPro, hasPromo, redeemPromoCode, refreshProStatus } = useAuth();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Tracks whether the user just left for Stripe checkout; when the app
  // returns to the foreground we'll verify the subscription with Stripe.
  const awaitingCheckoutRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async next => {
      if (next === 'active' && awaitingCheckoutRef.current) {
        awaitingCheckoutRef.current = false;
        try {
          setVerifying(true);
          const result = await refreshProStatus();
          if (result?.isPro) {
            Alert.alert('Welcome to Pro!', 'Your subscription is active. Enjoy unlimited generations.');
          } else {
            Alert.alert(
              'Payment Not Detected',
              'We did not find an active subscription yet. If you just paid, tap "Refresh Pro Status" in a moment.',
            );
          }
        } finally {
          setVerifying(false);
        }
      }
    });
    return () => sub.remove();
  }, [refreshProStatus]);

  const handlePromoSubmit = async code => {
    try {
      setPromoLoading(true);
      await redeemPromoCode(code);
      setShowPromoModal(false);
      Alert.alert('Success', 'Promo code applied!');
    } catch (error) {
      throw new Error(error.message || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleUpgradePro = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upgrade to Pro.');
      return;
    }
    try {
      setUpgradeLoading(true);
      const checkoutUrl = await createCheckoutSession(user.uid, user.email);
      if (checkoutUrl) {
        // Mark that we're expecting the user to return from Stripe. When
        // the app comes back to the foreground, the AppState listener
        // above will verify the subscription and auto-activate Pro.
        awaitingCheckoutRef.current = true;
        await Linking.openURL(checkoutUrl);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to start upgrade.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!user) return;
    try {
      setVerifying(true);
      const result = await refreshProStatus();
      if (result?.isPro) {
        Alert.alert('Pro Activated', 'Your subscription is active.');
      } else {
        Alert.alert(
          'No Active Subscription',
          'We could not find an active Stripe subscription for your account yet.',
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      setSignInLoading(true);
      if (isSignUp) {
        await signUpUser(signInEmail.trim(), signInPassword.trim());
      } else {
        await signInUser(signInEmail.trim(), signInPassword.trim());
      }
      setShowSignInModal(false);
      setSignInEmail('');
      setSignInPassword('');
    } catch (error) {
      const msg =
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : error.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists. Try signing in instead.'
          : error.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : error.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : error.message || 'Authentication failed.';
      Alert.alert('Error', msg);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOutUser();
          } catch (e) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const cardStyle = {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingBottom: insets.bottom + SPACING.lg,
          paddingHorizontal: SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: RADIUS.lg,
                backgroundColor: COLORS.orangeLight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="settings" size={24} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.navy }}>Settings</Text>
              <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginTop: SPACING.xs }}>
                Manage your account
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
            Account
          </Text>

          {user ? (
            <View style={cardStyle}>
              {/* User Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: COLORS.orange,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="person" size={28} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.navy, fontWeight: '600' }}>
                    {user.displayName || user.email}
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray500, marginTop: SPACING.xs }}>
                    {user.email}
                  </Text>
                </View>
              </View>

              {/* Sign Out */}
              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: SPACING.lg,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.gray200,
                }}
              >
                <Text style={{ ...TYPOGRAPHY.body, color: COLORS.danger, fontWeight: '600' }}>
                  Sign Out
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray300} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={cardStyle}>
              <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginBottom: SPACING.lg }}>
                Sign in to save your progress and track usage.
              </Text>
              <TouchableOpacity
                onPress={() => setShowSignInModal(true)}
                style={{
                  backgroundColor: COLORS.orange,
                  paddingVertical: SPACING.lg,
                  borderRadius: RADIUS.lg,
                  alignItems: 'center',
                  ...SHADOWS.md,
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Subscription Section */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
            Subscription
          </Text>

          {isPro ? (
            <View style={{ ...cardStyle, backgroundColor: COLORS.orangeLight, borderWidth: 1, borderColor: COLORS.orange }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.md,
                    backgroundColor: COLORS.orange,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="star" size={24} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.orangeDim, fontWeight: '700' }}>
                    Pro (Active)
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.orangeDim, marginTop: SPACING.xs }}>
                    Unlimited listings
                  </Text>
                </View>
              </View>
            </View>
          ) : hasPromo ? (
            <View style={{ ...cardStyle, backgroundColor: COLORS.orangeLight, borderWidth: 1, borderColor: COLORS.orange }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.md,
                    backgroundColor: COLORS.orange,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="gift" size={24} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.orangeDim, fontWeight: '700' }}>
                    Promo Active
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.orangeDim, marginTop: SPACING.xs }}>
                    Unlimited generations
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Free Tier Info */}
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: RADIUS.md,
                      backgroundColor: COLORS.gray100,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="flash" size={24} color={COLORS.gray400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...TYPOGRAPHY.body, color: COLORS.navy, fontWeight: '600' }}>
                      Free Tier
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginTop: SPACING.xs }}>
                      3 free generations per month
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              </View>

              {/* Upgrade Button */}
              <TouchableOpacity
                onPress={handleUpgradePro}
                disabled={upgradeLoading}
                style={{
                  backgroundColor: COLORS.orange,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.lg,
                  alignItems: 'center',
                  marginBottom: SPACING.lg,
                  opacity: upgradeLoading ? 0.6 : 1,
                  ...SHADOWS.md,
                }}
              >
                {upgradeLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16, marginBottom: SPACING.xs }}>
                      Upgrade to Pro
                    </Text>
                    <Text style={{ color: COLORS.white, fontSize: 12, opacity: 0.9 }}>
                      Unlimited generations
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Promo Code Button */}
              <TouchableOpacity
                onPress={() => setShowPromoModal(true)}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.orange,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.lg,
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                  ...SHADOWS.sm,
                }}
              >
                <Text style={{ color: COLORS.orange, fontWeight: '600', fontSize: 14 }}>
                  Have a Promo Code?
                </Text>
              </TouchableOpacity>

              {/* Refresh Pro Status — for users who paid but Pro isn't active yet */}
              {user && (
                <TouchableOpacity
                  onPress={handleManualVerify}
                  disabled={verifying}
                  style={{ padding: SPACING.sm, alignItems: 'center', opacity: verifying ? 0.5 : 0.7 }}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color={COLORS.gray500} />
                  ) : (
                    <Text style={{ color: COLORS.gray500, fontSize: 12 }}>
                      Already paid? Refresh Pro status
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* About Section */}
        <View>
          <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
            About
          </Text>
          <View style={cardStyle}>
            <View style={{ gap: SPACING.lg }}>
              {/* Version */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, paddingBottom: SPACING.lg }}>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray500, marginBottom: SPACING.sm }}>
                  App Version
                </Text>
                <Text style={{ ...TYPOGRAPHY.body, color: COLORS.navy, fontWeight: '600' }}>
                  1.0.0
                </Text>
              </View>

              {/* Built With */}
              <View>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray500, marginBottom: SPACING.sm }}>
                  Built with
                </Text>
                <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600 }}>
                  React Native • Expo • Firebase • OpenAI
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <PromoModal visible={showPromoModal} onDismiss={() => setShowPromoModal(false)} onApply={handlePromoSubmit} loading={promoLoading} />

      {/* Sign In / Sign Up Modal */}
      <Modal
        visible={showSignInModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignInModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: '85%',
              maxWidth: 400,
              ...SHADOWS.lg,
            }}
          >
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg, textAlign: 'center' }}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>

            <TextInput
              placeholder="Email"
              value={signInEmail}
              onChangeText={setSignInEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={{
                borderWidth: 1,
                borderColor: COLORS.gray200,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                marginBottom: SPACING.md,
                fontSize: 16,
                color: COLORS.navy,
              }}
            />

            <TextInput
              placeholder="Password"
              value={signInPassword}
              onChangeText={setSignInPassword}
              secureTextEntry
              textContentType={isSignUp ? 'newPassword' : 'password'}
              style={{
                borderWidth: 1,
                borderColor: COLORS.gray200,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                marginBottom: SPACING.xl,
                fontSize: 16,
                color: COLORS.navy,
              }}
            />

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={signInLoading}
              style={{
                backgroundColor: COLORS.orange,
                paddingVertical: SPACING.lg,
                borderRadius: RADIUS.lg,
                alignItems: 'center',
                marginBottom: SPACING.md,
                opacity: signInLoading ? 0.6 : 1,
              }}
            >
              {signInLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={{ alignItems: 'center', marginBottom: SPACING.md }}
            >
              <Text style={{ color: COLORS.orange, fontSize: 14 }}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowSignInModal(false);
                setSignInEmail('');
                setSignInPassword('');
                setIsSignUp(false);
              }}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.gray600, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
