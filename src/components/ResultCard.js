import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export function ResultCard({ title, content, onCopy }) {
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      onCopy && onCopy();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.md,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.navy,
          }}
        >
          {title}
        </Text>
        <TouchableOpacity onPress={handleCopy}>
          <Ionicons name="copy" size={20} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ maxHeight: 300 }}>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 22,
            color: COLORS.gray700,
          }}
        >
          {content}
        </Text>
      </ScrollView>

      <TouchableOpacity
        onPress={handleCopy}
        style={{
          marginTop: SPACING.md,
          paddingVertical: SPACING.sm,
          backgroundColor: COLORS.gold,
          borderRadius: RADIUS.md,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: COLORS.white,
            fontWeight: '600',
            fontSize: 14,
          }}
        >
          Copy to Clipboard
        </Text>
      </TouchableOpacity>
    </View>
  );
}
