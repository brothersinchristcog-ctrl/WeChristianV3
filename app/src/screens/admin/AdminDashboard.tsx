import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Bell, 
  Settings,
  DollarSign,
  ChevronRight
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  {
    title: 'Content Management',
    icon: BookOpen,
    color: '#0F766E', // Teal
    keywords: ['Promise', 'Sermon', 'Song']
  },
  {
    title: 'Community & Members',
    icon: Users,
    color: '#581C87', // Deep Royal Purple/Eggplant for excellent contrast
    keywords: ['Member', 'Attendance', 'Prayer']
  },
  {
    title: 'Events & Celebrations',
    icon: Calendar,
    color: '#831843', // Deep Ruby/Berry for a festive, elegant look with high contrast
    keywords: ['Event', 'Celebration']
  },
  {
    title: 'Communication',
    icon: Bell,
    color: '#78350F', // Rich Deep Bronze/Chocolate for excellent warm contrast
    keywords: ['Notification', 'WhatsApp']
  },
  {
    title: 'Finance & Subscriptions',
    icon: DollarSign,
    color: '#206A5D', // Deep green
    keywords: ['Expense', 'Donation', 'Subscription']
  },
  {
    title: 'Administration',
    icon: Settings,
    color: '#1E3A8A', // Deep Navy for maximum contrast
    keywords: ['Church Setting', 'Super Admin', 'About', 'Contact', 'Schedule']
  }
];

const FULL_WIDTH_MODULES = ['New Song', 'Members', 'Subscription', 'WeCelebrate'];

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export default function AdminDashboard({ navigation, allTabs = [] }: any) {
  const { setActiveTab } = useContext(AdminTabContext);
  const { member, user } = useAuth();
  
  // Extract first name for greeting if possible
  const fullName = member?.name || user?.displayName || 'Administrator';
  const firstName = fullName.split(' ')[0];

  // Helper to figure out which category a tab belongs to
  const getCategoryForTab = (tabName: string) => {
    for (const category of CATEGORIES) {
      if (category.keywords.some(kw => tabName.includes(kw))) {
        return category;
      }
    }
    return CATEGORIES[5]; // Default to Administration
  };

  const categorizedTabs: Record<string, any[]> = {};
  CATEGORIES.forEach(cat => categorizedTabs[cat.title] = []);

  allTabs.forEach((tab: any, index: number) => {
    if (tab.name === 'Dashboard') return;
    const category = getCategoryForTab(tab.name);
    categorizedTabs[category.title].push({ ...tab, index });
  });

  // Dynamic time-based greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening,';
  if (hour < 12) timeGreeting = 'Good morning,';
  else if (hour < 18) timeGreeting = 'Good afternoon,';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e2b4d" />
      
      {/* Warm Premium Hero Section with Dramatic Curve */}
      <View style={{ zIndex: 10, backgroundColor: '#F4F0EA' }}>
        <View
          style={[styles.heroSection, { backgroundColor: '#1e2b4d' }]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.greetingText}>{timeGreeting}</Text>
            <Text 
              style={styles.nameText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {fullName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <View style={styles.content}>
          {CATEGORIES.map((category, catIdx) => {
            const tabsInCategory = categorizedTabs[category.title];
            if (!tabsInCategory || tabsInCategory.length === 0) return null;

            return (
              <View key={catIdx} style={styles.categoryBlock}>
                
                {/* Elegant Category Header */}
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconBg, { backgroundColor: `${category.color}20` }]}>
                    <category.icon size={18} color={category.color} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                  <View style={[styles.categoryLine, { backgroundColor: `${category.color}40` }]} />
                </View>

                {/* Hybrid Grid of Modules */}
                <View style={styles.grid}>
                  {tabsInCategory.map((tab) => {
                    const isFullWidth = FULL_WIDTH_MODULES.includes(tab.name);
                    
                    return (
                      <TouchableOpacity 
                        key={tab.index} 
                        style={[
                          styles.moduleCard, 
                          isFullWidth && styles.moduleCardFull,
                          {
                            shadowColor: category.color,
                            borderColor: `${category.color}25`,
                          }
                        ]}
                        onPress={() => setActiveTab(tab.index)}
                        activeOpacity={0.7}
                      >
                        {isFullWidth ? (
                          <>
                            <View style={styles.moduleLeftRow}>
                              <View style={[styles.moduleIconWrapperFull, { backgroundColor: `${category.color}15` }]}>
                                <tab.icon size={22} color={category.color} strokeWidth={2.5} />
                              </View>
                              <Text style={styles.moduleTitleFull}>{tab.name}</Text>
                            </View>
                            <View style={[styles.chevronWrapper, { backgroundColor: `${category.color}10` }]}>
                              <ChevronRight size={18} color={category.color} />
                            </View>
                          </>
                        ) : (
                          <View style={styles.moduleColumn}>
                            <View style={[styles.moduleIconWrapper, { backgroundColor: `${category.color}15` }]}>
                              <tab.icon size={22} color={category.color} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.moduleTitle} numberOfLines={2}>{tab.name}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F0EA' }, // Warm beige backdrop
  
  // HERO SECTION
  heroSection: {
    paddingHorizontal: 28,
    paddingTop: 15,
    paddingBottom: 60, 
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  heroContent: {
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  greetingText: {
    color: '#cbd5e1',
    fontSize: 20,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    fontFamily: FONTS.serif,
  },

  scroll: { 
    paddingBottom: 140, // Space for the bottom tab bar
  },
  
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  // CATEGORIES
  categoryBlock: {
    marginBottom: 36,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIconBg: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: FONTS.serif,
    letterSpacing: 0.5,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 16,
  },

  // HYBRID MODULE GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14, 
  },
  moduleCard: {
    width: (width - 62) / 2, 
    backgroundColor: '#ffffff',
    borderRadius: 22, 
    padding: 14,
    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    minHeight: 100,
  },
  moduleCardFull: {
    width: '100%', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    minHeight: 70,
  },
  moduleColumn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  moduleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10, 
  },
  moduleIconWrapperFull: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: FONTS.sans,
    lineHeight: 18,
  },
  moduleTitleFull: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: FONTS.sans,
  }
});
