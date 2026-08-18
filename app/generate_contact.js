const fs = require('fs');
const file = 'src/screens/ContactUsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const newImports = `import React, { useState, useEffect } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, Clock, Calendar, Hand, Info, FileText } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import firestoreService from '../services/FirestoreService';
import { useChurch } from '../context/ChurchContext';`;

content = content.replace(/import React, \{ useState, useEffect \} from 'react';[\s\S]*?import firestoreService from '\.\.\/services\/FirestoreService';/, newImports);

const newScrollView = `<ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Intro */}
          <View style={styles.introSection}>
            {!!activeChurch?.theme?.logoUrl ? (
              <View style={styles.logoCircle}>
                <Image
                  source={{ uri: activeChurch.theme.logoUrl }}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.logoCircle, { backgroundColor: '#f0f2f7' }]} />
            )}
            <Text style={styles.introTitle}>Get in Touch</Text>
            <Text style={styles.introDesc}>
              We are here to support you on your spiritual journey. Reach out with questions, prayer requests, or just to say hello.
            </Text>
          </View>

          {/* Visit Us Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={22} color="#854d0e" />
              <Text style={styles.cardTitle}>Visit Us</Text>
            </View>
            <Text style={styles.cardBody}>{data.address}</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => openUrl('https://maps.google.com/?q=' + encodeURIComponent(data.address))}
              style={styles.mapContainer}
            >
              <Image 
                source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=15.228,78.106&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C15.228,78.106&key=YOUR_API_KEY_HERE' }} 
                style={styles.mapImg}
                defaultSource={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop' }}
              />
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>Maps</Text>
                <MapPin size={12} color="#1877f2" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Service Times Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={22} color="#854d0e" />
              <Text style={styles.cardTitle}>Service Times</Text>
            </View>
            
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <Text style={{ fontSize: 16 }}>⛪</Text>
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName}>Sunday Worship</Text>
                <Text style={styles.serviceTime}>10:30 AM — 1:30 PM</Text>
              </View>
            </View>
            
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <FileText size={18} color="#1a2d5a" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName}>Wednesday Bible Study</Text>
                <Text style={styles.serviceTime}>6:00 PM — 8:00 PM</Text>
              </View>
            </View>
            
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <Clock size={18} color="#1a2d5a" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName}>Women's Fasting Prayer</Text>
                <Text style={styles.serviceTime}>Friday: 11:00 AM — 3:00 PM</Text>
              </View>
            </View>

            <View style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <Text style={{ fontSize: 16 }}>⛪</Text>
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName}>Special Meeting</Text>
                <Text style={styles.serviceTime}>Every Month 2nd Saturday: 10:00 AM — 4:00 PM</Text>
              </View>
            </View>
          </View>

          {/* Connect With Us Network Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 20 }}>🤝</Text>
              <Text style={styles.cardTitle}>Connect With Us</Text>
            </View>
            
            <View style={styles.networkContainer}>
              <Svg height="160" width="100%" style={{ position: 'absolute' }}>
                <Line x1="16%" y1="40" x2="33%" y2="100" stroke="#1877f2" strokeWidth="3" />
                <Line x1="33%" y1="100" x2="50%" y2="40" stroke="#22c55e" strokeWidth="3" />
                <Line x1="50%" y1="40" x2="67%" y2="100" stroke="#ef4444" strokeWidth="3" />
                <Line x1="67%" y1="100" x2="84%" y2="40" stroke="#cbd5e1" strokeWidth="3" />
              </Svg>

              <View style={styles.networkRow}>
                {/* FB */}
                <View style={[styles.networkNode, { left: '8%', top: 15 }]}>
                  <TouchableOpacity 
                    style={[styles.nodeCircle, { borderColor: '#1877f2' }]} 
                    onPress={() => openUrl(data.socialLinks.facebook)}
                  >
                    <FacebookIcon size={24} />
                  </TouchableOpacity>
                  <Text style={styles.nodeLabel}>Facebook</Text>
                </View>

                {/* Phone */}
                <View style={[styles.networkNode, { left: '25%', top: 75 }]}>
                  <TouchableOpacity 
                    style={[styles.nodeCircle, { borderColor: '#22c55e' }]} 
                    onPress={() => openPhone(data.phoneNumbers[0])}
                  >
                    <Phone size={20} color="#22c55e" />
                  </TouchableOpacity>
                  <Text style={styles.nodeLabel}>Phone</Text>
                </View>

                {/* YouTube */}
                <View style={[styles.networkNode, { left: '42%', top: 15 }]}>
                  <TouchableOpacity 
                    style={[styles.nodeCircle, { borderColor: '#ef4444' }]} 
                    onPress={() => openUrl(data.socialLinks.youtube)}
                  >
                    <YoutubeIcon size={24} />
                  </TouchableOpacity>
                  <Text style={styles.nodeLabel}>YouTube</Text>
                </View>

                {/* Email */}
                <View style={[styles.networkNode, { left: '59%', top: 75 }]}>
                  <TouchableOpacity 
                    style={[styles.nodeCircle, { borderColor: '#1a2d5a' }]} 
                    onPress={() => openEmail(data.emails[0])}
                  >
                    <Mail size={20} color="#1a2d5a" />
                  </TouchableOpacity>
                  <Text style={styles.nodeLabel}>Email</Text>
                </View>

                {/* Instagram */}
                <View style={[styles.networkNode, { left: '76%', top: 15 }]}>
                  <TouchableOpacity 
                    style={[styles.nodeCircle, { borderColor: '#1a2d5a' }]} 
                    onPress={() => openUrl(data.socialLinks.instagram)}
                  >
                    <InstagramIcon size={24} color="#1a2d5a" />
                  </TouchableOpacity>
                  <Text style={styles.nodeLabel}>Instagram</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Call to me and I will answer you and tell you great and unsearchable things you do not know."
            </Text>
            <Text style={styles.quoteRef}>— JEREMIAH 33:3</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>`;

content = content.replace(/<ScrollView[\s\S]*?<\/ScrollView>/, newScrollView);

const newStyles = `const styles = StyleSheet.create({
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
    zIndex: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  scroll: { flex: 1, backgroundColor: '#fafafa' },
  scrollContent: { paddingHorizontal: 20 },

  introSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  introTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: '700',
    color: '#0f2756',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  introDesc: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f2756',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardBody: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },

  mapContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  mapImg: {
    width: '100%',
    height: '100%',
  },
  mapBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1877f2',
  },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: '#64748b',
  },

  networkContainer: {
    height: 150,
    position: 'relative',
    marginTop: 10,
  },
  networkRow: {
    flex: 1,
  },
  networkNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    marginLeft: -30,
  },
  nodeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },

  quoteCard: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
  },
  quoteRef: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854d0e',
    letterSpacing: 1.5,
  }
});`;

content = content.replace(/const styles = StyleSheet.create\(\{[\s\S]*\}\);/, newStyles);

content = content.replace(/const InstagramIcon = \(\{ size = 26 \}: \{ size\?: number \}\) => \([\s\S]*?<\/Svg>\n\);/, `const InstagramIcon = ({ size = 26, color = '#1a2d5a' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill={color} />
  </Svg>
);`);

content = content.replace(/const FacebookIcon = \(\{ size = 26 \}: \{ size\?: number \}\) => \([\s\S]*?<\/Svg>\n\);/, `const FacebookIcon = ({ size = 26, color = '#1877f2' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073c0 6.028 4.388 11.023 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.793-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.096 24 18.101 24 12.073z" />
  </Svg>
);`);

content = content.replace(/const YoutubeIcon = \(\{ size = 26 \}: \{ size\?: number \}\) => \([\s\S]*?<\/Svg>\n\);/, `const YoutubeIcon = ({ size = 26, color = '#ef4444' }: { size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" />
    <Path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" />
  </Svg>
);`);

if (!content.includes('const { activeChurch } = useChurch();')) {
  content = content.replace('const navigation = useNavigation();', 'const navigation = useNavigation();\n  const { activeChurch } = useChurch();');
}

fs.writeFileSync(file, content);
