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
import { Phone, Mail, MapPin, Save, ChevronLeft, Plus, Trash2, RefreshCw, Edit2, Eye, Link } from 'lucide-react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import { AdminTabContext } from '../../context/AdminTabContext';
import firestoreService from '../../services/FirestoreService';

interface ContactData {
  churchName: string;
  churchSubtitle: string;
  address: string;
  phoneNumbers: string[];
  emails: string[];
  socialLinks: {
    youtube: string;
    instagram: string;
    facebook: string;
    whatsapp?: string;
  };
  updatedAt?: any;
}

const DEFAULT_CONTACT: ContactData = {
  churchName: '',
  churchSubtitle: '',
  address: '',
  phoneNumbers: [''],
  emails: [''],
  socialLinks: {
    youtube: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
  },
};

/* ── Social icon SVGs ── */
const YtIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
    <Path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" />
    <Path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#ef4444" />
  </Svg>
);
const IgIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#fff" />
  </Svg>
);
const FbIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
    <Path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073c0 6.028 4.388 11.023 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.793-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.096 24 18.101 24 12.073z" />
  </Svg>
);
const WaIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
    <Path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.637.834 5.086 2.27 7.086L.517 24l5.05-1.745c1.947 1.282 4.256 2.031 6.464 2.031 6.645 0 12.03-5.386 12.03-12.031S18.675 0 12.031 0zm6.545 17.15c-.279.79-1.516 1.488-2.128 1.547-.565.053-1.272.181-3.64-1.12-2.846-1.564-4.646-4.48-4.783-4.665-.138-.184-1.144-1.523-1.144-2.905 0-1.383.714-2.062.97-2.339.255-.276.554-.345.74-.345.185 0 .37.004.535.011.171.008.401-.064.629.489.234.568.74 1.808.808 1.945.068.138.114.3.023.483-.09.184-.137.3-.275.46-.138.161-.29.345-.411.484-.138.138-.283.29-.12.568.161.276.717 1.18 1.537 1.912 1.058.946 1.936 1.238 2.213 1.376.276.138.437.114.6-.068.161-.184.69-1.28 1.28-1.722.59-.441 1.18-.368 1.436-.276.255.092 1.62.766 1.9.904.279.138.463.207.531.322.069.115.069.667-.21 1.457z" />
  </Svg>
);

export default function AdminContactUsEditor() {
  const { goBack } = useContext(AdminTabContext);

  const [data, setData] = useState<ContactData>(DEFAULT_CONTACT);
  const [draft, setDraft] = useState<ContactData>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const col = await firestoreService.getCollection('settings');
      const doc = await col.doc('contact').get();
      if (doc.exists()) {
        const d = doc.data() as ContactData;
        const fetched: ContactData = {
          churchName: d.churchName || DEFAULT_CONTACT.churchName,
          churchSubtitle: d.churchSubtitle || DEFAULT_CONTACT.churchSubtitle,
          address: d.address || DEFAULT_CONTACT.address,
          phoneNumbers: d.phoneNumbers?.length ? d.phoneNumbers : DEFAULT_CONTACT.phoneNumbers,
          emails: d.emails?.length ? d.emails : DEFAULT_CONTACT.emails,
          socialLinks: {
            youtube: d.socialLinks?.youtube || DEFAULT_CONTACT.socialLinks.youtube,
            instagram: d.socialLinks?.instagram || DEFAULT_CONTACT.socialLinks.instagram,
            facebook: d.socialLinks?.facebook || DEFAULT_CONTACT.socialLinks.facebook,
            whatsapp: d.socialLinks?.whatsapp || DEFAULT_CONTACT.socialLinks.whatsapp,
          },
        };
        setData(fetched);
        setDraft(fetched);
      }
      // If doc doesn't exist, silently use defaults
    } catch (err) {
      // Silently fall back to defaults (document may not exist yet)
      console.warn('ContactUs fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = () => { setDraft({ ...data }); setIsEditing(true); };
  const handleCancel = () => { setDraft({ ...data }); setIsEditing(false); };

  const handleSave = async () => {
    if (!draft.address.trim()) { Alert.alert('Validation', 'Church address cannot be empty.'); return; }
    const cleanedPhones = draft.phoneNumbers.filter((p) => p.trim() !== '');
    const cleanedEmails = draft.emails.filter((e) => e.trim() !== '');
    if (cleanedPhones.length === 0) { Alert.alert('Validation', 'Please add at least one phone number.'); return; }
    setSaving(true);
    try {
      const toSave = { ...draft, phoneNumbers: cleanedPhones, emails: cleanedEmails, updatedAt: firestore.FieldValue.serverTimestamp() };
      const col = await firestoreService.getCollection('settings');
      await col.doc('contact').set(toSave);
      setData({ ...draft, phoneNumbers: cleanedPhones, emails: cleanedEmails });
      setIsEditing(false);
      Alert.alert('✅ Saved', 'Contact Us information updated!');
    } catch (err) {
      Alert.alert('Save Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPhone = () => setDraft((p) => ({ ...p, phoneNumbers: [...p.phoneNumbers, ''] }));
  const updatePhone = (idx: number, val: string) => { const a = [...draft.phoneNumbers]; a[idx] = val; setDraft((p) => ({ ...p, phoneNumbers: a })); };
  const removePhone = (idx: number) => { if (draft.phoneNumbers.length === 1) return; setDraft((p) => ({ ...p, phoneNumbers: p.phoneNumbers.filter((_, i) => i !== idx) })); };
  const addEmail = () => setDraft((p) => ({ ...p, emails: [...p.emails, ''] }));
  const updateEmail = (idx: number, val: string) => { const a = [...draft.emails]; a[idx] = val; setDraft((p) => ({ ...p, emails: a })); };
  const removeEmail = (idx: number) => { if (draft.emails.length === 1) return; setDraft((p) => ({ ...p, emails: p.emails.filter((_, i) => i !== idx) })); };

  if (loading) {
        return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BE9A3A" />
        <Text style={styles.loadingText}>Loading Contact Info…</Text>
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
            <Text style={[styles.headerTitle, { fontSize: 20 }]} numberOfLines={1}>Contact Us</Text>
            <Text style={styles.headerSub}>CHURCH COMPANION</Text>
          </View>

                    {/* Right: Refresh + single Edit/View toggle */}
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

              {/* Address */}
              <View style={styles.viewCard}>
                <View style={styles.viewCardHeader}>
                  <MapPin size={15} color="#1a2d5a" />
                  <Text style={styles.viewCardTitle}>Church Address</Text>
                </View>
                <Text style={styles.viewCardBody}>{data.address}</Text>
              </View>

              {/* Phones */}
              <View style={styles.viewCard}>
                <View style={styles.viewCardHeader}>
                  <Phone size={15} color="#16a34a" />
                  <Text style={styles.viewCardTitle}>Phone Numbers</Text>
                  <View style={styles.countBadge}><Text style={styles.countBadgeTxt}>{data.phoneNumbers.length}</Text></View>
                </View>
                {data.phoneNumbers.map((ph, idx) => (
                  <View key={idx} style={styles.viewRow}>
                    <View style={[styles.viewRowIcon, { backgroundColor: '#dcfce7' }]}>
                      <Phone size={13} color="#16a34a" />
                    </View>
                    <View>
                      <Text style={styles.viewRowLabel}>Call</Text>
                      <Text style={styles.viewRowValue}>{ph}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Emails */}
              <View style={styles.viewCard}>
                <View style={styles.viewCardHeader}>
                  <Mail size={15} color="#d97706" />
                  <Text style={styles.viewCardTitle}>Email Addresses</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.countBadgeTxt, { color: '#d97706' }]}>{data.emails.length}</Text>
                  </View>
                </View>
                {data.emails.map((em, idx) => (
                  <View key={idx} style={styles.viewRow}>
                    <View style={[styles.viewRowIcon, { backgroundColor: '#fef3c7' }]}>
                      <Mail size={13} color="#d97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewRowLabel}>Email</Text>
                      <Text style={styles.viewRowValue} numberOfLines={1}>{em}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Social Links */}
              <View style={styles.viewCard}>
                <View style={styles.viewCardHeader}>
                  <Link size={15} color="#7c3aed" />
                  <Text style={styles.viewCardTitle}>Social Links</Text>
                </View>
                <View style={styles.socialPreviewRow}>
                  <View style={[styles.socialPreviewChip, { backgroundColor: '#ef4444' }]}>
                    <YtIcon /><Text style={styles.socialPreviewLabel}>YouTube</Text>
                  </View>
                  <View style={[styles.socialPreviewChip, { backgroundColor: '#e1306c' }]}>
                    <IgIcon /><Text style={styles.socialPreviewLabel}>Instagram</Text>
                  </View>
                  <View style={[styles.socialPreviewChip, { backgroundColor: '#1877f2' }]}>
                    <FbIcon /><Text style={styles.socialPreviewLabel}>Facebook</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ─── EDIT MODE ─── */
            <>
              <View style={[styles.modeBanner, { backgroundColor: '#fef3c7' }]}>
                <Edit2 size={13} color="#b45309" />
                <Text style={[styles.modeBannerTxt, { color: '#b45309' }]}>Editing — tap Save to update</Text>
              </View>

              {/* Church Name */}
              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><Text style={{fontSize:16}}>⛪</Text><Text style={styles.fieldLabel}>Church Name</Text></View>
                <TextInput style={styles.input} value={draft.churchName} onChangeText={(t) => setDraft((p) => ({ ...p, churchName: t }))} placeholder="E.g. Your Church Name" placeholderTextColor="#94a3b8" />
              </View>

              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><Text style={{fontSize:16}}>🏷️</Text><Text style={styles.fieldLabel}>Church Subtitle</Text></View>
                <TextInput style={styles.input} value={draft.churchSubtitle} onChangeText={(t) => setDraft((p) => ({ ...p, churchSubtitle: t }))} placeholder="E.g. Brothers in Christ Fellowship" placeholderTextColor="#94a3b8" />
              </View>

              {/* Address */}
              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><MapPin size={14} color="#1a2d5a" /><Text style={styles.fieldLabel}>Church Address</Text></View>
                <TextInput style={[styles.input, styles.textArea]} value={draft.address} onChangeText={(t) => setDraft((p) => ({ ...p, address: t }))} placeholder="Enter church address…" placeholderTextColor="#94a3b8" multiline numberOfLines={3} textAlignVertical="top" />
              </View>

              {/* Phone Numbers */}
              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><Phone size={14} color="#16a34a" /><Text style={styles.fieldLabel}>Phone Numbers</Text></View>
                <Text style={styles.fieldHint}>Members tap these to call directly.</Text>
                {draft.phoneNumbers.map((phone, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <TextInput style={[styles.input, styles.listInput]} value={phone} onChangeText={(t) => updatePhone(idx, t)} placeholder="+91 99999 00000" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removePhone(idx)} disabled={draft.phoneNumbers.length === 1}>
                      <Trash2 size={15} color={draft.phoneNumbers.length === 1 ? '#cbd5e1' : '#ef4444'} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addBtn} onPress={addPhone}>
                  <Plus size={14} color="#1a2d5a" /><Text style={styles.addTxt}>Add Phone Number</Text>
                </TouchableOpacity>
              </View>

              {/* Emails */}
              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><Mail size={14} color="#d97706" /><Text style={styles.fieldLabel}>Email Addresses</Text></View>
                <Text style={styles.fieldHint}>Members tap these to compose email.</Text>
                {draft.emails.map((email, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <TextInput style={[styles.input, styles.listInput]} value={email} onChangeText={(t) => updateEmail(idx, t)} placeholder="info@church.org" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeEmail(idx)} disabled={draft.emails.length === 1}>
                      <Trash2 size={15} color={draft.emails.length === 1 ? '#cbd5e1' : '#ef4444'} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addBtn} onPress={addEmail}>
                  <Plus size={14} color="#1a2d5a" /><Text style={styles.addTxt}>Add Email Address</Text>
                </TouchableOpacity>
              </View>

              {/* Social Links */}
              <View style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}><Link size={14} color="#7c3aed" /><Text style={styles.fieldLabel}>Social Media Links</Text></View>
                <View style={styles.socialEditRow}>
                  <View style={[styles.socialIconBadge, { backgroundColor: '#ef4444' }]}><YtIcon /></View>
                  <TextInput style={[styles.input, styles.socialInput]} value={draft.socialLinks.youtube} onChangeText={(t) => setDraft((p) => ({ ...p, socialLinks: { ...p.socialLinks, youtube: t } }))} placeholder="YouTube URL" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="url" />
                </View>
                <View style={styles.socialEditRow}>
                  <View style={[styles.socialIconBadge, { backgroundColor: '#e1306c' }]}><IgIcon /></View>
                  <TextInput style={[styles.input, styles.socialInput]} value={draft.socialLinks.instagram} onChangeText={(t) => setDraft((p) => ({ ...p, socialLinks: { ...p.socialLinks, instagram: t } }))} placeholder="Instagram URL" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="url" />
                </View>
                <View style={styles.socialEditRow}>
                  <View style={[styles.socialIconBadge, { backgroundColor: '#1877f2' }]}><FbIcon /></View>
                  <TextInput style={[styles.input, styles.socialInput]} value={draft.socialLinks.facebook} onChangeText={(t) => setDraft((p) => ({ ...p, socialLinks: { ...p.socialLinks, facebook: t } }))} placeholder="Facebook URL" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="url" />
                </View>
                <View style={styles.socialEditRow}>
                  <View style={[styles.socialIconBadge, { backgroundColor: '#25D366' }]}><WaIcon /></View>
                  <TextInput style={[styles.input, styles.socialInput]} value={draft.socialLinks.whatsapp} onChangeText={(t) => setDraft((p) => ({ ...p, socialLinks: { ...p.socialLinks, whatsapp: t } }))} placeholder="WhatsApp Number (with country code)" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="phone-pad" />
                </View>
              </View>

              {/* Save / Cancel */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                                <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
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

  modeBanner: { backgroundColor: '#E3F2FD', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  modeBannerTxt: { fontSize: 13, fontWeight: '700', color: '#162057' },

  viewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  viewCardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  viewCardTitle: { fontSize: 15, fontWeight: '800', color: '#162057', flex: 1 },
  countBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#16a34a' },
  viewCardBody: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  viewRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  viewRowIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  viewRowLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 1 },
  viewRowValue: { fontSize: 14, color: '#162057', fontWeight: '700' },
  socialPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialPreviewChip: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12 },
  socialPreviewLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },

  fieldCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  fieldLabelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#162057' },
  fieldHint: { fontSize: 11, color: '#64748B', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#162057', backgroundColor: '#F1F5F9' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  listRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  listInput: { flex: 1 },
  removeBtn: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  addBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#E3F2FD', borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd', borderStyle: 'dashed', marginTop: 4 },
  addTxt: { color: '#162057', fontWeight: '700', fontSize: 13 },
  socialEditRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 },
  socialIconBadge: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialInput: { flex: 1 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#E2E8F0', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { color: '#64748B', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, backgroundColor: '#BE9A3A', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#BE9A3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnDisabled: { opacity: 0.6 },
  saveTxt: { color: '#162057', fontWeight: '800', fontSize: 15 },
});
