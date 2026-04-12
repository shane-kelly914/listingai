import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ResultCard } from '../src/components/ResultCard';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../src/constants/theme';

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('full');
  const [exporting, setExporting] = useState(false);

  const full = params.full || '';
  const mls = params.mls || '';
  const social = params.social || '';
  const fixes = params.fixes ? JSON.parse(params.fixes) : [];

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content[activeTab].text);
      Alert.alert('Success', 'Copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const csv = [
        ['ListingAI Export', new Date().toLocaleDateString()],
        [],
        ['Full Listing Description'],
        [full],
        [],
        ['MLS Version'],
        [mls],
        [],
        ['Social Media'],
        [social],
      ]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      await Clipboard.setStringAsync(csv);
      Alert.alert('Success', 'CSV copied to clipboard. Paste into your spreadsheet.');
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const content = {
    full: { title: 'Full Description', text: full },
    mls: { title: 'MLS Version', text: mls },
    social: { title: 'Social Media', text: social },
  };

  const currentContent = content[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.navy,
          paddingTop: insets.top,
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.lg,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...SHADOWS.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.white, flex: 1, textAlign: 'center' }}>
          Your Listing
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={{ width: 28 }}>
          <Ionicons name="home" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.lg,
          paddingBottom: insets.bottom + SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pill Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: SPACING.md,
            marginBottom: SPACING.xl,
            backgroundColor: COLORS.white,
            borderRadius: RADIUS.lg,
            padding: SPACING.sm,
            ...SHADOWS.sm,
          }}
        >
          {Object.entries(content).map(([key, { title }]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{
                flex: 1,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: activeTab === key ? COLORS.orange : 'transparent',
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.label,
                  color: activeTab === key ? COLORS.white : COLORS.gray600,
                  fontWeight: activeTab === key ? '600' : '500',
                  textAlign: 'center',
                  fontSize: 12,
                }}
              >
                {title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fair Housing Badge */}
        {fixes.length >= 0 && (
          <View
            style={{
              backgroundColor: COLORS.orangeLight,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.orange,
              ...SHADOWS.sm,
            }}
          >
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.bodySm,
                    color: COLORS.orangeDim,
                    fontWeight: '600',
                    marginBottom: SPACING.xs,
                  }}
                >
                  Fair Housing Compliant
                </Text>
                {fixes.length > 0 ? (
                  <>
                    <Text style={{ ...TYPOGRAPHY.label, color: COLORS.orangeDim }}>
                      {fixes.length} potential issue{fixes.length > 1 ? 's' : ''} automatically cleaned.
                    </Text>
                    <Text style={{ ...TYPOGRAPHY.label, color: COLORS.orangeDim, marginTop: SPACING.xs }}>
                      {fixes.join(', ')}
                    </Text>
                  </>
                ) : (
                  <Text style={{ ...TYPOGRAPHY.label, color: COLORS.orangeDim }}>
                    Your listing passed fair housing screening.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Content Card */}
        <ResultCard
          title={currentContent.title}
          content={currentContent.text}
          onCopy={handleCopy}
        />

        {/* Action Buttons */}
        <View style={{ gap: SPACING.md, marginTop: SPACING.xl }}>
          {/* Export Button */}
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.md,
              backgroundColor: COLORS.white,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.orange,
              opacity: exporting ? 0.6 : 1,
              ...SHADOWS.sm,
            }}
          >
            {exporting ? (
              <ActivityIndicator color={COLORS.orange} />
            ) : (
              <>
                <Ionicons name="download" size={20} color={COLORS.orange} />
                <Text style={{ ...TYPOGRAPHY.body, color: COLORS.orange, fontWeight: '600' }}>
                  Export as CSV
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Generate Another Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.md,
              backgroundColor: COLORS.orange,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.lg,
              ...SHADOWS.md,
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '700' }}>
              Generate Another
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
