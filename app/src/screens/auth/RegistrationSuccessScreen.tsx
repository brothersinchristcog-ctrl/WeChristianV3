import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Heart
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RegistrationSuccessScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 🔮 Background Decor */}
      <View style={[styles.decorCircle, { top: -100, right: -100, opacity: 0.1 }]} />
      <View style={[styles.decorCircle, { bottom: -150, left: -150, opacity: 0.05 }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../../assets/logo.png')} 
                style={styles.logoImg}
                resizeMode="contain"
              />
              <View style={styles.sparkleBadge}>
                <Sparkles color="#fbbf24" size={20} />
              </View>
            </View>
            
            <Text style={styles.welcomeTitle}>Welcome Home!</Text>
            <Text style={styles.welcomeTelugu}>నూతన సభ్యులకు స్వాగతం</Text>
            <Text style={styles.successLbl}>REGISTRATION SUCCESSFUL</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.badgeRow}>
              <CheckCircle color="#15803D" size={16} />
              <Text style={styles.badgeTxt}>OFFICIAL MEMBER</Text>
            </View>
            
            <Text style={styles.cardDesc}>
              Praise the Lord! Your official record has been successfully created in the Church Registry.
              {"\n\n"}
              You can now access all features including Daily Promises, Prayer Wall, and Sermons.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnTxt}>Proceed to Sign In</Text>
              <View style={styles.btnIcon}>
                <ArrowRight color="#1a2d5a" size={20} strokeWidth={3} />
              </View>
            </TouchableOpacity>

            <View style={styles.blessingBox}>
              <Heart size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.blessingTxt}>God bless your journey with us.</Text>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2d5a' },
  decorCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#fbbf24' },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 30, justifyContent: 'space-between' },
  
  heroSection: { alignItems: 'center', marginTop: 40 },
  logoCircle: { 
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', 
    alignItems: 'center', justifyContent: 'center', marginBottom: 25,
    elevation: 20, shadowColor: '#fbbf24', shadowOpacity: 0.4, shadowRadius: 15,
    position: 'relative', overflow: 'hidden'
  },
  logoImg: { width: 110, height: 110, resizeMode: 'cover' },
  sparkleBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#1a2d5a', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#fbbf24' },
  
  welcomeTitle: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 5 },
  welcomeTelugu: { fontSize: 18, color: '#aac4e8', fontWeight: '500', textAlign: 'center', marginBottom: 10 },
  successLbl: { fontSize: 10, color: '#fbbf24', fontWeight: '800', textAlign: 'center', letterSpacing: 1.5 },

  infoCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  badgeTxt: { color: '#15803D', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardDesc: { fontSize: 14, color: '#fff', lineHeight: 22, textAlign: 'center', opacity: 0.8, fontWeight: '500' },

  footer: { width: '100%', paddingBottom: 20 },
  primaryBtn: { 
    backgroundColor: '#fff', flexDirection: 'row', height: 64, paddingHorizontal: 25, 
    borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', width: '100%', 
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 
  },
  primaryBtnTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  btnIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f0f2f7', alignItems: 'center', justifyContent: 'center' },

  blessingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 25 },
  blessingTxt: { color: '#aac4e8', fontSize: 12, fontWeight: '500' }
});
