import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Image } from 'react-native';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function AdminWeCelebrationsPhotoPicker({ 
  member,
  onBack, 
  onSelectPhoto 
}: { 
  member: any,
  onBack: () => void, 
  onSelectPhoto: (uri: string) => void 
}) {
  
  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onSelectPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const handleUseProfile = () => {
    const profilePic = member?.ProfilePhoto || member?.profilePhoto || member?.photoURL || member?.photoUrl || member?.profileImageUrl || member?.photo || member?.avatar;
    if (profilePic) {
      onSelectPhoto(profilePic);
    } else {
      Alert.alert("No Photo", "This member does not have a profile picture.");
    }
  };

  const profilePic = member?.ProfilePhoto || member?.profilePhoto || member?.photoURL || member?.photoUrl || member?.profileImageUrl || member?.photo || member?.avatar;
  const hasProfilePhoto = !!profilePic;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#162057" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>PREPARE WISH</Text>
          <Text style={styles.title}>Upload Photo</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>UPLOAD IMAGE</Text>
        
        <TouchableOpacity style={styles.uploadBox} onPress={handleUpload}>
          <ImageIcon size={32} color="#B88A2E" style={{ marginBottom: 12 }} />
          <Text style={styles.uploadText}>Tap to upload a custom photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileBtn} 
          onPress={handleUseProfile}
        >
          <ImageIcon size={20} color="#162057" />
          <Text style={styles.profileBtnText}>
            Use {member?.name ? member.name.split(' ')[0] + "'s" : "Member's"} Profile Picture
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#B88A2E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#162057',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  uploadText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#162057',
    backgroundColor: '#FFFFFF',
  },
  profileBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#162057',
    marginLeft: 8,
  }
});
