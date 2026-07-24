import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Target, Eye, Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';
import firestoreService from '../services/FirestoreService';

interface AboutUsData {
  churchName: string;
  churchSubtitle: string;
  description: string;
  mission: string;
  vision: string;
}

const DEFAULT: AboutUsData = {
  churchName: '',
  churchSubtitle: '',
  description: '',
  mission: '',
  vision: '',
};

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
                churchName: d.churchName || DEFAULT.churchName,
                churchSubtitle: d.churchSubtitle || DEFAULT.churchSubtitle,
                description: d.description || DEFAULT.description,
                mission: d.mission || DEFAULT.mission,
                vision: d.vision || DEFAULT.vision,
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
          {/* Church Logo Hero */}
          <View style={styles.heroCard}>
            {activeChurch?.theme?.logoUrl ? (
              <View style={styles.logoCircle}>
                <Image
                  source={{ uri: activeChurch.theme.logoUrl }}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            <Text style={styles.churchName}>{data.churchName}</Text>
            <Text style={styles.churchSubtitle}>{data.churchSubtitle}</Text>
            <View style={styles.goldDivider} />
            <Text style={styles.descriptionText}>{data.description}</Text>
          </View>

          {/* Mission Card */}
          <View style={styles.infoCard}>
            <View style={[styles.cardIconRow, { backgroundColor: '#fef3c7' }]}>
              <Target size={22} color="#b45309" />
              <Text style={[styles.cardTitle, { color: '#b45309' }]}>Our Mission</Text>
            </View>
            <Text style={styles.cardBody}>{data.mission}</Text>
          </View>

          {/* Vision Card */}
          <View style={styles.infoCard}>
            <View style={[styles.cardIconRow, { backgroundColor: '#ede9fe' }]}>
              <Eye size={22} color="#7c3aed" />
              <Text style={[styles.cardTitle, { color: '#7c3aed' }]}>Our Vision</Text>
            </View>
            <Text style={styles.cardBody}>{data.vision}</Text>
          </View>

          {/* Values Card */}
          <View style={styles.infoCard}>
            <View style={[styles.cardIconRow, { backgroundColor: '#fce7f3' }]}>
              <Heart size={22} color="#db2777" />
              <Text style={[styles.cardTitle, { color: '#db2777' }]}>Our Values</Text>
            </View>
            <View style={styles.valuesGrid}>
              {[
                { emoji: '✝️', label: 'Faith in Christ' },
                { emoji: '🙏', label: 'Prayer & Worship' },
                { emoji: '❤️', label: 'Love & Service' },
                { emoji: '📖', label: 'God\'s Word' },
                { emoji: '🤝', label: 'Community' },
                { emoji: '🕊️', label: 'Holy Spirit' },
              ].map((v) => (
                <View key={v.label} style={styles.valueChip}>
                  <Text style={styles.valueEmoji}>{v.emoji}</Text>
                  <Text style={styles.valueLabel}>{v.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 50 }} />
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
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: { flex: 1, backgroundColor: '#f0f2f7' },
  scrollContent: { padding: 16, gap: 14 },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FCD34D',
    marginBottom: 16,
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: { width: 90, height: 90, resizeMode: 'cover' },
  churchName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a2d5a',
    letterSpacing: 0.5,
  },
  churchSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  goldDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#FCD34D',
    borderRadius: 2,
    marginVertical: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    padding: 16,
    paddingTop: 4,
  },

  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingTop: 4,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  valueEmoji: { fontSize: 16 },
  valueLabel: { fontSize: 13, color: '#1a2d5a', fontWeight: '600' },
});
