import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { ArrowLeft, Save, ChevronLeft } from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import { firestore } from '../../services/firebaseConfig';
import SuccessPopup from '../../components/SuccessPopup';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const THEMES = [
  { id: 'floral', title: 'Floral Celebration', color: '#EAC259' },
  { id: 'golden', title: 'Golden Blessings', color: '#F3E4B6' },
  { id: 'royalblue', title: 'Royal Blue', color: '#8A9ED1' },
  { id: 'worship', title: 'Church Worship', color: '#9A71CA' },
  { id: 'white', title: 'Elegant White', color: '#F8F9FA' },
  { id: 'balloons', title: 'Balloons', color: '#F58A8A' },
  { id: 'minimal', title: 'Minimal Modern', color: '#DAD4CA' },
  { id: 'cross', title: 'Cross & Bible', color: '#14A39A' },
  { id: 'family', title: 'Family Celebration', color: '#F3A67D' },
  { id: 'children', title: "Children's Theme", color: '#68CAE8' },
];

export default function AdminWeCelebrationsAutoTemplate({ onBack }: { onBack: () => void }) {
  const { activeChurch, setActiveChurch } = useChurch();
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [monthlyTemplates, setMonthlyTemplates] = useState<Record<string, any>>({});
  
  // State for the editor
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<string>('royalblue');
  const [themeColor, setThemeColor] = useState<string>('#8A9ED1');
  const [message, setMessage] = useState('Wishing you a joy-filled day surrounded by God\'s love and grace. May this new year of life be your best yet!');
  const [verseRef, setVerseRef] = useState('Numbers 6:24-26');
  const [verseText, setVerseText] = useState('The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.');

  useEffect(() => {
    if (activeChurch?.monthlyCelebrationTemplates) {
      setMonthlyTemplates(activeChurch.monthlyCelebrationTemplates);
    } else if (activeChurch?.automatedWeCelebrationTemplate) {
      // Fallback: populate all months with the old single template
      const fallback = activeChurch.automatedWeCelebrationTemplate;
      const initial: Record<string, any> = {};
      MONTHS.forEach(m => {
        initial[m] = fallback;
      });
      setMonthlyTemplates(initial);
    }
  }, [activeChurch]);

  const handleEditMonth = (month: string) => {
    const tpl = monthlyTemplates[month] || {};
    setThemeId(tpl.themeId || 'royalblue');
    setThemeColor(tpl.themeColor || '#8A9ED1');
    setMessage(tpl.message || 'Wishing you a joy-filled day surrounded by God\'s love and grace.');
    setVerseRef(tpl.verseRef || 'Numbers 6:24-26');
    setVerseText(tpl.verseText || 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.');
    setSelectedMonth(month);
  };

  const handleSaveMonth = async () => {
    if (!activeChurch || !selectedMonth) return;
    setLoading(true);
    try {
      const template = {
        themeId,
        themeColor,
        message,
        verseRef,
        verseText
      };

      const updatedMonthly = {
        ...monthlyTemplates,
        [selectedMonth]: template
      };

      await firestore().collection('churches').doc(activeChurch.id).update({
        monthlyCelebrationTemplates: updatedMonthly
      });

      setActiveChurch({
        ...activeChurch,
        monthlyCelebrationTemplates: updatedMonthly
      });

      setMonthlyTemplates(updatedMonthly);
      setToastMsg(`${selectedMonth} Template Saved!`);
      setTimeout(() => {
        setToastMsg('');
        setSelectedMonth(null);
      }, 1500);

    } catch (err: any) {
      console.error('Failed to save auto template:', err);
      Alert.alert('Error', err.message || 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  const renderMonthGrid = () => (
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.desc}>
        Configure unique templates for each month of the year! Automated wishes will dynamically use the design configured for the current month.
      </Text>

      <View style={styles.grid}>
        {MONTHS.map(month => {
          const tpl = monthlyTemplates[month];
          const color = tpl?.themeColor || '#E2E8F0';
          const themeName = THEMES.find(t => t.id === tpl?.themeId)?.title || 'Unconfigured';
          
          return (
            <TouchableOpacity 
              key={month} 
              style={styles.card}
              onPress={() => handleEditMonth(month)}
            >
              <View style={[styles.cardTop, { backgroundColor: color }]} />
              <View style={styles.cardBottom}>
                <Text style={styles.cardTitle}>{month}</Text>
                <Text style={styles.cardSubtitle}>{themeName}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderEditor = () => (
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.desc}>
        Configuring template for {selectedMonth}. This design will be sent to all birthdays and anniversaries in {selectedMonth}.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Theme Design</Text>
        <Text style={styles.sectionDesc}>Select a beautiful theme color.</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
          {THEMES.map(theme => (
            <TouchableOpacity 
              key={theme.id} 
              style={[styles.themeCard, themeId === theme.id && styles.themeCardSelected]}
              onPress={() => {
                setThemeId(theme.id);
                setThemeColor(theme.color);
              }}
            >
              <View style={[styles.themeColorBox, { backgroundColor: theme.color }]} />
              <Text style={styles.themeTitle} numberOfLines={1}>{theme.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Greeting Message</Text>
        <Text style={styles.sectionDesc}>The member's name will automatically be added at the beginning (e.g., "Dear John,").</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          placeholder="Wishing you a joy-filled day..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Bible Verse</Text>
        <Text style={styles.sectionDesc}>This verse will appear at the bottom of the message.</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Verse Reference</Text>
          <TextInput
            style={styles.input}
            value={verseRef}
            onChangeText={setVerseRef}
            placeholder="e.g., Numbers 6:24"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Verse Text</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={verseText}
            onChangeText={setVerseText}
            placeholder="The Lord bless you and keep you..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveBtn} 
        onPress={handleSaveMonth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Save size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnTxt}>Save {selectedMonth} Template</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => selectedMonth ? setSelectedMonth(null) : onBack()}>
          {selectedMonth ? (
            <ChevronLeft stroke="#1E2A63" width={24} height={24} />
          ) : (
            <ArrowLeft stroke="#1E2A63" width={20} height={20} />
          )}
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>PREPARE WISH</Text>
          <Text style={styles.title}>{selectedMonth ? `Edit ${selectedMonth}` : '12-Month Automated'}</Text>
        </View>
      </View>

      {selectedMonth ? renderEditor() : renderMonthGrid()}

      <SuccessPopup visible={!!toastMsg} message={toastMsg} onDismiss={() => setToastMsg('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE9A3A',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#162057',
  },
  content: {
    flex: 1,
  },
  desc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardTop: {
    height: 100,
    width: '100%',
  },
  cardBottom: {
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#162057',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2A63',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  themeScroll: {
    flexDirection: 'row',
  },
  themeCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#1E2A63',
    backgroundColor: '#F1F5F9',
  },
  themeColorBox: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeTitle: {
    fontSize: 12,
    color: '#1E2A63',
    textAlign: 'center',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#BE9A3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: '#BE9A3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  saveBtnTxt: {
    fontWeight: '700',
    fontSize: 15,
    color: '#FFFFFF',
  }
});
