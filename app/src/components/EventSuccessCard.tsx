import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../theme/Theme';

export default function EventSuccessCard({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CheckCircle size={64} color="#10b981" strokeWidth={1.5} style={styles.icon} />
      </View>
      <Text style={styles.title}>Event Created!</Text>
      <Text style={styles.subtitle}>Your event has been successfully saved to the calendar.</Text>
      
      <TouchableOpacity style={styles.button} onPress={onDone}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 16,
    shadowColor: '#10b981', // green tinted shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0fdf4',
  },
  iconContainer: {
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
  },
  icon: {
    // marginBottom removed, handled by container
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  }
});