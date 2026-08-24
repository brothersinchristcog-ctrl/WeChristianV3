import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import SubscriptionTab from '../components/SubscriptionTab';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionScreen({ navigation, route }: any) {
  const { signOut } = useAuth();
  const isExpired = route?.params?.isExpired;

  return (
    <View style={[styles.container, { backgroundColor: '#F7F3E9' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3E9" />
      <SubscriptionTab 
        onClose={() => {
          if (isExpired) {
            signOut();
          } else {
            navigation.goBack();
          }
        }}
        isExpired={isExpired}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
