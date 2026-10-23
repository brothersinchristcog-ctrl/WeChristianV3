import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Music, Save, ChevronDown, CheckCircle, Pencil, X, List, Eye, Square,
  Trash2, Star, ChevronLeft, Plus, Share2, Sparkles, Sliders, ChevronRight,
  Users, Search, Calendar, CalendarDays, Clock, ArrowUp, ArrowDown, FolderPlus, BookOpen, Check
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import FirestoreService, { WorshipSong } from '../../services/FirestoreService';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc
} from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Christmas Songs',
  'Easter Songs',
  'Youth Songs',
  'Gospel Songs',
  'Marriage Songs',
  'Thanksgiving Songs',
  'Special Songs',
  'Other',
  'Theme Songs'
];

const SONGBOOK_KEY = 'cog_my_songbook_ids';

const KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'
];

const TEMPO_SUGGESTIONS = [
  { bpm: '68', label: '68 Slow' },
  { bpm: '75', label: '75 Worship' },
  { bpm: '85', label: '85 Ballad' },
  { bpm: '95', label: '95 Moderate' },
  { bpm: '100', label: '100 Praise' },
  { bpm: '110', label: '110 Medium' },
  { bpm: '120', label: '120 Upbeat' },
  { bpm: '128', label: '128 Fast' },
  { bpm: '140', label: '140 Joyful' },
];

const PRELUDE_SUGGESTIONS = [
  'Acoustic + Drum',
  'Keys',
  'Elec',
  'Acoustic',
  'Keys + Acoustic',
  'Full Band',
  'Pads',
  'Drums Only',
  'None'
];

const INTERLUDE_SUGGESTIONS = [
  'Keys + Elec (Alt)',
  'Keys/ Elec Alt',
  'Elec + Keys (Alt)',
  '(Elec + Keys)',
  'Acoustic Solo',
  'Elec Lead',
  'Full Band Dynamics',
  'None'
];

const NOTES_SUGGESTIONS = [
  "Celebrate God's power, strength, and salvation",
  "Prep for 2nd Coming",
  "God just wants our heart",
  "You washed us clean with your Blood",
  "Call to Worship & Praise",
  "Intimate Surrender & Holy Spirit",
  "Maintain purity and be Holy",
  "Giving our best to God (Offertory)"
];

export default function AdminSongEditor() {
  const { setActiveTab, setTabByName } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Screen-level tab
  const [screenTab, setScreenTab] = useState<'list' | 'setlist' | 'theme' | 'churchOwn'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── POST SONG FORM ──────────────────────────────
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [status, setStatus] = useState('Published');
  const [categories, setCategories] = useState<string[]>(['Stuthi Songs']);
  const [youtubeId, setYoutubeId] = useState('');
  const [songKey, setSongKey] = useState('F');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tempo, setTempo] = useState('100');
  const [verses, setVerses] = useState('4V');
  const [prelude, setPrelude] = useState('');
  const [interlude, setInterlude] = useState('');
  const [notes, setNotes] = useState('');
  const [postLedBy, setPostLedBy] = useState('');
  const [postLeaderSearch, setPostLeaderSearch] = useState('');
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{ id: string, title: string } | null>(null);
  const [syncReceipt, setSyncReceipt] = useState({ savedTo: '', id: '' });

  // ── MEMBER VIEW STATE ────────────────────────────
  const [memberSongs, setMemberSongs] = useState<WorshipSong[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTab, setMemberTab] = useState<'browse' | 'theme' | 'churchOwn'>('browse');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // ── POSTED SONGS LIST ───────────────────────────
  const [postedSongs, setPostedSongs] = useState<WorshipSong[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // ── EDIT MODAL ──────────────────────────────────
  const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleTe, setEditTitleTe] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editKey, setEditKey] = useState('C');
  const [editLyrics, setEditLyrics] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>(['Stuthi Songs']);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [editStatus, setEditStatus] = useState('Published');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);
  const [showEditKeyPicker, setShowEditKeyPicker] = useState(false);
  const [editTimeSignature, setEditTimeSignature] = useState('4/4');
  const [editTempo, setEditTempo] = useState('100');
  const [editVerses, setEditVerses] = useState('4V');
  const [editPrelude, setEditPrelude] = useState('');
  const [editInterlude, setEditInterlude] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLedBy, setEditLedBy] = useState('');
  const [editLeaderSearch, setEditLeaderSearch] = useState('');

  // ── Helper to calculate upcoming days of week / dates ──
  const getUpcomingDayDate = (targetDayOfWeek: number) => {
    // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const d = new Date();
    const currentDay = d.getDay();
    let diff = (targetDayOfWeek - currentDay + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const getRelativeDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const getNextSundayDate = () => getUpcomingDayDate(0);
  const getNextWednesdayDate = () => getUpcomingDayDate(3);
  const getNextFridayDate = () => getUpcomingDayDate(5);
  const getNextSaturdayDate = () => getUpcomingDayDate(6);
  const getTodayDate = () => getRelativeDate(0);
  const getTomorrowDate = () => getRelativeDate(1);

  // ── WORSHIP SERVICES & SETLIST FLOW STATE ────────
  const [worshipServices, setWorshipServices] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>('srv_sun1');
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("Sunday Service");
  const [serviceNameInput, setServiceNameInput] = useState('');
  const [serviceDateInput, setServiceDateInput] = useState('');
  const [serviceStartDateInput, setServiceStartDateInput] = useState('');
  const [serviceEndDateInput, setServiceEndDateInput] = useState('');
  const [serviceStartTimeInput, setServiceStartTimeInput] = useState('09:00 AM');
  const [serviceEndTimeInput, setServiceEndTimeInput] = useState('11:00 AM');
  const [serviceTimeInput, setServiceTimeInput] = useState('');

  // Date & Time Picker Modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'create' | 'edit'>('create');
  const [datePickerTargetField, setDatePickerTargetField] = useState<'start' | 'end'>('start');
  const [timePickerTargetField, setTimePickerTargetField] = useState<'start' | 'end'>('start');

  // Custom Service Categories state
  const [customServiceCategories, setCustomServiceCategories] = useState<any[]>([]);
  const [showAddCustomCatModal, setShowAddCustomCatModal] = useState(false);
  const [newCustomCatName, setNewCustomCatName] = useState('');
  const [newCustomCatIcon, setNewCustomCatIcon] = useState('⛪');

  // Custom Preset Names for Service Categories (under suggested names)
  const [customPresetsByCategory, setCustomPresetsByCategory] = useState<Record<string, string[]>>({});
  const [showAddCustomPresetInput, setShowAddCustomPresetInput] = useState(false);
  const [customPresetInput, setCustomPresetInput] = useState('');

  // Song selection directly inside Create Service Modal
  const [createServiceSelectedSongs, setCreateServiceSelectedSongs] = useState<WorshipSong[]>([]);
  const [createServiceSongSearch, setCreateServiceSongSearch] = useState('');
  const [createServiceSongCategory, setCreateServiceSongCategory] = useState('All');

  // Modals for Song Management in Services
  const [showSongPickerModal, setShowSongPickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');
  const [pickerSelectedSongs, setPickerSelectedSongs] = useState<WorshipSong[]>([]);

  const [showAddSetlistModal, setShowAddSetlistModal] = useState(false);
  const [editingSetlistIdx, setEditingSetlistIdx] = useState<number | null>(null);
  const [showSetlistKeyPicker, setShowSetlistKeyPicker] = useState(false);

  // Delete Confirmation Modals state for Setlist Flow
  const [serviceToDelete, setServiceToDelete] = useState<any | null>(null);
  const [setlistSongToDelete, setSetlistSongToDelete] = useState<{ index: number, song: any } | null>(null);
  const [toastNotification, setToastNotification] = useState<{ title: string, subtitle: string } | null>(null);

  // Form for New Song Creation directly into service
  const [showCreateSongModal, setShowCreateSongModal] = useState(false);
  const [creatingAndAddingSong, setCreatingAndAddingSong] = useState(false);
  const [newSongTitleEn, setNewSongTitleEn] = useState('');
  const [newSongTitleTe, setNewSongTitleTe] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongCategory, setNewSongCategory] = useState('Stuthi Songs');
  const [newSongLyrics, setNewSongLyrics] = useState('');

  const [setlistForm, setSetlistForm] = useState({
    title: '',
    titleTe: '',
    ledBy: '',
    key: 'F',
    timeSignature: '4/4',
    tempo: '100',
    verses: '4V',
    prelude: '',
    interlude: '',
    notes: '',
    isOffertory: false,
  });

  // Church Members directory for Leading Person search
  const [churchMembers, setChurchMembers] = useState<any[]>([]);
  const [showMemberPickerModal, setShowMemberPickerModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberPickerTarget, setMemberPickerTarget] = useState<'setlist' | 'post' | 'edit'>('setlist');

  const validServices: any[] = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
  const activeService: any = validServices.find(s => s && s.id === activeServiceId) || validServices[0] || {
    id: '',
    name: 'Service',
    category: 'Sunday Service',
    date: '',
    time: '',
    songs: []
  };
  const activeList: any[] = activeService?.songs || [];

  const fetchChurchMembers = async () => {
    try {
      const list = await FirestoreService.getAllMembers();
      setChurchMembers(Array.isArray(list) ? list.filter(Boolean) : []);
    } catch (e) {
      console.warn('Failed to fetch members for song leader search:', e);
    }
  };

  const fetchPostedSongs = async (forceRefresh = false) => {
    setLoadingList(true);
    try {
      const allSongs = await FirestoreService.getWorshipSongs({ forceRefresh });
      setPostedSongs(allSongs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPostedSongs();
    fetchMemberSongs();
    loadSetlists();
    loadCustomCategories();
    loadCustomPresets();
    fetchChurchMembers();
  }, []);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const fetchMemberSongs = async () => {
    try {
      const data = await FirestoreService.getWorshipSongs();
      setMemberSongs(data);
      const stored = await AsyncStorage.getItem(SONGBOOK_KEY);
      if (stored) setSavedIds(JSON.parse(stored));
    } catch (err) {
      console.error(err);
    }
  };

  const loadSetlists = async () => {
    try {
      const remoteServices = await FirestoreService.getWorshipServices();
      const validRemote = Array.isArray(remoteServices) ? remoteServices.filter(Boolean) : [];
      // Filter out any untouched dummy services that were previously auto-seeded
      const cleanedRemote = validRemote.filter((s: any) => {
        if (!s) return false;
        const isOldDummy = ['srv_sun1', 'srv_sun2', 'srv_bible', 'srv_women', 'srv_youth'].includes(s.id) && (!s.songs || s.songs.length === 0);
        return !isOldDummy;
      });
      if (cleanedRemote.length > 0) {
        setWorshipServices(cleanedRemote);
        if (!cleanedRemote.some((s: any) => s && s.id === activeServiceId)) {
          setActiveServiceId(cleanedRemote[0].id);
        }
        await AsyncStorage.setItem('@cog_worship_services', JSON.stringify(cleanedRemote));
        return;
      }

      const localServicesStr = await AsyncStorage.getItem('@cog_worship_services');
      if (localServicesStr) {
        const parsed = JSON.parse(localServicesStr);
        const validLocal = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        const cleanedLocal = validLocal.filter((s: any) => {
          if (!s) return false;
          const isOldDummy = ['srv_sun1', 'srv_sun2', 'srv_bible', 'srv_women', 'srv_youth'].includes(s.id) && (!s.songs || s.songs.length === 0);
          return !isOldDummy;
        });
        if (cleanedLocal.length > 0) {
          setWorshipServices(cleanedLocal);
          if (!cleanedLocal.some((s: any) => s && s.id === activeServiceId)) {
            setActiveServiceId(cleanedLocal[0].id);
          }
          return;
        }
      }

      // DO NOT auto-create dummy services by default. Let user create their own services.
      setWorshipServices([]);
      setActiveServiceId('');
      await AsyncStorage.setItem('@cog_worship_services', JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to load worship services:', e);
    }
  };

  const loadCustomPresets = async () => {
    try {
      const raw = await AsyncStorage.getItem('@cog_custom_category_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setCustomPresetsByCategory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load custom category presets:', e);
    }
  };

  const handleAddCustomPreset = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const cat = selectedServiceCategory || 'Sunday Service';
    const existing = customPresetsByCategory[cat] || [];
    if (!existing.includes(trimmed)) {
      const updated = {
        ...customPresetsByCategory,
        [cat]: [...existing, trimmed]
      };
      setCustomPresetsByCategory(updated);
      try {
        await AsyncStorage.setItem('@cog_custom_category_presets', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save custom category preset:', e);
      }
    }
  };

  const loadCustomCategories = async () => {
    try {
      const raw = await AsyncStorage.getItem('@cog_custom_service_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomServiceCategories(parsed.filter(Boolean));
        }
      }
    } catch (e) {
      console.warn('Failed to load custom service categories:', e);
    }
  };

  const handleAddCustomCategory = async () => {
    const name = newCustomCatName.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a name for the Service Type.');
      return;
    }
    const all = [...CHURCH_SERVICE_CATEGORIES, ...customServiceCategories];
    if (all.some(c => c.type.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Exists', 'A service type with this name already exists.');
      return;
    }

    const colorPalettes = [
      { color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
      { color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
      { color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
      { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
      { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    ];
    const palette = colorPalettes[customServiceCategories.length % colorPalettes.length];

    const newCat = {
      type: name,
      icon: newCustomCatIcon || '⛪',
      color: palette.color,
      bg: palette.bg,
      border: palette.border,
      defaultDay: 0,
      presets: [name, `${name} – Morning`, `${name} – Evening`]
    };

    const updated = [...customServiceCategories, newCat];
    setCustomServiceCategories(updated);
    try {
      await AsyncStorage.setItem('@cog_custom_service_categories', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save custom category:', e);
    }

    setSelectedServiceCategory(name);
    setServiceNameInput(name);
    setNewCustomCatName('');
    setShowAddCustomCatModal(false);
  };

  const parseServiceDateToDateObj = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = months.indexOf(monthStr);
      if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const parseServiceTimeToDateObj = (timeStr?: string): Date => {
    const now = new Date();
    if (!timeStr) return now;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    return now;
  };

  const handleDateConfirm = (d: Date) => {
    setShowDatePicker(false);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
    if (datePickerTargetField === 'end') {
      setServiceEndDateInput(formatted);
      const start = serviceStartDateInput.trim() || formatted;
      setServiceDateInput(formatted !== start ? `${start} – ${formatted}` : start);
    } else {
      setServiceStartDateInput(formatted);
      if (!serviceEndDateInput || serviceEndDateInput === serviceStartDateInput) {
        setServiceEndDateInput(formatted);
        setServiceDateInput(formatted);
      } else {
        setServiceDateInput(`${formatted} – ${serviceEndDateInput}`);
      }
    }
  };

  const handleTimeConfirm = (d: Date) => {
    setShowTimePicker(false);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formatted = `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    if (timePickerTargetField === 'end') {
      setServiceEndTimeInput(formatted);
      const start = serviceStartTimeInput.trim() || '09:00 AM';
      setServiceTimeInput(`${start} - ${formatted}`);
    } else {
      setServiceStartTimeInput(formatted);
      const end = serviceEndTimeInput.trim();
      setServiceTimeInput(end ? `${formatted} - ${end}` : formatted);
    }
  };

  const handleOpenCreateServiceModal = () => {
    setSelectedServiceCategory('Sunday Service');
    setServiceNameInput('');
    const sunDate = getNextSundayDate();
    setServiceStartDateInput(sunDate);
    setServiceEndDateInput(sunDate);
    setServiceDateInput(sunDate);
    setServiceStartTimeInput('09:00 AM');
    setServiceEndTimeInput('11:00 AM');
    setServiceTimeInput('09:00 AM - 11:00 AM');
    setCreateServiceSelectedSongs([]);
    setCreateServiceSongSearch('');
    setCreateServiceSongCategory('All');
    setShowAddCustomPresetInput(false);
    setCustomPresetInput('');
    setShowCreateServiceModal(true);
  };

  const persistServices = async (updated: any[]) => {
    const cleaned = Array.isArray(updated) ? updated.filter(Boolean) : [];
    setWorshipServices(cleaned);
    try {
      await AsyncStorage.setItem('@cog_worship_services', JSON.stringify(cleaned));
      await FirestoreService.saveWorshipServices(cleaned);
    } catch (e) {
      console.warn('Failed to persist worship services:', e);
    }
  };

  // ── SERVICE MANAGEMENT ACTIONS ────────────────────
  const handleCreateService = async () => {
    const name = serviceNameInput.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a Service Name.');
      return;
    }
    const category = selectedServiceCategory || 'Sunday Service';
    const startDate = serviceStartDateInput.trim() || serviceDateInput.trim() || getTodayDate();
    const endDate = serviceEndDateInput.trim() || startDate;
    const date = (endDate && endDate !== startDate) ? `${startDate} – ${endDate}` : startDate;
    const startTime = serviceStartTimeInput.trim() || '09:00 AM';
    const endTime = serviceEndTimeInput.trim();
    const time = endTime ? `${startTime} - ${endTime}` : startTime;

    // Map any selected songs from create service modal directly into initial setlist
    const initialSongs = createServiceSelectedSongs.map(song => ({
      id: Math.random().toString(36).substring(7),
      title: song.title,
      titleTe: song.titleTe || '',
      ledBy: song.ledBy || '',
      key: song.key || 'F',
      timeSignature: song.timeSignature || '4/4',
      tempo: song.tempo || '100',
      verses: song.verses || '4V',
      prelude: song.prelude || '',
      interlude: song.interlude || '',
      notes: song.notes || '',
      isOffertory: (song.category || '').toLowerCase().includes('offering'),
    }));

    const newService = {
      id: `srv_${Date.now()}`,
      name,
      category,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      time,
      songs: initialSongs
    };
    const currentList = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
    const updated = [...currentList, newService];
    await persistServices(updated);
    setActiveServiceId(newService.id);
    setShowCreateServiceModal(false);
    setServiceNameInput('');
    setServiceDateInput('');
    setServiceStartDateInput('');
    setServiceEndDateInput('');
    setServiceStartTimeInput('09:00 AM');
    setServiceEndTimeInput('11:00 AM');
    setServiceTimeInput('');
    setCreateServiceSelectedSongs([]);
    setCreateServiceSongSearch('');
    setCreateServiceSongCategory('All');
  };

  const handleUpdateService = async () => {
    const name = serviceNameInput.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a Service Name.');
      return;
    }
    const category = selectedServiceCategory || activeService?.category || 'Sunday Service';
    const startDate = serviceStartDateInput.trim() || activeService?.startDate || serviceDateInput.trim() || activeService?.date || getTodayDate();
    const endDate = serviceEndDateInput.trim() || startDate;
    const date = (endDate && endDate !== startDate) ? `${startDate} – ${endDate}` : startDate;
    const startTime = serviceStartTimeInput.trim() || '09:00 AM';
    const endTime = serviceEndTimeInput.trim();
    const time = endTime ? `${startTime} - ${endTime}` : startTime;
    const currentList = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
    const updated = currentList.map(s => {
      if (s && s.id === activeService?.id) {
        return { ...s, name, category, date, startDate, endDate, startTime, endTime, time };
      }
      return s;
    });
    await persistServices(updated);
    setShowEditServiceModal(false);
  };

  const handleDeleteService = (serviceId: string) => {
    const currentList = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
    const toDelete = currentList.find(s => s && s.id === serviceId);
    if (!toDelete) return;
    setServiceToDelete(toDelete);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const serviceId = serviceToDelete.id;
    const serviceName = serviceToDelete.name || 'Service';
    const currentList = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
    const updated = currentList.filter(s => s && s.id !== serviceId);
    await persistServices(updated);
    if (activeServiceId === serviceId) {
      setActiveServiceId(updated.length > 0 ? updated[0].id : '');
    }
    setShowEditServiceModal(false);
    setServiceToDelete(null);
    setToastNotification({
      title: 'Service Deleted',
      subtitle: `"${serviceName}" has been removed.`
    });
  };

  // ── SETLIST SONG ACTIONS ──────────────────────────
  const handleOpenSongPicker = () => {
    setPickerSearch('');
    setPickerCategory('All');
    setPickerSelectedSongs([]);
    setShowSongPickerModal(true);
  };

  const handleTogglePickerSongSelection = (song: WorshipSong) => {
    setPickerSelectedSongs(prev => {
      const exists = prev.some(s => s.id === song.id);
      if (exists) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleAddSelectedSongsToService = async () => {
    if (pickerSelectedSongs.length === 0) return;
    if (!activeService || !activeService.id) {
      Alert.alert('No Service', 'Please select or create a church service first.');
      return;
    }

    const newSongItems = pickerSelectedSongs.map(song => ({
      id: Math.random().toString(36).substring(7),
      title: song.title,
      titleTe: song.titleTe || '',
      ledBy: song.ledBy || '',
      key: song.key || 'F',
      timeSignature: song.timeSignature || '4/4',
      tempo: song.tempo || '100',
      verses: song.verses || '4V',
      prelude: song.prelude || '',
      interlude: song.interlude || '',
      notes: song.notes || '',
      isOffertory: (song.category || '').toLowerCase().includes('offering'),
    }));

    const currentSongs = [...(activeService.songs || [])];
    const updatedSongs = [...currentSongs, ...newSongItems];

    const updatedServices = worshipServices.map(s => {
      if (s && s.id === activeService.id) {
        return { ...s, songs: updatedSongs };
      }
      return s;
    });

    await persistServices(updatedServices);
    setShowSongPickerModal(false);
    setPickerSelectedSongs([]);
  };

  const handleSelectSongFromPicker = (song: WorshipSong) => {
    setEditingSetlistIdx(null);
    setSetlistForm({
      title: song.title,
      titleTe: song.titleTe || '',
      ledBy: song.ledBy || '',
      key: song.key || 'F',
      timeSignature: song.timeSignature || '4/4',
      tempo: song.tempo || '100',
      verses: song.verses || '4V',
      prelude: song.prelude || '',
      interlude: song.interlude || '',
      notes: song.notes || '',
      isOffertory: (song.category || '').toLowerCase().includes('offering'),
    });
    setShowSongPickerModal(false);
    setShowAddSetlistModal(true);
  };

  const handleSaveSetlistSong = async () => {
    if (!setlistForm.title.trim()) {
      Alert.alert('Required', 'Please enter a song title.');
      return;
    }
    const currentSongs = [...(activeService.songs || [])];
    if (editingSetlistIdx !== null && editingSetlistIdx >= 0 && editingSetlistIdx < currentSongs.length) {
      currentSongs[editingSetlistIdx] = {
        ...currentSongs[editingSetlistIdx],
        ...setlistForm
      };
    } else {
      currentSongs.push({
        ...setlistForm,
        id: Math.random().toString(36).substring(7)
      });
    }

    const updatedServices = worshipServices.map(s => {
      if (s.id === activeService.id) {
        return { ...s, songs: currentSongs };
      }
      return s;
    });

    await persistServices(updatedServices);
    setShowAddSetlistModal(false);
    setEditingSetlistIdx(null);
  };

  const promptDeleteSetlistSong = (index: number, song: any) => {
    setSetlistSongToDelete({ index, song });
  };

  const confirmDeleteSetlistSong = async () => {
    if (!setlistSongToDelete) return;
    const { index, song } = setlistSongToDelete;
    const songTitle = song?.title || 'Song';
    const currentSongs = [...(activeService.songs || [])];
    currentSongs.splice(index, 1);
    const updatedServices = worshipServices.map(s => {
      if (s.id === activeService.id) {
        return { ...s, songs: currentSongs };
      }
      return s;
    });
    await persistServices(updatedServices);
    setSetlistSongToDelete(null);
    setToastNotification({
      title: 'Song Removed',
      subtitle: `"${songTitle}" removed from this service.`
    });
  };

  const handleDeleteSetlistSong = (index: number) => {
    const currentSongs = [...(activeService.songs || [])];
    if (index >= 0 && index < currentSongs.length) {
      promptDeleteSetlistSong(index, currentSongs[index]);
    }
  };

  const handleMoveSongInService = async (index: number, direction: 'up' | 'down') => {
    const currentSongs = [...(activeService.songs || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentSongs.length) return;
    const temp = currentSongs[index];
    currentSongs[index] = currentSongs[targetIdx];
    currentSongs[targetIdx] = temp;
    const updatedServices = worshipServices.map(s => {
      if (s.id === activeService.id) {
        return { ...s, songs: currentSongs };
      }
      return s;
    });
    await persistServices(updatedServices);
  };

  const handleCreateAndAddSongToService = async () => {
    if (!newSongTitleEn.trim()) {
      Alert.alert('Required', 'Please enter Song Title (English).');
      return;
    }
    if (!newSongLyrics.trim()) {
      Alert.alert('Required', 'Please enter song lyrics.');
      return;
    }
    setCreatingAndAddingSong(true);
    try {
      const receipt = await FirestoreService.createWorshipSong({
        title: newSongTitleEn.trim(),
        titleTe: newSongTitleTe.trim(),
        artist: newSongArtist.trim(),
        lyrics: newSongLyrics.trim(),
        category: newSongCategory,
        key: setlistForm.key || 'F',
        timeSignature: setlistForm.timeSignature || '4/4',
        tempo: setlistForm.tempo || '100',
        verses: setlistForm.verses || '4V',
        prelude: setlistForm.prelude || '',
        interlude: setlistForm.interlude || '',
        notes: setlistForm.notes || '',
        ledBy: setlistForm.ledBy || '',
        status: 'Published'
      });
      const newSongId = typeof receipt === 'string' ? receipt : (receipt as any)?.id || Math.random().toString(36).substring(7);

      const songToAdd = {
        id: Math.random().toString(36).substring(7),
        songId: newSongId,
        title: newSongTitleEn.trim(),
        titleTe: newSongTitleTe.trim(),
        artist: newSongArtist.trim(),
        category: newSongCategory,
        key: setlistForm.key || 'F',
        timeSignature: setlistForm.timeSignature || '4/4',
        tempo: setlistForm.tempo || '100',
        verses: setlistForm.verses || '4V',
        prelude: setlistForm.prelude || '',
        interlude: setlistForm.interlude || '',
        notes: setlistForm.notes || '',
        ledBy: setlistForm.ledBy || '',
        isOffertory: setlistForm.isOffertory || false,
      };

      const currentSongs = [...(activeService.songs || []), songToAdd];
      const updatedServices = worshipServices.map(s => {
        if (s.id === activeService.id) {
          return { ...s, songs: currentSongs };
        }
        return s;
      });

      await persistServices(updatedServices);

      FirestoreService.clearWorshipSongsCache();
      fetchPostedSongs(true);

      setShowCreateSongModal(false);
      setNewSongTitleEn('');
      setNewSongTitleTe('');
      setNewSongArtist('');
      setNewSongLyrics('');
      setSetlistForm({
        title: '',
        titleTe: '',
        ledBy: '',
        key: 'F',
        timeSignature: '4/4',
        tempo: '100',
        verses: '4V',
        prelude: '',
        interlude: '',
        notes: '',
        isOffertory: false,
      });

      Alert.alert('Success', `"${songToAdd.title}" created in library and added to ${activeService?.name || 'Service'}!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create and add song.');
    } finally {
      setCreatingAndAddingSong(false);
    }
  };

  const handleShareSetlist = async () => {
    if (!activeService || !activeService.id) {
      Alert.alert('No Service', 'Please select or create a church service first.');
      return;
    }
    const churchTitle = activeChurch?.name || 'Worship Service';
    const cat = getServiceCategoryMeta(activeService?.category, activeService?.name);
    let msg = `🎵 *${cat.icon} SETLIST FLOW: ${activeService?.name || 'Service'}*\n`;
    msg += `⛪ *${churchTitle}*\n`;
    msg += `📅 *Date:* ${activeService?.date || 'TBD'}`;
    if (activeService?.time) msg += ` | ⏰ *Time:* ${activeService.time}`;
    msg += `\n\n`;
    if (!activeList || activeList.length === 0) {
      msg += `(No songs scheduled for this service yet)\n`;
    } else {
      activeList.forEach((s: any, idx: number) => {
        msg += `*${idx + 1}. ${s.title}* ${s.isOffertory ? '(OFFERTORY)' : ''}\n`;
        msg += `  • Key: ${s.key || 'N/A'} | Time: ${s.timeSignature || '4/4'} | Tempo: ${s.tempo || '100'} BPM | Verses: ${s.verses || '4V'}\n`;
        if (s.ledBy) msg += `  • Leading: ${s.ledBy}\n`;
        if (s.prelude) msg += `  • Prelude: ${s.prelude}\n`;
        if (s.interlude) msg += `  • Interlude: ${s.interlude}\n`;
        if (s.notes) msg += `  • Notes: ${s.notes}\n`;
        msg += `\n`;
      });
    }
    msg += `📲 View full setlist details & chords in WeChristian App!`;
    try {
      await Share.share({ message: msg });
    } catch (e) {
      console.log(e);
    }
  };

  // ── PUBLISH NEW SONG ─────────────────────────────
  const handlePublishSong = async () => {
    if (!titleEn.trim()) {
      Alert.alert('Required', 'Please enter a Song Title (English).');
      return;
    }
    if (!lyrics.trim()) {
      Alert.alert('Required', 'Please enter the Song Lyrics.');
      return;
    }
    setSubmitting(true);
    try {
      const primaryCategory = categories.join(';') || 'Other';
      const receipt = await FirestoreService.createWorshipSong({
        title: titleEn.trim(),
        titleTe: titleTe.trim(),
        artist: artist.trim(),
        lyrics: lyrics.trim(),
        ledBy: postLedBy.trim(),
        key: songKey,
        timeSignature,
        tempo,
        verses,
        prelude,
        interlude,
        notes,
        status,
        category: primaryCategory,
        youtubeId: youtubeId.trim()
      });
      const newSongId = typeof receipt === 'string' ? receipt : (receipt as any)?.id || 'Unknown';
      setSyncReceipt({ savedTo: 'Firebase DB', id: newSongId });

      try {
        const churchId = await FirestoreService.getChurchId();
        await FirestoreService.createNotificationBroadcast({
          title: `🎵 New Song: ${titleEn.trim()}`,
          content: `A new worship song "${titleEn.trim()}" has been posted under ${primaryCategory}!`,
          date: new Date().toISOString().split('T')[0],
          type: 'song',
          targetChurchId: churchId,
          relatedId: newSongId !== 'Unknown' ? newSongId : null
        });
      } catch { /* rules may block — OK */ }

      setShowSuccess(true);
      setShowPostModal(false); // Close modal on success
      FirestoreService.clearWorshipSongsCache();
      fetchPostedSongs(true);
    } catch (error: any) {
      Alert.alert('Salesforce Sync Error', error.message || 'Failed to sync with Salesforce.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitleEn(''); setTitleTe(''); setLyrics(''); setYoutubeId('');
    setArtist(''); setCategories(['Stuthi Songs']); setStatus('Published');
    setSongKey('F'); setTimeSignature('4/4'); setTempo('100'); setVerses('4V');
    setPrelude(''); setInterlude(''); setNotes(''); setPostLedBy('');
    setPostLeaderSearch('');
  };

  const handleUpload1000 = async () => {
    try {
      Alert.alert('Uploading', 'Starting bulk upload...');
      const songs = require('../../../master_songs.json');
      const db = getFirestore();
      
      let batch = writeBatch(db);
      let count = 0;
      let total = 0;

      for (const song of songs) {
        const newRef = doc(collection(db, 'masterSongs'));
        batch.set(newRef, {
           ...song,
           createdAt: serverTimestamp()
        });
        count++;
        total++;

        if (count === 400) {
           await batch.commit();
           batch = writeBatch(db);
           count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
      Alert.alert('Success', `Uploaded ${total} global master songs!`);
      fetchPostedSongs();
    } catch(err: any) {
      Alert.alert('Error', err.message);
    }
  };


  // ── OPEN EDIT MODAL ──────────────────────────────
  const openEdit = (song: WorshipSong) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditTitleTe(song.titleTe || '');
    setEditArtist(song.artist || '');
    setEditLyrics(song.lyrics || '');
    setEditLedBy(song.ledBy || '');
    setEditLeaderSearch('');
    setEditKey(song.key || 'C');
    setEditTimeSignature(song.timeSignature || '4/4');
    setEditTempo(song.tempo || '100');
    setEditVerses(song.verses || '4V');
    setEditPrelude(song.prelude || '');
    setEditInterlude(song.interlude || '');
    setEditNotes(song.notes || '');
    // Split semicolon-separated categories back into array
    const cats = (song.category || 'Stuthi Songs')
      .split(';').map(c => c.trim()).filter(Boolean);
    setEditCategories(cats);
    setEditYoutubeId(song.youtubeId || '');
    setEditStatus('Published');
  };

  const handleSaveEdit = async () => {
    if (!editingSong) return;
    if (!editTitle.trim()) { Alert.alert('Required', 'Song title is required.'); return; }
    setSavingEdit(true);
    try {
      const primaryEditCategory = editCategories.join(';') || 'Other';
      await FirestoreService.updateWorshipSong(editingSong.id, {
        title: editTitle.trim(),
        titleTe: editTitleTe.trim(),
        artist: editArtist.trim(),
        lyrics: editLyrics.trim(),
        ledBy: editLedBy.trim(),
        key: editKey,
        timeSignature: editTimeSignature,
        tempo: editTempo,
        verses: editVerses,
        prelude: editPrelude,
        interlude: editInterlude,
        notes: editNotes,
        category: primaryEditCategory,
        status: editStatus,
        youtubeId: editYoutubeId.trim()
      });
      setShowUpdateSuccess(true);
      setEditingSong(null);
      FirestoreService.clearWorshipSongsCache();
      fetchPostedSongs(true);

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update song.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── RENDER POSTED SONG ITEM ──────────────────────
  const [adminSelectedSong, setAdminSelectedSong] = useState<WorshipSong | null>(null);

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    try {
      await FirestoreService.deleteWorshipSong(songToDelete.id);
      FirestoreService.clearWorshipSongsCache();
      fetchPostedSongs(true);
      setSongToDelete(null);

      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete song.');
      setSongToDelete(null);
    }
  };

  const handleToggleTheme = async (song: WorshipSong) => {
    try {
      const currentCats = (song.category || 'Stuthi Songs')
        .split(';').map(c => c.trim()).filter(Boolean);
      let newCats: string[];
      if (currentCats.includes('Theme Songs')) {
        // Remove Theme Songs; keep remaining categories (fallback to Stuthi Songs)
        newCats = currentCats.filter(c => c !== 'Theme Songs');
        if (newCats.length === 0) newCats = ['Stuthi Songs'];
      } else {
        // Add Theme Songs to existing categories
        newCats = [...currentCats, 'Theme Songs'];
      }
      const newCategory = newCats.join(';');
      setPostedSongs(prev => prev.map(s => s.id === song.id ? { ...s, category: newCategory } : s));

      await FirestoreService.updateWorshipSong(song.id, { category: newCategory });
    } catch (e: any) {
      fetchPostedSongs();
      Alert.alert('Error', 'Failed to toggle theme status.');
    }
  };

  const renderSongItem = ({ item, index }: { item: WorshipSong; index: number }) => {
    const isTheme = (item.category || '').split(';').map(c => c.trim()).includes('Theme Songs');
    return (
      <TouchableOpacity style={styles.songItem} onPress={() => setAdminSelectedSong(item)}>
        <View style={styles.songIconBox}>
          <Music size={16} color="#1a2d5a" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.songItemTitle} numberOfLines={1}>
            {postedSongs.findIndex(s => s.id === item.id) + 1}. {item.title}
            {item.isDefault ? <Text style={{color: '#c0392b', fontSize: 10}}> [GLOBAL]</Text> : null}
          </Text>
          <Text style={styles.songItemSub} numberOfLines={1}>
            {item.category || 'Other'}{item.ledBy ? ` · 🎤 ${item.ledBy}` : ''}{item.key ? ` (${item.key})` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => handleToggleTheme(item)} 
            style={{ 
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, 
              borderColor: isTheme ? '#f59e0b' : '#e2e8f0', 
              backgroundColor: isTheme ? '#fef3c7' : '#f8fafc',
              flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 
            }}>
            <Star size={12} color={isTheme ? "#d97706" : "#94a3b8"} fill={isTheme ? "#f59e0b" : "none"} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: isTheme ? '#d97706' : '#64748b' }}>
              {isTheme ? 'THEME SONG' : 'MAKE THEME'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 4 }}>
            <Pencil size={15} color="#1a2d5a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSongToDelete({ id: item.id, title: item.title })} style={{ padding: 4 }}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSongPreviewModal = () => {
    if (!adminSelectedSong) return null;
    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setAdminSelectedSong(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
              borderBottomWidth: 0.5, borderColor: '#cbd5e1', paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a' }} numberOfLines={2}>{adminSelectedSong.title}</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: '700' }}>{adminSelectedSong.titleTe || ''}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, color: '#c0392b', fontWeight: '800' }}>{adminSelectedSong.category || 'Other'}</Text>
                  {adminSelectedSong.ledBy && (
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#1D4ED8' }}>🎤 Leading: {adminSelectedSong.ledBy}</Text>
                  )}
                  {adminSelectedSong.key && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Key: {adminSelectedSong.key}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setAdminSelectedSong(null)}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, color: '#1a2d5a' }}>LYRICS & SCRIPTS · సాహిత్యం</Text>
              <View style={{ borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                <Text style={{ fontSize: 13, lineHeight: 23, fontWeight: '500', fontStyle: 'italic', color: '#334155' }}>
                  {adminSelectedSong.lyrics || 'Lyrics are being updated by the administrator.'}
                </Text>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ── MEMBER VIEW UI ────────────────────────────────
  const renderMemberView = () => {
    const memberSongsWithIndex = memberSongs.map((s, index) => ({ ...s, absoluteIndex: index }));
    const browseSongs = memberSongsWithIndex.filter(s => {
      const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
      if (cats.length === 1 && cats[0] === 'Theme Songs') return false;
      const q = memberSearch.toLowerCase().trim();
      const numberMatch = (s.absoluteIndex + 1).toString().includes(q);
      return !q || s.title.toLowerCase().includes(q) || (s.titleTe && s.titleTe.toLowerCase().includes(q)) || numberMatch;
    });
    const themeSongs = memberSongsWithIndex.filter(s => {
      const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
      if (!cats.includes('Theme Songs')) return false;
      const q = memberSearch.toLowerCase().trim();
      const numberMatch = (s.absoluteIndex + 1).toString().includes(q);
      return !q || s.title.toLowerCase().includes(q) || (s.titleTe && s.titleTe.toLowerCase().includes(q)) || numberMatch;
    });
    const displaySongs = memberTab === 'browse' ? browseSongs : themeSongs;

    return (
      <View style={{ flex: 1, backgroundColor: '#EDE8DC' }}>
        {/* Member View Header */}
        <View style={{ backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', opacity: 0.8 }}>
            👁 ADMIN PREVIEW: Member Songs View
          </Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#FFFFFF', margin: 16, borderRadius: 14, padding: 4, gap: 4, elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' }}>
          <TouchableOpacity
            style={[{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
              memberTab === 'browse' && { backgroundColor: '#1a2d5a' }]}
            onPress={() => setMemberTab('browse')}>
            <Music size={13} color={memberTab === 'browse' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: memberTab === 'browse' ? '#fff' : '#64748b' }}>Browse Songs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
              memberTab === 'theme' && { backgroundColor: '#1a2d5a' }]}
            onPress={() => setMemberTab('theme')}>
            <Music size={13} color={memberTab === 'theme' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: memberTab === 'theme' ? '#fff' : '#64748b' }}>Theme Songs</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
          borderRadius: 12, paddingHorizontal: 14, height: 48, backgroundColor: '#FFFFFF',
          elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' }}>
          <Music size={16} color="#1a2d5a" />
          <TextInput
            placeholder={memberTab === 'browse' ? 'Search songs...' : 'Search theme songs...'}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 8, color: '#1a2d5a' }}
            value={memberSearch}
            onChangeText={setMemberSearch}
          />
        </View>

        {/* Song List */}
        <FlatList
          data={displaySongs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={fetchMemberSongs}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={() => (
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8,
              marginHorizontal: 16, marginBottom: 10, marginTop: 4 }}>
              {memberTab === 'browse' ? 'ALL SONGS' : 'THEME SONGS'} · {displaySongs.length} Songs
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ borderRadius: 14, borderWidth: 1, borderColor: 'rgba(26,45,90,0.08)', marginHorizontal: 16,
                marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FFFFFF',
                elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 4 }}
              onPress={() => setAdminSelectedSong(item)}>
              <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
                marginRight: 12, backgroundColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }}>{item.absoluteIndex + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ fontSize: 11, marginTop: 2, fontWeight: '600', color: '#64748B' }} numberOfLines={1}>
                  {item.titleTe ? `${item.titleTe} · ` : ''}{item.artist}
                </Text>
              </View>
              <Music size={14} color="#1a2d5a" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Music size={44} color="#cbd5e1" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a', marginTop: 12 }}>No Songs</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                {memberTab === 'theme' ? 'Mark songs as "Is Theme Song" to show them here.' : 'No songs found.'}
              </Text>
            </View>
          )}
        />
      </View>
    );
  };

  // ── POST SONG FORM UI ────────────────────────────
  const renderPostForm = () => (
    <View style={{ flex: 1 }}>
      {/* ── CARD 1: SONG DETAILS & LEADER ── */}
      <View style={styles.studioCard}>
        <View style={styles.studioCardHeader}>
          <View style={styles.studioCardTitleRow}>
            <Music size={16} color="#1a2d5a" />
            <Text style={styles.studioCardTitle}>SONG IDENTITY & LEADER</Text>
          </View>
        </View>

        {/* English Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.studioLabel}>SONG TITLE (ENGLISH) *</Text>
          <TextInput
            style={styles.studioInput}
            placeholder="e.g. Amazing Grace, Way Maker..."
            placeholderTextColor="#94A3B8"
            value={titleEn}
            onChangeText={setTitleEn}
          />
        </View>

        {/* Telugu Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.studioLabel}>SONG TITLE (TELUGU)</Text>
          <TextInput
            style={styles.studioInput}
            placeholder="ఉదాహరణ: అద్భుతమైన కృప..."
            placeholderTextColor="#94A3B8"
            value={titleTe}
            onChangeText={setTitleTe}
          />
        </View>

        {/* YouTube Video Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.studioLabel}>YOUTUBE VIDEO LINK</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 46 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626', marginRight: 6 }}>▶ YouTube</Text>
            <TextInput
              style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '600' }}
              placeholder="https://youtu.be/... or Video ID"
              placeholderTextColor="#94A3B8"
              value={youtubeId}
              onChangeText={setYoutubeId}
            />
            {youtubeId.length > 0 && (
              <TouchableOpacity onPress={() => setYoutubeId('')}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Artist / Band */}
        <View style={styles.inputGroup}>
          <Text style={styles.studioLabel}>ARTIST / BAND (Optional)</Text>
          <TextInput
            style={styles.studioInput}
            placeholder="e.g. Hillsong, Bethel, Local Choir..."
            placeholderTextColor="#94A3B8"
            value={artist}
            onChangeText={setArtist}
          />
        </View>

        {/* Song Leader Search Section */}
        <View style={{ marginTop: 6, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.studioLabel}>SONG LEADER / LEADING PERSON</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#BFDBFE'
              }}
              onPress={() => {
                setMemberPickerTarget('post');
                setMemberSearchQuery('');
                setShowMemberPickerModal(true);
              }}
            >
              <Users size={12} color="#1D4ED8" />
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>Browse Directory</Text>
            </TouchableOpacity>
          </View>

          {postLedBy ? (
            /* Selected Person Card */
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F0FDF4',
              borderWidth: 1,
              borderColor: '#BBF7D0',
              borderRadius: 12,
              padding: 10
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#15803D', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                    {postLedBy.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#14532D' }} numberOfLines={1}>{postLedBy}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>🎤 Designated Song Leader</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => { setPostLedBy(''); setPostLeaderSearch(''); }}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#DCFCE7' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Search Church Member Input */
            <View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 46
              }}>
                <Search size={16} color="#3B82F6" />
                <TextInput
                  style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '600', marginLeft: 8 }}
                  value={postLeaderSearch}
                  onChangeText={setPostLeaderSearch}
                  placeholder="Type member name or phone to search..."
                  placeholderTextColor="#94A3B8"
                />
                {postLeaderSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPostLeaderSearch('')} style={{ padding: 4 }}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Live Autocomplete Results */}
              {postLeaderSearch.trim().length > 0 && (
                <View style={{
                  marginTop: 6,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  maxHeight: 180,
                  overflow: 'hidden',
                  elevation: 3
                }}>
                  <ScrollView nestedScrollEnabled>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        backgroundColor: '#EFF6FF',
                        borderBottomWidth: 1,
                        borderBottomColor: '#DBEAFE'
                      }}
                      onPress={() => {
                        setPostLedBy(postLeaderSearch.trim());
                        setPostLeaderSearch('');
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>
                        Use: "{postLeaderSearch.trim()}"
                      </Text>
                      <CheckCircle size={14} color="#1D4ED8" />
                    </TouchableOpacity>

                    {churchMembers
                      .filter(m => {
                        if (!m) return false;
                        const q = postLeaderSearch.toLowerCase().trim();
                        const name = (m.name || m.firstName || '').toLowerCase();
                        const phone = (m.phone || '').toLowerCase();
                        return name.includes(q) || phone.includes(q);
                      })
                      .slice(0, 8)
                      .map(m => {
                        const name = m?.name || m?.firstName || 'Member';
                        return (
                          <TouchableOpacity
                            key={m?.id || name}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: '#F1F5F9'
                            }}
                            onPress={() => {
                              setPostLedBy(name);
                              setPostLeaderSearch('');
                            }}
                          >
                            <View style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: '#1a2d5a',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 10
                            }}>
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                                {name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2d5a' }}>{name}</Text>
                              {m.phone && <Text style={{ fontSize: 10, color: '#64748B' }}>{m.phone}</Text>}
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>Select</Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── CARD 2: MUSICAL ARRANGEMENT & BAND FLOW ── */}
      <View style={styles.studioCard}>
        <View style={styles.studioCardHeader}>
          <View style={styles.studioCardTitleRow}>
            <Sliders size={15} color="#1a2d5a" />
            <Text style={styles.studioCardTitle}>MUSICAL ARRANGEMENT & BAND FLOW</Text>
          </View>
          <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#1D4ED8' }}>SETLIST CHART</Text>
          </View>
        </View>

        {/* 4 Aligned Columns */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          {/* KEY */}
          <View style={{ flex: 1 }}>
            <Text style={styles.colHeaderLabel} numberOfLines={1}>KEY</Text>
            <TouchableOpacity
              style={styles.colInputBox}
              onPress={() => setShowKeyPicker(true)}
            >
              <Text style={{ color: '#1a2d5a', fontWeight: '900', fontSize: 14 }}>{songKey || 'F'}</Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* TIME SIGNATURE */}
          <View style={{ flex: 1 }}>
            <Text style={styles.colHeaderLabel} numberOfLines={1}>TIME SIG</Text>
            <View style={styles.colInputBox}>
              <TextInput
                style={styles.colInputText}
                placeholder="4/4"
                placeholderTextColor="#94A3B8"
                value={timeSignature}
                onChangeText={setTimeSignature}
              />
            </View>
          </View>

          {/* TEMPO WITH EMBEDDED BPM BADGE */}
          <View style={{ flex: 1 }}>
            <Text style={styles.colHeaderLabel} numberOfLines={1}>TEMPO</Text>
            <View style={[styles.colInputBox, { paddingHorizontal: 6 }]}>
              <TextInput
                style={[styles.colInputText, { paddingRight: 2 }]}
                placeholder="100"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={tempo}
                onChangeText={setTempo}
              />
              <Text style={{ fontSize: 8, fontWeight: '900', color: '#94A3B8' }}>BPM</Text>
            </View>
          </View>

          {/* VERSES */}
          <View style={{ flex: 1 }}>
            <Text style={styles.colHeaderLabel} numberOfLines={1}>VERSES</Text>
            <View style={styles.colInputBox}>
              <TextInput
                style={styles.colInputText}
                placeholder="4V"
                placeholderTextColor="#94A3B8"
                value={verses}
                onChangeText={setVerses}
              />
            </View>
          </View>
        </View>

        {/* Quick Tempo Presets Ribbon (Horizontal Scroll so it never wraps awkwardly!) */}
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#94A3B8' }}>TEMPO:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {[
              { label: 'Slow (72 BPM)', val: '72' },
              { label: 'Mid (96 BPM)', val: '96' },
              { label: 'Fast (124 BPM)', val: '124' },
              { label: 'Upbeat (138 BPM)', val: '138' },
            ].map(p => {
              const isSelected = tempo === p.val;
              return (
                <TouchableOpacity
                  key={p.val}
                  onPress={() => setTempo(p.val)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#1a2d5a' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: isSelected ? '#1a2d5a' : '#E2E8F0'
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Prelude & Interlude Live Arrangement */}
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Prelude */}
            <View style={{ flex: 1 }}>
              <Text style={styles.studioLabel}>PRELUDE INSTRUMENTS</Text>
              <TextInput
                style={[styles.studioInput, { marginBottom: 6 }]}
                placeholder="e.g. Acoustic + Drum"
                placeholderTextColor="#94A3B8"
                value={prelude}
                onChangeText={setPrelude}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                {PRELUDE_SUGGESTIONS.map(sug => {
                  const isSelected = prelude === sug;
                  return (
                    <TouchableOpacity
                      key={sug}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: isSelected ? '#0D9488' : '#F0FDFA',
                        borderWidth: 1,
                        borderColor: isSelected ? '#0D9488' : '#CCFBF1'
                      }}
                      onPress={() => setPrelude(sug)}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : '#0F766E' }}>{sug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Interlude */}
            <View style={{ flex: 1 }}>
              <Text style={styles.studioLabel}>INTERLUDE ARRANGEMENT</Text>
              <TextInput
                style={[styles.studioInput, { marginBottom: 6 }]}
                placeholder="e.g. Keys + Elec"
                placeholderTextColor="#94A3B8"
                value={interlude}
                onChangeText={setInterlude}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                {INTERLUDE_SUGGESTIONS.map(sug => {
                  const isSelected = interlude === sug;
                  return (
                    <TouchableOpacity
                      key={sug}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: isSelected ? '#2563EB' : '#EFF6FF',
                        borderWidth: 1,
                        borderColor: isSelected ? '#2563EB' : '#DBEAFE'
                      }}
                      onPress={() => setInterlude(sug)}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : '#1D4ED8' }}>{sug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Thematic Notes */}
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.studioLabel}>WORSHIP & THEMATIC NOTES</Text>
            {notes ? (
              <TouchableOpacity onPress={() => setNotes('')}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            style={[styles.studioInput, { height: 56, textAlignVertical: 'top', paddingTop: 8, marginBottom: 8 }]}
            multiline
            placeholder="e.g. Celebrate God's power, grace and praise..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {NOTES_SUGGESTIONS.map(sug => {
              const isAdded = (notes || '').includes(sug);
              return (
                <TouchableOpacity
                  key={sug}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: isAdded ? '#F59E0B' : '#FEF3C7',
                    borderWidth: 1,
                    borderColor: isAdded ? '#D97706' : '#FDE68A'
                  }}
                  onPress={() => {
                    if (!notes.trim()) setNotes(sug);
                    else if (!notes.includes(sug)) setNotes(`${notes} • ${sug}`);
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isAdded ? '#fff' : '#92400E' }}>
                    {isAdded ? '✓ ' : '+ '}{sug}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── CARD 3: CATEGORIES, LYRICS & PUBLISH STATUS ── */}
      <View style={styles.studioCard}>
        {/* Categories */}
        <View style={styles.studioCardHeader}>
          <View style={styles.studioCardTitleRow}>
            <Text style={styles.studioCardTitle}>CATEGORIES & THEMES</Text>
          </View>
          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>
            {categories.length} Selected
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {CATEGORIES.map(cat => {
            const isThemeCat = cat === 'Theme Songs';
            const isSelected = categories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isSelected ? (isThemeCat ? '#D97706' : '#1a2d5a') : '#E2E8F0',
                  backgroundColor: isSelected ? (isThemeCat ? '#FEF3C7' : '#1a2d5a') : '#F8FAFC',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }]}
                onPress={() => {
                  setCategories(prev =>
                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                  );
                }}
              >
                {isThemeCat && <Star size={11} color={isSelected ? '#D97706' : '#94A3B8'} fill={isSelected ? '#F59E0B' : 'none'} />}
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isSelected ? (isThemeCat ? '#B45309' : '#FFFFFF') : '#475569'
                }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Song Lyrics & Scripts (Clean, no +Verse/+Chorus/+Bridge buttons) */}
        <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <Text style={[styles.studioLabel, { marginBottom: 8 }]}>SONG LYRICS & SCRIPTS *</Text>
          <TextInput
            style={[styles.studioInput, {
              height: 240,
              textAlignVertical: 'top',
              paddingTop: 12,
              paddingHorizontal: 12,
              lineHeight: 20,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontSize: 13
            }]}
            placeholder={`Verse 1:\nAmazing grace! How sweet the sound...\n\nChorus:\nMy chains are gone, I've been set free...`}
            placeholderTextColor="#94A3B8"
            multiline
            value={lyrics}
            onChangeText={setLyrics}
          />
        </View>

        {/* Publish Status Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }}>Publish Status</Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>
              {status === 'Published' ? 'Visible in church library' : 'Saved as private draft'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 }, status === 'Published' ? { backgroundColor: '#15803D', borderColor: '#15803D' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
              onPress={() => setStatus('Published')}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: status === 'Published' ? '#fff' : '#64748B' }}>Published</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 }, status === 'Draft' ? { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
              onPress={() => setStatus('Draft')}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: status === 'Draft' ? '#fff' : '#64748B' }}>Draft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Save Action Button */}
      <TouchableOpacity
        style={[{
          backgroundColor: '#15803D',
          height: 52,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          elevation: 4,
          shadowColor: '#15803D',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          marginTop: 6
        }, submitting && { backgroundColor: '#94A3B8' }]}
        onPress={handlePublishSong}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Save size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>Publish Song to Church Library</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPostModal = () => (
    <Modal visible={showPostModal} animationType="slide" onRequestClose={() => setShowPostModal(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Top App Bar with Close and Centered Title - NO duplicate Publish button! */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          elevation: 2,
          shadowColor: '#1a2d5a',
          shadowOpacity: 0.05,
          shadowRadius: 4
        }}>
          <TouchableOpacity
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setShowPostModal(false)}
          >
            <X size={20} color="#334155" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a2d5a' }}>Publish New Song</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>Worship Library & Setlist Charts</Text>
          </View>

          {/* Balanced spacer so title is centered without duplicate button */}
          <View style={{ width: 36 }} />
        </View>

        {/* Full-Height Smooth Scrollable Content with Ample Bottom Room */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {renderPostForm()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ── POSTED SONGS LIST UI ─────────────────────────
  const renderPostedList = () => (
    <View style={{ flex: 1 }}>
      {loadingList ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#c0392b" />
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>{screenTab === 'theme' ? 'Theme Songs' : screenTab === 'churchOwn' ? 'Church Songs' : 'All Worship Songs'}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countTxt}>{postedSongs.filter(s => {
                  if (screenTab === 'theme' && !(s.category || '').includes('Theme Songs')) return false;
                  if (screenTab === 'churchOwn' && !s.isChurchOwn) return false;
                  return true;
                }).length} Total</Text>
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', marginBottom: 0, paddingHorizontal: 0 }]}
                  placeholder="Search songs by title or artist..."
                  placeholderTextColor="#94a3b8"
                  value={listSearchQuery}
                  onChangeText={setListSearchQuery}
                />
                {listSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setListSearchQuery('')} style={{ padding: 4 }}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          <FlatList
            data={postedSongs.filter(s => {
              // Text Search filter
              const q = listSearchQuery.trim().toLowerCase();
              const titleEnMatch = s.title ? s.title.toLowerCase().includes(q) : false;
              const titleTeMatch = s.titleTe ? s.titleTe.toLowerCase().includes(q) : false;
              const artistMatch = s.artist ? s.artist.toLowerCase().includes(q) : false;
              
              const absoluteIndex = postedSongs.findIndex(ps => ps.id === s.id);
              const numberMatch = (absoluteIndex + 1).toString().includes(q);
              
              const matchesSearch = !q || titleEnMatch || titleTeMatch || artistMatch || numberMatch;
              if (!matchesSearch) return false;

              const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
              
              // Theme Songs Tab filter
              if (screenTab === 'theme' && !cats.includes('Theme Songs')) return false;
              
              // Church Own Songs Tab filter
              if (screenTab === 'churchOwn' && !s.isChurchOwn) return false;

              // Category Ribbon filter
              if (selectedCategory !== 'All' && !cats.includes(selectedCategory)) return false;

              return true;
            })}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Music size={44} color="#cbd5e1" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a', marginTop: 12 }}>No songs yet</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Post your first song using the "Post Song" tab.</Text>
            </View>
          )}
          refreshing={loadingList}
          onRefresh={() => fetchPostedSongs(true)}
          ListFooterComponent={() => loadingMore ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#1a2d5a" />
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Loading more songs...</Text>
            </View>
          ) : null}
        />
        </>
      )}
    </View>
  );

  // ── CHURCH SERVICE CATEGORIES & SETLIST FLOW ──────
  const CHURCH_SERVICE_CATEGORIES = [
    {
      type: 'Sunday Service',
      icon: '⛪',
      color: '#1a2d5a',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      defaultDay: 0,
      presets: ['Sunday Service – 1st Service', 'Sunday Service – 2nd Service', 'Sunday Evening Service']
    },
    {
      type: 'Bible Study',
      icon: '📖',
      color: '#B45309',
      bg: '#FEF3C7',
      border: '#FDE68A',
      defaultDay: 3,
      presets: ['Wednesday Bible Study', 'Thursday Bible Study', 'Epistle to Romans Study', 'Weekly Bible Study']
    },
    {
      type: "Women's Fasting Prayer",
      icon: '🙏',
      color: '#BE185D',
      bg: '#FDF2F8',
      border: '#FBCFE8',
      defaultDay: 5,
      presets: ["Friday Women's Fasting Prayer", "Monthly Women's Fasting Prayer", "Esther Prayer Group"]
    },
    {
      type: 'Youth Meeting',
      icon: '🔥',
      color: '#C2410C',
      bg: '#FFF7ED',
      border: '#FED7AA',
      defaultDay: 6,
      presets: ['Saturday Youth Meeting', 'Youth Worship Night', 'Ignite Youth Fellowship']
    },
    {
      type: 'Cottage / House Prayer',
      icon: '🏠',
      color: '#047857',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      defaultDay: 2,
      presets: ['Tuesday Cottage Prayer', 'House Blessing & Prayer', 'Area Cell Group Prayer']
    },
    {
      type: 'All-Night Prayer',
      icon: '🌙',
      color: '#4338CA',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      defaultDay: 5,
      presets: ['Monthly All-Night Prayer', 'Fasting & Night Vigil', 'Chain Fasting Prayer']
    },
    {
      type: 'Midweek Prayer',
      icon: '🕊️',
      color: '#0369A1',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      defaultDay: 3,
      presets: ['Wednesday Prayer Service', 'Thursday Intercessory Prayer', 'Congregational Prayer']
    },
    {
      type: 'Sunday School / Kids',
      icon: '🎨',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      defaultDay: 0,
      presets: ['Sunday School Worship', 'Kids Praise & Action Songs', 'VBS Worship Session']
    },
    {
      type: 'Special Church Program',
      icon: '✨',
      color: '#9D174D',
      bg: '#FFF1F2',
      border: '#FECDD3',
      defaultDay: 0,
      presets: ['Revival Gospel Meeting', 'Thanksgiving Service', 'Church Anniversary Service', 'Special Convention']
    }
  ];

  const allServiceCategories = [...CHURCH_SERVICE_CATEGORIES, ...customServiceCategories];

  const getServiceCategoryMeta = (categoryName?: string, serviceName?: string) => {
    if (categoryName) {
      const found = allServiceCategories.find(c => c.type.toLowerCase() === categoryName.toLowerCase());
      if (found) return found;
      return {
        type: categoryName,
        icon: '⛪',
        color: '#1a2d5a',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        defaultDay: 0,
        presets: [categoryName]
      };
    }
    if (serviceName) {
      const lower = serviceName.toLowerCase();
      if (lower.includes('bible study')) return CHURCH_SERVICE_CATEGORIES[1];
      if (lower.includes('women') || lower.includes('fasting')) return CHURCH_SERVICE_CATEGORIES[2];
      if (lower.includes('youth')) return CHURCH_SERVICE_CATEGORIES[3];
      if (lower.includes('cottage') || lower.includes('house') || lower.includes('cell')) return CHURCH_SERVICE_CATEGORIES[4];
      if (lower.includes('all-night') || lower.includes('night prayer') || lower.includes('vigil')) return CHURCH_SERVICE_CATEGORIES[5];
      if (lower.includes('midweek') || lower.includes('intercessory')) return CHURCH_SERVICE_CATEGORIES[6];
      if (lower.includes('kids') || lower.includes('children') || lower.includes('school')) return CHURCH_SERVICE_CATEGORIES[7];
      if (lower.includes('special') || lower.includes('revival') || lower.includes('anniversary') || lower.includes('thanksgiving') || lower.includes('convention')) return CHURCH_SERVICE_CATEGORIES[8];
      const customMatch = customServiceCategories.find(c => lower.includes(c.type.toLowerCase()));
      if (customMatch) return customMatch;
    }
    return CHURCH_SERVICE_CATEGORIES[0];
  };

  const renderSetlistFlowView = () => {
    if (!activeService || !activeService.id || worshipServices.length === 0) {
      return (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Top Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a2d5a' }}>
                Setlist Flow
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 }}>
                Worship flow & musician charts
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#1a2d5a',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={handleOpenCreateServiceModal}
            >
              <Plus size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>New Service</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State Banner */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#1a2d5a',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            marginTop: 10
          }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Calendar size={32} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a2d5a', textAlign: 'center' }}>
              No Church Services Created
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 320 }}>
              Create your church services — Sunday Services, Bible Studies, Women's Fasting Prayer, or Youth Meetings — to start scheduling songs and band charts.
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: '#1a2d5a',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 22
              }}
              onPress={handleOpenCreateServiceModal}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Create Your First Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const activeCat = getServiceCategoryMeta(activeService?.category, activeService?.name);

    return (
      <View style={{ flex: 1 }}>
        {/* Top Header Card: Title, Service Switcher, Actions */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          {/* Section Heading & Top Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a2d5a' }}>
                Setlist Flow
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 }}>
                Order of service & musician charts
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#16A34A',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 8
                }}
                onPress={handleShareSetlist}
              >
                <Share2 size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#1a2d5a',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 8
                }}
                onPress={handleOpenCreateServiceModal}
              >
                <Plus size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>New Service</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Switcher Tabs Ribbon */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, alignItems: 'center' }}>
            {validServices.map((srv: any) => {
              if (!srv) return null;
              const isActive = (srv?.id || srv?.name) === (activeService?.id || activeService?.name);
              const cat = getServiceCategoryMeta(srv?.category, srv?.name);
              return (
                <TouchableOpacity
                  key={srv?.id || srv?.name || Math.random().toString()}
                  style={[{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: isActive ? '#1a2d5a' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isActive ? '#1a2d5a' : '#E2E8F0',
                    elevation: isActive ? 2 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }]}
                  onPress={() => setActiveServiceId(srv.id)}
                >
                  <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                  <View>
                    <Text style={[{ fontSize: 12, fontWeight: '800', color: isActive ? '#FFFFFF' : '#1E293B' }]}>
                      {srv.name || 'Service'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      {srv.date ? (
                        <Text style={[{ fontSize: 10, fontWeight: '600', color: isActive ? '#93C5FD' : '#64748B' }]}>
                          {srv.date}
                        </Text>
                      ) : null}
                      {srv.time ? (
                        <Text style={[{ fontSize: 10, fontWeight: '600', color: isActive ? '#BFDBFE' : '#94A3B8' }]}>
                          • {srv.time}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    marginLeft: 2
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? '#E2E8F0' : '#64748B' }}>
                      {srv.songs?.length || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}
              onPress={handleOpenCreateServiceModal}
            >
              <Plus size={13} color="#2563EB" />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>Add Service</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Active Service Banner & Control Bar */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 14,
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            elevation: 1,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <View style={{ backgroundColor: activeCat.bg, borderColor: activeCat.border, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10 }}>{activeCat.icon}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: activeCat.color }}>
                      {activeService?.category || activeCat.type}
                    </Text>
                  </View>
                  {activeService?.time ? (
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} color="#64748B" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>{activeService.time}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a2d5a' }} numberOfLines={2}>
                  {activeService?.name || 'Service'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                      {activeService?.date || getTodayDate()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                    • {activeList.length} {activeList.length === 1 ? 'song' : 'songs'} scheduled
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}
                  onPress={() => {
                    setSelectedServiceCategory(activeService?.category || activeCat.type);
                    setServiceNameInput(activeService?.name || '');
                    let start = activeService?.startDate || '';
                    let end = activeService?.endDate || '';
                    if (!start && activeService?.date) {
                      if (activeService.date.includes(' – ')) {
                        const parts = activeService.date.split(' – ');
                        start = parts[0]?.trim() || '';
                        end = parts[1]?.trim() || '';
                      } else if (activeService.date.includes(' to ')) {
                        const parts = activeService.date.split(' to ');
                        start = parts[0]?.trim() || '';
                        end = parts[1]?.trim() || '';
                      } else {
                        start = activeService.date.trim();
                        end = activeService.date.trim();
                      }
                    }
                    const finalStart = start || getTodayDate();
                    const finalEnd = end || finalStart;
                    setServiceStartDateInput(finalStart);
                    setServiceEndDateInput(finalEnd);
                    setServiceDateInput(activeService?.date || ((finalEnd !== finalStart) ? `${finalStart} – ${finalEnd}` : finalStart));
                    setShowAddCustomPresetInput(false);
                    setCustomPresetInput('');
                    if (activeService?.startTime || activeService?.endTime) {
                      setServiceStartTimeInput(activeService.startTime || '09:00 AM');
                      setServiceEndTimeInput(activeService.endTime || '11:00 AM');
                    } else if (activeService?.time) {
                      const parts = activeService.time.split(' - ');
                      setServiceStartTimeInput(parts[0] ? parts[0].trim() : '09:00 AM');
                      setServiceEndTimeInput(parts[1] ? parts[1].trim() : '11:00 AM');
                    } else {
                      setServiceStartTimeInput('09:00 AM');
                      setServiceEndTimeInput('11:00 AM');
                    }
                    setServiceTimeInput(activeService?.time || '');
                    setShowEditServiceModal(true);
                  }}
                >
                  <Pencil size={15} color="#1D4ED8" />
                </TouchableOpacity>

                {/* Always show Delete button so user can delete any service */}
                <TouchableOpacity
                  style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' }}
                  onPress={() => handleDeleteService(activeService?.id)}
                >
                  <Trash2 size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Song Add Action Buttons: Always prominently visible on active service card */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1.5,
                  borderColor: '#93C5FD',
                  paddingVertical: 9,
                  borderRadius: 10
                }}
                onPress={handleOpenSongPicker}
              >
                <BookOpen size={14} color="#1D4ED8" />
                <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '800' }}>Select from All Songs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#1a2d5a',
                  paddingVertical: 9,
                  borderRadius: 10
                }}
                onPress={() => {
                  setNewSongTitleEn('');
                  setNewSongTitleTe('');
                  setNewSongArtist('');
                  setNewSongCategory('Stuthi Songs');
                  setNewSongLyrics('');
                  setSetlistForm({
                    title: '',
                    titleTe: '',
                    ledBy: '',
                    key: 'F',
                    timeSignature: '4/4',
                    tempo: '100',
                    verses: '4V',
                    prelude: '',
                    interlude: '',
                    notes: '',
                    isOffertory: false,
                  });
                  setShowCreateSongModal(true);
                }}
              >
                <Plus size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Create New Song</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Setlist Song List */}
        <FlatList
          data={activeList}
          keyExtractor={(item, idx) => item.id || `setlist_song_${idx}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => activeList.length > 0 ? (
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 10 }}>
              {(activeService?.name || 'SERVICE').toUpperCase()} · {activeList.length} SONGS
            </Text>
          ) : null}
          renderItem={({ item, index }) => {
            const isOffertory = item.isOffertory || (item.title && item.title.toLowerCase().includes('offertory'));
            return (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isOffertory ? '#F59E0B' : 'rgba(26,45,90,0.08)',
                  elevation: 2,
                  shadowColor: '#1a2d5a',
                  shadowOpacity: 0.05,
                  shadowRadius: 5,
                }}
              >
                {/* Header row: Index, Title, Badges, Reorder, Edit, Delete */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: isOffertory ? '#FEF3C7' : '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '900', color: isOffertory ? '#D97706' : '#2563EB' }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a' }}>{item.title}</Text>
                        {isOffertory && (
                          <View style={{ backgroundColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#92400E' }}>OFFERTORY</Text>
                          </View>
                        )}
                      </View>
                      {item.titleTe ? (
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{item.titleTe}</Text>
                      ) : null}
                      {item.ledBy ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>🎤 Led by:</Text>
                          <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#BFDBFE' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E40AF' }}>{item.ledBy}</Text>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setEditingSetlistIdx(index);
                            setSetlistForm({
                              title: item.title,
                              titleTe: item.titleTe || '',
                              ledBy: '',
                              key: item.key || 'F',
                              timeSignature: item.timeSignature || '4/4',
                              tempo: item.tempo || '100',
                              verses: item.verses || '4V',
                              prelude: item.prelude || '',
                              interlude: item.interlude || '',
                              notes: item.notes || '',
                              isOffertory: !!item.isOffertory,
                            });
                            setShowAddSetlistModal(true);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>🎤 Song Leader:</Text>
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>+ Assign Leader</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Actions: Move Up, Move Down, Edit, Delete */}
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity
                      disabled={index === 0}
                      onPress={() => handleMoveSongInService(index, 'up')}
                      style={[{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, index === 0 && { opacity: 0.3 }]}
                    >
                      <ArrowUp size={13} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={index === activeList.length - 1}
                      onPress={() => handleMoveSongInService(index, 'down')}
                      style={[{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, index === activeList.length - 1 && { opacity: 0.3 }]}
                    >
                      <ArrowDown size={13} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingSetlistIdx(index);
                        setSetlistForm({
                          title: item.title,
                          titleTe: item.titleTe || '',
                          ledBy: item.ledBy || '',
                          key: item.key || 'F',
                          timeSignature: item.timeSignature || '4/4',
                          tempo: item.tempo || '100',
                          verses: item.verses || '4V',
                          prelude: item.prelude || '',
                          interlude: item.interlude || '',
                          notes: item.notes || '',
                          isOffertory: !!item.isOffertory,
                        });
                        setShowAddSetlistModal(true);
                      }}
                      style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Pencil size={13} color="#1a2d5a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => promptDeleteSetlistSong(index, item)}
                      style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Musical Tags: Key, Time.S, Tempo, Verses */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#334155' }}>
                      Key: <Text style={{ color: '#2563EB', fontWeight: '900' }}>{item.key || 'N/A'}</Text>
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#334155' }}>
                      Time: <Text style={{ color: '#0D9488', fontWeight: '900' }}>{item.timeSignature || '4/4'}</Text>
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#334155' }}>
                      Tempo: <Text style={{ color: '#D97706', fontWeight: '900' }}>{item.tempo || '100'} BPM</Text>
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#334155' }}>
                      Verses: <Text style={{ color: '#7C3AED', fontWeight: '900' }}>{item.verses || '4V'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Arrangement Details: Prelude, Interlude */}
                {(item.prelude || item.interlude) && (
                  <View style={{ marginTop: 10, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, gap: 4 }}>
                    {item.prelude ? (
                      <Text style={{ fontSize: 11, color: '#475569' }}>
                        🎵 <Text style={{ fontWeight: '700', color: '#1a2d5a' }}>Prelude:</Text> {item.prelude}
                      </Text>
                    ) : null}
                    {item.interlude ? (
                      <Text style={{ fontSize: 11, color: '#475569' }}>
                        🎸 <Text style={{ fontWeight: '700', color: '#1a2d5a' }}>Interlude:</Text> {item.interlude}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Worship Notes */}
                {item.notes ? (
                  <View style={{ marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#3B82F6', paddingLeft: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#475569' }}>
                      "{item.notes}"
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 }}>
              <Music size={44} color="#94A3B8" />
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a2d5a', marginTop: 12 }}>
                No Songs in {activeService?.name || 'Service'}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center', lineHeight: 18, maxWidth: 300 }}>
                Pick songs from your existing song library or compose a new song to build this service setlist.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#1a2d5a',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10
                  }}
                  onPress={handleOpenSongPicker}
                >
                  <BookOpen size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Select from All Songs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#059669',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10
                  }}
                  onPress={() => {
                    setNewSongTitleEn('');
                    setNewSongTitleTe('');
                    setNewSongArtist('');
                    setNewSongCategory('Stuthi Songs');
                    setNewSongLyrics('');
                    setSetlistForm({
                      title: '',
                      titleTe: '',
                      ledBy: '',
                      key: 'F',
                      timeSignature: '4/4',
                      tempo: '100',
                      verses: '4V',
                      prelude: '',
                      interlude: '',
                      notes: '',
                      isOffertory: false,
                    });
                    setShowCreateSongModal(true);
                  }}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Create New Song</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  // Pre-computed map of song id to its 1-based index in postedSongs for O(1) lookups
  const songIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < postedSongs.length; i++) {
      const s = postedSongs[i];
      if (s?.id) map.set(s.id, i + 1);
    }
    return map;
  }, [postedSongs]);

  // Fast memoized song filter for Create Service modal (solves slow loading freeze)
  const { displaySongsForCreate, totalMatchingSongsForCreate } = useMemo(() => {
    if (!showCreateServiceModal) return { displaySongsForCreate: [] as WorshipSong[], totalMatchingSongsForCreate: 0 };
    const q = createServiceSongSearch.trim().toLowerCase();
    const selCat = createServiceSongCategory;
    const selectedIds = new Set(createServiceSelectedSongs.map(s => s.id));

    const matched: WorshipSong[] = [];
    for (let i = 0; i < postedSongs.length; i++) {
      const s = postedSongs[i];
      const songNum = (i + 1).toString();
      const titleEnMatch = s.title ? s.title.toLowerCase().includes(q) : false;
      const titleTeMatch = s.titleTe ? s.titleTe.toLowerCase().includes(q) : false;
      const artistMatch = s.artist ? s.artist.toLowerCase().includes(q) : false;
      const numMatch = songNum.includes(q);

      if (q && !titleEnMatch && !titleTeMatch && !artistMatch && !numMatch) {
        continue;
      }

      if (selCat !== 'All') {
        const cats = (s.category || 'Other').split(';').map(c => c.trim());
        if (!cats.includes(selCat)) continue;
      }

      matched.push(s);
    }

    const selectedList: WorshipSong[] = [];
    const unselectedList: WorshipSong[] = [];
    const cap = q ? 50 : 30;

    for (const s of matched) {
      if (selectedIds.has(s.id)) {
        selectedList.push(s);
      } else if (unselectedList.length < cap) {
        unselectedList.push(s);
      }
    }

    return {
      displaySongsForCreate: [...selectedList, ...unselectedList],
      totalMatchingSongsForCreate: matched.length
    };
  }, [showCreateServiceModal, postedSongs, createServiceSongSearch, createServiceSongCategory, createServiceSelectedSongs]);

  const renderCreateServiceModal = () => {
    if (!showCreateServiceModal) return null;
    const curCatObj = allServiceCategories.find(c => c.type === selectedServiceCategory) || allServiceCategories[0] || CHURCH_SERVICE_CATEGORIES[0];

    return (
      <Modal
        visible={showCreateServiceModal}
        animationType="slide"
        onRequestClose={() => setShowCreateServiceModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Top Page Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingVertical: 14,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a2d5a' }}>
                Create Church Service
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Set up service timing and pick setlist songs
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateServiceModal(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Full Page Scroll */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category / Service Type Selection */}
            <Text style={styles.label}>SERVICE TYPE / MINISTRY *</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {allServiceCategories.map(cat => {
                const isSel = selectedServiceCategory === cat.type;
                return (
                  <TouchableOpacity
                    key={cat.type}
                    style={[{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: isSel ? cat.color : cat.bg,
                      borderWidth: 1.5,
                      borderColor: isSel ? cat.color : cat.border,
                    }]}
                    onPress={() => {
                      setSelectedServiceCategory(cat.type);
                      let d = getTodayDate();
                      if (cat.type === 'Sunday Service') d = getNextSundayDate();
                      else if (cat.type === 'Bible Study') d = getNextWednesdayDate();
                      else if (cat.type === "Women's Fasting Prayer") d = getNextFridayDate();
                      else if (cat.type === 'Youth Meeting') d = getNextSaturdayDate();
                      else if (cat.type === 'Cottage / House Prayer') d = getUpcomingDayDate(2);
                      else if (cat.type === 'All-Night Prayer') d = getNextFridayDate();
                      else if (cat.type === 'Midweek Prayer') d = getNextWednesdayDate();
                      setServiceStartDateInput(d);
                      setServiceEndDateInput(d);
                      setServiceDateInput(d);
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isSel ? '#fff' : cat.color }}>
                      {cat.type}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Single clean New Type chip (no ++ duplicate) */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1.5,
                  borderColor: '#86EFAC',
                  borderStyle: 'dashed'
                }}
                onPress={() => {
                  setNewCustomCatName('');
                  setNewCustomCatIcon('⛪');
                  setShowAddCustomCatModal(true);
                }}
              >
                <Plus size={13} color="#15803D" strokeWidth={2.5} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                  New Type
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Presets for Selected Category: Only + New option and saved custom presets */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>SUGGESTED NAMES (TAP TO AUTO-FILL)</Text>
              
              {showAddCustomPresetInput && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, backgroundColor: '#FFFFFF', height: 40, fontSize: 12 }]}
                    placeholder="Enter suggested service name..."
                    placeholderTextColor="#94A3B8"
                    value={customPresetInput}
                    onChangeText={setCustomPresetInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#15803D', paddingHorizontal: 12, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      if (customPresetInput.trim()) {
                        handleAddCustomPreset(customPresetInput.trim());
                        setServiceNameInput(customPresetInput.trim());
                        setCustomPresetInput('');
                        setShowAddCustomPresetInput(false);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                    onPress={() => {
                      setCustomPresetInput('');
                      setShowAddCustomPresetInput(false);
                    }}
                  >
                    <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {(customPresetsByCategory[selectedServiceCategory] || []).map((preset: string) => {
                  const isSel = serviceNameInput === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isSel ? '#1a2d5a' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isSel ? '#1a2d5a' : '#E2E8F0'
                      }]}
                      onPress={() => setServiceNameInput(preset)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSel ? '#fff' : '#334155' }}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1.5,
                    borderColor: '#86EFAC',
                    borderStyle: 'dashed'
                  }}
                  onPress={() => setShowAddCustomPresetInput(prev => !prev)}
                >
                  <Plus size={12} color="#15803D" strokeWidth={2.5} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                    + New
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Service Name Input */}
            <Text style={styles.label}>SERVICE NAME *</Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 14, backgroundColor: '#FFFFFF' }]}
              value={serviceNameInput}
              onChangeText={setServiceNameInput}
              placeholder="e.g. Wednesday Bible Study, Friday Fasting Prayer..."
              placeholderTextColor="#94A3B8"
            />

            {/* Service Dates: Start Date & End Date */}
            <Text style={styles.label}>SERVICE DATES *</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {/* Start Date */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  START DATE *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceStartDateInput ? '#2563EB' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                    gap: 8
                  }}
                  onPress={() => {
                    setPickerTarget('create');
                    setDatePickerTargetField('start');
                    setShowDatePicker(true);
                  }}
                >
                  <CalendarDays size={16} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: serviceStartDateInput ? '800' : '600', color: serviceStartDateInput ? '#1E293B' : '#94A3B8', flex: 1 }} numberOfLines={1}>
                    {serviceStartDateInput || 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Date */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  END DATE
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: (serviceEndDateInput && serviceEndDateInput !== serviceStartDateInput) ? '#2563EB' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                    gap: 8
                  }}
                  onPress={() => {
                    setPickerTarget('create');
                    setDatePickerTargetField('end');
                    setShowDatePicker(true);
                  }}
                >
                  <CalendarDays size={16} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: serviceEndDateInput ? '800' : '600', color: serviceEndDateInput ? '#1E293B' : '#94A3B8', flex: 1 }} numberOfLines={1}>
                    {serviceEndDateInput || serviceStartDateInput || 'Select End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}
                onPress={() => {
                  const d = getNextSundayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>+ Next Sunday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}
                onPress={() => {
                  const d = getNextWednesdayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>+ Wednesday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FDF2F8', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FBCFE8' }}
                onPress={() => {
                  const d = getNextFridayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BE185D' }}>+ Friday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FED7AA' }}
                onPress={() => {
                  const d = getNextSaturdayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#C2410C' }}>+ Saturday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }}
                onPress={() => {
                  const d = getTodayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>+ Today</Text>
              </TouchableOpacity>
            </View>

            {/* Service Time: Start Time & End Time */}
            <Text style={styles.label}>SERVICE TIME</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {/* Start Time */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  START TIME *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceStartTimeInput ? '#0D9488' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                  onPress={() => {
                    setPickerTarget('create');
                    setTimePickerTargetField('start');
                    setShowTimePicker(true);
                  }}
                >
                  <Clock size={16} color="#0D9488" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>
                    {serviceStartTimeInput || '09:00 AM'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  END TIME (OPTIONAL)
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceEndTimeInput ? '#0D9488' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                  onPress={() => {
                    setPickerTarget('create');
                    setTimePickerTargetField('end');
                    setShowTimePicker(true);
                  }}
                >
                  <Clock size={16} color="#0D9488" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: serviceEndTimeInput ? '#1E293B' : '#94A3B8' }}>
                    {serviceEndTimeInput || 'Set End Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Time Range Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {[
                { label: '09:00 - 11:00 AM', start: '09:00 AM', end: '11:00 AM' },
                { label: '10:30 - 12:30 PM', start: '10:30 AM', end: '12:30 PM' },
                { label: '06:30 - 08:30 PM', start: '06:30 PM', end: '08:30 PM' },
                { label: '07:00 - 09:00 PM', start: '07:00 PM', end: '09:00 PM' },
              ].map(preset => {
                const isSelected = serviceStartTimeInput === preset.start && serviceEndTimeInput === preset.end;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={{
                      backgroundColor: isSelected ? '#1a2d5a' : '#FFFFFF',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? '#1a2d5a' : '#E2E8F0',
                    }}
                    onPress={() => {
                      setServiceStartTimeInput(preset.start);
                      setServiceEndTimeInput(preset.end);
                      setServiceTimeInput(`${preset.start} - ${preset.end}`);
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SELECT SONGS FOR THIS SERVICE */}
            <View style={{ marginTop: 6, marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.label}>SELECT SONGS FOR THIS SERVICE (OPTIONAL)</Text>
                {createServiceSelectedSongs.length > 0 && (
                  <TouchableOpacity onPress={() => setCreateServiceSelectedSongs([])}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Clear ({createServiceSelectedSongs.length})</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 10, lineHeight: 16 }}>
                Select songs to add directly to this service setlist now, or you can add songs anytime later.
              </Text>

              {/* Song Search Box */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 10,
                paddingHorizontal: 10,
                height: 42,
                marginBottom: 8
              }}>
                <Search size={15} color="#64748B" />
                <TextInput
                  style={{ flex: 1, marginLeft: 8, fontSize: 12, color: '#1E293B', paddingVertical: 0 }}
                  placeholder="Search songs by English, Telugu, artist or #..."
                  placeholderTextColor="#94A3B8"
                  value={createServiceSongSearch}
                  onChangeText={setCreateServiceSongSearch}
                />
                {createServiceSongSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCreateServiceSongSearch('')}>
                    <X size={15} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Song Category Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                {['All', ...CATEGORIES.filter(c => c !== 'Theme Songs')].map(cat => {
                  const isSel = createServiceSongCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCreateServiceSongCategory(cat)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 14,
                        backgroundColor: isSel ? '#1a2d5a' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isSel ? '#1a2d5a' : '#E2E8F0'
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isSel ? '#FFFFFF' : '#475569' }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Scrollable Song List (Fast memoized rendering) */}
              <View style={{
                maxHeight: 280,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden'
              }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                  {displaySongsForCreate.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Music size={24} color="#94A3B8" />
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, fontWeight: '600' }}>
                        No songs found matching your search.
                      </Text>
                    </View>
                  ) : (
                    displaySongsForCreate.map((song, idx) => {
                      const isSelected = createServiceSelectedSongs.some(s => s.id === song.id);
                      const displayNum = songIndexMap.get(song.id) || (idx + 1);

                      return (
                        <TouchableOpacity
                          key={song.id || idx}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            borderBottomWidth: idx === displaySongsForCreate.length - 1 ? 0 : 1,
                            borderBottomColor: '#F1F5F9',
                            backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF'
                          }}
                          onPress={() => {
                            if (isSelected) {
                              setCreateServiceSelectedSongs(prev => prev.filter(s => s.id !== song.id));
                            } else {
                              setCreateServiceSelectedSongs(prev => [...prev, song]);
                            }
                          }}
                        >
                          {/* Checkbox */}
                          <View style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                            backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10
                          }}>
                            {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                          </View>

                          {/* Number Badge */}
                          <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#1a2d5a' }}>{displayNum}</Text>
                          </View>

                          {/* Title & Artist */}
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? '#1D4ED8' : '#1a2d5a' }} numberOfLines={1}>
                              {song.title}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                              {song.titleTe ? `${song.titleTe}${song.artist ? ` · ${song.artist}` : ''}` : (song.artist || 'Traditional')}
                            </Text>
                          </View>

                          {/* Key Badge */}
                          {song.key ? (
                            <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#2563EB' }}>{song.key}</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>

              {totalMatchingSongsForCreate > displaySongsForCreate.length && (
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
                  Showing top {displaySongsForCreate.length} of {totalMatchingSongsForCreate} songs · Use search to find more
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateService}>
              <Plus size={18} color="#fff" />
              <Text style={styles.saveBtnTxt}>
                Create Service{createServiceSelectedSongs.length > 0 ? ` with ${createServiceSelectedSongs.length} Songs` : ''}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 35 }} />
          </ScrollView>

          {/* Date Picker Modal for Create */}
          <DateTimePickerModal
            isVisible={showDatePicker && pickerTarget === 'create'}
            mode="date"
            date={parseServiceDateToDateObj(datePickerTargetField === 'end' ? (serviceEndDateInput || serviceStartDateInput) : serviceStartDateInput)}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Time Picker Modal for Create */}
          <DateTimePickerModal
            isVisible={showTimePicker && pickerTarget === 'create'}
            mode="time"
            date={parseServiceTimeToDateObj(timePickerTargetField === 'end' ? serviceEndTimeInput : serviceStartTimeInput)}
            onConfirm={handleTimeConfirm}
            onCancel={() => setShowTimePicker(false)}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEditServiceModal = () => {
    if (!showEditServiceModal || !activeService?.id) return null;

    return (
      <Modal
        visible={showEditServiceModal}
        animationType="slide"
        onRequestClose={() => setShowEditServiceModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Top Page Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingVertical: 14,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a2d5a' }}>
                Edit Service Details
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Update service timing, date or details
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowEditServiceModal(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Full Page Scroll */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category selector */}
            <Text style={styles.label}>SERVICE TYPE / MINISTRY</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {allServiceCategories.map(cat => {
                const isSel = selectedServiceCategory === cat.type;
                return (
                  <TouchableOpacity
                    key={cat.type}
                    style={[{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: isSel ? cat.color : cat.bg,
                      borderWidth: 1.5,
                      borderColor: isSel ? cat.color : cat.border,
                    }]}
                    onPress={() => setSelectedServiceCategory(cat.type)}
                  >
                    <Text style={{ fontSize: 12 }}>{cat.icon}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isSel ? '#fff' : cat.color }}>
                      {cat.type}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Single clean New Type chip (no ++ duplicate) */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1.5,
                  borderColor: '#86EFAC',
                  borderStyle: 'dashed'
                }}
                onPress={() => {
                  setNewCustomCatName('');
                  setNewCustomCatIcon('⛪');
                  setShowAddCustomCatModal(true);
                }}
              >
                <Plus size={13} color="#15803D" strokeWidth={2.5} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                  New Type
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Presets for Selected Category: Only + New option and saved custom presets */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>SUGGESTED NAMES (TAP TO AUTO-FILL)</Text>
              
              {showAddCustomPresetInput && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, backgroundColor: '#FFFFFF', height: 40, fontSize: 12 }]}
                    placeholder="Enter suggested service name..."
                    placeholderTextColor="#94A3B8"
                    value={customPresetInput}
                    onChangeText={setCustomPresetInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#15803D', paddingHorizontal: 12, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      if (customPresetInput.trim()) {
                        handleAddCustomPreset(customPresetInput.trim());
                        setServiceNameInput(customPresetInput.trim());
                        setCustomPresetInput('');
                        setShowAddCustomPresetInput(false);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                    onPress={() => {
                      setCustomPresetInput('');
                      setShowAddCustomPresetInput(false);
                    }}
                  >
                    <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {(customPresetsByCategory[selectedServiceCategory] || []).map((preset: string) => {
                  const isSel = serviceNameInput === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isSel ? '#1a2d5a' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isSel ? '#1a2d5a' : '#E2E8F0'
                      }]}
                      onPress={() => setServiceNameInput(preset)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSel ? '#fff' : '#334155' }}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1.5,
                    borderColor: '#86EFAC',
                    borderStyle: 'dashed'
                  }}
                  onPress={() => setShowAddCustomPresetInput(prev => !prev)}
                >
                  <Plus size={12} color="#15803D" strokeWidth={2.5} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                    + New
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>SERVICE NAME *</Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 14, backgroundColor: '#FFFFFF' }]}
              value={serviceNameInput}
              onChangeText={setServiceNameInput}
              placeholder="Service Name..."
              placeholderTextColor="#94A3B8"
            />

            {/* Service Dates: Start Date & End Date */}
            <Text style={styles.label}>SERVICE DATES *</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {/* Start Date */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  START DATE *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceStartDateInput ? '#2563EB' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                    gap: 8
                  }}
                  onPress={() => {
                    setPickerTarget('edit');
                    setDatePickerTargetField('start');
                    setShowDatePicker(true);
                  }}
                >
                  <CalendarDays size={16} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: serviceStartDateInput ? '800' : '600', color: serviceStartDateInput ? '#1E293B' : '#94A3B8', flex: 1 }} numberOfLines={1}>
                    {serviceStartDateInput || 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Date */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  END DATE
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: (serviceEndDateInput && serviceEndDateInput !== serviceStartDateInput) ? '#2563EB' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                    gap: 8
                  }}
                  onPress={() => {
                    setPickerTarget('edit');
                    setDatePickerTargetField('end');
                    setShowDatePicker(true);
                  }}
                >
                  <CalendarDays size={16} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: serviceEndDateInput ? '800' : '600', color: serviceEndDateInput ? '#1E293B' : '#94A3B8', flex: 1 }} numberOfLines={1}>
                    {serviceEndDateInput || serviceStartDateInput || 'Select End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}
                onPress={() => {
                  const d = getNextSundayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>+ Sunday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}
                onPress={() => {
                  const d = getNextWednesdayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>+ Wednesday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FDF2F8', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FBCFE8' }}
                onPress={() => {
                  const d = getNextFridayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BE185D' }}>+ Friday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FED7AA' }}
                onPress={() => {
                  const d = getNextSaturdayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#C2410C' }}>+ Saturday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }}
                onPress={() => {
                  const d = getTodayDate();
                  setServiceStartDateInput(d);
                  setServiceEndDateInput(d);
                  setServiceDateInput(d);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>+ Today</Text>
              </TouchableOpacity>
            </View>

            {/* Service Time: Start Time & End Time */}
            <Text style={styles.label}>SERVICE TIME</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {/* Start Time */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  START TIME *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceStartTimeInput ? '#0D9488' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                  onPress={() => {
                    setPickerTarget('edit');
                    setTimePickerTargetField('start');
                    setShowTimePicker(true);
                  }}
                >
                  <Clock size={16} color="#0D9488" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>
                    {serviceStartTimeInput || '09:00 AM'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>
                  END TIME (OPTIONAL)
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: serviceEndTimeInput ? '#0D9488' : '#CBD5E1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                  onPress={() => {
                    setPickerTarget('edit');
                    setTimePickerTargetField('end');
                    setShowTimePicker(true);
                  }}
                >
                  <Clock size={16} color="#0D9488" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: serviceEndTimeInput ? '#1E293B' : '#94A3B8' }}>
                    {serviceEndTimeInput || 'Set End Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Time Range Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {[
                { label: '09:00 - 11:00 AM', start: '09:00 AM', end: '11:00 AM' },
                { label: '10:30 - 12:30 PM', start: '10:30 AM', end: '12:30 PM' },
                { label: '06:30 - 08:30 PM', start: '06:30 PM', end: '08:30 PM' },
                { label: '07:00 - 09:00 PM', start: '07:00 PM', end: '09:00 PM' },
              ].map(preset => {
                const isSelected = serviceStartTimeInput === preset.start && serviceEndTimeInput === preset.end;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={{
                      backgroundColor: isSelected ? '#1a2d5a' : '#FFFFFF',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? '#1a2d5a' : '#E2E8F0',
                    }}
                    onPress={() => {
                      setServiceStartTimeInput(preset.start);
                      setServiceEndTimeInput(preset.end);
                      setServiceTimeInput(`${preset.start} - ${preset.end}`);
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateService}>
              <Save size={18} color="#fff" />
              <Text style={styles.saveBtnTxt}>Update Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA'
              }}
              onPress={() => {
                setShowEditServiceModal(false);
                setTimeout(() => {
                  handleDeleteService(activeService.id);
                }, 200);
              }}
            >
              <Trash2 size={16} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '800' }}>Delete This Service</Text>
            </TouchableOpacity>
            <View style={{ height: 35 }} />
          </ScrollView>

          {/* Date Picker Modal for Edit */}
          <DateTimePickerModal
            isVisible={showDatePicker && pickerTarget === 'edit'}
            mode="date"
            date={parseServiceDateToDateObj(datePickerTargetField === 'end' ? (serviceEndDateInput || serviceStartDateInput) : serviceStartDateInput)}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Time Picker Modal for Edit */}
          <DateTimePickerModal
            isVisible={showTimePicker && pickerTarget === 'edit'}
            mode="time"
            date={parseServiceTimeToDateObj(timePickerTargetField === 'end' ? serviceEndTimeInput : serviceStartTimeInput)}
            onConfirm={handleTimeConfirm}
            onCancel={() => setShowTimePicker(false)}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderAddCustomCategoryModal = () => {
    if (!showAddCustomCatModal) return null;
    const availableIcons = ['⛪', '📖', '🙏', '🔥', '🏠', '🌙', '🕊️', '🎨', '✨', '👥', '🎵', '🎸', '🎺', '✝️', '🛡️', '❤️'];

    return (
      <Modal transparent animationType="fade" visible={showAddCustomCatModal} onRequestClose={() => setShowAddCustomCatModal(false)}>
        <View style={styles.editModalBg}>
          <View style={[styles.editModalCard, { maxHeight: 420 }]}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Add New Service Type</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 1 }}>
                  Create a custom ministry or service type
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCustomCatModal(false)} style={styles.editCloseBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18 }}>
              <Text style={styles.label}>SERVICE TYPE / MINISTRY NAME *</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 14 }]}
                value={newCustomCatName}
                onChangeText={setNewCustomCatName}
                placeholder="e.g. Men's Fellowship, Choir Practice, Dawn Prayer..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>CHOOSE ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                {availableIcons.map(icon => {
                  const isSel = newCustomCatIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: isSel ? '#EFF6FF' : '#F1F5F9',
                        borderWidth: isSel ? 2 : 1,
                        borderColor: isSel ? '#2563EB' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onPress={() => setNewCustomCatIcon(icon)}
                    >
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 8 }]}
                onPress={handleAddCustomCategory}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.saveBtnTxt}>Add Service Type</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ── MODAL: SELECT FROM ALL SONGS (LIBRARY PICKER) ──
  const renderSongPickerModal = () => {
    if (!showSongPickerModal) return null;
    const q = pickerSearch.trim().toLowerCase();
    const filtered = postedSongs.filter(s => {
      const titleEnMatch = s.title ? s.title.toLowerCase().includes(q) : false;
      const titleTeMatch = s.titleTe ? s.titleTe.toLowerCase().includes(q) : false;
      const artistMatch = s.artist ? s.artist.toLowerCase().includes(q) : false;
      const absoluteIndex = postedSongs.findIndex(ps => ps.id === s.id);
      const numberMatch = (absoluteIndex + 1).toString().includes(q);
      const textMatch = !q || titleEnMatch || titleTeMatch || artistMatch || numberMatch;
      if (!textMatch) return false;

      if (pickerCategory !== 'All') {
        const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
        if (!cats.includes(pickerCategory)) return false;
      }
      return true;
    });

    const isAllFilteredSelected = filtered.length > 0 && filtered.every(f => pickerSelectedSongs.some(s => s.id === f.id));

    return (
      <Modal transparent animationType="slide" visible={showSongPickerModal} onRequestClose={() => setShowSongPickerModal(false)}>
        <View style={styles.editModalBg}>
          <View style={[styles.editModalCard, { height: '88%', paddingBottom: 0 }]}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Select from All Songs</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                  Select multiple songs to add to {activeService?.name || 'Service'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSongPickerModal(false)} style={styles.editCloseBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 44 }}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '700', marginLeft: 8 }}
                  placeholder="Search song title, Telugu, artist, or number..."
                  placeholderTextColor="#94A3B8"
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                />
                {pickerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPickerSearch('')}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filter Chips */}
            <View style={{ marginBottom: 6 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}>
                {['All', ...CATEGORIES.filter(c => c !== 'Theme Songs')].map(cat => {
                  const isSel = pickerCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setPickerCategory(cat)}
                      style={[{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: isSel ? '#1a2d5a' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isSel ? '#1a2d5a' : '#E2E8F0'
                      }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSel ? '#fff' : '#475569' }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Multi-Selection Counter & Quick Selection Actions Bar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  backgroundColor: pickerSelectedSongs.length > 0 ? '#1D4ED8' : '#64748B',
                  borderRadius: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 2
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>
                    {pickerSelectedSongs.length}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: pickerSelectedSongs.length > 0 ? '#1D4ED8' : '#64748B' }}>
                  {pickerSelectedSongs.length === 0 ? 'No songs selected' : `${pickerSelectedSongs.length} song${pickerSelectedSongs.length > 1 ? 's' : ''} selected`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {pickerSelectedSongs.length > 0 && (
                  <TouchableOpacity onPress={() => setPickerSelectedSongs([])}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>Clear</Text>
                  </TouchableOpacity>
                )}
                {filtered.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (isAllFilteredSelected) {
                        setPickerSelectedSongs(prev => prev.filter(s => !filtered.some(f => f.id === s.id)));
                      } else {
                        const map = new Map<string, WorshipSong>();
                        pickerSelectedSongs.forEach(s => map.set(s.id, s));
                        filtered.forEach(s => map.set(s.id, s));
                        setPickerSelectedSongs(Array.from(map.values()));
                      }
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>
                      {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Song List with Multi-Select Checkboxes */}
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const absoluteIndex = postedSongs.findIndex(ps => ps.id === item.id);
                const displayNum = absoluteIndex >= 0 ? absoluteIndex + 1 : index + 1;
                const isSelected = pickerSelectedSongs.some(s => s.id === item.id);
                const isAlreadyInService = (activeService?.songs || []).some(
                  (s: any) => s.title?.trim().toLowerCase() === item.title?.trim().toLowerCase()
                );

                return (
                  <TouchableOpacity
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => handleTogglePickerSongSelection(item)}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                      backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10
                    }}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>

                    {/* Number Badge */}
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: isSelected ? '#1D4ED8' : '#1a2d5a' }}>{displayNum}</Text>
                    </View>

                    {/* Song Details */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? '#1D4ED8' : '#1a2d5a' }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {item.titleTe ? `${item.titleTe}${item.artist ? ` · ${item.artist}` : ''}` : (item.artist || 'Traditional')}
                      </Text>
                    </View>

                    {/* Right Badges */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isAlreadyInService && (
                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: '#FDE68A' }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>In Service</Text>
                        </View>
                      )}
                      {item.key ? (
                        <View style={{ backgroundColor: isSelected ? '#DBEAFE' : '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: '#E2E8F0' }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#2563EB' }}>{item.key}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>No matching songs found</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Try another search or create a new song.</Text>
                </View>
              )}
            />

            {/* Bottom Action Footer for Adding Multiple Selected Songs */}
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10
            }}>
              {pickerSelectedSongs.length > 0 && (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => setPickerSelectedSongs([])}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: pickerSelectedSongs.length > 0 ? '#1a2d5a' : '#CBD5E1',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 13,
                  borderRadius: 12,
                  elevation: pickerSelectedSongs.length > 0 ? 2 : 0
                }}
                disabled={pickerSelectedSongs.length === 0}
                onPress={handleAddSelectedSongsToService}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                  {pickerSelectedSongs.length === 0
                    ? 'Select Songs Above'
                    : `Add ${pickerSelectedSongs.length} Song${pickerSelectedSongs.length > 1 ? 's' : ''} to Service`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ── MODAL: CREATE NEW SONG & ADD TO SERVICE ───────
  const renderCreateSongModal = () => {
    if (!showCreateSongModal) return null;

    return (
      <Modal transparent animationType="slide" visible={showCreateSongModal} onRequestClose={() => setShowCreateSongModal(false)}>
        <View style={styles.editModalBg}>
          <View style={[styles.editModalCard, { height: '88%' }]}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Create New Song</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                  Save to church song library & add to {activeService?.name || 'Service'}
                </Text>
              </View>
            <TouchableOpacity onPress={() => setShowCreateSongModal(false)} style={styles.editCloseBtn}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>SONG TITLE (ENGLISH) *</Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 12 }]}
              value={newSongTitleEn}
              onChangeText={setNewSongTitleEn}
              placeholder="English title..."
            />

            <Text style={styles.label}>SONG TITLE (TELUGU) · తెలుగు శీర్షిక</Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 12 }]}
              value={newSongTitleTe}
              onChangeText={setNewSongTitleTe}
              placeholder="తెలుగు శీర్షిక..."
            />

            <Text style={styles.label}>ARTIST / AUTHOR / COMPOSE</Text>
            <TextInput
              style={[styles.textInput, { marginBottom: 12 }]}
              value={newSongArtist}
              onChangeText={setNewSongArtist}
              placeholder="e.g. Hosanna Ministries"
            />

            <Text style={styles.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
              {CATEGORIES.map(cat => {
                const isSel = newSongCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewSongCategory(cat)}
                    style={[{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: isSel ? '#1a2d5a' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSel ? '#1a2d5a' : '#E2E8F0'
                    }]}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSel ? '#fff' : '#475569' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>LYRICS *</Text>
            <TextInput
              style={[styles.textInput, { height: 120, textAlignVertical: 'top', paddingTop: 10, marginBottom: 14 }]}
              multiline
              value={newSongLyrics}
              onChangeText={setNewSongLyrics}
              placeholder="Type or paste song lyrics..."
            />

            {/* Song Leader */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.studioLabel}>SONG LEADER / LEADING PERSON</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}
                onPress={() => {
                  setMemberPickerTarget('setlist');
                  setMemberSearchQuery('');
                  setShowMemberPickerModal(true);
                }}
              >
                <Users size={12} color="#1D4ED8" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>Browse Directory</Text>
              </TouchableOpacity>
            </View>

            {setlistForm.ledBy ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F0FDF4',
                borderWidth: 1,
                borderColor: '#BBF7D0',
                borderRadius: 12,
                padding: 10,
                marginBottom: 12
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#15803D', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                      {setlistForm.ledBy.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#14532D' }} numberOfLines={1}>{setlistForm.ledBy}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>🎤 Designated Song Leader</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSetlistForm(prev => ({ ...prev, ledBy: '' }))}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#DCFCE7' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={[styles.textInput, { marginBottom: 12 }]}
                value={setlistForm.ledBy}
                onChangeText={v => setSetlistForm(prev => ({ ...prev, ledBy: v }))}
                placeholder="Type leader name or browse directory..."
              />
            )}

            {/* Arrangement Row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.colHeaderLabel}>KEY</Text>
                <View style={styles.colInputBox}>
                  <TextInput
                    style={styles.colInputText}
                    value={setlistForm.key}
                    onChangeText={v => setSetlistForm(prev => ({ ...prev, key: v }))}
                    placeholder="F"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.colHeaderLabel}>TIME SIG</Text>
                <View style={styles.colInputBox}>
                  <TextInput
                    style={styles.colInputText}
                    value={setlistForm.timeSignature}
                    onChangeText={v => setSetlistForm(prev => ({ ...prev, timeSignature: v }))}
                    placeholder="4/4"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.colHeaderLabel}>TEMPO</Text>
                <View style={[styles.colInputBox, { paddingHorizontal: 6 }]}>
                  <TextInput
                    style={styles.colInputText}
                    value={setlistForm.tempo}
                    onChangeText={v => setSetlistForm(prev => ({ ...prev, tempo: v }))}
                    placeholder="100"
                    keyboardType="numeric"
                  />
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#94A3B8' }}>BPM</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.colHeaderLabel}>VERSES</Text>
                <View style={styles.colInputBox}>
                  <TextInput
                    style={styles.colInputText}
                    value={setlistForm.verses}
                    onChangeText={v => setSetlistForm(prev => ({ ...prev, verses: v }))}
                    placeholder="4V"
                  />
                </View>
              </View>
            </View>

            {/* Offertory */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
              onPress={() => setSetlistForm(prev => ({ ...prev, isOffertory: !prev.isOffertory }))}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: setlistForm.isOffertory ? '#F59E0B' : '#94A3B8', backgroundColor: setlistForm.isOffertory ? '#F59E0B' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {setlistForm.isOffertory && <CheckCircle size={14} color="#fff" />}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2d5a' }}>Is this the Offertory Song?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={creatingAndAddingSong}
              style={[styles.saveBtn, { marginTop: 12, backgroundColor: '#059669' }]}
              onPress={handleCreateAndAddSongToService}
            >
              {creatingAndAddingSong ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveBtnTxt}>Save & Add to {activeService?.name || 'Service'}</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

  // ── ADD/EDIT SETLIST SONG MODAL (ARRANGEMENT EDITOR) ──
  const renderAddSetlistModal = () => {
    if (!showAddSetlistModal) return null;

    return (
      <Modal transparent animationType="slide" visible={showAddSetlistModal} onRequestClose={() => setShowAddSetlistModal(false)}>
        <View style={styles.editModalBg}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>{editingSetlistIdx !== null ? 'Edit Song Arrangement' : `Add Song to ${activeService?.name || 'Service'}`}</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Configure musical key, band cues, and song leader</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddSetlistModal(false)} style={styles.editCloseBtn}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ padding: 20 }}>
              <Text style={styles.label}>SONG TITLE *</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 12 }]}
                value={setlistForm.title}
                onChangeText={v => setSetlistForm(prev => ({ ...prev, title: v }))}
                placeholder="Song Title..."
              />

              {setlistForm.titleTe ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>TELUGU TITLE · తెలుగు శీర్షిక</Text>
                  <TextInput
                    style={[styles.textInput]}
                    value={setlistForm.titleTe}
                    onChangeText={v => setSetlistForm(prev => ({ ...prev, titleTe: v }))}
                    placeholder="తెలుగు శీర్షిక..."
                  />
                </View>
              ) : null}

              {/* Leading Person with Church Member Search */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.studioLabel}>SONG LEADER / LEADING PERSON</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}
                  onPress={() => {
                    setMemberPickerTarget('setlist');
                    setMemberSearchQuery('');
                    setShowMemberPickerModal(true);
                  }}
                >
                  <Users size={12} color="#1D4ED8" />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>Browse Directory</Text>
                </TouchableOpacity>
              </View>

              {setlistForm.ledBy ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 12
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#15803D', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                        {setlistForm.ledBy.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#14532D' }} numberOfLines={1}>{setlistForm.ledBy}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>🎤 Designated Song Leader</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSetlistForm(prev => ({ ...prev, ledBy: '' }))}
                    style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#DCFCE7' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 46 }}>
                    <Search size={16} color="#3B82F6" />
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '600', marginLeft: 8 }}
                      value={setlistForm.ledBy}
                      onChangeText={v => setSetlistForm(prev => ({ ...prev, ledBy: v }))}
                      placeholder="Type name or search member..."
                      placeholderTextColor="#94A3B8"
                    />
                    {setlistForm.ledBy.length > 0 && (
                      <TouchableOpacity onPress={() => setSetlistForm(prev => ({ ...prev, ledBy: '' }))}>
                        <X size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Inline Member Autocomplete dropdown if user is typing */}
                  {setlistForm.ledBy.trim().length > 0 && churchMembers.filter(m => m && (m.name || m.firstName || '').toLowerCase().includes(setlistForm.ledBy.toLowerCase()) && (m.name || m.firstName || '') !== setlistForm.ledBy).length > 0 && (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', marginTop: 6, maxHeight: 150, overflow: 'hidden', elevation: 3 }}>
                      <ScrollView nestedScrollEnabled>
                        {churchMembers
                          .filter(m => m && (m.name || m.firstName || '').toLowerCase().includes(setlistForm.ledBy.toLowerCase()) && (m.name || m.firstName || '') !== setlistForm.ledBy)
                          .slice(0, 6)
                          .map(m => {
                            const name = m?.name || m?.firstName || 'Member';
                            return (
                              <TouchableOpacity
                                key={m?.id || name}
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                                onPress={() => setSetlistForm(prev => ({ ...prev, ledBy: name }))}
                              >
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a2d5a', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a2d5a' }}>{name}</Text>
                                  {m.phone && <Text style={{ fontSize: 10, color: '#64748B' }}>{m.phone}</Text>}
                                </View>
                                <CheckCircle size={14} color="#10B981" />
                              </TouchableOpacity>
                            );
                          })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Key, Time.S, Tempo, Verses with Aligned Layout */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                {/* KEY - Dropdown Selector */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.colHeaderLabel} numberOfLines={1}>KEY</Text>
                  <TouchableOpacity
                    style={[styles.colInputBox, {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 8,
                      borderColor: setlistForm.key ? '#2563EB' : '#CBD5E1',
                      borderWidth: 1.5,
                      backgroundColor: '#FFFFFF'
                    }]}
                    onPress={() => setShowSetlistKeyPicker(true)}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '900', color: setlistForm.key ? '#1D4ED8' : '#94A3B8' }}>
                      {setlistForm.key || 'Key'}
                    </Text>
                    <ChevronDown size={13} color="#2563EB" />
                  </TouchableOpacity>
                </View>

                {/* TIME SIGNATURE */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.colHeaderLabel} numberOfLines={1}>TIME SIG</Text>
                  <View style={styles.colInputBox}>
                    <TextInput
                      style={styles.colInputText}
                      value={setlistForm.timeSignature}
                      onChangeText={v => setSetlistForm(prev => ({ ...prev, timeSignature: v }))}
                      placeholder="4/4"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* TEMPO */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.colHeaderLabel} numberOfLines={1}>TEMPO</Text>
                  <View style={[styles.colInputBox, { paddingHorizontal: 6, borderColor: setlistForm.tempo ? '#0D9488' : '#CBD5E1', borderWidth: 1.5 }]}>
                    <TextInput
                      style={[styles.colInputText, { paddingRight: 2 }]}
                      value={setlistForm.tempo}
                      onChangeText={v => setSetlistForm(prev => ({ ...prev, tempo: v }))}
                      placeholder="100"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#0D9488' }}>BPM</Text>
                  </View>
                </View>

                {/* VERSES */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.colHeaderLabel} numberOfLines={1}>VERSES</Text>
                  <View style={styles.colInputBox}>
                    <TextInput
                      style={styles.colInputText}
                      value={setlistForm.verses}
                      onChangeText={v => setSetlistForm(prev => ({ ...prev, verses: v }))}
                      placeholder="4V"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>

              {/* Suggested Tempo Presets */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.3 }}>
                    SUGGESTED TEMPOS (BPM)
                  </Text>
                  {setlistForm.tempo ? (
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#0D9488' }}>
                      Selected: {setlistForm.tempo} BPM
                    </Text>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {TEMPO_SUGGESTIONS.map(sug => {
                    const isSelected = setlistForm.tempo === sug.bpm;
                    return (
                      <TouchableOpacity
                        key={sug.bpm}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: isSelected ? '#0D9488' : '#F0FDFA',
                          borderWidth: 1,
                          borderColor: isSelected ? '#0D9488' : '#CCFBF1',
                        }}
                        onPress={() => setSetlistForm(prev => ({ ...prev, tempo: sug.bpm }))}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#0F766E' }}>
                          {sug.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Prelude Instruments with Suggestion Chips */}
              <Text style={styles.studioLabel}>PRELUDE INSTRUMENTS</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 6 }]}
                value={setlistForm.prelude}
                onChangeText={v => setSetlistForm(prev => ({ ...prev, prelude: v }))}
                placeholder="e.g. Acoustic + Drum"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {PRELUDE_SUGGESTIONS.map(sug => {
                  const isSelected = setlistForm.prelude === sug;
                  return (
                    <TouchableOpacity
                      key={sug}
                      style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isSelected ? '#0D9488' : '#F0FDFA', borderWidth: 1, borderColor: isSelected ? '#0D9488' : '#CCFBF1' }]}
                      onPress={() => setSetlistForm(prev => ({ ...prev, prelude: sug }))}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#fff' : '#0F766E' }}>
                        🎵 {sug}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Interlude Arrangement with Suggestion Chips */}
              <Text style={styles.label}>INTERLUDE ARRANGEMENT · మధ్యంతర సంగీతం</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 6 }]}
                value={setlistForm.interlude}
                onChangeText={v => setSetlistForm(prev => ({ ...prev, interlude: v }))}
                placeholder="e.g. Keys + Elec (Alt)"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {INTERLUDE_SUGGESTIONS.map(sug => {
                  const isSelected = setlistForm.interlude === sug;
                  return (
                    <TouchableOpacity
                      key={sug}
                      style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isSelected ? '#2563EB' : '#EFF6FF', borderWidth: 1, borderColor: isSelected ? '#2563EB' : '#DBEAFE' }]}
                      onPress={() => setSetlistForm(prev => ({ ...prev, interlude: sug }))}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#fff' : '#1D4ED8' }}>
                        🎸 {sug}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Worship / Thematic Notes with Presets */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.label}>WORSHIP / THEMATIC NOTES · ఆరాధన వివరణ</Text>
                {setlistForm.notes ? (
                  <TouchableOpacity onPress={() => setSetlistForm(prev => ({ ...prev, notes: '' }))}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Clear Notes</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TextInput
                style={[styles.textInput, { height: 68, textAlignVertical: 'top', paddingTop: 10, marginBottom: 6 }]}
                multiline
                value={setlistForm.notes}
                onChangeText={v => setSetlistForm(prev => ({ ...prev, notes: v }))}
                placeholder="e.g. Celebrate God's power, strength, and salvation"
              />
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.3 }}>
                SUGGESTED THEMATIC FOCUS (TAP TO ADD):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {NOTES_SUGGESTIONS.map(sug => {
                  const isAdded = (setlistForm.notes || '').includes(sug);
                  return (
                    <TouchableOpacity
                      key={sug}
                      style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isAdded ? '#F59E0B' : '#FEF3C7', borderWidth: 1, borderColor: isAdded ? '#D97706' : '#FDE68A' }]}
                      onPress={() => {
                        setSetlistForm(prev => {
                          if (!prev.notes.trim()) return { ...prev, notes: sug };
                          if (prev.notes.includes(sug)) return prev;
                          return { ...prev, notes: `${prev.notes} • ${sug}` };
                        });
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isAdded ? '#fff' : '#92400E' }}>
                        {isAdded ? '✓ ' : '+ '}{sug}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Offertory Toggle */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
                onPress={() => setSetlistForm(prev => ({ ...prev, isOffertory: !prev.isOffertory }))}
              >
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: setlistForm.isOffertory ? '#F59E0B' : '#94A3B8', backgroundColor: setlistForm.isOffertory ? '#F59E0B' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {setlistForm.isOffertory && <CheckCircle size={14} color="#fff" />}
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2d5a' }}>Is this the Offertory Song?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 10 }]}
                onPress={handleSaveSetlistSong}
              >
                <Save size={18} color="#fff" />
                <Text style={styles.saveBtnTxt}>{editingSetlistIdx !== null ? 'Update Setlist Song' : 'Add to Service Setlist'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

  // ── CHURCH MEMBER DIRECTORY MODAL (Leading Person Picker) ──
  const renderMemberPickerModal = () => (
    <Modal transparent animationType="slide" visible={showMemberPickerModal} onRequestClose={() => setShowMemberPickerModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModalBox, { maxHeight: '82%', maxWidth: 420, width: '92%', padding: 18 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1a2d5a' }}>Church Members Directory</Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Search and assign worship leader</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMemberPickerModal(false)} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={{ flex: 1, fontSize: 13, color: '#1a2d5a', marginLeft: 8, fontWeight: '700' }}
              placeholder="Search member name or phone..."
              placeholderTextColor="#94A3B8"
              value={memberSearchQuery}
              onChangeText={setMemberSearchQuery}
              autoFocus
            />
            {memberSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Custom Name Quick Option if query typed */}
          {memberSearchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#BFDBFE' }}
              onPress={() => {
                const custom = memberSearchQuery.trim();
                if (memberPickerTarget === 'setlist') {
                  setSetlistForm(prev => ({ ...prev, ledBy: custom }));
                } else if (memberPickerTarget === 'post') {
                  setPostLedBy(custom);
                } else if (memberPickerTarget === 'edit') {
                  setEditLedBy(custom);
                }
                setShowMemberPickerModal(false);
                setMemberSearchQuery('');
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>Use custom: "{memberSearchQuery.trim()}"</Text>
              <CheckCircle size={14} color="#1D4ED8" />
            </TouchableOpacity>
          )}

          {/* Members list */}
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {churchMembers.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Loading church members directory...</Text>
              </View>
            ) : (
              churchMembers
                .filter(m => {
                  if (!m) return false;
                  const q = memberSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  const name = (m.name || m.firstName || '').toLowerCase();
                  const phone = (m.phone || '').toLowerCase();
                  return name.includes(q) || phone.includes(q);
                })
                .map(m => {
                  const name = m?.name || m?.firstName || 'Member';
                  return (
                    <TouchableOpacity
                      key={m?.id || name}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                      onPress={() => {
                        if (memberPickerTarget === 'setlist') {
                          setSetlistForm(prev => ({ ...prev, ledBy: name }));
                        } else if (memberPickerTarget === 'post') {
                          setPostLedBy(name);
                        } else if (memberPickerTarget === 'edit') {
                          setEditLedBy(name);
                        }
                        setShowMemberPickerModal(false);
                        setMemberSearchQuery('');
                      }}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#1a2d5a', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a2d5a' }}>{name}</Text>
                        {m.phone && <Text style={{ fontSize: 11, color: '#64748B' }}>{m.phone}</Text>}
                      </View>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  );
                })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={[styles.heroTitleRow, { alignItems: 'center', justifyContent: 'space-between', width: '100%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Song Manager</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowPostModal(true)}>
            <Plus size={16} color="#1a2d5a" />
            <Text style={styles.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Tabs */}
      <View style={styles.screenTabBar}>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'list' && styles.screenTabActive]}
          onPress={() => { setScreenTab('list'); setSelectedCategory('All'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'list' && styles.screenTabTxtActive]}>All Songs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'setlist' && styles.screenTabActive]}
          onPress={() => { setScreenTab('setlist'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'setlist' && styles.screenTabTxtActive]}>Setlist Flow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'theme' && styles.screenTabActive]}
          onPress={() => { setScreenTab('theme'); setSelectedCategory('All'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'theme' && styles.screenTabTxtActive]}>Theme Songs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'churchOwn' && styles.screenTabActive]}
          onPress={() => { setScreenTab('churchOwn'); setSelectedCategory('All'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'churchOwn' && styles.screenTabTxtActive]} numberOfLines={1}>Church Songs</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Ribbon (Only shown for song library views, not for setlist flow) */}
      {screenTab !== 'setlist' && (
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {['All', ...CATEGORIES.filter(c => c !== 'Theme Songs')].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === cat ? '#1a2d5a' : '#fff',
                  borderWidth: 1,
                  borderColor: selectedCategory === cat ? '#1a2d5a' : '#cbd5e1',
                }}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: selectedCategory === cat ? '#fff' : '#64748b' }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500', fontStyle: 'italic', textAlign: 'center', marginTop: 12, marginHorizontal: 20 }}>
            Note: If you are not interested in the Global Songs, please contact the WeChristian app team to disable them for your church.
          </Text>
        </View>
      )}

      {/* Content */}
      {screenTab === 'setlist' ? renderSetlistFlowView() : renderPostedList()}
      {renderPostModal()}
      {renderAddSetlistModal()}
      {renderCreateServiceModal()}
      {renderEditServiceModal()}
      {renderAddCustomCategoryModal()}
      {renderSongPickerModal()}
      {renderCreateSongModal()}
      {renderMemberPickerModal()}
      {renderSongPreviewModal()}

      {/* Post Key Picker Modal */}
      {showKeyPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowKeyPicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
            onPress={() => setShowKeyPicker(false)}>
            <View style={styles.pickerModalBox}>
              <Text style={styles.pickerModalTitle}>Select Key</Text>
              <ScrollView>
                {KEYS.map(k => (
                  <TouchableOpacity key={k} style={styles.pickerModalItem}
                    onPress={() => { setSongKey(k); setShowKeyPicker(false); }}>
                    <Text style={[styles.pickerModalTxt, songKey === k && { color: '#1a2d5a', fontWeight: '800' }]}>{k}</Text>
                    {songKey === k && <CheckCircle size={16} color="#1a2d5a" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Setlist Key Dropdown Picker Modal ── */}
      {showSetlistKeyPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowSetlistKeyPicker(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSetlistKeyPicker(false)}
          >
            <View style={[styles.pickerModalBox, { maxWidth: 360, width: '92%', padding: 20, borderRadius: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a2d5a' }}>Select Musical Key</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Choose pitch for band charts & vocalists</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSetlistKeyPicker(false)} style={{ padding: 4 }}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Major Keys Section */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 8 }}>
                  MAJOR KEYS
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => {
                    const isSel = (setlistForm.key || '').toUpperCase() === k.toUpperCase();
                    return (
                      <TouchableOpacity
                        key={k}
                        style={{
                          width: '22%',
                          height: 42,
                          borderRadius: 10,
                          backgroundColor: isSel ? '#1a2d5a' : '#F8FAFC',
                          borderWidth: isSel ? 2 : 1,
                          borderColor: isSel ? '#1a2d5a' : '#E2E8F0',
                          alignItems: 'center',
                          justifyContent: 'center',
                          elevation: isSel ? 2 : 0
                        }}
                        onPress={() => {
                          setSetlistForm(prev => ({ ...prev, key: k }));
                          setShowSetlistKeyPicker(false);
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '900', color: isSel ? '#FFFFFF' : '#1E293B' }}>
                          {k}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Minor Keys Section */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 8 }}>
                  MINOR KEYS
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  {['Am', 'Em', 'Dm', 'Bm', 'F#m', 'C#m', 'Cm', 'Gm'].map(k => {
                    const isSel = (setlistForm.key || '') === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        style={{
                          width: '22%',
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: isSel ? '#0D9488' : '#F0FDFA',
                          borderWidth: isSel ? 2 : 1,
                          borderColor: isSel ? '#0D9488' : '#CCFBF1',
                          alignItems: 'center',
                          justifyContent: 'center',
                          elevation: isSel ? 2 : 0
                        }}
                        onPress={() => {
                          setSetlistForm(prev => ({ ...prev, key: k }));
                          setShowSetlistKeyPicker(false);
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '900', color: isSel ? '#FFFFFF' : '#0F766E' }}>
                          {k}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Category Picker Modal (kept but unused now – categories use inline chips) ── */}

      {/* ── Edit Song Modal ── */}
      {editingSong && (
        <Modal visible animationType="slide" onRequestClose={() => setEditingSong(null)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Top App Bar with Close and Centered Title - NO duplicate Save button */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
              elevation: 2,
              shadowColor: '#1a2d5a',
              shadowOpacity: 0.05,
              shadowRadius: 4
            }}>
              <TouchableOpacity
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setEditingSong(null)}
              >
                <X size={20} color="#334155" />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a2d5a' }}>Edit Worship Song</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>Update Details & Setlist Chart</Text>
              </View>

              {/* Balanced spacer so title is centered without duplicate button */}
              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* ── CARD 1: SONG DETAILS & LEADER ── */}
              <View style={styles.studioCard}>
                <View style={styles.studioCardHeader}>
                  <View style={styles.studioCardTitleRow}>
                    <Music size={16} color="#1a2d5a" />
                    <Text style={styles.studioCardTitle}>SONG IDENTITY & LEADER</Text>
                  </View>
                </View>

                {/* English Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.studioLabel}>SONG TITLE (ENGLISH) *</Text>
                  <TextInput
                    style={styles.studioInput}
                    placeholder="e.g. Amazing Grace, Way Maker..."
                    placeholderTextColor="#94A3B8"
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />
                </View>

                {/* Telugu Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.studioLabel}>SONG TITLE (TELUGU)</Text>
                  <TextInput
                    style={styles.studioInput}
                    placeholder="ఉదాహరణ: అద్భుతమైన కృప..."
                    placeholderTextColor="#94A3B8"
                    value={editTitleTe}
                    onChangeText={setEditTitleTe}
                  />
                </View>

                {/* YouTube Video Link */}
                <View style={styles.inputGroup}>
                  <Text style={styles.studioLabel}>YOUTUBE VIDEO LINK</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 46 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626', marginRight: 6 }}>▶ YouTube</Text>
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '600' }}
                      placeholder="https://youtu.be/... or Video ID"
                      placeholderTextColor="#94A3B8"
                      value={editYoutubeId}
                      onChangeText={setEditYoutubeId}
                    />
                    {editYoutubeId.length > 0 && (
                      <TouchableOpacity onPress={() => setEditYoutubeId('')}>
                        <X size={15} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Artist / Band */}
                <View style={styles.inputGroup}>
                  <Text style={styles.studioLabel}>ARTIST / BAND (Optional)</Text>
                  <TextInput
                    style={styles.studioInput}
                    placeholder="e.g. Hillsong, Bethel, Local Choir..."
                    placeholderTextColor="#94A3B8"
                    value={editArtist}
                    onChangeText={setEditArtist}
                  />
                </View>

                {/* Song Leader Search Section */}
                <View style={{ marginTop: 6, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.studioLabel}>SONG LEADER / LEADING PERSON</Text>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#EFF6FF',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#BFDBFE'
                      }}
                      onPress={() => {
                        setMemberPickerTarget('edit');
                        setMemberSearchQuery('');
                        setShowMemberPickerModal(true);
                      }}
                    >
                      <Users size={12} color="#1D4ED8" />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>Browse Directory</Text>
                    </TouchableOpacity>
                  </View>

                  {editLedBy ? (
                    /* Selected Person Card */
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F0FDF4',
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                      borderRadius: 12,
                      padding: 10
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#15803D', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                            {editLedBy.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#14532D' }} numberOfLines={1}>{editLedBy}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>🎤 Designated Song Leader</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => { setEditLedBy(''); setEditLeaderSearch(''); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#DCFCE7' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Search Church Member Input */
                    <View>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#CBD5E1',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        height: 46
                      }}>
                        <Search size={16} color="#3B82F6" />
                        <TextInput
                          style={{ flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '600', marginLeft: 8 }}
                          value={editLeaderSearch}
                          onChangeText={setEditLeaderSearch}
                          placeholder="Type member name or phone to search..."
                          placeholderTextColor="#94A3B8"
                        />
                        {editLeaderSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setEditLeaderSearch('')} style={{ padding: 4 }}>
                            <X size={16} color="#94A3B8" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Live Autocomplete Results */}
                      {editLeaderSearch.trim().length > 0 && (
                        <View style={{
                          marginTop: 6,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          maxHeight: 180,
                          overflow: 'hidden',
                          elevation: 3
                        }}>
                          <ScrollView nestedScrollEnabled>
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 10,
                                backgroundColor: '#EFF6FF',
                                borderBottomWidth: 1,
                                borderBottomColor: '#DBEAFE'
                              }}
                              onPress={() => {
                                setEditLedBy(editLeaderSearch.trim());
                                setEditLeaderSearch('');
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>
                                Use: "{editLeaderSearch.trim()}"
                              </Text>
                              <CheckCircle size={14} color="#1D4ED8" />
                            </TouchableOpacity>

                            {churchMembers
                              .filter(m => {
                                if (!m) return false;
                                const q = editLeaderSearch.toLowerCase().trim();
                                const name = (m.name || m.firstName || '').toLowerCase();
                                const phone = (m.phone || '').toLowerCase();
                                return name.includes(q) || phone.includes(q);
                              })
                              .slice(0, 8)
                              .map(m => {
                                const name = m?.name || m?.firstName || 'Member';
                                return (
                                  <TouchableOpacity
                                    key={m?.id || name}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      padding: 10,
                                      borderBottomWidth: 1,
                                      borderBottomColor: '#F1F5F9'
                                    }}
                                    onPress={() => {
                                      setEditLedBy(name);
                                      setEditLeaderSearch('');
                                    }}
                                  >
                                    <View style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 14,
                                      backgroundColor: '#1a2d5a',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 10
                                    }}>
                                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                                        {name.charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2d5a' }}>{name}</Text>
                                      {m.phone && <Text style={{ fontSize: 10, color: '#64748B' }}>{m.phone}</Text>}
                                    </View>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>Select</Text>
                                  </TouchableOpacity>
                                );
                              })}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* ── CARD 2: MUSICAL ARRANGEMENT & BAND FLOW ── */}
              <View style={styles.studioCard}>
                <View style={styles.studioCardHeader}>
                  <View style={styles.studioCardTitleRow}>
                    <Sliders size={15} color="#1a2d5a" />
                    <Text style={styles.studioCardTitle}>MUSICAL ARRANGEMENT & BAND FLOW</Text>
                  </View>
                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#1D4ED8' }}>SETLIST CHART</Text>
                  </View>
                </View>

                {/* 4 Aligned Columns */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  {/* KEY */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colHeaderLabel} numberOfLines={1}>KEY</Text>
                    <TouchableOpacity
                      style={styles.colInputBox}
                      onPress={() => setShowEditKeyPicker(true)}
                    >
                      <Text style={{ color: '#1a2d5a', fontWeight: '900', fontSize: 14 }}>{editKey || 'C'}</Text>
                      <ChevronDown size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* TIME SIGNATURE */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colHeaderLabel} numberOfLines={1}>TIME SIG</Text>
                    <View style={styles.colInputBox}>
                      <TextInput
                        style={styles.colInputText}
                        placeholder="4/4"
                        placeholderTextColor="#94A3B8"
                        value={editTimeSignature}
                        onChangeText={setEditTimeSignature}
                      />
                    </View>
                  </View>

                  {/* TEMPO WITH EMBEDDED BPM BADGE */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colHeaderLabel} numberOfLines={1}>TEMPO</Text>
                    <View style={[styles.colInputBox, { paddingHorizontal: 6 }]}>
                      <TextInput
                        style={[styles.colInputText, { paddingRight: 2 }]}
                        placeholder="100"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={editTempo}
                        onChangeText={setEditTempo}
                      />
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#94A3B8' }}>BPM</Text>
                    </View>
                  </View>

                  {/* VERSES */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colHeaderLabel} numberOfLines={1}>VERSES</Text>
                    <View style={styles.colInputBox}>
                      <TextInput
                        style={styles.colInputText}
                        placeholder="4V"
                        placeholderTextColor="#94A3B8"
                        value={editVerses}
                        onChangeText={setEditVerses}
                      />
                    </View>
                  </View>
                </View>

                {/* Quick Tempo Presets Ribbon (Horizontal Scroll so it never wraps awkwardly!) */}
                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#94A3B8' }}>TEMPO:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {[
                      { label: 'Slow (72 BPM)', val: '72' },
                      { label: 'Mid (96 BPM)', val: '96' },
                      { label: 'Fast (124 BPM)', val: '124' },
                      { label: 'Upbeat (138 BPM)', val: '138' },
                    ].map(p => {
                      const isSelected = editTempo === p.val;
                      return (
                        <TouchableOpacity
                          key={p.val}
                          onPress={() => setEditTempo(p.val)}
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: isSelected ? '#1a2d5a' : '#F1F5F9',
                            borderWidth: 1,
                            borderColor: isSelected ? '#1a2d5a' : '#E2E8F0'
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Prelude & Interlude Live Arrangement */}
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {/* Prelude */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studioLabel}>PRELUDE INSTRUMENTS</Text>
                      <TextInput
                        style={[styles.studioInput, { marginBottom: 6 }]}
                        placeholder="e.g. Acoustic + Drum"
                        placeholderTextColor="#94A3B8"
                        value={editPrelude}
                        onChangeText={setEditPrelude}
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                        {PRELUDE_SUGGESTIONS.map(sug => {
                          const isSelected = editPrelude === sug;
                          return (
                            <TouchableOpacity
                              key={sug}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                backgroundColor: isSelected ? '#0D9488' : '#F0FDFA',
                                borderWidth: 1,
                                borderColor: isSelected ? '#0D9488' : '#CCFBF1'
                              }}
                              onPress={() => setEditPrelude(sug)}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : '#0F766E' }}>{sug}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Interlude */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studioLabel}>INTERLUDE ARRANGEMENT</Text>
                      <TextInput
                        style={[styles.studioInput, { marginBottom: 6 }]}
                        placeholder="e.g. Keys + Elec"
                        placeholderTextColor="#94A3B8"
                        value={editInterlude}
                        onChangeText={setEditInterlude}
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                        {INTERLUDE_SUGGESTIONS.map(sug => {
                          const isSelected = editInterlude === sug;
                          return (
                            <TouchableOpacity
                              key={sug}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                backgroundColor: isSelected ? '#2563EB' : '#EFF6FF',
                                borderWidth: 1,
                                borderColor: isSelected ? '#2563EB' : '#DBEAFE'
                              }}
                              onPress={() => setEditInterlude(sug)}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : '#1D4ED8' }}>{sug}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>

                {/* Thematic Notes */}
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.studioLabel}>WORSHIP & THEMATIC NOTES</Text>
                    {editNotes ? (
                      <TouchableOpacity onPress={() => setEditNotes('')}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TextInput
                    style={[styles.studioInput, { height: 56, textAlignVertical: 'top', paddingTop: 8, marginBottom: 8 }]}
                    multiline
                    placeholder="e.g. Celebrate God's power, grace and praise..."
                    placeholderTextColor="#94A3B8"
                    value={editNotes}
                    onChangeText={setEditNotes}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {NOTES_SUGGESTIONS.map(sug => {
                      const isAdded = (editNotes || '').includes(sug);
                      return (
                        <TouchableOpacity
                          key={sug}
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: isAdded ? '#F59E0B' : '#FEF3C7',
                            borderWidth: 1,
                            borderColor: isAdded ? '#D97706' : '#FDE68A'
                          }}
                          onPress={() => {
                            if (!editNotes.trim()) setEditNotes(sug);
                            else if (!editNotes.includes(sug)) setEditNotes(`${editNotes} • ${sug}`);
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: isAdded ? '#fff' : '#92400E' }}>
                            {isAdded ? '✓ ' : '+ '}{sug}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* ── CARD 3: CATEGORIES, LYRICS & PUBLISH STATUS ── */}
              <View style={styles.studioCard}>
                {/* Categories */}
                <View style={styles.studioCardHeader}>
                  <View style={styles.studioCardTitleRow}>
                    <Text style={styles.studioCardTitle}>CATEGORIES & THEMES</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>
                    {editCategories.length} Selected
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {CATEGORIES.map(cat => {
                    const isThemeCat = cat === 'Theme Songs';
                    const isSelected = editCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[{
                          paddingHorizontal: 11,
                          paddingVertical: 6,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: isSelected ? (isThemeCat ? '#D97706' : '#1a2d5a') : '#E2E8F0',
                          backgroundColor: isSelected ? (isThemeCat ? '#FEF3C7' : '#1a2d5a') : '#F8FAFC',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4
                        }]}
                        onPress={() => {
                          setEditCategories(prev =>
                            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                          );
                        }}
                      >
                        {isThemeCat && <Star size={11} color={isSelected ? '#D97706' : '#94A3B8'} fill={isSelected ? '#F59E0B' : 'none'} />}
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: isSelected ? (isThemeCat ? '#B45309' : '#FFFFFF') : '#475569'
                        }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Song Lyrics & Scripts (Clean, no +Verse/+Chorus/+Bridge buttons) */}
                <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text style={[styles.studioLabel, { marginBottom: 8 }]}>SONG LYRICS & SCRIPTS *</Text>
                  <TextInput
                    style={[styles.studioInput, {
                      height: 240,
                      textAlignVertical: 'top',
                      paddingTop: 12,
                      paddingHorizontal: 12,
                      lineHeight: 20,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontSize: 13
                    }]}
                    placeholder={`Verse 1:\nAmazing grace! How sweet the sound...\n\nChorus:\nMy chains are gone, I've been set free...`}
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={editLyrics}
                    onChangeText={setEditLyrics}
                  />
                </View>

                {/* Publish Status Toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }}>Publish Status</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      {editStatus === 'Published' ? 'Visible in church library' : 'Saved as private draft'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 }, editStatus === 'Published' ? { backgroundColor: '#15803D', borderColor: '#15803D' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                      onPress={() => setEditStatus('Published')}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: editStatus === 'Published' ? '#fff' : '#64748B' }}>Published</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 }, editStatus === 'Draft' ? { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                      onPress={() => setEditStatus('Draft')}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: editStatus === 'Draft' ? '#fff' : '#64748B' }}>Draft</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Bottom Save Action Button */}
              <TouchableOpacity
                style={[{
                  backgroundColor: '#1a2d5a',
                  height: 52,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  elevation: 4,
                  shadowColor: '#1a2d5a',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  marginTop: 6
                }, savingEdit && { backgroundColor: '#94A3B8' }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

          {/* Edit Category Picker removed – using inline chips above */}
          {/* Edit Key Picker */}
          {showEditKeyPicker && (
            <Modal transparent animationType="fade" visible onRequestClose={() => setShowEditKeyPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
                onPress={() => setShowEditKeyPicker(false)}>
                <View style={styles.pickerModalBox}>
                  <Text style={styles.pickerModalTitle}>Select Key</Text>
                  <ScrollView>
                    {KEYS.map(k => (
                      <TouchableOpacity key={k} style={styles.pickerModalItem}
                        onPress={() => { setEditKey(k); setShowEditKeyPicker(false); }}>
                        <Text style={[styles.pickerModalTxt, editKey === k && { color: '#c0392b', fontWeight: '800' }]}>{k}</Text>
                        {editKey === k && <CheckCircle size={16} color="#c0392b" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <Modal transparent visible animationType="fade">
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <CheckCircle size={36} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Publication Successful!</Text>
              <Text style={styles.successDesc}>
                "{titleEn}" has been published under <Text style={{ fontWeight: '800', color: '#1a2d5a' }}>{categories[0] || 'Other'}</Text> and saved to the database!
              </Text>

              <TouchableOpacity style={styles.successActionBtn} onPress={() => { setShowSuccess(false); resetForm(); setTabByName?.('Songs'); }}>
                <Text style={styles.successActionTxt}>✅ Done — Back to Songs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successSecBtn} onPress={() => { setShowSuccess(false); resetForm(); }}>
                <Text style={styles.successSecTxt}>Post Another Song</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.successSecBtn, { marginTop: 6, borderColor: '#c7d2fe' }]} onPress={() => { setShowSuccess(false); resetForm(); setActiveTab(0); }}>
                <Text style={[styles.successSecTxt, { color: '#6366f1' }]}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Update Success Modal ── */}
      {showUpdateSuccess && (
        <Modal transparent visible animationType="fade">
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <CheckCircle size={36} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Update Successful!</Text>
              <Text style={styles.successDesc}>
                The song details have been successfully updated in the database.
              </Text>
              <TouchableOpacity style={styles.successActionBtn} onPress={() => setShowUpdateSuccess(false)}>
                <Text style={styles.successActionTxt}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {songToDelete && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={[styles.successIconOuter, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.successIconInner, { backgroundColor: '#DC2626' }]}>
                  <Trash2 size={28} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Delete Song?</Text>
              <Text style={styles.successDesc}>
                Are you sure you want to delete "{songToDelete.title}"? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                <TouchableOpacity style={[styles.successSecBtn, { flex: 1 }]} onPress={() => setSongToDelete(null)}>
                  <Text style={styles.successSecTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.successActionBtn, { flex: 1, backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={confirmDeleteSong}>
                  <Text style={styles.successActionTxt}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Beautiful Delete Service Confirmation Modal ── */}
      {serviceToDelete && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setServiceToDelete(null)}>
          <View style={styles.successBg}>
            <View style={[styles.successCard, { maxWidth: 360, padding: 24, borderRadius: 24 }]}>
              {/* Glowing Red Trash Icon */}
              <View style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#FEF2F2',
                borderWidth: 2,
                borderColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 4,
                  shadowColor: '#DC2626',
                  shadowOpacity: 0.35,
                  shadowRadius: 8
                }}>
                  <Trash2 size={24} color="#FFFFFF" strokeWidth={2.3} />
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a2d5a', textAlign: 'center', marginBottom: 6 }}>
                Delete Church Service?
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                Are you sure you want to delete this service? All songs and musician charts in this setlist will also be removed.
              </Text>

              {/* Service Preview Card */}
              <View style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 20
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 18 }}>⛪</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1a2d5a', flex: 1 }} numberOfLines={1}>
                    {serviceToDelete.name || 'Church Service'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {serviceToDelete.date ? (
                    <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>📅 {serviceToDelete.date}</Text>
                    </View>
                  ) : null}
                  {serviceToDelete.time ? (
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D' }}>⏰ {serviceToDelete.time}</Text>
                    </View>
                  ) : null}
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>
                      🎵 {(serviceToDelete.songs || []).length} songs
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E2E8F0'
                  }}
                  onPress={() => setServiceToDelete(null)}
                >
                  <Text style={{ color: '#475569', fontSize: 13, fontWeight: '800' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1.2,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: '#DC2626',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    elevation: 3
                  }}
                  onPress={confirmDeleteService}
                >
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.3} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Delete Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Beautiful Remove Song from Setlist Modal ── */}
      {setlistSongToDelete && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setSetlistSongToDelete(null)}>
          <View style={styles.successBg}>
            <View style={[styles.successCard, { maxWidth: 360, padding: 24, borderRadius: 24 }]}>
              {/* Soft Red Warning Icon */}
              <View style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#FEF2F2',
                borderWidth: 2,
                borderColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 4,
                  shadowColor: '#DC2626',
                  shadowOpacity: 0.35,
                  shadowRadius: 8
                }}>
                  <Trash2 size={24} color="#FFFFFF" strokeWidth={2.3} />
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a2d5a', textAlign: 'center', marginBottom: 6 }}>
                Remove from Service?
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                Are you sure you want to remove this song from this setlist? It will remain safe in your Church Song Library.
              </Text>

              {/* Song Preview Card */}
              <View style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 20
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#1D4ED8' }}>
                      {setlistSongToDelete.index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1a2d5a' }} numberOfLines={1}>
                      {setlistSongToDelete.song?.title || 'Song'}
                    </Text>
                    {setlistSongToDelete.song?.titleTe ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {setlistSongToDelete.song.titleTe}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Tags row */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {setlistSongToDelete.song?.key ? (
                    <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1D4ED8' }}>
                        Key: {setlistSongToDelete.song.key}
                      </Text>
                    </View>
                  ) : null}
                  {setlistSongToDelete.song?.tempo ? (
                    <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>
                        {setlistSongToDelete.song.tempo} BPM
                      </Text>
                    </View>
                  ) : null}
                  {setlistSongToDelete.song?.ledBy ? (
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D' }}>
                        🎤 {setlistSongToDelete.song.ledBy}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E2E8F0'
                  }}
                  onPress={() => setSetlistSongToDelete(null)}
                >
                  <Text style={{ color: '#475569', fontSize: 13, fontWeight: '800' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1.2,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: '#DC2626',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    elevation: 3
                  }}
                  onPress={confirmDeleteSetlistSong}
                >
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.3} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Remove Song</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Toast Notification Overlay ── */}
      {toastNotification && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastIconBox}>
              <Trash2 size={22} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle}>{toastNotification.title}</Text>
              <Text style={styles.toastSub}>{toastNotification.subtitle}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastIconBox}>
              <Trash2 size={24} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.toastTitle}>Song Deleted</Text>
              <Text style={styles.toastSub}>The song has been permanently removed.</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  
  // Hero Section
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 10,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  
  newBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  newBtnTxt: { color: '#1a2d5a', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  // Screen Tab Bar
  screenTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)'
  },
  screenTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, gap: 6 },
  screenTabActive: { backgroundColor: '#1a2d5a' },
  screenTabTxt: { fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  screenTabTxtActive: { color: '#fff' },

  scroll: { padding: 14 },
  
  // Cards
  card: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', marginBottom: 8, letterSpacing: 0.5 },
  textInput: {
    backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 13, color: '#1a2d5a', fontWeight: '600'
  },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  pickerTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '700', flex: 1 },

  statusSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: 13, color: '#1a2d5a', fontWeight: '700' },
  statusBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E2DDD5' },
  statusBtnActive: { backgroundColor: '#2E6B4F', borderColor: '#2E6B4F' },
  statusBtnActiveDraft: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  statusBtnTxt: { fontSize: 12, color: '#1a2d5a', fontWeight: '700' },
  statusBtnTxtActive: { color: '#fff' },

  infoBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20 },
  infoText: { flex: 1, fontSize: 11, color: '#065F46', lineHeight: 18, fontWeight: '600' },

  saveBtn: { backgroundColor: '#2E6B4F', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#1a2d5a', shadowOpacity: 0.2, shadowRadius: 5 },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // List
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  countBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  countTxt: { fontSize: 11, fontWeight: '800', color: '#3730A3' },
  songItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' },
  songIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  songItemTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  songItemSub: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  // Picker Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,45,90, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerModalBox: { backgroundColor: '#fff', borderRadius: 16, width: '92%', maxWidth: 320, maxHeight: '65%', paddingVertical: 15, elevation: 10 },
  pickerModalTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 5, letterSpacing: 0.5 },
  pickerModalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  pickerModalTxt: { fontSize: 15, color: '#1a2d5a', fontWeight: '600' },

  // Edit Modal
  editModalBg: { flex: 1, backgroundColor: 'rgba(26,45,90,0.5)', justifyContent: 'flex-end' },
  editModalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, height: height * 0.88 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.08)' },
  editModalTitle: { fontSize: 18, fontWeight: '900', color: '#1a2d5a' },
  editCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  // Success Modal
  successBg: { flex: 1, backgroundColor: 'rgba(26,45,90, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '92%', maxWidth: 400, alignItems: 'center', elevation: 10 },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E6B4F', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1a2d5a', marginBottom: 8, textAlign: 'center' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  summaryBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, width: '100%', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  summaryLbl: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 6 },
  receiptText: { fontSize: 11, color: '#1a2d5a', marginTop: 2, fontWeight: '600' },
  successActionBtn: { backgroundColor: '#1a2d5a', height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  successActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  successSecBtn: { height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  successSecTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800' },

  // Toast
  toastOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  toastCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingRight: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, shadowColor: '#1a2d5a', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' },
  toastIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  toastTitle: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  toastSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  // Studio & Modern Card Styles
  studioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  studioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studioCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studioCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a2d5a',
    letterSpacing: 0.8,
  },
  studioLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  studioInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 13,
    color: '#1a2d5a',
    fontWeight: '600',
  },
  colHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
    height: 14,
  },
  colInputBox: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  colInputText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2d5a',
    textAlign: 'center',
    padding: 0,
    flex: 1,
  },
});
