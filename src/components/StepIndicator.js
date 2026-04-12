import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function StepIndicator({ currentStep, totalSteps = 3 }) {
  const steps = ['Photos', 'Details', 'Generate'];

  return (
    <View style={{ marginBottom: SPACING.xl }}>
      {/* Progress Dots and Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
        {steps.map((label, index) => (
          <View key={index} style={{ alignItems: 'center', flex: 1 }}>
            {/* Dot */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: index <= currentStep ? COLORS.orange : COLORS.gray200,
                marginBottom: SPACING.sm,
              }}
            />
            {/* Label */}
            <Text
              style={{
                ...TYPOGRAPHY.label,
                color: index <= currentStep ? COLORS.navy : COLORS.gray400,
                fontWeight: index === currentStep ? '600' : '400',
                fontSize: 11,
              }}
            >
              {label}
            </Text>
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 5,
                  width: '100%',
                  height: 2,
                  backgroundColor: index < currentStep ? COLORS.orange : COLORS.gray200,
                  marginLeft: SPACING.lg / 2,
                }}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Counter */}
      <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, textAlign: 'center' }}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}
