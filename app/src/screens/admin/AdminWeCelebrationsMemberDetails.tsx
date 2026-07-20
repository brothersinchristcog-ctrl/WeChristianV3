import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { ArrowLeft, Gift } from 'lucide-react-native';

export default function AdminWeCelebrationsMemberDetails({ member, category, onBack, onPrepareWish }: { member: any, category: string, onBack: () => void, onPrepareWish: () => void }) {
  
  const getAvatarColor = (name: string) => {
    const colors = ['#734062', '#1A4F5B', '#42518E', '#D97736'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#162057" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>CELEBRATION</Text>
          <Text style={styles.title}>Member Details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.avatarOuter, { borderColor: '#FFFFFF' }]}>
            <View style={[styles.avatarInner, { backgroundColor: getAvatarColor(member.name) }]}>
              {member.photoUrl ? (
                <Image source={{ uri: member.photoUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarTxt}>{member.initials}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagTxt}>{category}</Text>
          </View>
          
          <Text style={styles.memberName}>{member.name}</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>CELEBRATION DATE</Text>
            <Text style={styles.cardValue}>{member.dateStr || '--'}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>TURNING</Text>
            <Text style={styles.cardValue}>{member.age ? `${member.age} yrs old` : '--'}</Text>
          </View>
        </View>
        
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>MINISTRY</Text>
            <Text style={styles.cardValue}>{member.ministry || 'General'}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>FAMILY</Text>
            <Text style={styles.cardValue}>{member.family || 'Family'}</Text>
          </View>
        </View>

        {/* WhatsApp Number Card */}
        <View style={styles.fullCard}>
          <Text style={styles.cardLabel}>WHATSAPP NUMBER</Text>
          <Text style={styles.cardValue}>{member.phone || '--'}</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={onPrepareWish}>
          <Gift size={20} color="#162057" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnTxt}>Prepare Wish</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#FAF8F0',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#B88A2E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    color: '#162057',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  avatarInner: {
    width: 102,
    height: 102,
    borderRadius: 51,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarTxt: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  tag: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  tagTxt: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#162057',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAC259',
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#EAC259',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnTxt: {
    color: '#162057',
    fontSize: 16,
    fontWeight: '700',
  }
});
