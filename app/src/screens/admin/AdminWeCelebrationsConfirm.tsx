import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Check, Home } from 'lucide-react-native';

export default function AdminWeCelebrationsConfirm({ 
  member,
  category,
  onDone 
}: { 
  member: any, 
  category: string,
  onDone: () => void 
}) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.confirmCheck, 
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
      ]}>
        <Check stroke="#FFFFFF" width={40} height={40} strokeWidth={3} />
      </Animated.View>

      <Text style={styles.title}>Greeting Sent!</Text>
      
      <Text style={styles.message}>
        Your {categoryLabel.toLowerCase()} wish for <Text style={styles.bold}>{member?.name}</Text> has been sent via WhatsApp.
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={onDone}>
        <Home stroke="#FFFFFF" width={20} height={20} />
        <Text style={styles.btnPrimaryText}>Back to Celebrations</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 70,
  },
  confirmCheck: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#BE9A3A', // Fallback
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#BE9A3A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 8,
  },
  title: {
    fontFamily: 'Fraunces-Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 40,
  },
  bold: {
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#37469B',
    shadowColor: '#1E2A63',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
    width: '100%',
    maxWidth: 260,
  },
  btnPrimaryText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  }
});
