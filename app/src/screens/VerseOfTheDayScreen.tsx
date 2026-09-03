import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Share, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Heart } from 'lucide-react-native';
import VerseNotificationService, { DailyVerse } from '../services/VerseNotificationService';

const { width, height } = Dimensions.get('window');

const GRADIENTS = [
  ['#4facfe', '#00f2fe'], // Morning vibes
  ['#f6d365', '#fda085'], // Afternoon sun
  ['#a18cd1', '#fbc2eb'], // Evening sunset
  ['#09203f', '#537895'], // Night sky
  ['#84fab0', '#8fd3f4'], // Fresh
  ['#fa709a', '#fee140'], // Warm
  ['#30cfd0', '#330867'], // Deep
  ['#fccb90', '#d57eeb'], // Magical
];

export default function VerseOfTheDayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);

  const verseId = route.params?.verseId;
  const period = route.params?.period || 'Morning';

  useEffect(() => {
    if (verseId) {
      loadVerse(verseId);
      VerseNotificationService.markVerseAsShown(verseId);
    }
  }, [verseId]);

  const loadVerse = async (id: string) => {
    setLoading(true);
    const v = await VerseNotificationService.getVerseById(id);
    setVerse(v);
    setLoading(false);
  };

  const getGradientIndex = () => {
    if (!verseId) return 0;
    // Simple hash to deterministically pick a gradient based on the verseId length/characters
    const hash = verseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % GRADIENTS.length;
  };

  const gradientColors = GRADIENTS[getGradientIndex()];

  const handleShare = async () => {
    if (!verse) return;
    try {
      const message = `*Good ${period}!* \n\n"${verse.verseEn}"\n- ${verse.referenceEn}\n\n"${verse.verseTe}"\n- ${verse.referenceTe}\n\nShared via Brothers in Christ App`;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4facfe" />
      </View>
    );
  }

  if (!verse) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Verse not found or no longer available.</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Good {period}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <Heart color="rgba(0,0,0,0.05)" size={120} style={styles.watermark} />
          
          <Text style={styles.verseEn}>"{verse.verseEn}"</Text>
          <Text style={styles.refEn}>- {verse.referenceEn}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.verseTe}>"{verse.verseTe}"</Text>
          <Text style={styles.refTe}>- {verse.referenceTe}</Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 color="#fff" size={20} />
            <Text style={styles.shareBtnText}>Share Verse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: -20,
    right: -20,
    transform: [{ rotate: '-15deg' }],
  },
  verseEn: {
    fontSize: 24,
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 34,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  refEn: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  verseTe: {
    fontSize: 22,
    color: '#0f172a',
    lineHeight: 34,
    marginBottom: 12,
  },
  refTe: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 30,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  backBtnFallback: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
