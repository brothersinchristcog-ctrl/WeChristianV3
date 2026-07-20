import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { CheckCircle, Share2, ArrowRight } from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'JoinSuccess'>;
  route: RouteProp<AuthStackParamList, 'JoinSuccess'>;
};

export default function JoinSuccessScreen({ navigation, route }: Props) {
  const { churchName, isNewChurch, churchCode } = route.params;
  const { activeChurch } = useChurch();
  const primary = activeChurch?.theme?.primaryColor || '#1a2d5a';

  const handleShare = () => {
    if (!churchCode) return;
    Share.share({
      message: `Join "${churchName}" on WeChristian!\n\nUse the church code: ${churchCode}\n\nDownload the app here: https://play.google.com/store/apps/details?id=com.wechristian.app`,
      title: `Join ${churchName} on WeChristian`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: primary }]}>
          <CheckCircle size={52} color="#fff" />
        </View>

        <Text style={styles.title}>
          {isNewChurch ? 'Church Registered! 🎉' : 'Welcome! 🙏'}
        </Text>
        <Text style={styles.churchName}>{churchName}</Text>
        <Text style={styles.subtitle}>
          {isNewChurch
            ? 'Your church has been successfully registered on WeChristian. Share the code below with your members!'
            : 'You have successfully joined your church community on WeChristian.'}
        </Text>

        {isNewChurch && churchCode && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR CHURCH CODE</Text>
            <Text style={[styles.codeValue, { color: primary }]}>{churchCode}</Text>
            <Text style={styles.codeHint}>Share this code with your congregation members</Text>
            <TouchableOpacity style={[styles.shareBtn, { borderColor: primary }]} onPress={handleShare}>
              <Share2 size={16} color={primary} />
              <Text style={[styles.shareBtnTxt, { color: primary }]}>Share Code</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: primary }]}
          onPress={() => {
            const authUser = require('@react-native-firebase/auth').default().currentUser;
            if (authUser) {
               // The user is logged in. 
               // This screen shouldn't even be visible if RootNavigator worked correctly.
               // Let's trigger an update or just route to Tabs/MainModes if possible.
               try {
                 navigation.getParent()?.navigate('MainModes');
               } catch(e) {
                 navigation.replace('Login');
               }
            } else {
               navigation.replace('Login');
            }
          }}
        >
          <Text style={styles.continueBtnTxt}>Continue to App</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28, elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20,
  },

  title: { color: '#f8fafc', fontSize: 26, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  churchName: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },

  codeCard: {
    width: '100%', backgroundColor: '#1e293b', borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 32,
    borderWidth: 1, borderColor: '#334155',
  },
  codeLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  codeValue: { fontSize: 36, fontWeight: '900', letterSpacing: 6, marginBottom: 8 },
  codeHint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  shareBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20,
  },
  shareBtnTxt: { fontSize: 14, fontWeight: '700' },

  continueBtn: {
    width: '100%', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    elevation: 4,
  },
  continueBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
