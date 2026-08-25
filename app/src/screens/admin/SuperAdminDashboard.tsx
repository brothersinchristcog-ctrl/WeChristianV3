import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../../context/AuthContext';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { Plus, ArrowLeft, Shield, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import storage from '@react-native-firebase/storage';

export default function SuperAdminDashboard({ navigation }: any) {
  const { member } = useAuth();
  const [churches, setChurches] = useState<ChurchDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    subdomain: '',
    logoUrl: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Validate Super Admin privileges
  useEffect(() => {
    if (member?.userType !== 'super_admin') {
      Alert.alert('Access Denied', 'You do not have permission to view this screen.');
      navigation.goBack();
    }
  }, [member]);

  const fetchChurches = async () => {
    setLoading(true);
    const data = await ChurchService.getAllChurches();
    setChurches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChurches();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreateChurch = async () => {
    if (!formData.name || !formData.subdomain) {
      Alert.alert('Required', 'Please provide a name and subdomain.');
      return;
    }
    try {
      setLoading(true);
      setUploading(true);

      // 1. Create church document first
      const churchId = await ChurchService.createChurch({
        name: formData.name,
        churchCode: formData.subdomain.toUpperCase().substring(0, 6) + Math.floor(100 + Math.random() * 900),
        isParentOrganization: true,
        tagline: formData.tagline,
        subdomain: formData.subdomain.toLowerCase(),
        contactEmail: 'admin@' + formData.subdomain.toLowerCase() + '.com',
        theme: {
          primaryColor: '#1a2d5a',
          secondaryColor: '#aac4e8',
          backgroundColor: '#f8fafc',
          textColor: '#1e293b',
          logoUrl: '' // Will update later if image selected
        },
        features: {
          hasSermons: true,
          hasDailyPromises: true,
          hasWorshipSongs: true,
          hasGiving: true,
        },
        subscriptionTier: 'premium',
        memberCount: 0,
        whatsappIntegrationEnabled: false
      });

      // 2. Upload image if selected
      let downloadURL = '';
      if (selectedImage) {
        try {
          const ext = selectedImage.substring(selectedImage.lastIndexOf('.') + 1) || 'jpg';
          const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          const storagePath = `churches/${churchId}/brand/logo_${Date.now()}.${ext}`;
          
          // BYPASS Native Firebase SDK completely and use REST API
          const bucket = 'wechristian-67f07.firebasestorage.app';
          const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(storagePath)}`;
          
          const idToken = await auth().currentUser?.getIdToken();
          
          // Read local file and upload via Expo FileSystem
          const uploadRes = await FileSystem.uploadAsync(uploadUrl, selectedImage, {
            httpMethod: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': contentType,
            },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
          });
          
          if (uploadRes.status !== 200) {
            throw new Error(`REST API failed: ${uploadRes.body}`);
          }
          
          const responseData = JSON.parse(uploadRes.body);
          downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=${responseData.downloadTokens}`;

          // 3. Update church with new logo URL
          await ChurchService.updateChurch(churchId, { theme: { primaryColor: '#1a2d5a', secondaryColor: '#aac4e8', backgroundColor: '#f8fafc', textColor: '#1e293b', logoUrl: downloadURL } });
        } catch (uploadErr) {
          console.error(uploadErr);
          Alert.alert('Upload Warning', 'Church created, but logo failed to upload.');
        }
      }

      Alert.alert('Success', `${formData.name} created!`);
      setShowModal(false);
      setFormData({ name: '', tagline: '', subdomain: '', logoUrl: '' });
      setSelectedImage(null);
      fetchChurches();
    } catch (e) {
      Alert.alert('Error', 'Could not create church.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleExtendSubscription = async (churchId: string, churchName: string) => {
    try {
      Alert.alert(
        'Confirm Extension',
        `Extend subscription for ${churchName} by 1 year?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Extend', 
            style: 'default',
            onPress: async () => {
              setLoading(true);
              const { firestore } = await import('../../services/firebaseConfig');
              const newDate = new Date();
              newDate.setFullYear(newDate.getFullYear() + 1);
              
              await ChurchService.updateChurch(churchId, {
                'subscription.validUntil': firestore.Timestamp.fromDate(newDate),
                'subscription.status': 'active'
              } as any);
              
              Alert.alert('Success', `${churchName} subscription extended!`);
              fetchChurches();
            }
          }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to extend subscription');
    }
  };

  const renderChurch = ({ item }: { item: ChurchDetails }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>Subdomain: {item.subdomain}</Text>
        <Text style={styles.cardSub}>Members: {item.memberCount || 0}</Text>
        <Text style={styles.cardSub}>Status: {item.subscription?.status === 'active' ? 'Active' : 'Trial / Expired'}</Text>
      </View>
      <TouchableOpacity 
        style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' }}
        onPress={() => handleExtendSubscription(item.id, item.name)}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>+ 1 Year</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Shield size={24} color="#facc15" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Super Admin</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>All Churches ({churches.length})</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.createBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1a2d5a" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={churches}
            keyExtractor={c => c.id}
            renderItem={renderChurch}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      {/* CREATE CHURCH MODAL */}
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Church</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Church Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grace Baptist"
              value={formData.name}
              onChangeText={t => setFormData({...formData, name: t})}
            />

            <Text style={styles.label}>Tagline / Motto</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. A Gateway to Heaven"
              value={formData.tagline}
              onChangeText={t => setFormData({...formData, tagline: t})}
            />

            <Text style={styles.label}>Church Logo</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {selectedImage ? (
                <Text style={styles.uploadTxt}>Image Selected!</Text>
              ) : (
                <>
                  <ImageIcon size={24} color="#64748b" />
                  <Text style={styles.uploadTxt}>Tap to upload logo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Subdomain / Church Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. grace"
              value={formData.subdomain}
              onChangeText={t => setFormData({...formData, subdomain: t})}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateChurch} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnTxt}>Create Church</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  header: { 
    backgroundColor: '#1a2d5a', 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backBtn: { marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a2d5a' },
  createBtn: { 
    backgroundColor: '#16a34a', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  createBtnTxt: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  list: { paddingBottom: 40 },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2 
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a2d5a', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a2d5a' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b' },
  submitBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imageUpload: {
    backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed',
    height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 8, flexDirection: 'row', flexWrap: 'wrap'
  },
  uploadTxt: { color: '#64748b', fontSize: 14, fontWeight: '500' }
});
