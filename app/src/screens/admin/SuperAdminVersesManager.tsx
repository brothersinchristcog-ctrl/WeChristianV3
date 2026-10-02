import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { UploadCloud, CheckCircle, Trash2, Database, Eye, Pencil, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function SuperAdminVersesManager({ searchQuery = '' }: { searchQuery?: string }) {
  const navigation = useNavigation<any>();
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  const [editingVerse, setEditingVerse] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getVerseDateInfo = (index: number) => {
    if (typeof index !== 'number') return { month: 'Unknown', fullDate: '', period: '' };
    const EPOCH = new Date('2024-01-01T00:00:00Z');
    const daysSinceEpoch = Math.floor(index / 4);
    const periodIndex = index % 4;
    
    const d = new Date(EPOCH);
    d.setDate(d.getDate() + daysSinceEpoch);
    
    const month = d.toLocaleString('en-US', { month: 'short' });
    const fullDate = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let period = 'Morning';
    if (periodIndex === 1) period = 'Afternoon';
    if (periodIndex === 2) period = 'Evening';
    if (periodIndex === 3) period = 'Night';
    
    return { month, fullDate, period };
  };

  const filteredVerses = useMemo(() => {
    return verses.filter(v => {
      // 1. Month Filter
      if (selectedMonth !== 'All') {
        const info = getVerseDateInfo(v.index);
        if (info.month !== selectedMonth) return false;
      }
      
      // 2. Search Filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const vEn = (v.verseEn || '').toLowerCase();
        const vTe = (v.verseTe || '').toLowerCase();
        const rEn = (v.referenceEn || '').toLowerCase();
        const rTe = (v.referenceTe || '').toLowerCase();
        
        if (!vEn.includes(query) && !vTe.includes(query) && !rEn.includes(query) && !rTe.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [verses, selectedMonth, searchQuery]);

  const handleUpdateVerse = async () => {
    if (!editingVerse || !editingVerse.id) return;
    setIsUpdating(true);
    try {
      await firestore().collection('daily_verses').doc(editingVerse.id).update({
        verseEn: editingVerse.verseEn,
        verseTe: editingVerse.verseTe,
        referenceEn: editingVerse.referenceEn,
        referenceTe: editingVerse.referenceTe,
      });
      
      setVerses(verses.map(v => v.id === editingVerse.id ? editingVerse : v));
      setEditingVerse(null);
      Alert.alert('Success', 'Verse updated successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update verse.');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleBulkUpload = async (directData?: any) => {
    try {
      const parsedData = directData || JSON.parse(jsonInput);
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'Input must be a JSON array of verses.');
        return;
      }

      setIsUploading(true);
      const versesRef = firestore().collection('daily_verses');
      
      let count = 0;
      let index = 0;
      const batches = [];
      let currentBatch = firestore().batch();
      
      for (const verse of parsedData) {
        if (verse.verseEn && verse.verseTe) {
          const docRef = versesRef.doc();
          currentBatch.set(docRef, {
            ...verse,
            index: index,
            createdAt: firestore.FieldValue.serverTimestamp()
          });
          count++;
          index++;
          
          if (count % 450 === 0) {
            batches.push(currentBatch.commit());
            currentBatch = firestore().batch();
          }
        }
      }

      if (count % 450 !== 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);
      
      // Save total count in metadata for deterministic syncing
      await firestore().collection('daily_verses_meta').doc('metadata').set({
        totalVerses: count,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
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
      </View>
      
      <View style={{ marginBottom: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MONTHS}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.monthChip, 
                selectedMonth === item && styles.monthChipActive
              ]}
              onPress={() => setSelectedMonth(item)}
            >
              <Text style={[
                styles.monthChipText, 
                selectedMonth === item && styles.monthChipTextActive
              ]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: '#10b981', width: '100%', justifyContent: 'center', marginBottom: 10 }]} 
          onPress={() => {
            if (verses.length > 0) {
              navigation.navigate('VerseOfTheDay', { verseId: verses[0].id, period: 'Morning' });
            } else {
              Alert.alert('No verses', 'Upload verses first to test the UI');
            }
          }}
        >
          <Eye size={16} color="#fff" />
          <Text style={styles.btnText}>Test Verse UI Screen</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#ef4444', flex: 1, justifyContent: 'center' }]} 
            onPress={handleClearAll}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.btnText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#3b82f6', flex: 1, justifyContent: 'center' }]} 
            onPress={() => setShowInput(!showInput)}
          >
            <UploadCloud size={16} color="#fff" />
            <Text style={styles.btnText}>{showInput ? 'Cancel' : 'Upload JSON'}</Text>
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
          data={filteredVerses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.verseCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verseEn}>"{item.verseEn}"</Text>
                  <Text style={styles.refEn}>- {item.referenceEn}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.verseTe}>"{item.verseTe}"</Text>
                  <Text style={styles.refTe}>- {item.referenceTe}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setEditingVerse({...item})}
                  style={{ padding: 8, backgroundColor: '#334155', borderRadius: 8, marginLeft: 12 }}
                >
                  <Pencil size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: '#f0b429', marginTop: 14, fontWeight: '700' }}>
                {getVerseDateInfo(item.index).fullDate} • {getVerseDateInfo(item.index).period} <Text style={{ color: '#64748b', fontWeight: 'normal', fontSize: 11 }}>(Index: {item.index})</Text>
              </Text>
            </View>
          )}
        />
      )}

      {/* Edit Modal */}
      {editingVerse && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20, zIndex: 10 }]}>
          <View style={{ backgroundColor: '#1e293b', padding: 20, borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: 'bold' }}>Edit Verse</Text>
              <TouchableOpacity onPress={() => setEditingVerse(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Verse (English)</Text>
            <TextInput style={[styles.input, { height: 80, marginBottom: 12 }]} multiline value={editingVerse.verseEn} onChangeText={t => setEditingVerse({...editingVerse, verseEn: t})} />
            
            <Text style={styles.label}>Reference (English)</Text>
            <TextInput style={[styles.input, { height: 45, marginBottom: 16 }]} value={editingVerse.referenceEn} onChangeText={t => setEditingVerse({...editingVerse, referenceEn: t})} />

            <Text style={styles.label}>Verse (Telugu)</Text>
            <TextInput style={[styles.input, { height: 80, marginBottom: 12 }]} multiline value={editingVerse.verseTe} onChangeText={t => setEditingVerse({...editingVerse, verseTe: t})} />
            
            <Text style={styles.label}>Reference (Telugu)</Text>
            <TextInput style={[styles.input, { height: 45, marginBottom: 20 }]} value={editingVerse.referenceTe} onChangeText={t => setEditingVerse({...editingVerse, referenceTe: t})} />

            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#3b82f6', justifyContent: 'center' }]} 
              onPress={handleUpdateVerse}
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
    actions: { flexDirection: 'column', gap: 12, marginBottom: 24 },
    btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, gap: 8 },
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
  monthChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  monthChipActive: { backgroundColor: '#f0b429', borderColor: '#f0b429' },
  monthChipText: { color: '#94a3b8', fontWeight: '600' },
  monthChipTextActive: { color: '#1a1200' },
});
