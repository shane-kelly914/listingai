import React from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3; // 3 cols + gaps

export function PhotoGrid({
  photos,
  onRemove,
  onAddPress,
  loading = false,
  maxPhotos = 15,
}) {
  const canAddMore = photos.length < maxPhotos;

  // Prepare grid data: add button first if can add, then photos
  const gridData = [];
  if (canAddMore) {
    gridData.push({ id: 'add-button', type: 'add' });
  }
  photos.forEach((photo, index) => {
    gridData.push({ id: `photo-${index}`, type: 'photo', photo, index });
  });

  const renderItem = ({ item }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity
          onPress={onAddPress}
          disabled={loading}
          style={{
            width: PHOTO_SIZE,
            height: PHOTO_SIZE,
            borderRadius: RADIUS.lg,
            borderWidth: 2,
            borderColor: COLORS.orange,
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.orangeLight,
            opacity: loading ? 0.5 : 1,
            margin: SPACING.sm,
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.orange} />
          ) : (
            <>
              <Ionicons name="add-circle" size={40} color={COLORS.orange} />
              <Text
                style={{
                  ...TYPOGRAPHY.label,
                  color: COLORS.orange,
                  marginTop: SPACING.xs,
                  fontWeight: '600',
                }}
              >
                Add Photo
              </Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ position: 'relative', margin: SPACING.sm }}>
        <Image
          source={{ uri: item.photo.uri }}
          style={{
            width: PHOTO_SIZE,
            height: PHOTO_SIZE,
            borderRadius: RADIUS.lg,
            ...SHADOWS.md,
          }}
        />
        <TouchableOpacity
          onPress={() => onRemove(item.index)}
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            backgroundColor: COLORS.danger,
            borderRadius: 18,
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            ...SHADOWS.md,
          }}
        >
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View>
      {gridData.length === 0 ? (
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            alignItems: 'center',
            ...SHADOWS.sm,
          }}
        >
          <Ionicons name="image" size={48} color={COLORS.gray300} style={{ marginBottom: SPACING.md }} />
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray600, textAlign: 'center' }}>
            Add property photos
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray500, textAlign: 'center', marginTop: SPACING.sm }}>
            Upload clear photos of the property's best features
          </Text>
        </View>
      ) : (
        <FlatList
          data={gridData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          contentContainerStyle={{ paddingHorizontal: SPACING.sm }}
        />
      )}
    </View>
  );
}
