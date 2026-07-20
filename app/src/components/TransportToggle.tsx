import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing } from '../theme/Theme';
import { TransportMode } from '../types/event';

const modes: { key: TransportMode; icon: string; label: string }[] = [
  { key: 'car',  icon: 'car-outline',    label: 'Car'  },
  { key: 'bike', icon: 'bicycle-outline', label: 'Bike' },
  { key: 'bus',  icon: 'bus-outline',     label: 'Bus'  },
];

export const TransportToggle = ({
  value, onChange
}: { value: TransportMode; onChange: (m: TransportMode) => void }) => (
  <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
    {modes.map(m => {
      const isActive = value === m.key;
      return (
        <TouchableOpacity
          key={m.key}
          onPress={() => onChange(m.key)}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 4, paddingVertical: 10,
            borderRadius: radius.sm,
            borderWidth: isActive ? 2 : 1,
            borderColor: isActive ? colors.primary : colors.border,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Ionicons
            name={m.icon as any}
            size={16}
            color={isActive ? colors.primary : colors.textSecondary}
          />
          <Text style={{
            fontSize: 12,
            color: isActive ? colors.primary : colors.textSecondary,
            fontWeight: isActive ? '700' : '400'
          }}>
            {m.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default TransportToggle;
