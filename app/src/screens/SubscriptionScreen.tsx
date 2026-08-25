import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import SubscriptionTab from '../components/SubscriptionTab';

import { useAuth } from '../context/AuthContext';

export default function SubscriptionScreen({ navigation, route }: any) {
  const { isDark } = useTheme();
  const { signOut } = useAuth();
  
  const isExpired = route?.params?.isExpired;

  return (
    <View style={[styles.container, { backgroundColor: '#F7F3E9' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3E9" />

      {/* Header Removed */}

      {/* Main Content */}
      <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 }}>
        <SubscriptionTab />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    backgroundColor: 'transparent', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, width: '100%' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  backBtnTxt: { color: '#1F3B3D', fontSize: 16, fontWeight: '700', marginLeft: 4 },
});
