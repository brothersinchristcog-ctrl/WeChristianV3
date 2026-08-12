import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
// Removed SafeAreaView as padding is handled by the header
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Calendar, Award, CheckCircle, Circle, BookOpen, Clock, Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FirestoreService from '../services/FirestoreService';

const { width } = Dimensions.get('window');

interface PlanDay {
  day: number;
  labelEn: string;
  labelTe: string;
  book: string;
  chapter: number;
}

interface BiblePlan {
  id: string;
  titleEn: string;
  titleTe: string;
  descEn: string;
  descTe: string;
  durationEn: string;
  durationTe: string;
  color: string;
  icon: any;
  days: PlanDay[];
}

const BIBLE_PLANS: BiblePlan[] = [
  {
    id: '30_day',
    titleEn: '30-Day Bible Reading Plan',
    titleTe: '30 రోజుల బైబిల్ పఠన ప్రణాళిక',
    descEn: '30 Days of Wisdom & Gospel highlights. Deepen your faith with daily guidance.',
    descTe: '30 రోజుల జ్ఞానము మరియు సువార్త ముఖ్యాంశాలు. ప్రతిరోజూ దేవుని వాక్య ధ్యానం.',
    durationEn: '30-Day',
    durationTe: '30 రోజులు',
    color: '#1a2d5a',
    icon: Clock,
    days: [
      { day: 1, labelEn: 'Matthew Chapter 1', labelTe: 'మత్తయి 1వ అధ్యాయం', book: 'Matthew', chapter: 1 },
      { day: 2, labelEn: 'Matthew Chapter 2', labelTe: 'మత్తయి 2వ అధ్యాయం', book: 'Matthew', chapter: 2 },
      { day: 3, labelEn: 'Matthew Chapter 5 (Sermon on Mount)', labelTe: 'మత్తయి 5వ అధ్యాయం', book: 'Matthew', chapter: 5 },
      { day: 5, labelEn: 'John Chapter 1 (The Word of Life)', labelTe: 'యోహాను 1వ అధ్యాయం', book: 'John', chapter: 1 },
      { day: 10, labelEn: 'John Chapter 3 (Born Again)', labelTe: 'యోహాను 3వ అధ్యాయం', book: 'John', chapter: 3 },
      { day: 15, labelEn: 'John Chapter 14 (The Way & Truth)', labelTe: 'యోహాను 14వ అధ్యాయం', book: 'John', chapter: 14 },
      { day: 20, labelEn: 'Psalms 23 (The Good Shepherd)', labelTe: 'కీర్తనల గ్రంథము 23వ అధ్యాయం', book: 'Psalms', chapter: 23 },
      { day: 25, labelEn: 'Romans Chapter 12 (Living Sacrifices)', labelTe: 'రోమీయులకు 12వ అధ్యాయం', book: 'Romans', chapter: 12 },
      { day: 30, labelEn: 'Revelation Chapter 22 (River of Life)', labelTe: 'ప్రకటన గ్రంథము 22వ అధ్యాయం', book: 'Revelation', chapter: 22 }
    ]
  },
  {
    id: '90_day',
    titleEn: '90-Day Bible Reading Plan',
    titleTe: '90 రోజుల బైబిల్ పఠన ప్రణాళిక',
    descEn: 'A balanced 90-day reading plan through the entire New Testament and Psalms.',
    descTe: 'క్రొత్త నిబంధన మరియు కీర్తనల గ్రంథం గుండా 90 రోజుల క్రమబద్ధమైన పఠన ప్రణాళిక.',
    durationEn: '90-Day',
    durationTe: '90 రోజులు',
    color: '#D97706',
    icon: Calendar,
    days: [
      { day: 1, labelEn: 'Matthew Chapter 1', labelTe: 'మత్తయి 1వ అధ్యాయం', book: 'Matthew', chapter: 1 },
      { day: 10, labelEn: 'Mark Chapter 1', labelTe: 'మార్కు 1వ అధ్యాయం', book: 'Mark', chapter: 1 },
      { day: 20, labelEn: 'Luke Chapter 1', labelTe: 'లూకా 1వ అధ్యాయం', book: 'Luke', chapter: 1 },
      { day: 30, labelEn: 'John Chapter 1', labelTe: 'యోహాను 1వ అధ్యాయం', book: 'John', chapter: 1 },
      { day: 45, labelEn: 'Acts Chapter 1', labelTe: 'అపొస్తలుల కార్యములు 1వ అధ్యాయం', book: 'Acts', chapter: 1 },
      { day: 60, labelEn: 'Romans Chapter 12', labelTe: 'రోమీయులకు 12వ అధ్యాయం', book: 'Romans', chapter: 12 },
      { day: 75, labelEn: 'Hebrews Chapter 11', labelTe: 'హెబ్రీయులకు 11వ అధ్యాయం', book: 'Hebrews', chapter: 11 },
      { day: 90, labelEn: 'Revelation Chapter 22', labelTe: 'ప్రకటన గ్రంథము 22వ అధ్యాయం', book: 'Revelation', chapter: 22 }
    ]
  },
  {
    id: '6_month',
    titleEn: '6-Month Bible Reading Plan',
    titleTe: '6 నెలల బైబిల్ పఠన ప్రణాళిక',
    descEn: 'A thorough 6-Month journey through the entire New Testament and wisdom essentials.',
    descTe: 'క్రొత్త నిబంధన మరియు జ్ఞాన గ్రంథాల గుండా 180 రోజుల క్రమబద్ధమైన ప్రయాణం.',
    durationEn: '6-Month',
    durationTe: '6 నెలలు',
    color: '#0F766E',
    icon: BookOpen,
    days: [
      { day: 1, labelEn: 'Matthew Chapter 1-2', labelTe: 'మత్తయి 1-2 అధ్యాయాలు', book: 'Matthew', chapter: 1 },
      { day: 15, labelEn: 'Mark Chapter 1', labelTe: 'మార్కు 1వ అధ్యాయం', book: 'Mark', chapter: 1 },
      { day: 30, labelEn: 'Luke Chapter 1', labelTe: 'లూకా 1వ అధ్యాయం', book: 'Luke', chapter: 1 },
      { day: 45, labelEn: 'John Chapter 1', labelTe: 'యోహాను 1వ అధ్యాయం', book: 'John', chapter: 1 },
      { day: 60, labelEn: 'Acts Chapter 1', labelTe: 'అపొస్తలుల కార్యములు 1వ అధ్యాయం', book: 'Acts', chapter: 1 },
      { day: 90, labelEn: 'Romans Chapter 1', labelTe: 'రోమీయులకు 1వ అధ్యాయం', book: 'Romans', chapter: 1 },
      { day: 120, labelEn: 'Ephesians Chapter 1', labelTe: 'ఎఫెసీయులకు 1వ అధ్యాయం', book: 'Ephesians', chapter: 1 },
      { day: 150, labelEn: 'James Chapter 1', labelTe: 'యాకోబు 1వ అధ్యాయం', book: 'James', chapter: 1 },
      { day: 180, labelEn: 'Revelation Chapter 22', labelTe: 'ప్రకటన గ్రంథము 22వ అధ్యాయం', book: 'Revelation', chapter: 22 }
    ]
  },
  {
    id: '1_year',
    titleEn: '1-Year Bible Reading Plan',
    titleTe: '1 సంవత్సర బైబిల్ పఠన ప్రణాళిక',
    descEn: 'The ultimate journey. Read through the canonical scriptures from Genesis to Revelation in 365 Days.',
    descTe: 'ఆదికాండము నుండి ప్రకటన గ్రంథము వరకు సంపూర్ణ బైబిల్ గ్రంథ పఠన ప్రణాళిక.',
    durationEn: '1-Year',
    durationTe: '1 సంవత్సరం',
    color: '#c0392b',
    icon: Award,
    days: [
      { day: 1, labelEn: 'Genesis Chapter 1-3', labelTe: 'ఆదికాండము 1-3 అధ్యాయాలు', book: 'Genesis', chapter: 1 },
      { day: 50, labelEn: 'Exodus Chapter 1', labelTe: 'నిర్గమకాండము 1వ అధ్యాయం', book: 'Exodus', chapter: 1 },
      { day: 100, labelEn: 'Joshua Chapter 1', labelTe: 'యెహోషువ 1వ అధ్యాయం', book: 'Joshua', chapter: 1 },
      { day: 150, labelEn: 'Psalms Chapter 1', labelTe: 'కీర్తనల గ్రంథము 1వ అధ్యాయం', book: 'Psalms', chapter: 1 },
      { day: 200, labelEn: 'Isaiah Chapter 1', labelTe: 'యెషయా 1వ అధ్యాయం', book: 'Isaiah', chapter: 1 },
      { day: 250, labelEn: 'Matthew Chapter 1', labelTe: 'మత్తయి 1వ అధ్యాయం', book: 'Matthew', chapter: 1 },
      { day: 300, labelEn: 'John Chapter 1', labelTe: 'యోహాను 1వ అధ్యాయం', book: 'John', chapter: 1 },
      { day: 365, labelEn: 'Revelation Chapter 22', labelTe: 'ప్రకటన గ్రంథము 22వ అధ్యాయం', book: 'Revelation', chapter: 22 }
    ]
  }
];

export default function BiblePlansScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const { member, setMember } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('30_day');
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [lang, setLang] = useState<'English' | 'Telugu'>('Telugu');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activePlan = BIBLE_PLANS.find(p => p.id === selectedPlanId) || BIBLE_PLANS[0];

  useEffect(() => {
    loadProgress();
  }, [member]);

  const loadProgress = async () => {
    try {
      setLoadingProgress(true);
      
      // 1. Try from Firestore if member is logged in
      if (member && member.id && member.churchId) {
        const cloudProgress = await FirestoreService.getBibleProgress(member.churchId, member.id);
        // Guard against null return (no document yet)
        if (cloudProgress && Object.keys(cloudProgress).length > 0) {
          setProgress(cloudProgress);
          await AsyncStorage.setItem('@BiblePlansProgress', JSON.stringify(cloudProgress));
          setLoadingProgress(false);
          return;
        }
      }

      // 2. Fallback to Local Storage
      const stored = await AsyncStorage.getItem('@BiblePlansProgress');
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    } finally {
      setLoadingProgress(false);
    }
  };

  const toggleDayCompletion = async (dayNumber: number) => {
    try {
      const planProgress = progress[selectedPlanId] || [];
      const dayStr = dayNumber.toString();
      
      let updatedProgressList: string[];
      if (planProgress.includes(dayStr)) {
        updatedProgressList = planProgress.filter(d => d !== dayStr);
      } else {
        updatedProgressList = [...planProgress, dayStr];
      }

      const updatedProgress = {
        ...progress,
        [selectedPlanId]: updatedProgressList
      };

      setProgress(updatedProgress);
      const jsonStr = JSON.stringify(updatedProgress);
      await AsyncStorage.setItem('@BiblePlansProgress', jsonStr);
    } catch (e) {
      console.error('Error saving progress locally:', e);
      Alert.alert('Error', 'Failed to save progress locally.');
    }
  };

  const handleSavePlan = async () => {
    if (!member || !member.id || !member.churchId) {
      Alert.alert('Sign In Required', 'Please sign in to save your progress to the cloud.');
      return;
    }
    setIsSaving(true);
    try {
      await FirestoreService.saveBibleProgress(member.churchId, member.id, progress);
      setShowSuccess(true);
    } catch (e) {
      console.error('Error saving to cloud:', e);
      Alert.alert('Error', 'Failed to save progress to the cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  const activePlanCompletedDays = progress[selectedPlanId] || [];
  const percentComplete = activePlan.days.length > 0 
    ? Math.round((activePlanCompletedDays.length / activePlan.days.length) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Premium Navy Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bible Reading Plans</Text>
          <Text style={styles.headerSub}>బైబిల్ పఠన ప్రణాళికలు</Text>
        </View>
        <TouchableOpacity 
          style={styles.langToggle} 
          onPress={() => setLang(lang === 'English' ? 'Telugu' : 'English')}
        >
          <Text style={styles.langToggleTxt}>{lang === 'English' ? 'తెలుగు' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector Tabs */}
        <View style={styles.tabSelector}>
          {BIBLE_PLANS.map(plan => {
            const isActive = plan.id === selectedPlanId;
            const PlanIcon = plan.icon;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.tabCard, 
                  { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  isActive && { borderColor: plan.color, borderWidth: 2 }
                ]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <View style={[styles.iconCircle, { backgroundColor: plan.color }]}>
                  <PlanIcon size={18} color="#fff" />
                </View>
                <Text style={[
                  styles.tabLabel, 
                  { color: isDark ? '#fff' : '#1e293b' },
                  isActive && { fontWeight: '800' }
                ]}>
                  {lang === 'English' ? plan.durationEn : plan.durationTe}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Plan Detail Card */}
        <View style={[styles.detailsCard, { backgroundColor: activePlan.color }]}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIconCircle}>
              <BookOpen size={24} color={activePlan.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailsTitle}>
                {lang === 'English' ? activePlan.titleEn : activePlan.titleTe}
              </Text>
              <Text style={styles.detailsDuration}>
                {lang === 'English' ? activePlan.durationEn : activePlan.durationTe} · {activePlan.days.length} milestones
              </Text>
            </View>
          </View>
          <Text style={styles.detailsDesc}>
            {lang === 'English' ? activePlan.descEn : activePlan.descTe}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {lang === 'English' ? 'Overall Progress' : 'మొత్తం ప్రగతి'}
              </Text>
              <Text style={styles.progressPercent}>{percentComplete}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentComplete}%`, backgroundColor: '#FCD34D' }]} />
            </View>
            <Text style={styles.progressStats}>
              {activePlanCompletedDays.length} of {activePlan.days.length} completed
            </Text>
          </View>
        </View>

        {/* Milestones / Days List */}
        <Text style={[styles.sectionHeading, { color: isDark ? '#fff' : '#1a2d5a' }]}>
          {lang === 'English' ? 'Reading Checkpoints' : 'పఠన మైలురాళ్ళు'}
        </Text>

        <View style={styles.daysList}>
          {activePlan.days.map((item) => {
            const isCompleted = activePlanCompletedDays.includes(item.day.toString());
            return (
              <View 
                key={item.day} 
                style={[
                  styles.dayCard, 
                  { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  isCompleted && { opacity: 0.85 }
                ]}
              >
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={() => toggleDayCompletion(item.day)}
                >
                  {isCompleted ? (
                    <CheckCircle size={24} color={activePlan.color} fill={`${activePlan.color}22`} />
                  ) : (
                    <Circle size={24} color="#94a3b8" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dayInfo}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('BibleReader', {
                      bookName: item.book,
                      chapter: item.chapter,
                      lang: lang === 'English' ? 'English' : 'Telugu'
                    });
                  }}
                >
                  <View style={styles.dayHeaderRow}>
                    <Text style={[styles.dayLabel, { color: activePlan.color }]}>
                      {lang === 'English' ? `DAY ${item.day}` : `రోజు ${item.day}`}
                    </Text>
                    <Text style={styles.readPrompt}>
                      {lang === 'English' ? 'TAP TO READ' : 'చదవడానికి నొక్కండి'} →
                    </Text>
                  </View>
                  <Text style={[
                    styles.dayScripture, 
                    { color: isDark ? '#fff' : '#1e293b' },
                    isCompleted && styles.completedText
                  ]}>
                    {lang === 'English' ? item.labelEn : item.labelTe}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSavePlan}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#1a2d5a" />
          ) : (
            <Text style={styles.saveBtnTxt}>
              {lang === 'English' ? 'Save Progress' : 'ప్రగతిని సేవ్ చేయండి'}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="slide">
        <View style={styles.modalOverlayCen}>
          <View style={[styles.successModal, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.successCircleBg}>
               <View style={styles.successIconBox}>
                 <CheckCircle size={46} color="#fff" />
               </View>
            </View>
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>
              {lang === 'English' ? 'Hallelujah!' : 'హల్లెలూయ!'}
            </Text>
            <Text style={styles.successSub}>
              {lang === 'English' 
                ? 'Your Bible reading progress has been successfully saved.' 
                : 'మీ బైబిల్ పఠన ప్రగతి విజయవంతంగా సేవ్ చేయబడింది.'}
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowSuccess(false)}>
              <Text style={styles.doneBtnTxt}>
                {lang === 'English' ? 'Amen' : 'ఆమేన్'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 2 },
  
  langToggle: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  langToggleTxt: { color: '#fff', fontSize: 16 },

  scroll: { flex: 1, padding: 15 },

  tabSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8
  },
  tabCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  tabLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  detailsCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  detailsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  detailsDuration: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 1 },
  detailsDesc: { color: '#fff', fontSize: 12, lineHeight: 18, opacity: 0.9, marginBottom: 20 },

  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },
  progressPercent: { color: '#FCD34D', fontSize: 14, fontWeight: '900' },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  progressStats: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },

  sectionHeading: { fontSize: 15, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5 },

  daysList: { gap: 12 },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  checkbox: { marginRight: 15 },
  dayInfo: { flex: 1 },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  dayLabel: { fontSize: 11, fontWeight: '900' },
  readPrompt: { fontSize: 9, color: '#94a3b8', fontWeight: '800' },
  dayScripture: { fontSize: 14, fontWeight: '700' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  
  saveBtn: {
    backgroundColor: '#FCD34D',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  saveBtnTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800' },

  modalOverlayCen: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: { 
    backgroundColor: '#fff', 
    borderRadius: 32, 
    padding: 30, 
    width: '85%', 
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  successCircleBg: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  successIconBox: { 
    width: 76, height: 76, borderRadius: 38, 
    backgroundColor: '#10b981', 
    justifyContent: 'center', alignItems: 'center',
    elevation: 5,
    shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
  },
  successTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  doneBtn: { 
    backgroundColor: '#1a2d5a', 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    borderRadius: 100, 
    width: '100%', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  doneBtnTxt: { color: '#FCD34D', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});
