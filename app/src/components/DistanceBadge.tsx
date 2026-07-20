import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../theme/Theme';

export const DistanceBadge = ({ distKm, minutes }: { distKm: number; minutes: number }) => {
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} hr ${m > 0 ? `${m} min` : ''}`.trim();
  };

  return (
    <View style={{ 
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#FFF', 
      borderWidth: 1, borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: 10, paddingVertical: 6 
    }}>
      <Ionicons name="location" size={14} color={colors.primary} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
        {distKm.toFixed(1)} km · {formatTime(minutes)}
      </Text>
    </View>
  );
};

export default DistanceBadge;
