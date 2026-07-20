import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Gift, Heart, PlusCircle } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import Theme from '../../theme/Theme';
import ChurchService from '../../services/ChurchService';
import AdminWeCelebrationsList from './AdminWeCelebrationsList';
import AdminWeCelebrationsPersonalize from './AdminWeCelebrationsPersonalize';
import AdminWeCelebrationsMemberDetails from './AdminWeCelebrationsMemberDetails';
import AdminWeCelebrationsThemePicker from './AdminWeCelebrationsThemePicker';
import AdminWeCelebrationsCustomTheme from './AdminWeCelebrationsCustomTheme';
import AdminWeCelebrationsVersePicker from './AdminWeCelebrationsVersePicker';
import AdminWeCelebrationsPhotoPicker from './AdminWeCelebrationsPhotoPicker'; // TS refresh
import storage from '@react-native-firebase/storage';
import AdminWeCelebrationsPreview from './AdminWeCelebrationsPreview';
import AdminWeCelebrationsWhatsAppPreview from './AdminWeCelebrationsWhatsAppPreview';
import AdminWeCelebrationsConfirm from './AdminWeCelebrationsConfirm';
import AdminWeCelebrationsAutoTemplate from './AdminWeCelebrationsAutoTemplate'; // TS recompile
import SuccessPopup from '../../components/SuccessPopup';
import { CustomAlert } from '../../components/CustomAlert';

import { useChurch } from '../../context/ChurchContext';
import { functions, firestore } from '../../services/firebaseConfig';

type ViewMode = 'dashboard' | 'list' | 'details' | 'personalize' | 'themePicker' | 'customTheme' | 'versePicker' | 'photoPicker' | 'preview' | 'whatsapp' | 'confirm' | 'autoTemplate';

export default function AdminWeCelebrations({ navigation }: any) {
  const { activeChurch, setActiveChurch } = useChurch();
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
  
  const [toastMsg, setToastMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'info' });

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
      <AdminWeCelebrationsList 
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

    if (!activeChurch?.whatsappIntegrationEnabled) {
      setAlertConfig({
        visible: true,
        title: 'WhatsApp Integration Not Enabled',
        message: 'WhatsApp Integration is not enabled for your church. Please contact the We Christian team to activate this feature. Once enabled, you will be able to use WhatsApp Integration from the We Celebration module and Church Settings.',
        type: 'info'
      });
      return;
    }
    
    setIsSending(true);
    try {
      let uploadedImageUrl: string | undefined = undefined;

      if (localImageUri && activeChurch?.id) {
        // Upload to Firebase Storage
        const ext = localImageUri.substring(localImageUri.lastIndexOf('.') + 1) || 'jpg';
        const storagePath = `churches/${activeChurch.id}/celebrations/${Date.now()}.${ext}`;
        const reference = storage().ref(storagePath);
        
        await reference.putFile(localImageUri);
        uploadedImageUrl = await reference.getDownloadURL();
      }

      if (!activeChurch?.id) {
        throw new Error("Church ID is missing");
      }

      // Fetch Church's BYOC WhatsApp Credentials
      const secrets = await ChurchService.getChurchSecrets(activeChurch.id);
      
      let WA_ACCESS_TOKEN = "";
      let WA_PHONE_NUMBER_ID = "";

      if (secrets?.useWeChristianWhatsApp) {
        WA_ACCESS_TOKEN = "EAAbDAG4HrdcBR7CZCEl8CjzaZAO2kq0pw1H64slZC1n2QyRqHl6FO6x691ILR5jSeMuynh6p1uaashhbyD4UcOIVFbpUafsgab4YVOgAZAvPtwv7NzDa8yECxMg7BxKeBkzXOc3bPFfBaK1pJxyHcXo41ez5Afftlz5qt3PmZAZAgsUNKlvZAXihZAAFEMAsnQzadAZDZD";
        WA_PHONE_NUMBER_ID = "1183530004847802";
      } else {
        if (!secrets || !secrets.whatsappAccessToken || !secrets.whatsappPhoneId) {
          throw new Error('This church has not configured their WhatsApp credentials in Admin Settings.');
        }
        WA_ACCESS_TOKEN = secrets.whatsappAccessToken;
        WA_PHONE_NUMBER_ID = secrets.whatsappPhoneId;
      }

      let formattedPhone = selectedMember.phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`; 
      }

      const url = `https://graph.facebook.com/v17.0/${WA_PHONE_NUMBER_ID}/messages`;
      
      // Extracted from Meta dashboard
      const TEMPLATE_NAME = 'birthday_card';
      const LANGUAGE_CODE = 'en';

      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: {
            code: LANGUAGE_CODE
          },
          components: []
        }
      };

      if (uploadedImageUrl) {
        payload.template.components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: uploadedImageUrl
              }
            }
          ]
        });
      }

      payload.template.components.push({
        type: "body",
        parameters: [
          {
            type: "text",
            text: greetingMessage || " "
          },
          {
            type: "text",
            text: selectedVerse?.text ? `"${selectedVerse.text}" — ${selectedVerse.ref}` : " "
          }
        ]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
         throw new Error(responseData.error?.message || "Failed to send WhatsApp message");
      }

      // Save to chat history so admin can see it in WA Inbox
      if (responseData.messages && responseData.messages.length > 0) {
        const messageId = responseData.messages[0].id;
        const fullText = `[Template Sent] ${greetingMessage || ''} ${selectedVerse?.text ? `"${selectedVerse.text}" — ${selectedVerse.ref}` : ''}`.trim();
        
        await firestore()
          .collection('churches')
          .doc(activeChurch?.id || 'WECHRISTIAN_DEFAULT_CHURCH')
          .collection('whatsappMessages')
          .doc(messageId)
          .set({
            phoneNumberId: WA_PHONE_NUMBER_ID,
            from: formattedPhone,
            text: fullText,
            messageId,
            churchId: activeChurch?.id || 'WECHRISTIAN_DEFAULT_CHURCH',
            direction: 'outbound',
            status: 'sent',
            timestamp: firestore.FieldValue.serverTimestamp(),
            createdAt: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
      }

      setViewMode('confirm');
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      Alert.alert('Failed to Send', error.message || 'An unknown error occurred while sending the message.');
    } finally {
      setIsSending(false);
    }
  };

  switch (viewMode) {
    case 'details':
      return (
        <AdminWeCelebrationsMemberDetails 
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
          <AdminWeCelebrationsPersonalize 
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
          <AdminWeCelebrationsThemePicker
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
          <AdminWeCelebrationsCustomTheme
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
        <AdminWeCelebrationsVersePicker
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
        <AdminWeCelebrationsPhotoPicker
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
        <AdminWeCelebrationsPreview
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
        <View style={{ flex: 1 }}>
          <AdminWeCelebrationsWhatsAppPreview
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
          onSend={handleSendWhatsApp}
          isSending={isSending}
        />
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
      </View>
      );
    }
    case 'confirm':
      return (
        <AdminWeCelebrationsConfirm
          member={selectedMember}
          category={selectedCategory}
          onDone={() => setViewMode('dashboard')}
        />
      );
    case 'autoTemplate':
      return (
        <AdminWeCelebrationsAutoTemplate 
          onBack={() => setViewMode('dashboard')}
        />
      );
  }

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setViewMode('list');
  };

  const toggleAutomation = async () => {
    if (!activeChurch) return;
    try {
      const newValue = !activeChurch.automatedWhatsappWishesEnabled;
      await firestore().collection('churches').doc(activeChurch.id).update({ automatedWhatsappWishesEnabled: newValue });
      setActiveChurch({ ...activeChurch, automatedWhatsappWishesEnabled: newValue });
      setToastMsg(newValue ? 'Automated WhatsApp Wishes Enabled' : 'Automated WhatsApp Wishes Disabled');
    } catch (err) {
      console.error('Failed to toggle automation:', err);
      Alert.alert('Error', 'Failed to update automation settings.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHURCH COMPANION</Text>
        <Text style={styles.title}>WeCelebration</Text>
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

      {/* Automation Settings Card */}
      <View style={styles.automationCard}>
        <View style={styles.automationHeader}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.automationTitle}>Automated WhatsApp Wishes</Text>
            <Text style={styles.automationDesc}>
              Automatically send WhatsApp wishes to members on their special day at 8:00 AM.
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggleTrack, activeChurch?.automatedWhatsappWishesEnabled ? styles.toggleTrackOn : styles.toggleTrackOff]}
            onPress={toggleAutomation}
          >
            <View style={[styles.toggleThumb, activeChurch?.automatedWhatsappWishesEnabled ? styles.toggleThumbOn : styles.toggleThumbOff]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.configBtn} 
          onPress={() => setViewMode('autoTemplate')}
        >
          <Text style={styles.configBtnText}>Configure Template</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#B88A2E', // Gold
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: '#162057', // Deep navy
    fontSize: 24,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#162057', // Deep navy
    borderRadius: 24,
    padding: 24,
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
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: '48%',
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
  },
  automationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  automationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  automationTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  automationDesc: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: '#10B981',
  },
  toggleTrackOff: {
    backgroundColor: '#D1D5DB',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    transform: [{ translateX: 22 }],
  },
  toggleThumbOff: {
    transform: [{ translateX: 0 }],
  },
  configBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  configBtnText: {
    color: '#37469B',
    fontSize: 14,
    fontWeight: '600',
  }
});