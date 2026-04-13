import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export function PromoModal({ visible, onDismiss, onApply, loading = false }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleApply = async () => {
    setError('');
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    try {
      await onApply(code.trim());
      setCode('');
    } catch (err) {
      setError(err.message || 'Invalid promo code');
    }
  };

  const handleDismiss = () => {
    setCode('');
    setError('');
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING.lg,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            width: '100%',
            maxWidth: 400,
            ...SHADOWS.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: COLORS.navy,
              }}
            >
              Redeem a Code
            </Text>
            <TouchableOpacity onPress={handleDismiss}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: COLORS.gray600,
              marginBottom: SPACING.md,
              lineHeight: 20,
            }}
          >
            Have a promo or commission code? Enter it below to unlock your benefits.
          </Text>

          <TextInput
            placeholder="Enter code"
            value={code}
            onChangeText={setCode}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: error ? COLORS.danger : COLORS.gray300,
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              fontSize: 14,
              marginBottom: SPACING.md,
              color: COLORS.gray800,
            }}
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="characters"
          />

          {error && (
            <Text
              style={{
                color: COLORS.danger,
                fontSize: 12,
                marginBottom: SPACING.md,
              }}
            >
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleApply}
            disabled={loading || !code.trim()}
            style={{
              backgroundColor: COLORS.gold,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.md,
              alignItems: 'center',
              opacity: loading || !code.trim() ? 0.5 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                Apply Code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDismiss}
            disabled={loading}
            style={{
              marginTop: SPACING.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: COLORS.gray600,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
