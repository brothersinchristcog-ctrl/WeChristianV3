import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Target, Heart, Sparkles, Users, BookOpen, Video, Hand, Gift, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';
import firestoreService from '../services/FirestoreService';

interface AboutUsData {
  churchName: string;
  churchSubtitle: string;
  description: string;
  mission: string;
  vision: string;
}

const DEFAULT: AboutUsData = {
  churchName: 'Church of GOD',
  churchSubtitle: 'క్రీస్తు నందు సహోదరుల సహవాసము',
  description: 'At Church of GOD, our calling is rooted in a simple yet profound mandate: to serve and love our community as a reflection of divine compassion. We believe that every individual is a story of grace waiting to be told, and we strive to be the supportive chapter where healing and purpose meet.',
  vision: '"Building a house of prayer for all nations, where every soul finds a home and every heart finds peace."',
  mission: 'We look forward to a future where the walls of the church extend into the streets, bringing hope to the hopeless and a tangible sense of belonging to all who seek it.',
};

const { width } = Dimensions.get('window');

export default function AboutUsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { activeChurch } = useChurch();
  const [data, setData] = useState<AboutUsData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: () => void = () => {};

    const setupListener = async () => {
      try {
        const col = await firestoreService.getCollection('settings');
        unsub = col.doc('about').onSnapshot(
          (doc) => {
            if (doc.exists()) {
              const d = doc.data() as AboutUsData;
              setData({
                churchName: d.churchName || activeChurch?.name || 'Your Church',
                churchSubtitle: d.churchSubtitle || '',
                description: d.description || activeChurch?.aboutUs || '',
                mission: d.mission || '',
                vision: d.vision || '',
              });
            } else {
              setData({
                churchName: activeChurch?.name || 'Your Church',
                churchSubtitle: '',
                description: activeChurch?.aboutUs || '',
                mission: '',
                vision: '',
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn('AboutUs listener error:', err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.warn('Error setting up AboutUs listener:', err);
        setLoading(false);
      }
    };

    setupListener();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Hero Header Card */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color="#fff" />
            <Text style={styles.backBtnTxt}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeTxt}>⛪ Church</Text>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.headerTitle}>About Us</Text>
          <Text style={styles.headerSub}>Discover our mission and values</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a2d5a" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Church Name */}
          <View style={styles.heroSection}>
            {!!activeChurch?.theme?.logoUrl ? (
              <View style={styles.logoCircle}>
                <Image
                  source={{ uri: activeChurch.theme.logoUrl }}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.logoCircle, { backgroundColor: '#f0f2f7' }]} />
            )}
            <Text style={styles.churchName}>{data.churchName}</Text>
            <Text style={styles.churchSubtitle}>{data.churchSubtitle}</Text>
          </View>

          {/* Our Calling Card */}
          <View style={styles.callingCard}>
            <View style={styles.callingHeader}>
              <Heart size={20} color="#1a2d5a" strokeWidth={2} />
              <Text style={styles.callingTitle}>Our Calling</Text>
            </View>
            <Text style={styles.callingText}>{data.description}</Text>
          </View>

          {/* Church Image */}
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800&auto=format&fit=crop' }} 
            style={styles.churchImage}
          />

          {/* Our Vision */}
          <View style={styles.visionSection}>
            <Text style={styles.sectionTitle}>Our Vision</Text>
            <View style={styles.blockquoteContainer}>
              <View style={styles.blockquoteLine} />
              <Text style={styles.blockquoteText}>{data.vision}</Text>
            </View>
            <Text style={styles.visionText}>{data.mission}</Text>
          </View>

          {/* Our Core Values */}
          <View style={styles.valuesSection}>
            <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Our Core Values</Text>
            <View style={styles.valuesGrid}>
              <View style={[styles.valuePill, { backgroundColor: '#dbeafe' }]}>
                <Heart size={16} color="#1e3a8a" />
                <Text style={[styles.valuePillText, { color: '#1e3a8a' }]}>Compassion</Text>
              </View>
              <View style={[styles.valuePill, { backgroundColor: '#fef08a' }]}>
                <Target size={16} color="#854d0e" />
                <Text style={[styles.valuePillText, { color: '#854d0e' }]}>Integrity</Text>
              </View>
              <View style={[styles.valuePill, { backgroundColor: '#e5e7eb' }]}>
                <Sparkles size={16} color="#374151" />
                <Text style={[styles.valuePillText, { color: '#374151' }]}>Faith</Text>
              </View>
              <View style={[styles.valuePill, { backgroundColor: '#bfdbfe' }]}>
                <Users size={16} color="#1e40af" />
                <Text style={[styles.valuePillText, { color: '#1e40af' }]}>Fellowship</Text>
              </View>
            </View>
          </View>

          {/* Connected in Spirit */}
          <View style={styles.connectedSection}>
            <Text style={styles.sectionTitle}>Connected in Spirit</Text>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#e2e8f0' }]}>
                <BookOpen size={20} color="#1e293b" />
              </View>
              <Text style={styles.featureTitle}>Sermons On-Demand</Text>
              <Text style={styles.featureDesc}>Revisit Sunday messages anytime. Journey through our archive of teachings wherever you are.</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#fef3c7' }]}>
                <Video size={20} color="#92400e" />
              </View>
              <Text style={styles.featureTitle}>Live Services</Text>
              <Text style={styles.featureDesc}>Watch our Sunday gatherings live. Connect from anywhere in the world.</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#fef3c7' }]}>
                <Hand size={20} color="#92400e" />
              </View>
              <Text style={styles.featureTitle}>Prayer Requests</Text>
              <Text style={styles.featureDesc}>"Submit and join in communal prayer. Your burdens are shared, and your joys are celebrated."</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#e2e8f0' }]}>
                <Gift size={20} color="#1e293b" />
              </View>
              <Text style={styles.featureTitle}>Giving & Support</Text>
              <Text style={styles.featureDesc}>Seamlessly support church ministries. Secure and faithful stewardship for our shared mission.</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#e5e7eb' }]}>
                <Sparkles size={20} color="#1f2937" />
              </View>
              <Text style={styles.featureTitle}>Daily Promises</Text>
              <Text style={styles.featureDesc}>Start your day with scripture and reflection. Morning bread for your spiritual journey.</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#e2e8f0' }]}>
                <Calendar size={20} color="#1e293b" />
              </View>
              <Text style={styles.featureTitle}>Events & RSVP</Text>
              <Text style={styles.featureDesc}>Stay updated and register for gatherings. Never miss a moment with your church family.</Text>
            </View>
          </View>

          {/* Footer Quote */}
          <View style={styles.footerQuoteCard}>
            <Text style={styles.footerQuoteText}>"And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."</Text>
            <Text style={styles.footerQuoteRef}>PHILIPPIANS 4:7</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a2d5a' },
  header: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 12,
  },
  headerBottom: {
    paddingLeft: 4,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },

  scroll: { flex: 1, backgroundColor: '#fafafa' },
  scrollContent: { paddingHorizontal: 20 },

  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  churchName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontWeight: '600',
    color: '#0f2756',
    textAlign: 'center',
    marginBottom: 8,
  },
  churchSubtitle: {
    fontSize: 15,
    color: '#1e3a8a',
    textAlign: 'center',
    fontWeight: '500',
  },

  callingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  callingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  callingTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f2756',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  callingText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },

  churchImage: {
    width: '100%',
    height: 250,
    borderRadius: 24,
    marginBottom: 30,
  },

  visionSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f2756',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 20,
  },
  blockquoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  blockquoteLine: {
    width: 4,
    backgroundColor: '#facc15',
    marginRight: 16,
    borderRadius: 2,
  },
  blockquoteText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    fontStyle: 'italic',
    lineHeight: 28,
  },
  visionText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 24,
  },

  valuesSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  valuePillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  connectedSection: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f2756',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },

  footerQuoteCard: {
    backgroundColor: '#0f2756',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  footerQuoteText: {
    fontSize: 18,
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    zIndex: 1,
  },
  footerQuoteRef: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 2,
    zIndex: 1,
  },
});
