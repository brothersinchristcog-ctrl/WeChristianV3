import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Info, Save, ChevronLeft, RefreshCw, Edit2, Eye, Target } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { AdminTabContext } from '../../context/AdminTabContext';
import firestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';

interface AboutUsData {
  churchName: string;
  churchSubtitle: string;
  description: string;
  mission: string;
  vision: string;
  updatedAt?: any;
}

const DEFAULT_ABOUT: AboutUsData = {
  churchName: '',
  churchSubtitle: '',
  description: '',
  mission: '',
  vision: '',
};

export default function AdminAboutUsEditor() {
  const { goBack } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  const [data, setData] = useState<AboutUsData>(DEFAULT_ABOUT);
  const [draft, setDraft] = useState<AboutUsData>(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const col = await firestoreService.getCollection('settings');
      const doc = await col.doc('about').get();
      if (doc.exists()) {
        const d = doc.data() as AboutUsData;
        const fetched: AboutUsData = {
          churchName: d.churchName || activeChurch?.name || '',
          churchSubtitle: d.churchSubtitle || '',
          description: d.description || activeChurch?.aboutUs || '',
          mission: d.mission || '',
          vision: d.vision || '',
        };
        setData(fetched);
        setDraft(fetched);
      } else {
        const fallback: AboutUsData = {
          churchName: activeChurch?.name || '',
          churchSubtitle: '',
          description: activeChurch?.aboutUs || '',
          mission: '',
          vision: '',
        };
        setData(fallback);
        setDraft(fallback);
        setIsEditing(true); // Automatically open in edit mode if empty
      }
      // If doc doesn't exist yet, silently use defaults
    } catch (err) {
      // Silently fall back to defaults (document may not exist yet)
      console.warn('AboutUs fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = () => { setDraft({ ...data }); setIsEditing(true); };
  const handleCancel = () => { setDraft({ ...data }); setIsEditing(false); };

  const handleSave = async () => {
    if (!draft.churchName.trim()) { Alert.alert('Validation', 'Church name cannot be empty.'); return; }
    if (!draft.description.trim()) { Alert.alert('Validation', 'Description cannot be empty.'); return; }
    setSaving(true);
    try {
      const col = await firestoreService.getCollection('settings');
      await col.doc('about').set({
        ...draft,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setData({ ...draft });
      setIsEditing(false);
      Alert.alert('✅ Saved', 'About Us content updated successfully!');
    } catch (err) {
      Alert.alert('Save Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
        return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BE9A3A" />
        <Text style={styles.loadingText}>Loading About Us…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

                {/* ── Fixed Header ── */}
                <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <ChevronLeft size={22} color="#fff" />
            <Text style={styles.backBtnTxt}>Back</Text>
          </TouchableOpacity>
          <View style={[styles.heroTitles, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 }]}>
            <Text style={[styles.headerTitle, { fontSize: 20 }]} numberOfLines={1}>About Us</Text>
            <Text style={styles.headerSub}>CHURCH COMPANION</Text>
          </View>

          {/* Right actions: Refresh + single Edit/View toggle */}
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={fetchData} style={styles.iconBtn}>
              <RefreshCw size={16} color="#F3EAD9" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={isEditing ? handleCancel : handleEdit}
            >
              {isEditing
                ? <><Eye size={14} color="#F3EAD9" /><Text style={[styles.editToggleTxt, { color: '#F3EAD9' }]}>View</Text></>
                : <><Edit2 size={14} color="#BE9A3A" /><Text style={styles.editToggleTxt}>Edit</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── VIEW MODE ─── */}
          {!isEditing ? (
            <>
              <View style={styles.modeBanner}>
                <Eye size={13} color="#1a2d5a" />
                <Text style={styles.modeBannerTxt}>Preview — tap Edit to make changes</Text>
              </View>

              <View style={styles.viewCard}>
                <View style={styles.viewCardHeader}>
                  <Info size={15} color="#1a2d5a" />
                  <Text style={styles.viewCardTitle}>Church Description</Text>
                </View>
                <Text style={styles.viewCardBody}>{data.description}</Text>
              </View>

              <View style={styles.viewCard}>
                <View style={[styles.viewCardBand, { backgroundColor: '#fef3c7' }]}>
                  <Target size={15} color="#b45309" />
                  <Text style={[styles.viewCardTitle, { color: '#b45309' }]}>Our Mission</Text>
                </View>
                <Text style={[styles.viewCardBody, { paddingTop: 12 }]}>{data.mission}</Text>
              </View>

              <View style={styles.viewCard}>
                <View style={[styles.viewCardBand, { backgroundColor: '#ede9fe' }]}>
                  <Eye size={15} color="#7c3aed" />
                  <Text style={[styles.viewCardTitle, { color: '#7c3aed' }]}>Our Vision</Text>
                </View>
                <Text style={[styles.viewCardBody, { paddingTop: 12 }]}>{data.vision}</Text>
              </View>
            </>
          ) : (
            /* ─── EDIT MODE ─── */
            <>
              <View style={[styles.modeBanner, { backgroundColor: '#fef3c7' }]}>
                <Edit2 size={13} color="#b45309" />
                <Text style={[styles.modeBannerTxt, { color: '#b45309' }]}>Editing — tap Save to update</Text>
              </View>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>⛪ Church Name</Text>
                <Text style={styles.fieldHint}>Main name displayed at the top of About Us.</Text>
                <TextInput
                  style={styles.input}
                  value={draft.churchName}
                  onChangeText={(t) => setDraft((p) => ({ ...p, churchName: t }))}
                  placeholder="E.g. Church of GOD"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>🏷️ Church Subtitle</Text>
                <Text style={styles.fieldHint}>Sub-name or congregation name shown below the main name.</Text>
                <TextInput
                  style={styles.input}
                  value={draft.churchSubtitle}
                  onChangeText={(t) => setDraft((p) => ({ ...p, churchSubtitle: t }))}
                  placeholder="E.g. Brothers in Christ Fellowship"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>📖 Church Description</Text>
                <Text style={styles.fieldHint}>Main introduction shown to members.</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={draft.description}
                  onChangeText={(t) => setDraft((p) => ({ ...p, description: t }))}
                  placeholder="Enter church description…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>🎯 Our Mission</Text>
                <Text style={styles.fieldHint}>Displayed in a highlighted mission card.</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={draft.mission}
                  onChangeText={(t) => setDraft((p) => ({ ...p, mission: t }))}
                  placeholder="Enter mission statement…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>🔭 Our Vision</Text>
                <Text style={styles.fieldHint}>Displayed in a highlighted vision card.</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={draft.vision}
                  onChangeText={(t) => setDraft((p) => ({ ...p, vision: t }))}
                  placeholder="Enter vision statement…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#162057" size="small" />
                    : <><Save size={16} color="#162057" /><Text style={styles.saveTxt}>Save Changes</Text></>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F0' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF8F0', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },

  /* Header */
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 10,
  },
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2, letterSpacing: 1.5, fontWeight: '800' },
  headerRight: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  editToggleBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  editToggleTxt: { color: '#BE9A3A', fontSize: 13, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  /* Mode banner */
  modeBanner: { backgroundColor: '#E3F2FD', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  modeBannerTxt: { fontSize: 13, fontWeight: '700', color: '#162057' },

  /* View cards */
  viewCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
  viewCardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 20, paddingBottom: 6 },
  viewCardBand: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  viewCardTitle: { fontSize: 15, fontWeight: '800', color: '#162057' },
  viewCardBody: { fontSize: 14, color: '#64748B', lineHeight: 22, paddingHorizontal: 20, paddingBottom: 20 },

  /* Edit fields */
  fieldCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#162057', marginBottom: 4 },
  fieldHint: { fontSize: 11, color: '#64748B', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#162057', backgroundColor: '#F1F5F9' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  /* Action buttons */
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#E2E8F0', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { color: '#64748B', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, backgroundColor: '#BE9A3A', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#BE9A3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnDisabled: { opacity: 0.6 },
  saveTxt: { color: '#162057', fontWeight: '800', fontSize: 15 },
});
