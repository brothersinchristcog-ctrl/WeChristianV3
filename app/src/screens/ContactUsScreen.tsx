import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail } from 'lucide-react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import firestoreService from '../services/FirestoreService';

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
}

const DEFAULT: ContactData = {
  churchName: '',
  churchSubtitle: '',
  address: '',
  phoneNumbers: [],
  emails: [],
  socialLinks: {
    youtube: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
  },
};

/* ── Inline Social SVGs ── */
const YoutubeIcon = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
    <Path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" />
    <Path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#ef4444" />
  </Svg>
);

const InstagramIcon = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#fff" />
  </Svg>
);

const FacebookIcon = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
    <Path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073c0 6.028 4.388 11.023 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.793-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.096 24 18.101 24 12.073z" />
  </Svg>
);

const WhatsappIcon = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
    <Path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.637.834 5.086 2.27 7.086L.517 24l5.05-1.745c1.947 1.282 4.256 2.031 6.464 2.031 6.645 0 12.03-5.386 12.03-12.031S18.675 0 12.031 0zm6.545 17.15c-.279.79-1.516 1.488-2.128 1.547-.565.053-1.272.181-3.64-1.12-2.846-1.564-4.646-4.48-4.783-4.665-.138-.184-1.144-1.523-1.144-2.905 0-1.383.714-2.062.97-2.339.255-.276.554-.345.74-.345.185 0 .37.004.535.011.171.008.401-.064.629.489.234.568.74 1.808.808 1.945.068.138.114.3.023.483-.09.184-.137.3-.275.46-.138.161-.29.345-.411.484-.138.138-.283.29-.12.568.161.276.717 1.18 1.537 1.912 1.058.946 1.936 1.238 2.213 1.376.276.138.437.114.6-.068.161-.184.69-1.28 1.28-1.722.59-.441 1.18-.368 1.436-.276.255.092 1.62.766 1.9.904.279.138.463.207.531.322.069.115.069.667-.21 1.457z" />
  </Svg>
);

export default function ContactUsScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState<ContactData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: () => void = () => {};

    const setupListener = async () => {
      try {
        const col = await firestoreService.getCollection('settings');
        unsub = col.doc('contact').onSnapshot(
          (doc) => {
            if (doc.exists()) {
              const d = doc.data() as ContactData;
              setData({
                churchName: d.churchName || DEFAULT.churchName,
                churchSubtitle: d.churchSubtitle || DEFAULT.churchSubtitle,
                address: d.address || DEFAULT.address,
                phoneNumbers: d.phoneNumbers?.length ? d.phoneNumbers : DEFAULT.phoneNumbers,
                emails: d.emails?.length ? d.emails : DEFAULT.emails,
                socialLinks: {
                  youtube: d.socialLinks?.youtube || DEFAULT.socialLinks.youtube,
                  instagram: d.socialLinks?.instagram || DEFAULT.socialLinks.instagram,
                  facebook: d.socialLinks?.facebook || DEFAULT.socialLinks.facebook,
                  whatsapp: d.socialLinks?.whatsapp || DEFAULT.socialLinks.whatsapp,
                },
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn('ContactUs listener error:', err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.warn('Error setting up ContactUs listener:', err);
        setLoading(false);
      }
    };

    setupListener();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const openPhone = (number: string) =>
    Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Unable to open the phone dialer.'));

  const openEmail = (email: string) =>
    Linking.openURL(`mailto:${email}`).catch(() => Alert.alert('Error', 'Unable to open the email app.'));

  const openUrl = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the link.'));
  };

  const openWhatsapp = (phone?: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleaned}`).catch(() => Alert.alert('Error', 'Could not open WhatsApp.'));
    });
  };

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
          <Text style={styles.headerTitle}>Contact Us</Text>
          <Text style={styles.headerSub}>Reach out, we'd love to hear from you</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c0c14" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Our Details Card ── */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsCardHeader}>
              <View style={styles.churchIconBg}>
                <Text style={{ fontSize: 18 }}>⛪</Text>
              </View>
              <Text style={styles.detailsCardTitle}>Our Details</Text>
            </View>
            <View style={styles.detailsDivider} />
            <Text style={styles.churchName}>{data.churchName}</Text>
            <Text style={styles.churchSubtitle}>{data.churchSubtitle}</Text>
            <View style={styles.addressRow}>
              <MapPin size={14} color="#94a3b8" style={{ marginTop: 1 }} />
              <Text style={styles.addressText}>{data.address}</Text>
            </View>
          </View>

          {/* ── Phone Numbers (individual rows) ── */}
          {data.phoneNumbers.map((phone, idx) => (
            <TouchableOpacity
              key={`phone-${idx}`}
              style={styles.contactRow}
              onPress={() => openPhone(phone)}
              activeOpacity={0.7}
            >
              <View style={styles.contactRowLeft}>
                <View style={styles.iconCircle}>
                  <Phone size={18} color="#7c0c14" />
                </View>
                <View>
                  <Text style={styles.contactRowLabel}>Call</Text>
                  <Text style={styles.contactRowValue}>{phone}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}

          {/* ── Email Addresses (individual rows) ── */}
          {data.emails.map((email, idx) => (
            <TouchableOpacity
              key={`email-${idx}`}
              style={styles.contactRow}
              onPress={() => openEmail(email)}
              activeOpacity={0.7}
            >
              <View style={styles.contactRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#fff0f0' }]}>
                  <Mail size={18} color="#7c0c14" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactRowLabel}>Email</Text>
                  <Text style={styles.contactRowValue} numberOfLines={1}>{email}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}

          {/* ── Follow Us ── */}
          <View style={styles.followUsSection}>
            <Text style={styles.followUsTitle}>Follow us</Text>
            <View style={styles.socialRow}>
              {/* YouTube */}
              {!!data.socialLinks.youtube && (
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: '#ef4444' }]}
                  onPress={() => openUrl(data.socialLinks.youtube)}
                  activeOpacity={0.85}
                >
                  <YoutubeIcon size={26} />
                </TouchableOpacity>
              )}

              {/* Facebook */}
              {!!data.socialLinks.facebook && (
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: '#1877f2' }]}
                  onPress={() => openUrl(data.socialLinks.facebook)}
                  activeOpacity={0.85}
                >
                  <FacebookIcon size={26} />
                </TouchableOpacity>
              )}

              {/* Instagram */}
              {!!data.socialLinks.instagram && (
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: '#e1306c' }]}
                  onPress={() => openUrl(data.socialLinks.instagram)}
                  activeOpacity={0.85}
                >
                  <InstagramIcon size={26} />
                </TouchableOpacity>
              )}

              {/* WhatsApp */}
              {!!data.socialLinks.whatsapp && (
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: '#25D366' }]}
                  onPress={() => openWhatsapp(data.socialLinks.whatsapp)}
                  activeOpacity={0.85}
                >
                  <WhatsappIcon size={26} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: 80 }} />
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

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f0f0' },

  scroll: { flex: 1, backgroundColor: '#f5f0f0' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  /* Details Card */
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#7c0c14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  churchIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fdf2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0a0b',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#f0e8e8',
    marginBottom: 14,
  },
  churchName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c0c14',
    marginBottom: 2,
  },
  churchSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    flex: 1,
  },

  /* Contact Rows (phone / email) */
  contactRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#7c0c14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fdf2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRowLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRowValue: {
    fontSize: 15,
    color: '#1a0a0b',
    fontWeight: '700',
  },

  /* Follow Us */
  followUsSection: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 20,
  },
  followUsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0a0b',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});
