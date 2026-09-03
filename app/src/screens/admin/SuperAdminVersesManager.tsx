import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { UploadCloud, CheckCircle, Trash2 } from 'lucide-react-native';

export default function SuperAdminVersesManager() {
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchVerses();
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const snapshot = await firestore().collection('daily_verses').get();
      const verseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVerses(verseData);
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'Input must be a JSON array of verses.');
        return;
      }

      setIsUploading(true);
      const batch = firestore().batch();
      const versesRef = firestore().collection('daily_verses');
      
      let count = 0;
      for (const verse of parsedData) {
        if (verse.verseEn && verse.verseTe) {
          const docRef = versesRef.doc();
          batch.set(docRef, {
            ...verse,
            createdAt: firestore.FieldValue.serverTimestamp()
          });
          count++;
        }
      }

      await batch.commit();
      Alert.alert('Success', `Successfully uploaded ${count} verses.`);
      setJsonInput('');
      setShowInput(false);
      fetchVerses();
    } catch (error) {
      console.error(error);
      Alert.alert('Invalid JSON', 'Please check your JSON format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete ALL daily verses?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setIsUploading(true);
        try {
          const snapshot = await firestore().collection('daily_verses').get();
          const batch = firestore().batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          fetchVerses();
        } catch (e) {
          console.error(e);
        } finally {
          setIsUploading(false);
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Verses: {verses.length}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#ef4444' }]} 
            onPress={handleClearAll}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.btnText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#3b82f6' }]} 
            onPress={() => setShowInput(!showInput)}
          >
            <UploadCloud size={16} color="#fff" />
            <Text style={styles.btnText}>{showInput ? 'Cancel' : 'Bulk Upload JSON'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showInput && (
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Paste JSON Array of verses:</Text>
          <Text style={styles.helper}>Format: [{`{ "verseEn": "Jesus wept.", "referenceEn": "John 11:35", "verseTe": "యేసు కన్నీళ్లు విడిచెను.", "referenceTe": "యోహాను 11:35" }`}]</Text>
          <TextInput
            style={styles.input}
            multiline
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder="[ { ... } ]"
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#10b981', alignSelf: 'flex-end', marginTop: 10 }]} 
            onPress={handleBulkUpload}
            disabled={isUploading}
          >
            {isUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Upload Verses</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={verses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.verseCard}>
              <Text style={styles.verseEn}>"{item.verseEn}"</Text>
              <Text style={styles.refEn}>- {item.referenceEn}</Text>
              <View style={styles.divider} />
              <Text style={styles.verseTe}>"{item.verseTe}"</Text>
              <Text style={styles.refTe}>- {item.referenceTe}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  uploadSection: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20 },
  label: { color: '#f8fafc', fontWeight: 'bold', marginBottom: 4 },
  helper: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', height: 150, borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  verseCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  verseEn: { color: '#f8fafc', fontSize: 16, fontStyle: 'italic', marginBottom: 4 },
  refEn: { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  verseTe: { color: '#f8fafc', fontSize: 16, marginBottom: 4 },
  refTe: { color: '#94a3b8', fontSize: 14, textAlign: 'right' },
});
