import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  Ticket,
  Plus,
  Copy,
  Share2,
  CheckCircle,
  Clock,
  Ban,
  Building,
  Calendar,
  X,
  Search,
  Layers,
  Trash2,
  ShieldCheck,
  Check,
  Printer,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react-native';

export interface VoucherItem {
  id: string; // The code
  code: string;
  status: 'unused' | 'redeemed' | 'expired' | 'disabled';
  durationDays: number;
  voucherExpiryDate?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  redeemedAt?: string;
  redeemedChurchId?: string;
  redeemedChurchName?: string;
  redeemedByUserId?: string;
  redeemedByUserName?: string;
  batchTag?: string;
}

function generateRandomCode(): string {
  // Captcha-style: 7 characters total, mixed capital letters and numbers
  // Uses unambiguous characters (excluding confusing 0/O, 1/I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Guarantee mix of both digits and capital letters
  if (!/\d/.test(code) || !/[A-Z]/.test(code)) {
    return generateRandomCode();
  }
  return code;
}

export default function SuperAdminVouchersManager({ searchQuery = '' }: { searchQuery?: string }) {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unused' | 'redeemed' | 'expired' | 'disabled'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Single Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleCode, setSingleCode] = useState('');
  const [singleDurationDays, setSingleDurationDays] = useState('365');
  const [singleExpiryDays, setSingleExpiryDays] = useState('365');
  const [singleBatchTag, setSingleBatchTag] = useState('');
  const [creatingSingle, setCreatingSingle] = useState(false);

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkPrefix, setBulkPrefix] = useState('WC');
  const [bulkDurationDays, setBulkDurationDays] = useState('365');
  const [bulkExpiryDays, setBulkExpiryDays] = useState('365');
  const [bulkBatchTag, setBulkBatchTag] = useState('');
  const [creatingBulk, setCreatingBulk] = useState(false);

  // Printing & Exporting states
  const [exportingPdf, setExportingPdf] = useState(false);

  // Detail Modal
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

  // Custom Success Modal
  const [successModalData, setSuccessModalData] = useState<{
    type: 'single' | 'bulk';
    title: string;
    subtitle: string;
    code?: string;
    count?: number;
    durationDays?: number;
    expiryDate?: string;
    batchTag?: string;
  } | null>(null);

  // Confirmation Modal for Disable / Enable / Delete
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'disable' | 'enable' | 'delete';
    voucher: VoucherItem;
    title: string;
    description: string;
    confirmBtnText: string;
    confirmBtnColor: string;
  } | null>(null);

  // Fetch vouchers directly from Firestore
  const fetchVouchersAdmin = async () => {
    try {
      const snapshot = await firestore()
        .collection('vouchers')
        .orderBy('createdAt', 'desc')
        .get();
      const list: VoucherItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        let status = data.status || 'unused';
        if (status === 'unused' && data.voucherExpiryDate) {
          if (new Date(data.voucherExpiryDate).getTime() < Date.now()) {
            status = 'expired';
          }
        }
        return {
          id: doc.id,
          code: data.code || doc.id,
          status,
          durationDays: data.durationDays || 365,
          voucherExpiryDate: data.voucherExpiryDate,
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          redeemedAt: data.redeemedAt,
          redeemedChurchId: data.redeemedChurchId,
          redeemedChurchName: data.redeemedChurchName,
          redeemedByUserId: data.redeemedByUserId,
          redeemedByUserName: data.redeemedByUserName,
          batchTag: data.batchTag,
        };
      });
      setVouchers(list);
    } catch (err: any) {
      console.warn('fetchVouchersAdmin error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load vouchers: try real-time onSnapshot, fall back to Admin Cloud Function if permission denied
  useEffect(() => {
    let unsub: any;
    try {
      unsub = firestore()
        .collection('vouchers')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            if (snapshot) {
              const list: VoucherItem[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                let status = data.status || 'unused';

                if (status === 'unused' && data.voucherExpiryDate) {
                  if (new Date(data.voucherExpiryDate).getTime() < Date.now()) {
                    status = 'expired';
                  }
                }

                return {
                  id: doc.id,
                  code: data.code || doc.id,
                  status,
                  durationDays: data.durationDays || 365,
                  voucherExpiryDate: data.voucherExpiryDate,
                  createdAt: data.createdAt || new Date().toISOString(),
                  createdBy: data.createdBy,
                  createdByName: data.createdByName,
                  redeemedAt: data.redeemedAt,
                  redeemedChurchId: data.redeemedChurchId,
                  redeemedChurchName: data.redeemedChurchName,
                  redeemedByUserId: data.redeemedByUserId,
                  redeemedByUserName: data.redeemedByUserName,
                  batchTag: data.batchTag,
                };
              });
              setVouchers(list);
            }
            setLoading(false);
          },
          (error) => {
            console.log('Direct firestore onSnapshot failed, using Cloud Function fallback...');
            fetchVouchersAdmin();
          }
        );
    } catch (e) {
      fetchVouchersAdmin();
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && v.status !== activeFilter) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const code = (v.code || '').toLowerCase();
        const church = (v.redeemedChurchName || '').toLowerCase();
        const admin = (v.redeemedByUserName || '').toLowerCase();
        const tag = (v.batchTag || '').toLowerCase();

        if (
          !code.includes(query) &&
          !church.includes(query) &&
          !admin.includes(query) &&
          !tag.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [vouchers, activeFilter, searchQuery]);

  // Counts for summary metrics
  const counts = useMemo(() => {
    const total = vouchers.length;
    let unused = 0;
    let redeemed = 0;
    let expired = 0;
    let disabled = 0;

    vouchers.forEach((v) => {
      if (v.status === 'unused') unused++;
      else if (v.status === 'redeemed') redeemed++;
      else if (v.status === 'expired') expired++;
      else if (v.status === 'disabled') disabled++;
    });

    return { total, unused, redeemed, expired, disabled };
  }, [vouchers]);

  // Copy to clipboard
  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Share voucher code
  const handleShareCode = async (voucher: VoucherItem) => {
    try {
      const message = `Here is your WeChristian 1-Year Church Subscription Voucher Code:\n\n` +
        `Code: ${voucher.code}\n` +
        `Duration: ${voucher.durationDays} Days (1 Full Year Access)\n` +
        `Note: 1-Year duration starts from the date you redeem this code.\n\n` +
        `How to Redeem:\n` +
        `1. Download/Open WeChristian App from Google Play Store:\n` +
        `   https://play.google.com/store/apps/details?id=com.wechristian.app\n` +
        `2. Go to Profile > Church Subscription\n` +
        `3. Tap "Redeem Voucher Code"\n` +
        `4. Enter: ${voucher.code}\n\n` +
        `Enjoy full church platform access!`;
      await Share.share({ message });
    } catch (e) {
      console.error(e);
    }
  };

  // Prompt Disable / Enable with custom modal card
  const promptToggleStatus = (voucher: VoucherItem) => {
    if (voucher.status === 'redeemed') {
      Alert.alert('Cannot Modify', 'Redeemed vouchers cannot be altered.');
      return;
    }

    const newStatus = voucher.status === 'disabled' ? 'unused' : 'disabled';
    if (newStatus === 'disabled') {
      setConfirmModalData({
        type: 'disable',
        voucher,
        title: 'Disable Voucher?',
        description: `Are you sure you want to disable voucher ${voucher.code}? Pastors will not be able to redeem it while disabled.`,
        confirmBtnText: 'Yes, Disable',
        confirmBtnColor: '#ef4444',
      });
    } else {
      setConfirmModalData({
        type: 'enable',
        voucher,
        title: 'Enable Voucher?',
        description: `Are you sure you want to activate voucher ${voucher.code}? It will become available for pastors to redeem immediately.`,
        confirmBtnText: 'Yes, Enable',
        confirmBtnColor: '#10b981',
      });
    }
  };

  // Prompt Delete with custom modal card
  const promptDeleteVoucher = (voucher: VoucherItem) => {
    setConfirmModalData({
      type: 'delete',
      voucher,
      title: 'Delete Voucher?',
      description: voucher.status === 'redeemed'
        ? `Warning: Voucher ${voucher.code} was already redeemed by "${voucher.redeemedChurchName}". Deleting this will permanently delete the voucher record.`
        : `Are you sure you want to permanently delete voucher ${voucher.code}? This action cannot be undone.`,
      confirmBtnText: 'Yes, Delete Permanently',
      confirmBtnColor: '#dc2626',
    });
  };

  // Execute confirmed action (Disable, Enable, or Delete)
  const executeConfirmAction = async () => {
    if (!confirmModalData) return;
    const { type, voucher } = confirmModalData;

    try {
      if (type === 'delete') {
        await firestore().collection('vouchers').doc(voucher.id).delete();
      } else {
        const newStatus = type === 'disable' ? 'disabled' : 'unused';
        await firestore().collection('vouchers').doc(voucher.id).update({
          status: newStatus,
          disabledAt: newStatus === 'disabled' ? new Date().toISOString() : null,
        });
      }
      setConfirmModalData(null);
      if (selectedVoucher?.id === voucher.id) {
        setSelectedVoucher(null);
      }
      fetchVouchersAdmin();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    }
  };

  // Create single voucher
  const handleCreateSingle = async () => {
    const rawCode = (singleCode.trim() || generateRandomCode()).toUpperCase();
    const normalizedCode = rawCode.replace(/\s+/g, '');
    const duration = parseInt(singleDurationDays, 10) || 365;
    const expiryDays = parseInt(singleExpiryDays, 10) || 365;

    const voucherExpiry = new Date();
    voucherExpiry.setDate(voucherExpiry.getDate() + expiryDays);

    setCreatingSingle(true);
    try {
      const currentUser = auth().currentUser;
      const payload = {
        code: normalizedCode,
        durationDays: duration,
        voucherExpiryDate: voucherExpiry.toISOString(),
        batchTag: singleBatchTag.trim() || 'Manual',
        createdBy: currentUser?.uid || 'super_admin',
        createdByName: currentUser?.displayName || currentUser?.email || 'Platform Admin',
      };

      const docRef = firestore().collection('vouchers').doc(normalizedCode);
      const existing = await docRef.get();
      if (existing.exists && (typeof existing.exists === 'function' ? existing.exists() : existing.exists)) {
        Alert.alert('Error', 'A voucher with this code already exists. Please choose another code.');
        setCreatingSingle(false);
        return;
      }

      await docRef.set({
        ...payload,
        status: 'unused',
        createdAt: new Date().toISOString(),
      });

      setShowSingleModal(false);
      setSingleCode('');
      setSingleBatchTag('');
      fetchVouchersAdmin();

      // Show beautiful success card modal
      setSuccessModalData({
        type: 'single',
        title: 'Voucher Created!',
        subtitle: 'The 1-Year Church Subscription voucher has been created and is ready to distribute.',
        code: normalizedCode,
        durationDays: duration,
        expiryDate: voucherExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        batchTag: singleBatchTag.trim() || 'Manual',
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to create voucher');
    } finally {
      setCreatingSingle(false);
    }
  };

  // Create bulk vouchers
  const handleCreateBulk = async () => {
    const count = parseInt(bulkCount, 10);
    if (!count || count < 1 || count > 100) {
      Alert.alert('Invalid Count', 'Please specify a count between 1 and 100.');
      return;
    }

    const duration = parseInt(bulkDurationDays, 10) || 365;
    const expiryDays = parseInt(bulkExpiryDays, 10) || 365;
    const prefix = (bulkPrefix.trim() || 'WC').toUpperCase();

    const voucherExpiry = new Date();
    voucherExpiry.setDate(voucherExpiry.getDate() + expiryDays);

    setCreatingBulk(true);
    try {
      const currentUser = auth().currentUser;
      const payload = {
        count,
        prefix,
        durationDays: duration,
        voucherExpiryDate: voucherExpiry.toISOString(),
        batchTag: bulkBatchTag.trim() || `Batch_${Date.now()}`,
        createdBy: currentUser?.uid || 'super_admin',
        createdByName: currentUser?.displayName || currentUser?.email || 'Platform Admin',
      };

      const batch = firestore().batch();
      const nowIso = new Date().toISOString();
      const expiryIso = voucherExpiry.toISOString();
      const generatedCodes: string[] = [];

      for (let i = 0; i < count; i++) {
        let code = generateRandomCode();
        while (generatedCodes.includes(code)) {
          code = generateRandomCode();
        }
        generatedCodes.push(code);

        const ref = firestore().collection('vouchers').doc(code);
        batch.set(ref, {
          code,
          status: 'unused',
          durationDays: duration,
          voucherExpiryDate: expiryIso,
          createdAt: nowIso,
          createdBy: currentUser?.uid || 'super_admin',
          createdByName: currentUser?.displayName || currentUser?.email || 'Platform Admin',
          batchTag: payload.batchTag,
        });
      }

      await batch.commit();

      setShowBulkModal(false);
      setBulkBatchTag('');
      fetchVouchersAdmin();

      // Show beautiful bulk success card modal
      setSuccessModalData({
        type: 'bulk',
        title: 'Bulk Generation Complete!',
        subtitle: `Successfully generated ${count} vouchers with prefix ${prefix}. You can now print cards as PDF or export to CSV.`,
        count,
        durationDays: duration,
        expiryDate: voucherExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        batchTag: payload.batchTag,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to generate bulk vouchers');
    } finally {
      setCreatingBulk(false);
    }
  };

  // ── PRINTABLE PHYSICAL CARDS PDF GENERATOR ──
  const handlePrintCardsPdf = async () => {
    const listToPrint = filteredVouchers.filter((v) => v.status === 'unused');
    if (listToPrint.length === 0) {
      Alert.alert('No Unused Vouchers', 'There are no unused vouchers to print in the current view.');
      return;
    }

    setExportingPdf(true);
    try {
      const isSingle = listToPrint.length === 1;
      const cardsHtml = listToPrint
        .map(
          (v) => `
          <div class="card-wrapper">
            <div class="cut-label">✂ Cut along dashed border</div>
            <div class="card">
              <div class="card-top">
                <div class="brand-logo">✝ We<span class="brand-accent">Christian</span></div>
                <div class="pass-badge">1 YEAR CHURCH PASS</div>
              </div>

              <div class="card-headline">CHURCH MEMBERSHIP &amp; PLATFORM ACCESS</div>

              <div class="code-container">
                <div class="code-label">VOUCHER CODE</div>
                <div class="code-text">${v.code}</div>
              </div>

              <div class="duration-banner">
                <div class="duration-text">⭐ 365 DAYS UNLIMITED ACCESS</div>
                <div class="duration-sub">1-Year duration starts from the date this code is redeemed</div>
              </div>

              <div class="instructions-box">
                <div class="instructions-title">How to Redeem:</div>
                <ol>
                  <li>Open <b>WeChristian App</b> (Download on Google Play Store)</li>
                  <li>Go to <b>Profile &gt; Church Subscription</b></li>
                  <li>Tap <b>Redeem Voucher Code</b> &amp; enter the code above</li>
                  <li>Instantly activates <b>1 Full Year</b> for your church!</li>
                </ol>
              </div>

              <div class="playstore-box">
                <div class="playstore-info">
                  <div class="playstore-tag">GET IT ON GOOGLE PLAY</div>
                  <div class="playstore-url">https://play.google.com/store/apps/details?id=com.wechristian.app</div>
                </div>
                <div class="qr-container">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.wechristian.app" alt="Play Store QR" class="qr-code" />
                  <div class="qr-label">Scan to Install</div>
                </div>
              </div>

              <div class="card-footer">
                <span>Single Church Use • Instant Activation</span>
                <span>WeChristian Platform</span>
              </div>
            </div>
          </div>
        `
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>WeChristian Pastor Voucher Cards</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
              background-color: #ffffff;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 12px;
              border-bottom: 2px solid #e2e8f0;
            }
            .page-title {
              font-size: 22px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: 0.5px;
            }
            .page-subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .grid {
              display: grid;
              grid-template-columns: ${isSingle ? '1fr' : '1fr 1fr'};
              gap: 18px;
              max-width: ${isSingle ? '540px' : '100%'};
              margin: 0 auto;
            }
            .card-wrapper {
              border: 1.5px dashed #94a3b8;
              border-radius: 16px;
              padding: 8px;
              background-color: #f8fafc;
              page-break-inside: avoid;
            }
            .cut-label {
              font-size: 9px;
              color: #94a3b8;
              text-align: right;
              margin-bottom: 4px;
              font-weight: 600;
            }
            .card {
              background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
              border: 1.5px solid #f59e0b;
              border-radius: 14px;
              padding: 20px 22px;
              color: #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.15);
            }
            .card-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(245, 158, 11, 0.4);
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .brand-logo {
              font-size: 20px;
              font-weight: 900;
              color: #ffffff;
              letter-spacing: 0.8px;
            }
            .brand-accent {
              color: #f59e0b;
            }
            .pass-badge {
              background: rgba(245, 158, 11, 0.2);
              border: 1px solid #f59e0b;
              color: #fef08a;
              font-size: 10px;
              font-weight: 800;
              padding: 4px 10px;
              border-radius: 20px;
              letter-spacing: 0.8px;
              text-transform: uppercase;
            }
            .card-headline {
              text-align: center;
              font-size: 11px;
              font-weight: 700;
              color: #cbd5e1;
              letter-spacing: 1.2px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .code-container {
              background: #020617;
              border: 2px solid #f59e0b;
              border-radius: 10px;
              padding: 12px;
              text-align: center;
              margin-bottom: 12px;
            }
            .code-label {
              font-size: 9px;
              font-weight: 800;
              color: #94a3b8;
              letter-spacing: 1.8px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .code-text {
              font-family: 'Courier New', Courier, monospace;
              font-size: 24px;
              font-weight: 900;
              color: #fbbf24;
              letter-spacing: 3px;
            }
            .duration-banner {
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.4);
              border-radius: 8px;
              padding: 8px 12px;
              text-align: center;
              margin-bottom: 12px;
            }
            .duration-text {
              color: #34d399;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.3px;
            }
            .duration-sub {
              color: #94a3b8;
              font-size: 9.5px;
              margin-top: 2px;
              font-weight: 500;
            }
            .instructions-box {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 12px;
              font-size: 10.5px;
              line-height: 18px;
              color: #cbd5e1;
            }
            .instructions-title {
              font-size: 10px;
              font-weight: 800;
              color: #f59e0b;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
            }
            .instructions-box ol {
              padding-left: 18px;
            }
            .instructions-box li {
              margin-bottom: 2px;
            }
            .instructions-box b {
              color: #ffffff;
            }
            .playstore-box {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: rgba(2, 6, 23, 0.7);
              border: 1px solid rgba(245, 158, 11, 0.3);
              border-radius: 8px;
              padding: 8px 12px;
              margin-bottom: 12px;
            }
            .playstore-info {
              flex: 1;
              padding-right: 10px;
            }
            .playstore-tag {
              font-size: 8px;
              font-weight: 800;
              color: #f59e0b;
              letter-spacing: 0.8px;
              margin-bottom: 2px;
            }
            .playstore-url {
              font-size: 9px;
              color: #38bdf8;
              word-break: break-all;
              line-height: 13px;
            }
            .qr-container {
              text-align: center;
            }
            .qr-code {
              width: 50px;
              height: 50px;
              border-radius: 4px;
              background: #ffffff;
              padding: 2px;
              display: block;
            }
            .qr-label {
              font-size: 7.5px;
              font-weight: 700;
              color: #94a3b8;
              margin-top: 2px;
            }
            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              padding-top: 8px;
              font-size: 9.5px;
              color: #94a3b8;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="page-header">
            <div class="page-title">WeChristian Pastor Voucher Cards</div>
            <div class="page-subtitle">Print on Cardstock (A4 Sheet). Cut along dashed lines to distribute to Pastors &amp; Church Leaders.</div>
          </div>
          <div class="grid">
            ${cardsHtml}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share / Print Voucher Cards',
        });
      } else {
        Alert.alert('Success', `Cards PDF generated at: ${uri}`);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate printable cards PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  // ── EXPORT CSV FOR PRINTER / SPREADSHEET (AS ACTUAL FILE) ──
  const handleExportCsv = async () => {
    if (vouchers.length === 0) {
      Alert.alert('No Data', 'No vouchers available to export.');
      return;
    }

    try {
      let csv = 'Voucher Code,Duration Days,Status,Batch Tag,Created Date,Redeemed Church,Redeemed By,Redeemed Date\n';
      filteredVouchers.forEach((v) => {
        const createdStr = v.createdAt
          ? new Date(v.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        const redeemedStr = v.redeemedAt
          ? new Date(v.redeemedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        const line = [
          `"${v.code}"`,
          v.durationDays,
          `"${v.status.toUpperCase()}"`,
          `"${v.batchTag || 'Manual'}"`,
          `"${createdStr}"`,
          `"${v.redeemedChurchName || ''}"`,
          `"${v.redeemedByUserName || ''}"`,
          `"${redeemedStr}"`,
        ].join(',');
        csv += line + '\n';
      });

      const fileUri = `${FileSystem.cacheDirectory}WeChristian_Vouchers_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Voucher Codes (CSV)',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        await Share.share({ message: csv, title: 'WeChristian_Vouchers.csv' });
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to export CSV file.');
    }
  };

  const getStatusColor = (status: VoucherItem['status']) => {
    switch (status) {
      case 'unused':
        return '#06b6d4'; // Cyan
      case 'redeemed':
        return '#10b981'; // Green
      case 'expired':
        return '#f59e0b'; // Amber
      case 'disabled':
        return '#ef4444'; // Red
      default:
        return '#94a1c4';
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Summary Counters ── */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{counts.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#06b6d4' }]}>
          <Text style={[styles.metricNumber, { color: '#06b6d4' }]}>{counts.unused}</Text>
          <Text style={styles.metricLabel}>Unused</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#10b981' }]}>
          <Text style={[styles.metricNumber, { color: '#10b981' }]}>{counts.redeemed}</Text>
          <Text style={styles.metricLabel}>Redeemed</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#f59e0b' }]}>
          <Text style={[styles.metricNumber, { color: '#f59e0b' }]}>{counts.expired + counts.disabled}</Text>
          <Text style={styles.metricLabel}>Inactive</Text>
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => {
            setSingleCode(generateRandomCode());
            setShowSingleModal(true);
          }}
        >
          <Plus size={16} color="#0f172a" />
          <Text style={styles.primaryActionTxt}>Single Voucher</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => setShowBulkModal(true)}
        >
          <Layers size={16} color="#f4f6fb" />
          <Text style={styles.secondaryActionTxt}>Bulk Generate</Text>
        </TouchableOpacity>
      </View>

      {/* ── Export & Print Utility Row ── */}
      <View style={styles.exportRow}>
        <TouchableOpacity
          style={styles.exportPill}
          onPress={handlePrintCardsPdf}
          disabled={exportingPdf}
        >
          {exportingPdf ? (
            <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 6 }} />
          ) : (
            <Printer size={15} color="#10b981" style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.exportPillTxt, { color: '#10b981' }]}>Print Cards (PDF)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportPill} onPress={handleExportCsv}>
          <FileSpreadsheet size={15} color="#60a5fa" style={{ marginRight: 6 }} />
          <Text style={[styles.exportPillTxt, { color: '#60a5fa' }]}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Pills Bar (Clean Horizontal Scroll with Counts) ── */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['all', 'unused', 'redeemed', 'expired', 'disabled'] as const).map((tab) => {
            const count = tab === 'all' ? counts.total : counts[tab];
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeTxt, isActive && styles.filterBadgeTxtActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Vouchers List ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f0b429" />
          <Text style={styles.loadingTxt}>Loading vouchers...</Text>
        </View>
      ) : filteredVouchers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ticket size={48} color="#475569" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No Vouchers Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'No vouchers match your search criteria.'
              : 'Create single or bulk voucher codes to activate church subscriptions.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVouchers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchVouchersAdmin();
          }}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            const isCopied = copiedCode === item.code;

            return (
              <TouchableOpacity
                style={styles.voucherCard}
                activeOpacity={0.85}
                onPress={() => setSelectedVoucher(item)}
              >
                {/* Top Row: Code & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleCopyCode(item.code)}
                    >
                      {isCopied ? (
                        <Check size={16} color="#10b981" />
                      ) : (
                        <Copy size={16} color="#94a1c4" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleShareCode(item)}
                    >
                      <Share2 size={16} color="#94a1c4" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Duration Row (No text clipping) */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Clock size={13} color="#f0b429" style={{ marginRight: 6 }} />
                    <Text style={styles.detailTxt}>
                      <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{item.durationDays} Days Access</Text> (Starts on redemption)
                    </Text>
                  </View>
                </View>

                {/* Church Info if redeemed */}
                {item.status === 'redeemed' && (
                  <View style={styles.redeemedBox}>
                    <Building size={14} color="#10b981" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.redeemedChurchName} numberOfLines={1}>
                        {item.redeemedChurchName || 'Church'}
                      </Text>
                      <Text style={styles.redeemedDateTxt}>
                        Redeemed by {item.redeemedByUserName || 'Admin'} on{' '}
                        {item.redeemedAt ? new Date(item.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Card Footer: Batch Tag & Actions (Disable + Delete) */}
                <View style={styles.cardFooter}>
                  <Text style={styles.batchText} numberOfLines={1}>
                    {item.batchTag ? `Tag: ${item.batchTag}` : `Created ${new Date(item.createdAt).toLocaleDateString()}`}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.status !== 'redeemed' && (
                      <TouchableOpacity
                        onPress={() => promptToggleStatus(item)}
                        style={[styles.toggleBtn, item.status === 'disabled' && styles.enableBtn]}
                      >
                        <Text style={[styles.toggleBtnTxt, item.status === 'disabled' && styles.enableBtnTxt]}>
                          {item.status === 'disabled' ? 'Enable' : 'Disable'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Delete Card Button */}
                    <TouchableOpacity
                      onPress={() => promptDeleteVoucher(item)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={12} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={styles.deleteBtnTxt}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Single Voucher Modal ── */}
      <Modal visible={showSingleModal} transparent animationType="fade" onRequestClose={() => setShowSingleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Single Voucher</Text>
              <TouchableOpacity onPress={() => setShowSingleModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>Voucher Code</Text>
                  <TouchableOpacity onPress={() => setSingleCode(generateRandomCode())}>
                    <Text style={styles.linkTxt}>Auto-Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={singleCode}
                  onChangeText={(t) => setSingleCode(t.toUpperCase())}
                  placeholder="e.g. 7K8N2XP"
                  placeholderTextColor="#64748b"
                  autoCapitalize="characters"
                  maxLength={12}
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subscription Duration (Days)</Text>
                <TextInput
                  value={singleDurationDays}
                  onChangeText={setSingleDurationDays}
                  keyboardType="numeric"
                  placeholder="365"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
                <Text style={styles.inputHint}>Default 365 days gives 1 year access upon redemption.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voucher Redemption Deadline (Days from now)</Text>
                <TextInput
                  value={singleExpiryDays}
                  onChangeText={setSingleExpiryDays}
                  keyboardType="numeric"
                  placeholder="365"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
                <Text style={styles.inputHint}>How long the voucher remains redeemable before expiring.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Batch / Reference Tag (Optional)</Text>
                <TextInput
                  value={singleBatchTag}
                  onChangeText={setSingleBatchTag}
                  placeholder="e.g. Hyderabad Conference"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateSingle}
                disabled={creatingSingle}
              >
                {creatingSingle ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.submitModalBtnTxt}>Create Voucher</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Bulk Voucher Modal ── */}
      <Modal visible={showBulkModal} transparent animationType="fade" onRequestClose={() => setShowBulkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Generate Vouchers</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number of Vouchers (1 - 100)</Text>
                <TextInput
                  value={bulkCount}
                  onChangeText={setBulkCount}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subscription Duration (Days)</Text>
                <TextInput
                  value={bulkDurationDays}
                  onChangeText={setBulkDurationDays}
                  keyboardType="numeric"
                  placeholder="365"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voucher Validity (Days from now)</Text>
                <TextInput
                  value={bulkExpiryDays}
                  onChangeText={setBulkExpiryDays}
                  keyboardType="numeric"
                  placeholder="365"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Batch Name / Purpose</Text>
                <TextInput
                  value={bulkBatchTag}
                  onChangeText={setBulkBatchTag}
                  placeholder="e.g. Pastor Summit 2026"
                  placeholderTextColor="#64748b"
                  style={styles.modalInput}
                />
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateBulk}
                disabled={creatingBulk}
              >
                {creatingBulk ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.submitModalBtnTxt}>Generate {bulkCount || 0} Vouchers</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Voucher Detail Modal ── */}
      <Modal visible={!!selectedVoucher} transparent animationType="fade" onRequestClose={() => setSelectedVoucher(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ticket size={20} color="#f0b429" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Voucher Details</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedVoucher(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedVoucher && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailBoxLabel}>VOUCHER CODE</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={styles.detailBoxValueCode}>{selectedVoucher.code}</Text>
                    <TouchableOpacity onPress={() => handleCopyCode(selectedVoucher.code)} style={styles.copyPill}>
                      <Copy size={14} color="#0f172a" />
                      <Text style={styles.copyPillTxt}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Status</Text>
                  <Text style={[styles.infoVal, { color: getStatusColor(selectedVoucher.status), fontWeight: '700' }]}>
                    {selectedVoucher.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Subscription Duration</Text>
                  <Text style={styles.infoVal}>{selectedVoucher.durationDays} Days (Starts upon redemption)</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Redemption Deadline</Text>
                  <Text style={styles.infoVal}>
                    {selectedVoucher.voucherExpiryDate ? new Date(selectedVoucher.voucherExpiryDate).toLocaleDateString() : 'No Limit'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Created At</Text>
                  <Text style={styles.infoVal}>
                    {new Date(selectedVoucher.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Created By</Text>
                  <Text style={styles.infoVal}>{selectedVoucher.createdByName || 'Admin'}</Text>
                </View>

                {selectedVoucher.status === 'redeemed' && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionHeader}>Redemption Record</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Redeemed Church</Text>
                      <Text style={[styles.infoVal, { color: '#10b981', fontWeight: '700' }]}>
                        {selectedVoucher.redeemedChurchName || 'Church'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Church ID</Text>
                      <Text style={styles.infoVal}>{selectedVoucher.redeemedChurchId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Redeemed By</Text>
                      <Text style={styles.infoVal}>{selectedVoucher.redeemedByUserName || 'Church Admin'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Redeemed On</Text>
                      <Text style={styles.infoVal}>
                        {selectedVoucher.redeemedAt ? new Date(selectedVoucher.redeemedAt).toLocaleString() : 'N/A'}
                      </Text>
                    </View>
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleShareCode(selectedVoucher)}
                  >
                    <Share2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#ffffff', fontWeight: '700' }}>Share</Text>
                  </TouchableOpacity>

                  {selectedVoucher.status !== 'redeemed' && (
                    <TouchableOpacity
                      style={[
                        styles.modalActionBtn,
                        { backgroundColor: selectedVoucher.status === 'disabled' ? '#10b981' : '#f59e0b' },
                      ]}
                      onPress={() => {
                        promptToggleStatus(selectedVoucher);
                      }}
                    >
                      <Ban size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#ffffff', fontWeight: '700' }}>
                        {selectedVoucher.status === 'disabled' ? 'Enable' : 'Disable'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => {
                      promptDeleteVoucher(selectedVoucher);
                    }}
                  >
                    <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#ffffff', fontWeight: '700' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 🌟 GORGEOUS CONFIRMATION MODAL CARD (DISABLE / ENABLE / DELETE) ── */}
      <Modal
        visible={!!confirmModalData}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalData(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(5, 10, 20, 0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 390,
            backgroundColor: '#101a2e',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: confirmModalData?.type === 'enable' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)',
            padding: 24,
            alignItems: 'center',
            shadowColor: confirmModalData?.type === 'enable' ? '#10b981' : '#ef4444',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 28,
            elevation: 24,
          }}>
            {/* Top Icon Badge */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: confirmModalData?.type === 'enable' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: confirmModalData?.type === 'enable' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }}>
              {confirmModalData?.type === 'delete' ? (
                <Trash2 size={30} color="#ef4444" />
              ) : confirmModalData?.type === 'disable' ? (
                <Ban size={30} color="#ef4444" />
              ) : (
                <CheckCircle size={30} color="#10b981" />
              )}
            </View>

            {/* Title */}
            <Text style={{
              color: '#f8fafc',
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              {confirmModalData?.title}
            </Text>

            {/* Voucher Code Chip */}
            <View style={{
              backgroundColor: '#0a101f',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#1e293b',
              marginBottom: 14,
            }}>
              <Text style={{
                color: '#f0b429',
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: 1.5,
              }}>
                {confirmModalData?.voucher.code}
              </Text>
            </View>

            {/* Description */}
            <Text style={{
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 19,
              marginBottom: 22,
              paddingHorizontal: 6,
            }}>
              {confirmModalData?.description}
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setConfirmModalData(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#cbd5e1', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={executeConfirmAction}
                style={{
                  flex: 1.3,
                  backgroundColor: confirmModalData?.confirmBtnColor || '#ef4444',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                  {confirmModalData?.confirmBtnText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 🌟 GORGEOUS ADMIN SUCCESS MODAL CARD ── */}
      <Modal
        visible={!!successModalData}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalData(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(5, 10, 20, 0.82)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#101a2e',
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: successModalData?.type === 'single' ? 'rgba(240, 180, 41, 0.45)' : 'rgba(6, 182, 212, 0.45)',
            padding: 24,
            alignItems: 'center',
            shadowColor: successModalData?.type === 'single' ? '#f0b429' : '#06b6d4',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 28,
            elevation: 24,
          }}>
            {/* Glowing Tag */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: successModalData?.type === 'single' ? 'rgba(240, 180, 41, 0.15)' : 'rgba(6, 182, 212, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: successModalData?.type === 'single' ? 'rgba(240, 180, 41, 0.35)' : 'rgba(6, 182, 212, 0.35)',
            }}>
              <Sparkles size={13} color={successModalData?.type === 'single' ? '#f0b429' : '#06b6d4'} style={{ marginRight: 6 }} />
              <Text style={{
                color: successModalData?.type === 'single' ? '#f0b429' : '#06b6d4',
                fontSize: 11.5,
                fontWeight: '800',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}>
                {successModalData?.type === 'single' ? 'Ready For Redemption' : 'Batch Created'}
              </Text>
            </View>

            {/* Heading */}
            <Text style={{
              color: '#f8fafc',
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 6,
              letterSpacing: 0.3,
            }}>
              {successModalData?.title}
            </Text>

            <Text style={{
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 19,
              marginBottom: 20,
              paddingHorizontal: 10,
            }}>
              {successModalData?.subtitle}
            </Text>

            {/* Content for Single Voucher */}
            {successModalData?.type === 'single' && successModalData.code && (
              <View style={{
                width: '100%',
                backgroundColor: '#0a101f',
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: '#1e293b',
                marginBottom: 20,
              }}>
                <View style={{ alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    Voucher Code
                  </Text>
                  <Text style={{
                    color: '#f0b429',
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    fontSize: 22,
                    fontWeight: '800',
                    letterSpacing: 2,
                  }}>
                    {successModalData.code}
                  </Text>
                </View>

                {/* Inline Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <TouchableOpacity
                    onPress={() => handleCopyCode(successModalData.code!)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: copiedCode === successModalData.code ? '#10b981' : '#1e293b',
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    {copiedCode === successModalData.code ? (
                      <>
                        <Check size={14} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Copied!</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color="#f8fafc" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#f8fafc', fontWeight: '600', fontSize: 13 }}>Copy Code</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareCode({
                      id: successModalData.code!,
                      code: successModalData.code!,
                      status: 'unused',
                      durationDays: successModalData.durationDays || 365,
                      createdAt: new Date().toISOString(),
                    })}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1e293b',
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Share2 size={14} color="#f8fafc" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#f8fafc', fontWeight: '600', fontSize: 13 }}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Details Breakdown */}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 10, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12.5 }}>Duration:</Text>
                    <Text style={{ color: '#f8fafc', fontSize: 12.5, fontWeight: '700' }}>{successModalData.durationDays} Days (Starts upon redemption)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12.5 }}>Redeem Before:</Text>
                    <Text style={{ color: '#f8fafc', fontSize: 12.5, fontWeight: '600' }}>{successModalData.expiryDate}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12.5 }}>Batch Tag:</Text>
                    <Text style={{ color: '#06b6d4', fontSize: 12.5, fontWeight: '600' }}>{successModalData.batchTag}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Content for Bulk Vouchers */}
            {successModalData?.type === 'bulk' && (
              <View style={{
                width: '100%',
                backgroundColor: '#0a101f',
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: '#1e293b',
                marginBottom: 20,
              }}>
                <View style={{ alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ color: '#06b6d4', fontSize: 24, fontWeight: '800' }}>
                    {successModalData.count} Vouchers
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                    Ready for Distribution
                  </Text>
                </View>

                {/* Quick Print / Export buttons */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSuccessModalData(null);
                      handlePrintCardsPdf();
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(16, 185, 129, 0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Printer size={15} color="#10b981" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Print PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSuccessModalData(null);
                      handleExportCsv();
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(96, 165, 250, 0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(96, 165, 250, 0.4)',
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    <FileSpreadsheet size={15} color="#60a5fa" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#60a5fa', fontWeight: '700', fontSize: 13 }}>Export CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={() => setSuccessModalData(null)}
              style={{
                width: '100%',
                backgroundColor: successModalData?.type === 'single' ? '#f0b429' : '#06b6d4',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: successModalData?.type === 'single' ? '#f0b429' : '#06b6d4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800', marginRight: 6 }}>
                Done
              </Text>
              <Check size={18} color="#0f172a" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1b2340',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3b66',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f6fb',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a1c4',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#f0b429',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionTxt: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#1b2340',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2d3b66',
  },
  secondaryActionTxt: {
    color: '#f4f6fb',
    fontSize: 14,
    fontWeight: '700',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1b2340',
    borderWidth: 1,
    borderColor: '#2d3b66',
  },
  exportPillTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1b2340',
    borderWidth: 1,
    borderColor: '#2d3b66',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#f0b429',
    borderColor: '#f0b429',
  },
  filterPillText: {
    fontSize: 12,
    color: '#94a1c4',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: '#242e50',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#0f172a',
  },
  filterBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a1c4',
  },
  filterBadgeTxtActive: {
    color: '#f0b429',
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingTxt: {
    color: '#94a1c4',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#f4f6fb',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  voucherCard: {
    backgroundColor: '#1b2340',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d3b66',
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f4f6fb',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#242e50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTxt: {
    color: '#94a1c4',
    fontSize: 12,
  },
  redeemedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98130',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  redeemedChurchName: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  redeemedDateTxt: {
    color: '#94a1c4',
    fontSize: 11,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#242e50',
    paddingTop: 8,
    marginTop: 4,
  },
  batchText: {
    color: '#64748b',
    fontSize: 11,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  toggleBtnTxt: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  enableBtn: {
    backgroundColor: '#10b98120',
    borderColor: '#10b98140',
  },
  enableBtnTxt: {
    color: '#10b981',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ef444418',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  deleteBtnTxt: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#131b31',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2d3b66',
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f4f6fb',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a1c4',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  linkTxt: {
    color: '#f0b429',
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242e50',
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#f4f6fb',
    fontSize: 15,
  },
  inputHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  submitModalBtn: {
    backgroundColor: '#f0b429',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitModalBtnTxt: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  detailBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242e50',
  },
  detailBoxLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailBoxValueCode: {
    color: '#f0b429',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0b429',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  copyPillTxt: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1b2340',
  },
  infoKey: {
    color: '#94a1c4',
    fontSize: 13,
  },
  infoVal: {
    color: '#f4f6fb',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#242e50',
    marginVertical: 12,
  },
  sectionHeader: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
