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
import { useLanguage } from '../../context/LanguageContext';
import { User, Globe, MapPin, ArrowRight, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { user } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [cellGroup, setCellGroup] = useState('');
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
      await AsyncStorage.setItem('@user_language', language);
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
        <Text style={styles.title}>{t('auth.welcomeHome')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formWrap}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Language Selection */}
            <Text style={styles.label}>{t('auth.preferredLanguage')}</Text>
            <View style={styles.langGrid}>
              {languages.map((item) => {
                const isActive = language === item.code;
                return (
                  <TouchableOpacity 
                    key={item.code}
                    style={[styles.langBtn, isActive && styles.langBtnActive]}
                    onPress={() => setLanguage(item.code)}
                  >
                    <Text style={[styles.langTxt, isActive && styles.langTxtActive]}>
                      {item.nativeName}
                    </Text>
                    <Text style={[styles.langSubTxt, isActive && styles.langSubTxtActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Profile Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <View style={styles.inputBox}>
                <User size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullNamePlaceholder')}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.cellGroup')}</Text>
              <View style={styles.inputBox}>
                <MapPin size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.cellGroupPlaceholder')}
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
                  <Text style={styles.primaryBtnTxt}>{t('auth.completeRegistration')}</Text>
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
  
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  langBtn: { width: '31%', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  langBtnActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  langTxt: { fontSize: 13, fontWeight: '700', color: '#1a2d5a' },
  langTxtActive: { color: '#fbbf24' },
  langSubTxt: { fontSize: 10, fontWeight: '500', color: '#6b7280', marginTop: 2 },
  langSubTxtActive: { color: '#ffffff' },

  inputGroup: { marginBottom: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 15, height: 56 },
  input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#111827' },

  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, marginBottom: 30 },
  infoTxt: { flex: 1, fontSize: 11, color: '#15803D', fontWeight: '600', lineHeight: 16 },

  primaryBtn: { backgroundColor: '#1a2d5a', borderRadius: 16, paddingVertical: 20, elevation: 8, shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 40 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
