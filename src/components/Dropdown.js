import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

export function Dropdown({ label, selectedValue, onValueChange, items, placeholder = 'Select...' }) {
  const [visible, setVisible] = useState(false);

  const selectedItem = items.find(i => i.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray300,
          borderRadius: RADIUS.md,
          backgroundColor: COLORS.white,
          paddingHorizontal: SPACING.md,
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: selectedValue ? COLORS.gray800 : COLORS.gray400,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.gray400} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1}>
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: 400,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.md,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.gray200,
                  }}
                >
                  <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy }}>
                    {label || 'Select'}
                  </Text>
                  <TouchableOpacity onPress={() => setVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.gray500} />
                  </TouchableOpacity>
                </View>

                {/* Options */}
                <FlatList
                  data={items}
                  keyExtractor={(item, idx) => String(item.value || idx)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onValueChange(item.value);
                        setVisible(false);
                      }}
                      style={{
                        paddingHorizontal: SPACING.lg,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor:
                          item.value === selectedValue ? COLORS.goldLight : COLORS.white,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          color: item.value === selectedValue ? COLORS.navy : COLORS.gray700,
                          fontWeight: item.value === selectedValue ? '600' : '400',
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.value === selectedValue && (
                        <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: COLORS.gray100 }} />
                  )}
                />
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
