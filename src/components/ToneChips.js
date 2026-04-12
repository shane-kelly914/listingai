import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export function ToneChips({ tones, selectedTone, onToneSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginVertical: SPACING.md }}
    >
      <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingRight: SPACING.md }}>
        {tones.map(tone => {
          const isSelected = selectedTone === tone.value;
          return (
            <TouchableOpacity
              key={tone.value}
              onPress={() => onToneSelect(tone.value)}
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.full,
                backgroundColor: isSelected ? COLORS.gold : COLORS.gray100,
                borderWidth: isSelected ? 0 : 1,
                borderColor: COLORS.gray300,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? COLORS.white : COLORS.gray700,
                }}
              >
                {tone.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
