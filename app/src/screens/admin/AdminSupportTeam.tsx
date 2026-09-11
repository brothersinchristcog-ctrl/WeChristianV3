import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Dimensions, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, MessageCircle, Mail, ChevronLeft, Globe } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

const SUPPORT_MEMBERS = [
  {
    name: 'S. Sunil Babu',
    initials: 'SB',
    phone: '8374331432',
    displayPhone: '+91 83743 31432',
  },
  {
    name: 'Y. Prabhakar',
    initials: 'YP',
    phone: '9392723536',
    displayPhone: '+91 93927 23536',
  },
  {
    name: 'L. Shaik Shafi',
    initials: 'SS',
    phone: '9642402639',
    displayPhone: '+91 96424 02639',
  }
];

export default function AdminSupportTeam({ navigation }: any) {
  const { goBack } = useContext(AdminTabContext) as any;

  const handleWhatsApp = (phone: string) => {
    const message = encodeURIComponent('Hello WeChristian Support Team, I need help with the WeChristian app.');
    const url = `https://wa.me/91${phone}?text=${message}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const handleCall = (phone: string) => {
    const url = `tel:+91${phone}`;
    Linking.openURL(url).catch(err => console.error("Couldn't open dialer", err));
  };

  const handleEmail = () => {
    const message = encodeURIComponent('Hello WeChristian Support Team,\n\nI need help with...');
    const url = `mailto:wechristianapp@gmail.com?subject=WeChristian%20app%20support&body=${message}`;
    Linking.openURL(url).catch(err => console.error("Couldn't open email", err));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={goBack} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.topbarTitle, { marginHorizontal: 12, opacity: 0.4, color: '#fff' }]}>|</Text>
              <View>
                <Text style={styles.topbarTitle}>Contact Support</Text>
                <Text style={[styles.heroSub, { marginTop: 2 }]}>WeChristian app assistance</Text>
              </View>
            </View>
          </View>
        </View>

        <ImageBackground source={require('../../../assets/support_bg.png')} style={{ flex: 1 }} imageStyle={{ opacity: 0.1, resizeMode: 'cover' }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Hero Section */}
          <View style={styles.contentHero}>
            {/* We approximate the radial gradient with a linear gradient or an absolutely positioned circle. 
                A large View with opacity works well for the 'hero-arc' effect. */}
            <View style={styles.heroArcContainer}>
               <View style={styles.heroArc} />
            </View>
            
            <Text style={styles.eyebrow}>We're here for you</Text>
            <Text style={styles.heroTitle}>Need help with the{'\n'}WeChristian app?</Text>
            <Text style={styles.heroDesc}>
              Our support team is happy to help — reach out however's easiest for you.
            </Text>
          </View>

          {/* Divider */}
          <LinearGradient
            colors={['#E4DECE', 'rgba(228,222,206,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          <Text style={styles.sectionLabel}>Support team</Text>

          {/* Support Members */}
          <View style={styles.cards}>
            {SUPPORT_MEMBERS.map((member, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.person}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.personName}>{member.name}</Text>
                    <Text style={styles.personNumber}>{member.displayPhone}</Text>
                  </View>
                </View>
                
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnWhatsapp]} 
                    onPress={() => handleWhatsApp(member.phone)}
                    activeOpacity={0.7}
                  >
                    <MessageCircle color="#12603C" size={16} />
                    <Text style={styles.btnWhatsappText}>WhatsApp</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnCall]} 
                    onPress={() => handleCall(member.phone)}
                    activeOpacity={0.7}
                  >
                    <Phone color="#2F5A8A" size={16} />
                    <Text style={styles.btnCallText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.emailSection}>
            <Text style={styles.sectionLabel}>Digital</Text>
            
            <View style={[styles.card, { marginBottom: 10 }]}>
              <View style={styles.person}>
                <View style={styles.emailIcon}>
                  <Mail color="#7A5A24" size={19} />
                </View>
                <View>
                  <Text style={styles.personName}>WeChristian support</Text>
                  <Text style={styles.personNumber}>wechristianapp@gmail.com</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.btn, styles.btnEmail]} 
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <Text style={styles.btnEmailText}>Send email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.person}>
                <View style={styles.emailIcon}>
                  <Globe color="#7A5A24" size={19} />
                </View>
                <View>
                  <Text style={styles.personName}>Our Website</Text>
                  <Text style={styles.personNumber}>wechristian.app</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.btn, styles.btnEmail]} 
                onPress={() => Linking.openURL('https://wechristian.app').catch(err => console.error("Couldn't open website", err))}
                activeOpacity={0.7}
              >
                <Text style={styles.btnEmailText}>Visit Website</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footnote}>
            <Text style={styles.verse}>"Carry each other's burdens." — Galatians 6:2</Text>
            <Text style={styles.footnoteText}>We usually reply within a day.</Text>
          </View>

          </ScrollView>
        </ImageBackground>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EA', // --parchment
  },
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
  },
  topbarTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.serif,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#AEB8D4',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentHero: {
    position: 'relative',
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroArcContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: -1,
  },
  heroArc: {
    position: 'absolute',
    top: -140,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(185,135,59,0.08)', // Simplified radial approximation
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#B9873B', // --gold
    fontWeight: '600',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: FONTS.serif,
    fontSize: 29,
    fontWeight: '500',
    lineHeight: 34,
    color: '#1F2A44',
    marginBottom: 10,
  },
  heroDesc: {
    fontSize: 14.5,
    lineHeight: 22.5,
    color: '#4B5670', // --ink-soft
    maxWidth: 300,
  },
  divider: {
    height: 1,
    marginHorizontal: 26,
    marginBottom: 18,
    marginTop: 4,
  },
  sectionLabel: {
    paddingHorizontal: 26,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#4B5670',
    fontWeight: '600',
    marginBottom: 12,
  },
  cards: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DECE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1E4C9', // --gold-soft
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: '600',
    color: '#7A5A24',
  },
  personName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 2,
  },
  personNumber: {
    fontSize: 13,
    color: '#4B5670',
    letterSpacing: 0.1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 11,
  },
  btnWhatsapp: {
    backgroundColor: '#E4F3EC', // --whatsapp-soft
  },
  btnWhatsappText: {
    color: '#12603C',
    fontSize: 13.5,
    fontWeight: '600',
  },
  btnCall: {
    backgroundColor: '#E7EEF6', // --call-blue-soft
  },
  btnCallText: {
    color: '#2F5A8A',
    fontSize: 13.5,
    fontWeight: '600',
  },
  emailSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emailIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1E4C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEmail: {
    width: '100%',
    backgroundColor: '#1F2A44',
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEmailText: {
    color: '#F7F3EA',
    fontSize: 13.5,
    fontWeight: '600',
  },
  footnote: {
    paddingHorizontal: 26,
    paddingTop: 20,
    alignItems: 'center',
  },
  verse: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: '#1F2A44',
    marginBottom: 4,
    textAlign: 'center',
  },
  footnoteText: {
    fontSize: 12,
    color: '#4B5670',
    textAlign: 'center',
    lineHeight: 19,
  },
});
