import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates, deleteTemplate } from '../../src/services/storage';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadTemplates(); }, []));

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Template', `Remove "${name}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await deleteTemplate(id);
          await loadTemplates();
        },
        style: 'destructive',
      },
    ]);
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
              <Ionicons name="bookmark" size={24} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.navy }}>Saved Templates</Text>
              <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginTop: SPACING.xs }}>
                Reuse property details quickly
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <ActivityIndicator color={COLORS.orange} size="large" />
          </View>
        ) : templates.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              alignItems: 'center',
              ...SHADOWS.sm,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: RADIUS.lg,
                backgroundColor: COLORS.gray50,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Ionicons name="documents" size={40} color={COLORS.gray300} />
            </View>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, textAlign: 'center', marginBottom: SPACING.md }}>
              No Templates Yet
            </Text>
            <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, textAlign: 'center' }}>
              Save property details from your listings to create reusable templates for similar properties.
            </Text>
          </View>
        ) : (
          <View style={{ gap: SPACING.md }}>
            {templates.map(template => (
              <View
                key={template.id}
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.lg,
                  ...SHADOWS.sm,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    {/* Icon */}
                    <View style={{ marginBottom: SPACING.md }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: RADIUS.md,
                          backgroundColor: COLORS.orangeLight,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="home" size={20} color={COLORS.orange} />
                      </View>
                    </View>

                    {/* Template Name */}
                    <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.sm }}>
                      {template.name}
                    </Text>

                    {/* Details */}
                    <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
                      {template.propertyType && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                          <Ionicons name="layers" size={14} color={COLORS.gray500} />
                          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600 }}>
                            {template.propertyType}
                          </Text>
                        </View>
                      )}
                      {template.city && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                          <Ionicons name="location" size={14} color={COLORS.gray500} />
                          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600 }}>
                            {template.city}, {template.state}
                          </Text>
                        </View>
                      )}
                      {template.bedrooms && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                          <Ionicons name="bed" size={14} color={COLORS.gray500} />
                          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600 }}>
                            {template.bedrooms} BR · {template.bathrooms} BA
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Saved Date */}
                    {template.savedAt && (
                      <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray500 }}>
                        Saved {new Date(template.savedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => handleDelete(template.id, template.name)}
                    style={{
                      padding: SPACING.sm,
                      marginLeft: SPACING.md,
                      marginTop: -SPACING.sm,
                    }}
                  >
                    <Ionicons name="trash" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
