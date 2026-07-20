import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Image as ImageIcon, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { useChurch } from '../../context/ChurchContext';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#dc2626',
  '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669',
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed'
];

export default function AdminCelebrationsCustomTheme({ onBack, onSave }: { onBack: () => void, onSave: (theme: any) => void }) {
  const { activeChurch } = useChurch();
  const [themeName, setThemeName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!themeName) {
      Alert.alert("Missing Info", "Please enter a theme name.");
      return;
    }
    if (!backgroundColor && !imageUri) {
      Alert.alert("Missing Info", "Please provide either a background color or an image.");
      return;
    }

    setSaving(true);
    let finalImageUrl = null;

    try {
      if (imageUri && activeChurch?.id) {
        const ext = imageUri.substring(imageUri.lastIndexOf('.') + 1) || 'jpg';
        const storagePath = `churches/${activeChurch.id}/themes/custom_${Date.now()}.${ext}`;
        const reference = storage().ref(storagePath);
        await reference.putFile(imageUri);
        finalImageUrl = await reference.getDownloadURL();
      }

      const newTheme = {
        id: `custom_${Date.now()}`,
        title: themeName,
        color: backgroundColor || null,
        imageUrl: finalImageUrl,
        isCustom: true
      };

      if (activeChurch?.id) {
        await firestore().collection('churches').doc(activeChurch.id).update({
          customThemes: firestore.FieldValue.arrayUnion(newTheme)
        });
      }

      onSave(newTheme);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save custom theme.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#162057" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>PREPARE WISH</Text>
          <Text style={styles.title}>Custom Theme</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.sectionTitle}>ADD CUSTOM THEME</Text>

        <Text style={styles.label}>Theme Name</Text>
        <TextInput 
          style={styles.input}
          value={themeName}
          onChangeText={setThemeName}
          placeholder="e.g. Ocean Blue"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Background Color</Text>
        <TouchableOpacity 
          style={styles.dropdownBtn}
          onPress={() => setShowColorDropdown(!showColorDropdown)}
        >
          {backgroundColor ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.dropdownColorPreview, { backgroundColor }]} />
              <Text style={styles.dropdownBtnTxt}>{backgroundColor}</Text>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Select a color</Text>
          )}
          <Text style={{ color: '#64748B' }}>▼</Text>
        </TouchableOpacity>

        {showColorDropdown && (
          <View style={styles.dropdownList}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {PRESET_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setBackgroundColor(color);
                    setShowColorDropdown(false);
                  }}
                >
                  <View style={[styles.dropdownColorPreview, { backgroundColor: color }]} />
                  <Text style={styles.dropdownItemTxt}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Background Image (Optional)</Text>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <ImageIcon size={28} color="#B88A2E" style={{ marginBottom: 8 }} />
              <Text style={styles.uploadTxt}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnTxt}>Save & Apply</Text>
            </>
          )}
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
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  label: {
    color: '#162057',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 20,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dropdownBtnTxt: {
    fontSize: 15,
    color: '#111827',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dropdownColorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: -12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemTxt: {
    fontSize: 15,
    color: '#111827',
  },
  imageUpload: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  uploadTxt: {
    color: '#64748B',
    fontSize: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162057',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#162057',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
