import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export function UsageBar({ usageCount, maxFree = 3, isPro = false, hasPromo = false }) {
  if (isPro) {
    return (
      <View
        style={{
          backgroundColor: COLORS.goldLight,
          padding: SPACING.md,
          borderRadius: 8,
          marginVertical: SPACING.md,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.goldDim,
            textAlign: 'center',
          }}
        >
          Unlimited Generations (Pro)
        </Text>
      </View>
    );
  }

  if (hasPromo) {
    return (
      <View
        style={{
          backgroundColor: COLORS.goldLight,
          padding: SPACING.md,
          borderRadius: 8,
          marginVertical: SPACING.md,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.goldDim,
            textAlign: 'center',
          }}
        >
          Unlimited Generations (Promo Active)
        </Text>
      </View>
    );
  }

  const remaining = Math.max(0, maxFree - usageCount);
  const percentUsed = (usageCount / maxFree) * 100;

  return (
    <View style={{ marginVertical: SPACING.md }}>
      <View style={{ marginBottom: SPACING.sm }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.gray700,
            marginBottom: SPACING.xs,
          }}
        >
          Free Tier: {remaining} / {maxFree} remaining
        </Text>
        <View
          style={{
            height: 8,
            backgroundColor: COLORS.gray200,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${percentUsed}%`,
              backgroundColor: percentUsed > 66 ? COLORS.danger : COLORS.gold,
            }}
          />
        </View>
      </View>
      {remaining === 0 && (
        <Text
          style={{
            fontSize: 12,
            color: COLORS.danger,
            fontWeight: '500',
          }}
        >
          Free limit reached. Upgrade to Pro or enter a promo code.
        </Text>
      )}
    </View>
  );
}
