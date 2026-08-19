import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SectionList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Play, 
  Mic,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Layers
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import FirestoreService, { Sermon } from '../services/FirestoreService';

const { width } = Dimensions.get('window');

const ALL_CATEGORIES = [
  'All',
  'Bible Study',
  "Women's Fasting Prayer",
  'Second Saturday Prayer',
  'Sunday Service',
  'All-Night Prayer',
  'Youth Meeting',
  'Revival Meeting',
  'Special Messages',
  'Shorts',
  'Testimonies',
  'Uncategorized',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Bible Study':              '#1a2d5a',
  "Women's Fasting Prayer":   '#be185d',
  'Second Saturday Prayer':   '#7c3aed',
  'Sunday Service':           '#0369a1',
  'All-Night Prayer':         '#1d4ed8',
  'Youth Meeting':            '#15803d',
  'Revival Meeting':          '#b45309',
  'Special Messages':         '#c0392b',
  'Shorts':                   '#d97706',
  'Testimonies':              '#047857',
  'Uncategorized':            '#64748b',
};

export default function SermonsScreen({ navigation }: any) {
  const { isDark, toggleTheme, colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const fetchSermons = async () => {
    try {
      const data = await FirestoreService.getSermons(64);
      setSermons(data);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSermons(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchSermons(); };

  const toggleSection = (cat: string) => {
    setCollapsedSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Build grouped sections
  const buildSections = () => {
    const filtered = activeCategory === 'All' ? sermons : sermons.filter(s => {
      let catsArray: string[] = [];
      if (typeof s.categories === 'string' && s.categories.trim().length > 0) {
        catsArray = s.categories.split(';').map((c: string) => c.trim()).filter(Boolean);
      } else if (Array.isArray(s.categories)) {
        catsArray = s.categories;
      }
      
      if (activeCategory === 'Uncategorized') return catsArray.length === 0;
      return catsArray.includes(activeCategory);
    });

    if (activeCategory !== 'All') {
      return [{ title: activeCategory, data: filtered }];
    }

    // Group by ALL categories
    const grouped: Record<string, any[]> = {};
    filtered.forEach(sermon => {
      let cats: string[] = [];
      if (typeof sermon.categories === 'string' && sermon.categories.trim().length > 0) {
        cats = sermon.categories.split(';').map((c: string) => c.trim()).filter(Boolean);
      } else if (Array.isArray(sermon.categories) && sermon.categories.length > 0) {
        cats = sermon.categories;
      }
      
      if (cats.length === 0) cats = ['Uncategorized'];

      cats.forEach((cat: string) => {
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(sermon);
      });
    });

    // Sort categories in defined order
    return ALL_CATEGORIES.filter(c => c !== 'All' && grouped[c]?.length > 0)
      .map(cat => ({ title: cat, data: grouped[cat] }));
  };

  const sections = buildSections();

  const renderSermonItem = (item: any) => (
    <TouchableOpacity 
      style={[styles.sermonCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#f1f5f9' }]}
      onPress={() => navigation.navigate('SermonVideo', { 
        sermonData: item
      })}
    >
      <View style={[styles.scThumb, { backgroundColor: isDark ? '#0f172a' : '#0f172a' }]}>
        <View style={styles.playOverlay}>
          <Play size={16} color="#fff" fill="#c0392b" />
        </View>
      </View>
      <View style={styles.scInfo}>
        <Text style={[styles.scTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]} numberOfLines={2}>
          {item.title}{item.titleTelugu ? ` · ${item.titleTelugu}` : ''}
        </Text>
        <Text style={[styles.scMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {item.pastor || 'Brother Y. Rajesh'} · {item.date || 'N/A'}{item.duration && item.duration !== 'N/A' ? ` · ${item.duration}` : ''}
        </Text>
        {item.scripture ? (
          <View style={styles.scriptureTag}>
            <BookOpen size={10} color="#7c3aed" />
            <Text style={styles.scriptureTagTxt}>{item.scripture}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => {
    const isCollapsed = collapsedSections[title];
    const color = CATEGORY_COLORS[title] || '#1a2d5a';
    const count = sections.find(s => s.title === title)?.data.length || 0;
    return (
      <TouchableOpacity
        style={[styles.sectionHeader, { borderLeftColor: color, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
        onPress={() => toggleSection(title)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : color }]}>{title}</Text>
          <Text style={[styles.sectionCount, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>{count} sermon{count !== 1 ? 's' : ''}</Text>
        </View>
        {isCollapsed
          ? <ChevronRight size={18} color={isDark ? '#f8fafc' : color} />
          : <ChevronDown size={18} color={isDark ? '#f8fafc' : color} />
        }
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0f172a' : colors.primary }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading Sermons...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sermons</Text>
          <Text style={styles.headerSub}>{sermons.length} sermons</Text>
        </View>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[
                styles.pill,
                { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' },
                activeCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] || '#1a2d5a', borderColor: CATEGORY_COLORS[cat] || '#1a2d5a' }
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.pillText, { color: isDark ? '#94a3b8' : '#64748b' }, activeCategory === cat && { color: '#fff' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sermons Grouped by Category */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
      >
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Layers size={48} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>No sermons found</Text>
            <Text style={[styles.emptySub, { color: isDark ? '#475569' : '#94a3b8' }]}>Pull down to refresh</Text>
          </View>
        ) : (
          sections.map(section => {
            const isCollapsed = collapsedSections[section.title];
            return (
              <View key={section.title} style={styles.sectionBlock}>
                {renderSectionHeader(section.title)}
                {!isCollapsed && section.data.map(item => (
                  <View key={item.id}>
                    {renderSermonItem(item)}
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fbbf24', marginTop: 15, fontWeight: '600' },

  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 2 },
  themeToggle: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  themeToggleText: { color: '#fff', fontSize: 16 },

  filterSection: { paddingVertical: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '600' },

  sectionBlock: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  sectionCount: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  sermonCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
  },
  scThumb: {
    width: 80,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  playOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scInfo: { flex: 1 },
  scTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  scMeta: { fontSize: 10, marginTop: 5, lineHeight: 14 },
  scriptureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#f5f3ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  scriptureTagTxt: { fontSize: 9, fontWeight: '700', color: '#7c3aed' },

  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 6 },
});
