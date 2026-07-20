import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Image, Alert } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 20 padding each side, 20 gap between

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

export default function AdminWeCelebrationsThemePicker({ onBack, onSelectTheme, onDeleteSuccess }: { onBack: () => void, onSelectTheme: (themeId: string) => void, onDeleteSuccess?: () => void }) {
  const { activeChurch, setActiveChurch } = useChurch();
  const customThemes = activeChurch?.customThemes || [];

  const handleLongPress = (theme: any) => {
    if (!theme.isCustom || !activeChurch?.id) return;
    
    Alert.alert(
      "Delete Custom Theme",
      `Are you sure you want to delete "${theme.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection('churches').doc(activeChurch.id).update({
                customThemes: firestore.FieldValue.arrayRemove(theme)
              });
              if (activeChurch) {
                setActiveChurch({
                  ...activeChurch,
                  customThemes: (activeChurch.customThemes || []).filter((t: any) => t.id !== theme.id)
                });
              }
              if (onDeleteSuccess) {
                onDeleteSuccess();
              }
            } catch (error) {
              Alert.alert("Error", "Could not delete theme.");
            }
          }
        }
      ]
    );
  };

  const ALL_THEMES = [...customThemes, ...THEMES];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#162057" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>PREPARE WISH</Text>
          <Text style={styles.title}>Choose Theme</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.sectionTitle}>CHOOSE CELEBRATION THEME</Text>

        <View style={styles.grid}>
          {ALL_THEMES.map(theme => (
            <TouchableOpacity 
              key={theme.id} 
              style={styles.card}
              onPress={() => onSelectTheme(theme.id)}
              onLongPress={() => handleLongPress(theme)}
            >
              <View style={[
                styles.cardTop, 
                theme.color ? { backgroundColor: theme.color } : null
              ]}>
                {(theme.isImage || theme.imageUrl) && (
                  <View style={styles.imagePlaceholder}>
                    {theme.imageUrl ? (
                      <Image source={{ uri: theme.imageUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{color: '#fff', fontSize: 10, textAlign: 'center', opacity: 0.8}}>Image Placeholder</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardTitle} numberOfLines={1}>{theme.title}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Custom Theme Button */}
          <TouchableOpacity style={styles.customCard} onPress={() => onSelectTheme('custom')}>
            <Plus size={24} color="#B88A2E" style={{ marginBottom: 12 }} />
            <Text style={styles.customCardTxt}>Custom Theme</Text>
          </TouchableOpacity>
        </View>

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
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    height: cardWidth * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTop: {
    flex: 1,
    backgroundColor: '#E2E8F0', // fallback
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    height: 44,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  customCard: {
    width: cardWidth,
    height: cardWidth * 0.9,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#EAC259',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 194, 89, 0.05)',
  },
  customCardTxt: {
    color: '#B88A2E',
    fontSize: 14,
    fontWeight: '700',
  }
});
