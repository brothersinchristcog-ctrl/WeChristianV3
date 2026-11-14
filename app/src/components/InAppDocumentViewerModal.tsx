import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { X, FileText, Download, AlertCircle, RefreshCw } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';

export interface InAppDocumentViewerDoc {
  url: string;
  name: string;
  mimeType?: string;
}

interface InAppDocumentViewerModalProps {
  visible: boolean;
  doc: InAppDocumentViewerDoc | null;
  onClose: () => void;
}

const injectedGviewCSS = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = "body, html, #drive-viewer-root, .drive-viewer-paginated-scrollable { background: #FFFFFF !important; background-color: #FFFFFF !important; margin: 0 !important; padding: 0 !important; } .drive-viewer-toolstrip { display: none !important; } .drive-viewer-page-container { margin: 8px auto !important; box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important; border: 1px solid #E5E7EB !important; } img { max-width: 100% !important; }";
      document.head.appendChild(style);
    } catch(e) {}
  })();
  true;
`;

export default function InAppDocumentViewerModal({
  visible,
  doc,
  onClose,
}: InAppDocumentViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!doc) return null;

  const fileName = doc.name || 'Document';
  const isImage =
    doc.mimeType?.toLowerCase().startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  const isPdf =
    doc.mimeType?.toLowerCase().includes('pdf') ||
    /\.pdf$/i.test(fileName);

  // WebView source URL:
  // On iOS, native WebKit renders PDFs directly.
  // On Android, use Google Docs Viewer for crisp in-app PDF rendering with zoom & pagination.
  const webViewUri =
    Platform.OS === 'ios' && isPdf
      ? doc.url
      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(doc.url)}`;

  const handleDownloadOrShare = async () => {
    try {
      setDownloading(true);
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localUri = `${FileSystem.cacheDirectory}${Date.now()}_${cleanName}`;
      const downloadRes = await FileSystem.downloadAsync(doc.url, localUri);
      setDownloading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: doc.mimeType || 'application/pdf',
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        Alert.alert('Saved', `Document saved to cache: ${downloadRes.uri}`);
      }
    } catch (err: any) {
      setDownloading(false);
      Alert.alert('Download Error', err?.message || 'Unable to download document.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#09090B' : '#F8FAFC',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* In-App Viewer Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderBottomColor: isDark ? '#27272A' : '#E2E8F0',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.closeBtn,
              { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
            ]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={20} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              <FileText
                size={16}
                color={isDark ? '#38BDF8' : '#2563EB'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.titleText,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {fileName}
              </Text>
            </View>
            <Text
              style={[
                styles.subtitleText,
                { color: isDark ? '#A1A1AA' : '#64748B' },
              ]}
              numberOfLines={1}
            >
              {isImage ? 'Image Attachment' : isPdf ? 'PDF Document' : 'Document Attachment'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
            ]}
            onPress={handleDownloadOrShare}
            disabled={downloading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={isDark ? '#38BDF8' : '#2563EB'} />
            ) : (
              <Download
                size={18}
                color={isDark ? '#38BDF8' : '#2563EB'}
                strokeWidth={2.2}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Viewer Content Area */}
        <View style={styles.contentWrap}>
          {isImage ? (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: doc.url }}
                style={styles.fullImage}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setLoadError(true);
                }}
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={isDark ? '#38BDF8' : '#2563EB'} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: isDark ? '#A1A1AA' : '#64748B' },
                    ]}
                  >
                    Loading image…
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.webWrap}>
              <WebView
                key={reloadKey}
                source={{ uri: webViewUri }}
                style={[
                  styles.webView,
                  { backgroundColor: isDark ? '#121214' : '#FFFFFF' },
                ]}
                originWhitelist={['*']}
                injectedJavaScript={injectedGviewCSS}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                startInLoadingState={true}
                nestedScrollEnabled={true}
                onLoadStart={() => {
                  setLoading(true);
                  setLoadError(false);
                }}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setLoadError(true);
                }}
                renderLoading={() => (
                  <View
                    style={[
                      styles.loadingOverlay,
                      { backgroundColor: isDark ? '#09090B' : '#F8FAFC' },
                    ]}
                  >
                    <ActivityIndicator size="large" color={isDark ? '#38BDF8' : '#2563EB'} />
                    <Text
                      style={[
                        styles.loadingText,
                        { color: isDark ? '#CBD5E1' : '#475569' },
                      ]}
                    >
                      Opening document in Rhema…
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Error State */}
          {loadError && (
            <View
              style={[
                styles.errorOverlay,
                { backgroundColor: isDark ? '#09090B' : '#F8FAFC' },
              ]}
            >
              <AlertCircle size={44} color="#EF4444" />
              <Text
                style={[
                  styles.errorTitle,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
              >
                Failed to Open Document
              </Text>
              <Text
                style={[
                  styles.errorSub,
                  { color: isDark ? '#A1A1AA' : '#64748B' },
                ]}
              >
                Unable to load this attachment. Please verify your connection.
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryBtn,
                  { backgroundColor: isDark ? '#38BDF8' : '#2563EB' },
                ]}
                onPress={() => {
                  setLoadError(false);
                  setLoading(true);
                  setReloadKey((k) => k + 1);
                }}
                activeOpacity={0.85}
              >
                <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  subtitleText: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    position: 'relative',
  },
  imageWrap: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  webWrap: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  retryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
