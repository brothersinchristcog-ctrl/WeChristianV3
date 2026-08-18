import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView
} from 'react-native';
import { firestore, FieldValue } from '../../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { User, Globe, MapPin, ArrowRight, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [cellGroup, setCellGroup] = useState('');
  const [language, setLanguage] = useState<'English' | 'Telugu'>('English');
  const [loading, setLoading] = useState(false);

  const handleCompleteRegistration = async () => {
    if (!user) return;

    if (!fullName || !cellGroup) {
      Alert.alert('Incomplete Profile', 'Please provide your name and cell group to continue.');
      return;
    }

    setLoading(true);
    try {
      // ── Save to Firestore (Triggers RootNavigator redirection) ──
      await firestore().collection('users').doc(user.uid).set({
        name: fullName,
        phone: user.phoneNumber || 'Guest',
        cellGroup,
        language,
        onboardingComplete: true,
        createdAt: FieldValue.serverTimestamp(),
      });
      await AsyncStorage.setItem('user_language', language);
    } catch (error) {
      console.error('Onboarding Save Error:', error);
      Alert.alert('Error', 'Failed to save your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Immersive Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Home</Text>
        <Text style={styles.subtitle}>Let's personalize your spiritual journey.</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formWrap}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Language Selection */}
            <Text style={styles.label}>PREFREED LANGUAGE · భాష</Text>
            <View style={styles.langRow}>
              <TouchableOpacity 
                style={[styles.langBtn, language === 'English' && styles.langBtnActive]}
                onPress={() => setLanguage('English')}
              >
                <Globe size={14} color={language === 'English' ? '#fff' : '#1a2d5a'} />
                <Text style={[styles.langTxt, language === 'English' && styles.langTxtActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.langBtn, language === 'Telugu' && styles.langBtnActive]}
                onPress={() => setLanguage('Telugu')}
              >
                <Text style={[styles.langTxt, language === 'Telugu' && styles.langTxtActive]}>తెలుగు</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputBox}>
                <User size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CELL GROUP / LOCALITY</Text>
              <View style={styles.inputBox}>
                <MapPin size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Guntur East"
                  value={cellGroup}
                  onChangeText={setCellGroup}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <ShieldCheck size={16} color="#15803D" />
              <Text style={styles.infoTxt}>This information helps us connect you with your local cell group leaders.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryBtnTxt}>Start My Journey</Text>
                  <ArrowRight size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2d5a' },
  header: { paddingHorizontal: 30, paddingTop: 80, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#aac4e8', fontSize: 14, marginTop: 8, fontWeight: '500' },

  formWrap: { flex: 1 },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 0 },

  label: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 15 },
  
  langRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  langBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f9fafb' },
  langBtnActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  langTxt: { fontSize: 14, fontWeight: '700', color: '#1a2d5a' },
  langTxtActive: { color: '#fff' },

  inputGroup: { marginBottom: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 15, height: 56 },
  input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#111827' },

  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, marginBottom: 30 },
  infoTxt: { flex: 1, fontSize: 11, color: '#15803D', fontWeight: '600', lineHeight: 16 },

  primaryBtn: { backgroundColor: '#1a2d5a', borderRadius: 16, paddingVertical: 20, elevation: 8, shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 40 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
