import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import { ArrowLeft, ArrowRight, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { QUIZ_CATEGORIES } from '../../constants/BibleQuizCategories';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';
import QuizLanguageModal from './QuizLanguageModal';

export default function BibleQuizHomeScreen() {
  const navigation = useNavigation<any>();
  const { quizLanguage, quizLanguageOption } = useQuizLanguage();
  const { isDark } = useTheme();
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);

  const ui = getQuizStrings(quizLanguage);

  const handleSelectCategory = (cat: typeof QUIZ_CATEGORIES[0]) => {
    navigation.navigate('BibleQuizLevels', {
      category: cat.id,
      categoryTitle: cat.name,
      categoryTelugu: cat.teluguName,
      categoryImage: cat.imageUrl,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3673" />

      {/* Signature WeChristian Curved Topper Hero Section */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerHero}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {ui.quizTitle}
            </Text>
          </View>

          {/* Local Quiz Language Selector Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.8}
          >
            <Globe size={13} color="#ffffff" />
            <Text style={styles.langPillTxt}>{quizLanguageOption.nativeName}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Tagline inside Curved Topper Card */}
        <View style={styles.heroSubRow}>
          <Text style={styles.heroSubTxt}>
            {quizLanguage === 'te'
              ? '12 అంశాలు · ప్రతి అంశంలో 30 స్థాయిలు'
              : '12 Faith Categories · 30 Progressive Levels'}
          </Text>
        </View>
      </LinearGradient>

      {/* Categories List (12 Curated Category Cards) */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {QUIZ_CATEGORIES.map((cat) => {
          const localizedName = ui.categories[cat.id] || cat.name;
          const showSecondary = quizLanguage !== 'en' && localizedName !== cat.name;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                isDark && {
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
              onPress={() => handleSelectCategory(cat)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={{ uri: cat.imageUrl }}
                style={styles.cardImageBg}
                imageStyle={styles.cardImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.82)']}
                  locations={[0.25, 0.6, 1]}
                  style={styles.cardOverlay}
                >
                  <View style={styles.cardContentRow}>
                    <Text style={styles.categoryTitle}>
                      {localizedName}
                      {showSecondary ? ` · ${cat.name}` : ''}
                    </Text>
                    <View style={styles.arrowCircle}>
                      <ArrowRight size={18} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Local Quiz Language Selector Modal */}
      <QuizLanguageModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerHero: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 14,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#1a3673',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    zIndex: 10,
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroSubRow: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  heroSubTxt: {
    color: '#cbd5e1',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scrollArea: {
    flex: 1,
  },
  categoryCard: {
    height: 116,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardImage: {
    borderRadius: 18,
  },
  cardOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPill: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 5,
  },
  langPillTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
