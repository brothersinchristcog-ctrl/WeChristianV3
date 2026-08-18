import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  FileText, 
  Save, 
  X, 
  Calendar,
  CheckSquare,
  Square,
  CheckCircle2,
  Combine
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CustomAlert } from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

interface SermonNote {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export default function MemberNotesScreen({ navigation, route }: any) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { prefillTitle, prefillContent } = route?.params || {};
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & form states
  const [modalVisible, setModalVisible] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true); // open in read-only by default
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Merge & Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeTitle, setMergeTitle] = useState('');

  useEffect(() => {
    loadNotes();
  }, [route?.params?.refreshId]);

  // Auto-open create modal when pre-fill params are passed (e.g. from Bible Search)
  useEffect(() => {
    if (prefillTitle || prefillContent) {
      setNoteTitle(prefillTitle || 'Bible Study Notes');
      setNoteContent(prefillContent || '');
      setEditingNoteId(null);
      setModalVisible(true);
    }
  }, [prefillTitle, prefillContent]);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('@SermonPersonalNotes');
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading sermon notes:', e);
    }
  };

  const saveNotesToStorage = async (newNotesList: SermonNote[]) => {
    try {
      await AsyncStorage.setItem('@SermonPersonalNotes', JSON.stringify(newNotesList));
    } catch (e) {
      console.error('Error saving sermon notes:', e);
      Alert.alert('Error', 'Failed to save sermon notes.');
    }
  };

  const handleCreateOrEditNote = () => {
    if (!noteTitle.trim()) {
      Alert.alert('Required', 'Please enter a note title.');
      return;
    }

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let updatedNotes: SermonNote[];

    if (editingNoteId) {
      // Editing Mode
      updatedNotes = notes.map(n => 
        n.id === editingNoteId 
          ? { ...n, title: noteTitle.trim(), content: noteContent.trim(), timestamp: dateStr }
          : n
      );
    } else {
      // Creating Mode
      const newNote: SermonNote = {
        id: Date.now().toString(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        timestamp: dateStr
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
    
    // Close modal & reset fields
    setModalVisible(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this sermon note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const filtered = notes.filter(n => n.id !== id);
            setNotes(filtered);
            saveNotesToStorage(filtered);
            setAlertConfig({ visible: true, title: 'Note Deleted', message: 'Sermon Note Deleted Successfully', type: 'success' });
          }
        }
      ]
    );
  };

  const openViewMode = (note: SermonNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsViewMode(true); // always open read-only first
    setModalVisible(true);
  };

  const openCreateForm = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setIsViewMode(false); // new note always opens in edit mode
    setModalVisible(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]
    );
  };

  const handleMergeNotes = () => {
    if (!mergeTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for the merged sermon collection.');
      return;
    }

    const notesToMerge = notes.filter(n => selectedNoteIds.includes(n.id));
    
    // Combine content
    let combinedContent = '';
    notesToMerge.forEach((note, index) => {
      combinedContent += `--- ${note.title} ---\n${note.content}\n\n`;
    });

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newNote: SermonNote = {
      id: Date.now().toString(),
      title: mergeTitle.trim(),
      content: combinedContent.trim(),
      timestamp: dateStr
    };

    // Remove the original notes that were merged
    const remainingNotes = notes.filter(n => !selectedNoteIds.includes(n.id));
    const updatedNotes = [newNote, ...remainingNotes];

    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);

    // Reset selection and close modal
    setMergeModalVisible(false);
    setMergeTitle('');
    setIsSelectionMode(false);
    setSelectedNoteIds([]);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNoteCard = ({ item }: { item: SermonNote }) => {
    const isSelected = selectedNoteIds.includes(item.id);

    return (
      <View style={[
        styles.noteCard, 
        { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
        isSelectionMode && isSelected && { borderColor: '#1a2d5a', borderWidth: 2 }
      ]}>
        <TouchableOpacity 
          style={[styles.noteCardBody, isSelectionMode && { flexDirection: 'row', alignItems: 'center' }]} 
          activeOpacity={0.7}
          onPress={() => isSelectionMode ? toggleSelection(item.id) : openViewMode(item)}
          onLongPress={() => {
            if (!isSelectionMode) {
              setIsSelectionMode(true);
              toggleSelection(item.id);
            }
          }}
        >
          {isSelectionMode && (
            <View style={{ marginRight: 15 }}>
              {isSelected ? (
                <CheckSquare size={24} color="#1a2d5a" />
              ) : (
                <Square size={24} color={isDark ? '#475569' : '#cbd5e1'} />
              )}
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.noteCardTitle, { color: isDark ? '#fff' : '#0f172a' }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.dateBadge}>
                <Calendar size={10} color="#64748b" />
                <Text style={styles.dateText}>{item.timestamp}</Text>
              </View>
            </View>
            
            <Text style={[styles.noteCardSnippet, { color: isDark ? '#94a3b8' : '#475569' }]} numberOfLines={3}>
              {item.content || '(No additional text)'}
            </Text>
          </View>
        </TouchableOpacity>

        {!isSelectionMode && (
          <View style={styles.cardActionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openViewMode(item)}>
              <Edit3 size={15} color={isDark ? '#60a5fa' : '#1a2d5a'} />
              <Text style={[styles.actionBtnTxt, { color: isDark ? '#60a5fa' : '#1a2d5a' }]}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteNote(item.id)}>
              <Trash2 size={15} color="#ef4444" />
              <Text style={[styles.actionBtnTxt, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Sermon Notes</Text>
            <Text style={styles.headerSubtitle}>ప్రసంగ గమనికలు</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          {notes.length > 0 && (
            <TouchableOpacity 
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: isSelectionMode ? '#fff' : 'rgba(255,255,255,0.2)', borderRadius: 15 }} 
              onPress={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedNoteIds([]);
              }}
            >
              <Text style={{ color: isSelectionMode ? '#1a2d5a' : '#fff', fontSize: 12, fontWeight: '700' }}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>
          )}
          {!isSelectionMode && (
            <TouchableOpacity style={styles.plusBtn} onPress={openCreateForm}>
              <Plus size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          placeholder="Search sermon notes..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
            <Text style={styles.searchClearTxt}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <FileText size={50} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[styles.emptyStateTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              No sermon notes found
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Create a note of your favorite sermons, verses, or study logs!
            </Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateForm}>
              <Plus size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.createFirstBtnTxt}>Create First Note</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Merge Button */}
      {isSelectionMode && selectedNoteIds.length > 1 && (
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 40 : 30,
            alignSelf: 'center',
            backgroundColor: '#1a2d5a',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 30,
            gap: 10,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10
          }}
          onPress={() => setMergeModalVisible(true)}
        >
          <Combine size={20} color="#FCD34D" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
            Merge Selected ({selectedNoteIds.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Merge Title Prompt Modal */}
      <Modal
        visible={mergeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMergeModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#fff', padding: 24, paddingBottom: 30 }]}>
            <Text style={[{ fontSize: 18, fontWeight: '800', marginBottom: 15, color: isDark ? '#fff' : '#0f172a' }]}>
              Name your Sermon Group
            </Text>
            <Text style={[{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 20 }]}>
              The selected {selectedNoteIds.length} notes will be combined into a single note and the originals will be removed.
            </Text>
            
            <TextInput
              placeholder="E.g. Sunday Service Notes..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[styles.titleInput, { color: isDark ? '#fff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1', marginBottom: 24 }]}
              value={mergeTitle}
              onChangeText={setMergeTitle}
              maxLength={80}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#f1f5f9', alignItems: 'center' }}
                onPress={() => setMergeModalVisible(false)}
              >
                <Text style={{ color: isDark ? '#fff' : '#475569', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a2d5a', alignItems: 'center' }}
                onPress={handleMergeNotes}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Merge Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View / Create / Edit Note Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {!editingNoteId ? 'Create New Sermon Note' : isViewMode ? 'Sermon Note' : 'Edit Sermon Note'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {/* Edit toggle button when in view mode */}
                {editingNoteId && isViewMode && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#1a2d5a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
                    onPress={() => setIsViewMode(false)}
                  >
                    <Edit3 size={14} color="#FCD34D" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={20} color={isDark ? '#fff' : '#475569'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* View Mode: Read-Only */}
            {isViewMode && editingNoteId ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.inputLabel, { marginBottom: 6 }]}>SERMON TITLE · శీర్షిక</Text>
                <View style={[styles.titleInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0', justifyContent: 'center' }]}>
                  <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 15, fontWeight: '700' }}>{noteTitle}</Text>
                </View>

                <View style={{ height: 15 }} />

                <Text style={[styles.inputLabel, { marginBottom: 6 }]}>SERMON DETAILS & POINTS · గమనికలు</Text>
                <View style={[styles.contentInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0', minHeight: 180, height: undefined }]}>
                  <Text style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 14, lineHeight: 22 }}>
                    {noteContent || '(No content yet)'}
                  </Text>
                </View>

                <View style={{ height: 60 }} />
              </ScrollView>
            ) : (
              /* Edit/Create Mode: Editable Inputs */
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>SERMON TITLE · శీర్షిక</Text>
                <TextInput
                  placeholder="E.g. Sunday Sermon Notes, Scripture Reflections..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.titleInput, { color: isDark ? '#fff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  maxLength={80}
                />

                <View style={{ height: 15 }} />

                <Text style={styles.inputLabel}>SERMON DETAILS & POINTS · గమనికలు</Text>
                <TextInput
                  placeholder="Write your sermon points, verses, and key takeaways here..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.contentInput, { color: isDark ? '#fff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline={true}
                  numberOfLines={10}
                  textAlignVertical="top"
                />

                <View style={{ height: 30 }} />

                {/* Save Button */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreateOrEditNote}>
                  <Save size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnTxt}>
                    {editingNoteId ? 'Save Changes' : 'Save Sermon Note'}
                  </Text>
                </TouchableOpacity>
                <View style={{ height: 60 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Search
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    marginLeft: 8
  },
  searchClearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearTxt: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },

  listContent: { padding: 16, paddingBottom: 60 },

  // Card styles
  noteCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden'
  },
  noteCardBody: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  noteCardTitle: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4
  },
  dateText: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  noteCardSnippet: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.01)'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  actionBtnTxt: { fontSize: 12, fontWeight: '700' },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30
  },
  emptyStateTitle: { fontSize: 16, fontWeight: '800', marginTop: 15, marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3
  },
  createFirstBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: height * 0.85, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#cbd5e1', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 17, fontWeight: '900' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8 },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.01)'
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.01)'
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#c0392b',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
