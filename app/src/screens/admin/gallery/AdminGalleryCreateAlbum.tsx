import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, UploadCloud, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AdminGalleryStackParamList } from './AdminGalleryNavigator';
import GalleryService from '../../../services/GalleryService';

type NavigationProp = NativeStackNavigationProp<AdminGalleryStackParamList, 'AdminGalleryCreateAlbum'>;

export default function AdminGalleryCreateAlbum() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter an album name.');
      return;
    }

    try {
      setLoading(true);
      await GalleryService.createAlbum({
        name,
        description,
        visibility: 'Public', // Could add a toggle later if needed
      }, coverUri);
      
      DeviceEventEmitter.emit('GALLERY_ALBUM_CREATED');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to create album.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.newBadge}>NEW</Text>
          <Text style={styles.headerTitle}>Create album</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ALBUM NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Christmas Eve Service"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="A short note about this album..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>COVER PHOTO</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverPreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <UploadCloud size={24} color="#fff" />
                </View>
                <Text style={styles.uploadMainText}>Tap to select image</Text>
                <Text style={styles.uploadSubText}>JPG, PNG up to 20MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!name.trim() || loading) && { opacity: 0.5 }]} 
          disabled={!name.trim() || loading}
          onPress={handleCreate}
        >
          {loading ? (
            <ActivityIndicator color="#0b141a" />
          ) : (
            <Text style={styles.submitBtnText}>Create Album</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D15',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 30,
  },
  newBadge: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  uploadArea: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderRadius: 20,
    height: 200,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIconContainer: {
    backgroundColor: '#3B82F6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadMainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  uploadSubText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  submitBtn: {
    backgroundColor: '#FCD34D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0b141a',
    fontSize: 16,
    fontWeight: '700',
  },
});
