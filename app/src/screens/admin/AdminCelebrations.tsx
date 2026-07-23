import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import Share from 'react-native-share';
import { Gift, Heart, PlusCircle, ChevronLeft } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import Theme from '../../theme/Theme';
import ChurchService from '../../services/ChurchService';
import { AdminTabContext } from '../../context/AdminTabContext';
import AdminCelebrationsList from './AdminCelebrationsList';
import AdminCelebrationsPersonalize from './AdminCelebrationsPersonalize';
import AdminCelebrationsMemberDetails from './AdminCelebrationsMemberDetails';
import AdminCelebrationsThemePicker from './AdminCelebrationsThemePicker';
import AdminCelebrationsCustomTheme from './AdminCelebrationsCustomTheme';
import AdminCelebrationsVersePicker from './AdminCelebrationsVersePicker';
import AdminCelebrationsPhotoPicker from './AdminCelebrationsPhotoPicker'; // TS refresh
import storage from '@react-native-firebase/storage';
import AdminCelebrationsPreview from './AdminCelebrationsPreview';
import AdminCelebrationsWhatsAppPreview from './AdminCelebrationsWhatsAppPreview';
import AdminCelebrationsConfirm from './AdminCelebrationsConfirm';
import SuccessPopup from '../../components/SuccessPopup';

import { useChurch } from '../../context/ChurchContext';
import { functions } from '../../services/firebaseConfig';

type ViewMode = 'dashboard' | 'list' | 'details' | 'personalize' | 'themePicker' | 'customTheme' | 'versePicker' | 'photoPicker' | 'preview' | 'whatsapp' | 'confirm';

export default function AdminCelebrations({ navigation }: any) {
  const { activeChurch, setActiveChurch } = useChurch();
  const { setActiveTab } = React.useContext(AdminTabContext);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Hoisted state for personalization flow
  const [layout, setLayout] = useState<'theme' | 'photo'>('theme');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<{ref: string, text: string} | null>(null);
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [titleOverlay, setTitleOverlay] = useState<string>('');
  const [nameOverlay, setNameOverlay] = useState<string>('');
  
  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    birthdays: { total: 0, thisWeek: 0 },
    anniversaries: { total: 0, thisWeek: 0 },
    baptisms: { total: 0, thisWeek: 0 },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await FirestoreService.getAllCelebrations();
        
        let total = 0;
        let today = 0;
        let thisWeek = 0;
        let bTotal = 0, bWeek = 0;
        let aTotal = 0, aWeek = 0;
        let baptTotal = 0, baptWeek = 0;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDate = now.getDate();
        
        // Simple week logic: within next 7 days
        const isThisWeek = (m: number, d: number) => {
          const target = new Date(now.getFullYear(), m - 1, d);
          const diffTime = target.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        };

        const isToday = (m: number, d: number) => {
          return m === currentMonth && d === currentDate;
        };

        data.forEach(rec => {
          if (rec.Birthdate) {
            total++;
            bTotal++;
            const parts = rec.Birthdate.split('-');
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (isToday(m, d)) today++;
            if (isThisWeek(m, d)) {
              thisWeek++;
              bWeek++;
            }
          }
          if (rec.Baptism_Date__c) {
            total++;
            baptTotal++;
            const parts = rec.Baptism_Date__c.split('-');
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (isToday(m, d)) today++;
            if (isThisWeek(m, d)) {
              thisWeek++;
              baptWeek++;
            }
          }
        });

        const accountGroups: { [accountId: string]: any[] } = {};
        data.forEach(rec => {
          if (rec.Anniversary_Date__c) {
            const accId = rec.AccountId || rec.Id;
            if (!accountGroups[accId]) accountGroups[accId] = [];
            accountGroups[accId].push(rec);
          }
        });

        Object.values(accountGroups).forEach(group => {
          if (group.length > 0) {
            const husband = group.find((m: any) => m.Gender__c === 'Male') || group[0];
            total++;
            aTotal++;
            const parts = husband.Anniversary_Date__c.split('-');
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (isToday(m, d)) today++;
            if (isThisWeek(m, d)) {
              thisWeek++;
              aWeek++;
            }
          }
        });

        setStats({
          total,
          today,
          thisWeek,
          birthdays: { total: bTotal, thisWeek: bWeek },
          anniversaries: { total: aTotal, thisWeek: aWeek },
          baptisms: { total: baptTotal, thisWeek: baptWeek },
        });
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BE9A3A" />
      </View>
    );
  }

  if (viewMode === 'list') {
    return (
      <AdminCelebrationsList 
        category={selectedCategory} 
        onBack={() => setViewMode('dashboard')} 
        onSelectMember={(member) => {
          setSelectedMember(member);
          setViewMode('details');
        }}
      />
    );
  }

  const handleSendWhatsApp = async (localImageUri?: string) => {
    if (!selectedMember?.phone) {
      Alert.alert('Error', 'This member does not have a phone number on record.');
      return;
    }
    
    setIsSending(true);
    try {
      let formattedPhone = selectedMember.phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`; 
      }

      let text = `Praise the Lord!\n\n${greetingMessage || ""}`;
      if (selectedVerse?.text) {
         text += `\n\n"${selectedVerse.text}"\n— ${selectedVerse.ref}`;
      }
      
      text += `\n\nWith Love ❤️\n${activeChurch?.name || 'Your Church'}`;
      
      if (localImageUri) {
        try {
          await Share.shareSingle({
            title: 'Share Celebration Card',
            message: text,
            url: localImageUri,
            social: Share.Social.WHATSAPP,
            whatsAppNumber: formattedPhone
          } as any);
          setViewMode('confirm');
        } catch (err: any) {
          console.log('Share error or cancelled:', err);
          // If cancelled, it might throw, just continue
        }
      } else {
        const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
            setViewMode('confirm');
        } else {
            Alert.alert('Error', 'WhatsApp is not installed on your device.');
        }
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      Alert.alert('Failed to Send', error.message || 'An unknown error occurred while sending the message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPush = async (localImageUri?: string) => {
    if (!selectedMember || !activeChurch) return;
    setIsSending(true);
    try {
      let text = `Praise the Lord!\n\n${greetingMessage || ""}`;
      if (selectedVerse?.text) {
         text += `\n\n"${selectedVerse.text}"\n— ${selectedVerse.ref}`;
      }
      text += `\n\nWith Love ❤️\n${activeChurch?.name || 'Your Church'}`;

      let imageUrl = null;
      if (localImageUri) {
         try {
            const storage = require('@react-native-firebase/storage').default;
            const ext = localImageUri.substring(localImageUri.lastIndexOf('.') + 1) || 'jpg';
            const storagePath = `celebrations/image_${Date.now()}.${ext}`;
            const reference = storage().ref(storagePath);
            await reference.putFile(localImageUri);
            imageUrl = await reference.getDownloadURL();
         } catch (e) {
            console.error('Failed to upload celebration image', e);
         }
      }

      await FirestoreService.createNotificationBroadcast({
         title: `${selectedCategory === 'Birthday' ? '🎂 Happy Birthday' : selectedCategory === 'Anniversary' ? '💒 Happy Anniversary' : '🎉 Happy Baptism Anniversary'}, ${selectedMember.name}!`,
         content: text,
         date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
         type: 'celebration',
         targetChurchId: activeChurch.id,
         targetPhone: selectedMember.phone,
         imageUrl,
         silent: false,
      });

      Alert.alert('Push Notification Sent', `A notification was sent directly to ${selectedMember.name}!`);
      setViewMode('confirm');
    } catch (error: any) {
      console.error('Error sending Push:', error);
      Alert.alert('Failed to Send Push', error.message || 'An unknown error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  switch (viewMode) {
    case 'details':
      return (
        <AdminCelebrationsMemberDetails 
          member={selectedMember}
          category={selectedCategory}
          onBack={() => setViewMode('list')}
          onPrepareWish={() => {
            // Reset personalization state when starting a new wish
            setSelectedThemeId(null);
            setSelectedVerse(null);
            setGreetingMessage('');
            setTitleOverlay(selectedCategory);
            setNameOverlay(selectedMember?.name || '');
            setViewMode('personalize');
          }}
        />
      );
    case 'personalize':
      return (
        <View style={{flex: 1}}>
          <AdminCelebrationsPersonalize 
            member={selectedMember}
            category={selectedCategory}
            layout={layout}
            onLayoutChange={setLayout}
            photoUri={photoUri}
            selectedThemeId={selectedThemeId}
            selectedVerse={selectedVerse}
            greetingMessage={greetingMessage}
            onMessageChange={setGreetingMessage}
            titleOverlay={titleOverlay}
            onTitleOverlayChange={setTitleOverlay}
            nameOverlay={nameOverlay}
            onNameOverlayChange={setNameOverlay}
            onBack={() => setViewMode('details')}
            onChooseTheme={() => setViewMode('themePicker')}
            onChoosePhoto={() => setViewMode('photoPicker')}
            onChooseVerse={() => setViewMode('versePicker')}
            onPreview={() => setViewMode('preview')}
          />
          <SuccessPopup visible={!!toastMsg} message={toastMsg} onDismiss={() => setToastMsg('')} />
        </View>
      );
    case 'themePicker':
      return (
        <View style={{flex: 1}}>
          <AdminCelebrationsThemePicker
            onBack={() => setViewMode('personalize')}
            onSelectTheme={(themeId: string) => {
              if (themeId === 'custom') {
                setViewMode('customTheme');
              } else {
                setSelectedThemeId(themeId);
                setViewMode('personalize');
              }
            }}
            onDeleteSuccess={() => setToastMsg('Custom Theme Deleted')}
          />
          <SuccessPopup visible={!!toastMsg} message={toastMsg} onDismiss={() => setToastMsg('')} />
        </View>
      );
    case 'customTheme':
      return (
        <View style={{flex: 1}}>
          <AdminCelebrationsCustomTheme
            onBack={() => setViewMode('themePicker')}
            onSave={(newTheme: any) => {
              if (activeChurch) {
                setActiveChurch({
                  ...activeChurch,
                  customThemes: [...(activeChurch.customThemes || []), newTheme]
                });
              }
              setSelectedThemeId(newTheme.id);
              setToastMsg('Custom Theme Saved Successfully!');
              setViewMode('personalize');
            }}
          />
          <SuccessPopup visible={!!toastMsg} message={toastMsg} onDismiss={() => setToastMsg('')} />
        </View>
      );
    case 'versePicker':
      return (
        <AdminCelebrationsVersePicker
          category={selectedCategory}
          selectedVerseRef={selectedVerse?.ref}
          onBack={() => setViewMode('personalize')}
          onSelectVerse={(verse) => {
            setSelectedVerse(verse);
            setViewMode('personalize');
          }}
        />
      );
    case 'photoPicker':
      return (
        <AdminCelebrationsPhotoPicker
          member={selectedMember}
          onBack={() => setViewMode('personalize')}
          onSelectPhoto={(uri: string) => {
            setPhotoUri(uri);
            setViewMode('personalize');
          }}
        />
      );
    case 'preview': {
      // Find full theme object (default to royal if not found)
      let themeObj = THEMES.find(t => t.id === selectedThemeId);
      if (!themeObj && selectedThemeId?.startsWith('custom_')) {
        themeObj = activeChurch?.customThemes?.find((t: any) => t.id === selectedThemeId);
      }
      if (!themeObj) themeObj = { id: 'royal', title: 'Royal Blue', color: '#1E2A63', c: ['#5A6BC4', '#1E2A63'] } as any;

      if (layout === 'photo' && photoUri) {
        themeObj = { ...themeObj, imageUrl: photoUri } as any;
      }

      return (
        <AdminCelebrationsPreview
          member={selectedMember}
          category={selectedCategory}
          theme={themeObj}
          layout={layout}
          photoUri={photoUri}
          titleOverlay={titleOverlay}
          nameOverlay={nameOverlay}
          message={greetingMessage}
          verse={selectedVerse || {ref: '', text: ''}}
          churchName={activeChurch?.name || ''}
          onBack={() => setViewMode('personalize')}
          onEdit={() => setViewMode('personalize')}
          onContinue={() => setViewMode('whatsapp')}
        />
      );
    }
    case 'whatsapp': {
      let themeObj = THEMES.find(t => t.id === selectedThemeId);
      if (!themeObj && selectedThemeId?.startsWith('custom_')) {
        themeObj = activeChurch?.customThemes?.find((t: any) => t.id === selectedThemeId);
      }
      if (!themeObj) themeObj = { id: 'royal', title: 'Royal Blue', color: '#1E2A63', c: ['#5A6BC4', '#1E2A63'] } as any;
      if (layout === 'photo' && photoUri) {
        themeObj = { ...themeObj, imageUrl: photoUri } as any;
      }

      return (
        <AdminCelebrationsWhatsAppPreview
          member={selectedMember}
          category={selectedCategory}
          theme={themeObj}
          layout={layout}
          photoUri={photoUri}
          titleOverlay={titleOverlay}
          nameOverlay={nameOverlay}
          message={greetingMessage}
          verse={selectedVerse || {ref: '', text: ''}}
          churchName={activeChurch?.name || ''}
          onEdit={() => setViewMode('personalize')}
          onSendWhatsApp={handleSendWhatsApp}
          onSendPush={handleSendPush}
        />
      );
    }
    case 'confirm':
      return (
        <AdminCelebrationsConfirm
          member={selectedMember}
          category={selectedCategory}
          onDone={() => setViewMode('dashboard')}
        />
      );
  }

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setViewMode('list');
  };

  return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab(0)}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>Celebrations</Text>
          <Text style={styles.headerSub}>Manage birthdays & anniversaries</Text>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>THIS SEASON</Text>
        <Text style={styles.heroTitle}>Celebrations{'\n'}worth remembering</Text>
        <Text style={styles.heroDesc}>
          Browse birthdays, anniversaries and baptisms across the parish, and prepare a beautiful wish in moments.
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL RECORDS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>TODAY</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>CELEBRATION CATEGORIES</Text>

      {/* Categories */}
      <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#F3E4B6' }]} onPress={() => handleCategoryPress('Birthday')}>
        <Gift size={24} color="#B88A2E" style={styles.catIcon} />
        <Text style={styles.catTitle}>Birthday</Text>
        <Text style={styles.catDesc}>
          <Text style={{color: '#6B5720', fontWeight: '500'}}>{stats.birthdays.total} members</Text>
          {stats.birthdays.thisWeek > 0 && (
            <Text style={{color: '#B88A2E'}}>{' \u00B7 '}{stats.birthdays.thisWeek} this week</Text>
          )}
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.categoryCard, styles.halfCard, { backgroundColor: '#E2E5F2' }]} onPress={() => handleCategoryPress('Wedding Anniversary')}>
          <Heart size={24} color="#455490" style={styles.catIcon} />
          <Text style={styles.catTitle}>Wedding{'\n'}Anniversary</Text>
          <Text style={styles.catDesc}>
            <Text style={{color: '#525B7E', fontWeight: '500'}}>{stats.anniversaries.total} members</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.categoryCard, styles.halfCard, { backgroundColor: '#DDF1E7' }]} onPress={() => handleCategoryPress('Baptism Anniversary')}>
          <PlusCircle size={24} color="#358B6D" style={styles.catIcon} />
          <Text style={styles.catTitle}>Baptism{'\n'}Anniversary</Text>
          <Text style={styles.catDesc}>
            <Text style={{color: '#4B6B5E', fontWeight: '500'}}>{stats.baptisms.total} members</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        <Text style={{color: '#1D4ED8', fontWeight: 'bold'}}>WeChristian</Text> - {activeChurch?.name?.toUpperCase() || ''}
      </Text>
    </ScrollView>
  );
}

const THEMES = [
  { id: 'floral', title: 'Floral Celebration', c: ['#E7C767', '#BE9A3A'] },
  { id: 'golden', title: 'Golden Blessings', c: ['#F3D98B', '#B4842A'] },
  { id: 'royal', title: 'Royal Blue', c: ['#5A6BC4', '#1E2A63'] },
  { id: 'worship', title: 'Church Worship', c: ['#8A6FBF', '#3D2C6B'] },
  { id: 'white', title: 'Elegant White', c: ['#FDFBF6', '#E4DAC2'] },
  { id: 'balloons', title: 'Balloons', c: ['#F09A9A', '#E7C767'] },
  { id: 'minimal', title: 'Minimal Modern', c: ['#DCD6C8', '#9C9483'] },
  { id: 'cross', title: 'Cross & Bible', c: ['#4FA6A6', '#1E2A63'] },
  { id: 'family', title: 'Family Celebration', c: ['#E39A6B', '#BE9A3A'] },
  { id: 'children', title: "Children's Theme", c: ['#7BC9E0', '#F3D98B'] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0', // Ivory deep
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
    content: {
    padding: 0,
    paddingBottom: 40,
  },
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 10,
    marginBottom: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },
    heroCard: {
    backgroundColor: '#162057', // Deep navy
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  heroEyebrow: {
    color: '#D4AF37', // Gold
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
  },
  heroDesc: {
    color: '#8B96C3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statItem: {
    marginRight: 24,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8B96C3',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
    sectionTitle: {
    color: '#848796',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  halfCard: {
    width: '48%',
    marginHorizontal: 0,
  },
  catIcon: {
    marginBottom: 16,
  },
  catTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  catDesc: {
    fontSize: 13,
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 40,
  }
});
