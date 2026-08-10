import React, { useState, useEffect, useContext } from 'react'; // Force TS Refresh
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  Platform,
  Image
} from 'react-native';
import { 
  Plus, 
  ChevronLeft,
  Calendar,
  Search,
  ChevronRight,
  Save,
  X,
  Pencil,
  Trash2,
  Gift,
  CheckCircle2,
  FileText,
  Printer,
  FolderHeart
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { ChurchDonation } from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom Range' | 'All Time';
type SubTab = 'dashboard' | 'donations';

export default function AdminDonationDashboard() {
  const { setActiveTab } = useContext(AdminTabContext);
  const { member } = useAuth();
  const [donations, setDonations] = useState<ChurchDonation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local UI State
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>('dashboard');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [churchProfile, setChurchProfile] = useState<any>(null);

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
  const [showCustomEndPicker, setShowCustomEndPicker] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([
    'Tithes', 'Offering', 'Building Fund', 'Missionary', 'Other'
  ]);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
    const [showCategoryInvoiceModal, setShowCategoryInvoiceModal] = useState(false);
  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [reportDateFilter, setReportDateFilter] = useState<FilterPeriod>('Month');
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);
  const [reportCustomStartDate, setReportCustomStartDate] = useState<Date | null>(null);
  const [reportCustomEndDate, setReportCustomEndDate] = useState<Date | null>(null);
  const [showReportStartPicker, setShowReportStartPicker] = useState(false);
  const [showReportEndPicker, setShowReportEndPicker] = useState(false);
  const [selectedDonationForInvoice, setSelectedDonationForInvoice] = useState<ChurchDonation | null>(null);
  const invoiceRef = React.useRef<any>(null);
  const categoryInvoiceRef = React.useRef<any>(null);

  // Add Donation Modal State
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [addDonCategory, setAddDonCategory] = useState('Tithes');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [donationDonorName, setDonationDonorName] = useState('');
  const [donationDonorPhone, setDonationDonorPhone] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationPaymentMethod, setDonationPaymentMethod] = useState('Cash');
  const [donationNotes, setDonationNotes] = useState('');
  const [editDonationId, setEditDonationId] = useState<string | null>(null);
  
  // Success Card State
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchData = async () => {
    try {
      const churchId = member?.churchId || member?.primaryChurchId;
      if (churchId) {
        const cDoc = await firestore().collection('churches').doc(churchId).get();
        const docData: any = typeof cDoc.data === 'function' ? cDoc.data() : cDoc.data;
        if (docData) {
          setChurchProfile(docData);
          if (docData.customDonationCategories && Array.isArray(docData.customDonationCategories)) {
            setCategories(prev => Array.from(new Set([...prev, ...docData.customDonationCategories])));
          }
        }
      }

      const donData = await FirestoreService.getDonations(500);
      setDonations(donData);
      
      const usedCategories = donData.map(e => e.category).filter(Boolean);
      setCategories(prev => Array.from(new Set([...prev, ...usedCategories])));
    } catch (err) {
      console.error(err);
      displayToast("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [member]);

  const openAddDonation = () => {
    setEditDonationId(null);
    setAddDonCategory(categories.length > 0 ? categories[0] : 'Tithes');
    setShowCategoryDropdown(false);
    setDonationDonorName('');
    setDonationDonorPhone('');
    setDonationAmount('');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setDonationPaymentMethod('Cash');
    setDonationNotes('');
    setShowAddDonationModal(true);
  };

  const openEditDonation = (don: ChurchDonation) => {
    setEditDonationId(don.id || null);
    setAddDonCategory(don.category || 'Tithes');
    setShowCategoryDropdown(false);
    
    setDonationDonorName(don.donorName || '');
    setDonationDonorPhone(don.donorPhone || '');
    setDonationAmount(String(don.amount || ''));
    setDonationDate(don.date || new Date().toISOString().split('T')[0]);
    setDonationPaymentMethod(don.paymentMethod || 'Cash');
    setDonationNotes(don.notes || '');
    setShowAddDonationModal(true);
  };

  const handleSaveDonation = async () => {
    if (!donationAmount || isNaN(parseFloat(donationAmount))) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!donationDonorName.trim()) {
      Alert.alert('Validation Error', 'Please enter a donor name.');
      return;
    }

    try {
      const data: Partial<ChurchDonation> = {
        amount: parseFloat(donationAmount),
        category: addDonCategory,
        donorName: donationDonorName,
        donorPhone: donationDonorPhone,
        date: donationDate,
        paymentMethod: donationPaymentMethod,
        notes: donationNotes,
        addedBy: member?.name || member?.id
      };
      
      if (editDonationId) {
        data.id = editDonationId;
      }
      
      await FirestoreService.saveDonation(data);
      setShowAddDonationModal(false);
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2000);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save donation.');
    }
  };

  const handleDeleteDonation = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this donation record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await FirestoreService.deleteDonation(id);
          displayToast("Donation deleted");
          fetchData();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete donation');
        }
      }}
    ]);
  };

  const getSequentialDonationNumber = (donId?: string) => {
    if (!donId) return String(donations.length + 1).padStart(7, '0');
    const index = donations.findIndex(d => d.id === donId);
    const stableNum = index !== -1 ? (donations.length - index) : (donations.length + 1);
    return String(stableNum).padStart(7, '0');
  };

  const generateInvoiceHtml = (don: ChurchDonation) => {
      const cName = churchProfile?.name || "We Christian Church";
      const churchCode = (churchProfile?.name || 'WEC').substring(0, 3).toUpperCase();
      const receiptNo = `${churchCode}-DON-${getSequentialDonationNumber(don.id)}`;
      const cAddress = churchProfile?.address || churchProfile?.mailingCity ? `${churchProfile.mailingCity}, ${churchProfile.mailingState || ''}` : "";
      const cPhone = churchProfile?.phone || "";
      const logoUrl = churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto || null;
      
      const logoHtml = logoUrl 
         ? `<img src="${logoUrl}" style="width: 80px; height: 80px; border-radius: 40px; object-fit: cover; margin-bottom: 15px; border: 3px solid #c9973f; padding: 2px;" />` 
         : `<div style="width: 80px; height: 80px; border-radius: 40px; background-color: #c9973f; color: #141d33; font-size: 36px; font-weight: bold; line-height: 80px; text-align: center; margin: 0 auto 15px auto;">${cName.charAt(0).toUpperCase()}</div>`;

      return `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 30px; background-color: #f4f6f8; color: #1b2a4a; }
              .invoice-container { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border-top: 8px solid #c9973f; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f4efe6; padding-bottom: 30px; }
              .header h1, .header h2 { margin: 0; color: #1b2a4a; font-weight: 800; letter-spacing: 0.5px; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 35px; flex-wrap: wrap; background: #faf3e3; padding: 25px; border-radius: 10px; border: 1px solid rgba(201, 151, 63, 0.3); }
              .meta-box { width: 45%; margin-bottom: 15px; }
              .label { font-size: 10px; font-weight: 800; color: #c9973f; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1.2px; }
              .value { font-size: 15px; font-weight: 700; color: #1b2a4a; }
              table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 35px; border-radius: 8px; overflow: hidden; border: 1px solid #e1e5eb; }
              th { text-align: left; background-color: #1b2a4a; color: #ffffff; padding: 15px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
              td { padding: 15px 12px; border-bottom: 1px solid #e1e5eb; font-size: 14px; font-weight: 500; color: #3a4b6c; }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .total-box { background: #1b2a4a; padding: 25px; text-align: right; border-radius: 10px; margin-bottom: 50px; box-shadow: 0 10px 20px rgba(27, 42, 74, 0.15); }
              .total-label { font-size: 12px; font-weight: 800; color: #c9973f; text-transform: uppercase; letter-spacing: 1.5px; }
              .total-value { font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 8px; }
              .footer { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; }
              .sign-box { width: 35%; border-top: 2px dashed #a89f92; text-align: center; padding-top: 15px; font-size: 11px; color: #645d54; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <div class="church-info">
                  ${logoHtml}
                  <h2 style="margin:0; margin-top:10px; margin-bottom:5px;">${cName}</h2>
                  ${cAddress ? `<div style="font-size: 13px; color: #645d54; margin-bottom:3px;">${cAddress}</div>` : ''}
                  ${cPhone ? `<div style="font-size: 13px; color: #645d54;">Phone: ${cPhone}</div>` : ''}
                </div>
              </div>
              <div class="meta">
                <div class="meta-box"><div class="label">RECEIPT NO</div><div class="value">${receiptNo}</div></div>
                <div class="meta-box"><div class="label">DONATION DATE</div><div class="value">${don.date}</div></div>
                <div class="meta-box"><div class="label">RECEIVED FROM</div><div class="value">${don.donorName}</div></div>
                <div class="meta-box"><div class="label">DONOR PHONE</div><div class="value">${don.donorPhone || 'N/A'}</div></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>DONATION CATEGORY</th>
                    <th style="text-align:center;">PAYMENT METHOD</th>
                    <th style="text-align:right;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding-left: 20px; font-weight: 700;">${don.category}</td>
                    <td style="text-align:center;">${don.paymentMethod || 'Cash'}</td>
                    <td style="text-align:right;">₹${don.amount.toLocaleString('en-IN')}</td>
                  </tr>
                  ${don.notes ? `
                  <tr>
                    <td colspan="3" style="padding-left: 20px; font-size: 12px; color: #645d54;"><strong>Notes:</strong> ${don.notes}</td>
                  </tr>` : ''}
                </tbody>
              </table>
              <div class="total-box">
                <div class="total-label">GRAND TOTAL</div>
                <div class="total-value">₹${don.amount.toLocaleString('en-IN')}</div>
              </div>
              <div style="text-align: center; margin-bottom: 20px; font-size: 14px; color: #645d54; font-style: italic;">
                Thank you for your generous donation. May God bless you abundantly.
              </div>
              <div class="footer">
                <div class="sign-box">Church Seal</div>
                <div class="sign-box">Authorized Signature</div>
              </div>
            </div>
          </body>
        </html>
      `;
  };

  const handleGenerateInvoice = async (don: ChurchDonation) => {
    try {
      const html = generateInvoiceHtml(don);
      const { uri } = await Print.printToFileAsync({ html });
      
      const receiptNo = don.id ? don.id.substring(0, 6).toUpperCase() : Date.now().toString().slice(-6);
      const cleanFileName = `Donation-Receipt-${receiptNo}-${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystemLegacy.cacheDirectory + cleanFileName;
      await FileSystemLegacy.copyAsync({ from: uri, to: newUri });
      
      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const base64Data = await FileSystemLegacy.readAsStringAsync(newUri, { encoding: FileSystemLegacy.EncodingType.Base64 });
            const savedUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(permissions.directoryUri, cleanFileName, 'application/pdf');
            await FileSystemLegacy.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystemLegacy.EncodingType.Base64 });
            Alert.alert('Success', 'Receipt downloaded successfully.');
          } else {
            await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Donation Receipt' });
          }
        } catch (err) {
          await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Donation Receipt' });
        }
      } else {
        await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Donation Receipt' });
      }
    } catch (e: any) {
      if (e?.message?.includes('Another share request')) {
        return;
      }
      Alert.alert('Error', e?.message || 'Failed to generate invoice');
    }
  };

  const handlePrint = async (don: ChurchDonation) => {
    try {
      const html = generateInvoiceHtml(don);
      await Print.printAsync({ html });
    } catch (e: any) {
      Alert.alert('Print Error', e?.message || 'Unknown error');
    }
  };

  const handleDownloadImage = async () => {
    try {
      if (invoiceRef.current) {
        const uri = await invoiceRef.current.capture();
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Success', 'Receipt saved to photos');
        } else {
          Alert.alert('Permission Denied', 'Please grant permission to save images.');
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleShareImage = async () => {
    try {
      if (invoiceRef.current) {
        const uri = await invoiceRef.current.capture();
        await Sharing.shareAsync(uri, { dialogTitle: 'Share Receipt' });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const generateCategoryInvoiceHtml = (category: string, dons: ChurchDonation[]) => {
      const cName = churchProfile?.name || "We Christian Church";
      const churchCode = (churchProfile?.name || 'WEC').substring(0, 3).toUpperCase();
      const reportNo = `${churchCode}-REP-${Date.now().toString().slice(-6)}`;
      const cAddress = churchProfile?.address || churchProfile?.mailingCity ? `${churchProfile.mailingCity}, ${churchProfile.mailingState || ''}` : "";
      const cPhone = churchProfile?.phone || "";
      const logoUrl = churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto || null;
      
      const logoHtml = logoUrl 
         ? `<img src="${logoUrl}" style="width: 80px; height: 80px; border-radius: 40px; object-fit: cover; margin-bottom: 15px; border: 3px solid #c9973f; padding: 2px;" />` 
         : `<div style="width: 80px; height: 80px; border-radius: 40px; background-color: #c9973f; color: #141d33; font-size: 36px; font-weight: bold; line-height: 80px; text-align: center; margin: 0 auto 15px auto;">${cName.charAt(0).toUpperCase()}</div>`;

      const grandTotal = dons.reduce((sum, d) => sum + d.amount, 0);

      const tableRows = dons.map(don => `
        <tr>
          <td style="padding-left: 20px; font-weight: 700;">${don.donorName || 'Unknown'}</td>
          <td style="text-align:center;">${don.paymentMethod || 'Cash'}</td>
          <td style="text-align:right;">₹${don.amount.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      return `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 30px; background-color: #f4f6f8; color: #1b2a4a; }
              .invoice-container { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border-top: 8px solid #c9973f; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f4efe6; padding-bottom: 30px; }
              .header h1, .header h2 { margin: 0; color: #1b2a4a; font-weight: 800; letter-spacing: 0.5px; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 35px; flex-wrap: wrap; background: #faf3e3; padding: 25px; border-radius: 10px; border: 1px solid rgba(201, 151, 63, 0.3); }
              .meta-box { width: 45%; margin-bottom: 15px; }
              .label { font-size: 10px; font-weight: 800; color: #c9973f; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1.2px; }
              .value { font-size: 15px; font-weight: 700; color: #1b2a4a; }
              table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 35px; border-radius: 8px; overflow: hidden; border: 1px solid #e1e5eb; }
              th { text-align: left; background-color: #1b2a4a; color: #ffffff; padding: 15px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
              td { padding: 15px 12px; border-bottom: 1px solid #e1e5eb; font-size: 14px; font-weight: 500; color: #3a4b6c; }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .total-box { background: #1b2a4a; padding: 25px; text-align: right; border-radius: 10px; margin-bottom: 50px; box-shadow: 0 10px 20px rgba(27, 42, 74, 0.15); }
              .total-label { font-size: 12px; font-weight: 800; color: #c9973f; text-transform: uppercase; letter-spacing: 1.5px; }
              .total-value { font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 8px; }
              .footer { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; }
              .sign-box { width: 35%; border-top: 2px dashed #a89f92; text-align: center; padding-top: 15px; font-size: 11px; color: #645d54; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <div class="church-info">
                  ${logoHtml}
                  <h2 style="margin:0; margin-top:10px; margin-bottom:5px;">${cName}</h2>
                  ${cAddress ? `<div style="font-size: 13px; color: #645d54; margin-bottom:3px;">${cAddress}</div>` : ''}
                  ${cPhone ? `<div style="font-size: 13px; color: #645d54;">Phone: ${cPhone}</div>` : ''}
                </div>
              </div>
              <div class="meta">
                <div class="meta-box"><div class="label">REPORT NO</div><div class="value">${reportNo}</div></div>
                <div class="meta-box"><div class="label">GENERATION DATE</div><div class="value">${new Date().toISOString().split('T')[0]}</div></div>
                <div class="meta-box"><div class="label">CATEGORY</div><div class="value">${category}</div></div>
                <div class="meta-box"><div class="label">TOTAL ITEMS</div><div class="value">${dons.length} donations</div></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>DONOR NAME</th>
                    <th style="text-align:center;">METHOD</th>
                    <th style="text-align:right;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              <div class="total-box">
                <div class="total-label">GRAND TOTAL</div>
                <div class="total-value">₹${grandTotal.toLocaleString('en-IN')}</div>
              </div>
              <div class="footer">
                <div class="sign-box">Church Seal</div>
                <div class="sign-box">Authorized Signature</div>
              </div>
            </div>
          </body>
        </html>
      `;
  };

  const handleGenerateCategoryInvoice = async (category: string, dons: ChurchDonation[]) => {
    try {
      const html = generateCategoryInvoiceHtml(category, dons);
      const { uri } = await Print.printToFileAsync({ html });
      
      const cleanFileName = `Category-Report-${category.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      const newUri = FileSystemLegacy.cacheDirectory + cleanFileName;
      await FileSystemLegacy.copyAsync({ from: uri, to: newUri });
      
      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const base64Data = await FileSystemLegacy.readAsStringAsync(newUri, { encoding: FileSystemLegacy.EncodingType.Base64 });
            const savedUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(permissions.directoryUri, cleanFileName, 'application/pdf');
            await FileSystemLegacy.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystemLegacy.EncodingType.Base64 });
            Alert.alert('Success', 'Report downloaded successfully.');
          } else {
            await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Category Report' });
          }
        } catch (err) {
          await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Category Report' });
        }
      } else {
        await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Category Report' });
      }
    } catch (e: any) {
      if (e?.message?.includes('Another share request')) {
        return;
      }
      Alert.alert('Error', e?.message || 'Failed to generate report');
    }
  };

  const handlePrintCategory = async (category: string, dons: ChurchDonation[]) => {
    try {
      const html = generateCategoryInvoiceHtml(category, dons);
      await Print.printAsync({ html });
    } catch (error) {
      console.log('Print failed', error);
    }
  };

  const handleDownloadCategoryImage = async () => {
    try {
      if (categoryInvoiceRef.current) {
        const uri = await categoryInvoiceRef.current.capture();
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Success', 'Report saved to photos');
        } else {
          Alert.alert('Permission Denied', 'Needs storage permission');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleShareCategoryImage = async () => {
    try {
      if (categoryInvoiceRef.current) {
        const uri = await categoryInvoiceRef.current.capture();
        await Sharing.shareAsync(uri, { dialogTitle: 'Share Category Report' });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const churchId = member?.churchId || member?.primaryChurchId;
      if (!churchId) return;
      
      const newCats = Array.from(new Set([...categories, newCategoryName.trim()]));
      setCategories(newCats);
      await firestore().collection('churches').doc(churchId).update({
        customDonationCategories: newCats
      });
      setShowCategoryModal(false);
      setNewCategoryName('');
      displayToast("Category created successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to create category");
    }
  };

  // ── Calculation & Grouping Logic ──
  const getStats = () => {
    let today = 0, thisWeek = 0, thisMonth = 0, thisYear = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    donations.forEach(d => {
      if (!d.date || !d.amount) return;
      const dDate = new Date(d.date);
      if (isNaN(dDate.getTime())) return;

      if (d.date === todayStr) today += d.amount;
      if (dDate >= startOfWeek) thisWeek += d.amount;
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) thisMonth += d.amount;
      if (dDate.getFullYear() === currentYear) thisYear += d.amount;
    });

    return { today, thisWeek, thisMonth, thisYear };
  };

  const stats = getStats();

  // Filters for sub-tab
  const getReportFilteredDonations = (data: ChurchDonation[]) => {
    let filtered = data;
    const now = new Date();
    
    if (reportDateFilter === 'Today') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = data.filter(e => e.date === todayStr);
    } else if (reportDateFilter === 'Week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      filtered = data.filter(e => new Date(e.date) >= startOfWeek);
    } else if (reportDateFilter === 'Month') {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (reportDateFilter === 'Year') {
      filtered = data.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    } else if (reportDateFilter === 'Custom Range' && reportCustomStartDate && reportCustomEndDate) {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d >= reportCustomStartDate && d <= reportCustomEndDate;
      });
    }
    return filtered;
  };

  const filterDonations = (data: ChurchDonation[]) => {
    let filtered = data;
    const now = new Date();
    
    if (filterPeriod === 'Today') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = data.filter(e => e.date === todayStr);
    } else if (filterPeriod === 'Week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      filtered = data.filter(e => new Date(e.date) >= startOfWeek);
    } else if (filterPeriod === 'Month') {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filterPeriod === 'Year') {
      filtered = data.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    } else if (filterPeriod === 'Custom Range' && customStartDate && customEndDate) {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d >= customStartDate && d <= customEndDate;
      });
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(e => e.category?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const filteredDonations = filterDonations(donations);
  
  const groupedDonations = filteredDonations.reduce((groups, donation) => {
    const categoryName = donation.category || 'Tithes';
    if (!groups[categoryName]) {
      groups[categoryName] = { title: categoryName, date: donation.date, total: 0, items: [] };
    }
    if (donation.date > groups[categoryName].date) {
      groups[categoryName].date = donation.date;
    }
    groups[categoryName].items.push(donation);
    groups[categoryName].total += donation.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchDonation[] }>);
  
  const groupKeys = Object.keys(groupedDonations).sort((a,b) => groupedDonations[b].total - groupedDonations[a].total);

  // Global grouping for dashboard recent list
  const globalGroupedDonations = donations.reduce((groups, donation) => {
    const categoryName = donation.category || 'Tithes';
    if (!groups[categoryName]) {
      groups[categoryName] = { title: categoryName, date: donation.date, total: 0, items: [] };
    }
    if (donation.date > groups[categoryName].date) {
      groups[categoryName].date = donation.date;
    }
    groups[categoryName].items.push(donation);
    groups[categoryName].total += donation.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchDonation[] }>);
  
  const globalGroupKeys = Object.keys(globalGroupedDonations).sort((a,b) => {
      return new Date(globalGroupedDonations[b].date).getTime() - new Date(globalGroupedDonations[a].date).getTime();
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity 
              onPress={() => {
                if (currentSubTab === 'donations' && selectedCategoryView) {
                  setSelectedCategoryView(null);
                } else if (currentSubTab === 'donations') {
                  setCurrentSubTab('dashboard');
                } else {
                  setActiveTab(0);
                }
              }} 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.heroTitle, currentSubTab === 'dashboard' && { color: '#FCD34D' }]} numberOfLines={1}>
                  {currentSubTab === 'dashboard' ? 'Dashboard' : 
                   (selectedCategoryView ? 'Donations' : 'Donations')}
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#c9973f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 14 }}
                  onPress={openAddDonation}
                >
                  <Text style={{ color: '#141d33', fontSize: 11, fontWeight: '700' }}>+ New Donation</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.heroSub, { marginTop: 4 }]} numberOfLines={1}>
                {currentSubTab === 'dashboard' ? 'Every offering, accounted for' : 
                 (selectedCategoryView ? selectedCategoryView : 'Track every category, line by line')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        
        {/* ================= DASHBOARD ================= */}
        {currentSubTab === 'dashboard' && (
          <View>
            <View style={styles.summaryGrid}>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>Today</Text>
                <Text style={styles.sumValue}>₹{stats.today.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Week</Text>
                <Text style={styles.sumValue}>₹{stats.thisWeek.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Month</Text>
                <Text style={styles.sumValue}>₹{stats.thisMonth.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Year</Text>
                <Text style={styles.sumValue}>₹{stats.thisYear.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionHeadingTxt}>Quick actions</Text>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => setShowCategoryModal(true)}>
                <View style={styles.qaIcon}><Plus size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Create Category</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={openAddDonation}>
                <View style={styles.qaIcon}><Gift size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Add Donation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionHeadingTxt}>Recent donations</Text>
            </View>
            
            <View style={styles.catList}>
              {globalGroupKeys.slice(0, 3).map(key => {
                const group = globalGroupedDonations[key];
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={styles.recentCatCard} 
                    activeOpacity={0.9} 
                    onPress={() => {
                      setCurrentSubTab('donations');
                      setSelectedCategoryView(key);
                    }}
                  >
                    <View style={styles.catBody}>
                      <View>
                        <Text style={styles.catName}>{group.title}</Text>
                        <Text style={styles.catMeta}>{group.items.length} items • {group.date}</Text>
                      </View>
                      <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {globalGroupKeys.length === 0 && (
                <Text style={styles.emptyNote}>No recent donations found.</Text>
              )}
            </View>

            {globalGroupKeys.length > 0 && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentSubTab('donations')}>
                <Text style={styles.btnSecondaryTxt}>View All Donations</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= DONATIONS LIST ================= */}
        {currentSubTab === 'donations' && (
          <View>
            {selectedCategoryView ? (
              <View style={{ paddingTop: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                  onPress={() => setSelectedCategoryView(null)}
                >
                  <ChevronRight size={14} color="#e6c079" style={{ transform: [{ rotate: '180deg' }], marginRight: 4 }} />
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#e6c079', fontWeight: '600' }}>Back to categories</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#141d33', fontWeight: '700' }}>{selectedCategoryView}</Text>
                </View>

                {donations
                  .filter(e => e.category === selectedCategoryView)
                  .map((don, idx) => {
                    return (
                      <TouchableOpacity 
                        key={don.id || idx} 
                        style={{ 
                          backgroundColor: '#ffffff', 
                          borderRadius: 16, 
                          padding: 16, 
                          marginBottom: 14, 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderWidth: 1, 
                          borderColor: '#e5ddd0',
                          shadowColor: '#1b2a4a',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2
                        }}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedDonationForInvoice(don);
                          setShowInvoicePreviewModal(true);
                        }}
                      >
                        <View style={{ flexDirection: 'row', flex: 1, paddingRight: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 16, fontWeight: '700', color: '#1b2a4a', marginBottom: 4 }} numberOfLines={1}>
                              {don.donorName || `${don.category} Donation`}
                            </Text>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginBottom: 8 }}>
                              {don.date} • {don.paymentMethod || 'Cash'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: 70 }}>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#1b2a4a' }}>
                            ₹{don.amount?.toLocaleString('en-IN') || 0}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity 
                              onPress={() => {
                                setSelectedDonationForInvoice(don);
                                setShowInvoicePreviewModal(true);
                              }}
                              style={{ padding: 8, backgroundColor: '#eff6ff', borderRadius: 8, marginRight: 8 }}
                            >
                              <FileText size={14} color="#3b82f6" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => openEditDonation(don)}
                              style={{ padding: 8, backgroundColor: '#f4efe6', borderRadius: 8, marginRight: 8 }}
                            >
                              <Pencil size={14} color="#1b2a4a" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => {
                                if (don.id) handleDeleteDonation(don.id);
                              }}
                              style={{ padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 }}
                            >
                              <Trash2 size={14} color="#dc2626" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                {donations.filter(e => e.category === selectedCategoryView).length === 0 && (
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No records found.</Text>
                )}
                
                {donations.filter(e => e.category === selectedCategoryView).length > 0 && (
                  <View style={{ marginBottom: 40 }}>
                    <View style={{ backgroundColor: '#f4efe6', borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#c9973f' }}>
                      <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#141d33', fontWeight: '700' }}>Category Total</Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 22, color: '#141d33', fontWeight: '700' }}>
                        ₹{donations.filter(e => e.category === selectedCategoryView).reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#1b2a4a', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => {
                      setReportDateFilter(filterPeriod);
                      const catDons = donations.filter(e => e.category === selectedCategoryView);
                      const initialFiltered = getReportFilteredDonations(catDons);
                      setSelectedDonationIds(initialFiltered.map((d: ChurchDonation) => d.id || ''));
                      setShowReportConfigModal(true);
                    }}
                    >
                      <Printer size={18} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' }}>Generate Category Report</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            ) : (
              <View>
                {/* ── Filters ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 20, paddingBottom: 10 }}>
                  {(['Today', 'Week', 'Month', 'Year', 'Custom Range'] as FilterPeriod[]).map(fp => (
                    <TouchableOpacity 
                      key={fp} 
                      style={[styles.filterChip, filterPeriod === fp && styles.filterChipActive]}
                      onPress={() => setFilterPeriod(fp)}
                    >
                      <Text style={[styles.filterChipTxt, filterPeriod === fp && styles.filterChipTxtActive]}>
                        {fp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {filterPeriod === 'Custom Range' && (
                  <View style={styles.customRangeRow}>
                    <TouchableOpacity style={styles.customRangeBtn} onPress={() => setShowCustomStartPicker(true)}>
                      <Calendar size={14} color="#a89f92" style={{ marginRight: 6 }} />
                      <Text style={styles.customRangeBtnTxt}>
                        {customStartDate ? customStartDate.toLocaleDateString() : 'Start Date'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.customRangeTo}>to</Text>
                    <TouchableOpacity style={styles.customRangeBtn} onPress={() => setShowCustomEndPicker(true)}>
                      <Calendar size={14} color="#a89f92" style={{ marginRight: 6 }} />
                      <Text style={styles.customRangeBtnTxt}>
                        {customEndDate ? customEndDate.toLocaleDateString() : 'End Date'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.customRangeApply}
                      onPress={() => {
                        if (!customStartDate || !customEndDate) {
                          displayToast("Please select both dates");
                        }
                      }}
                    >
                      <Text style={styles.customRangeApplyTxt}>Apply</Text>
                    </TouchableOpacity>

                    <DateTimePickerModal
                      isVisible={showCustomStartPicker}
                      mode="date"
                      date={customStartDate || new Date()}
                      onConfirm={(d) => { setCustomStartDate(d); setShowCustomStartPicker(false); }}
                      onCancel={() => setShowCustomStartPicker(false)}
                    />
                    <DateTimePickerModal
                      isVisible={showCustomEndPicker}
                      mode="date"
                      date={customEndDate || new Date()}
                      onConfirm={(d) => { setCustomEndDate(d); setShowCustomEndPicker(false); }}
                      onCancel={() => setShowCustomEndPicker(false)}
                    />
                  </View>
                )}

                <View style={styles.searchBar}>
                  <Search size={18} color="#a89f92" />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Search categories..."
                    placeholderTextColor="#a89f92"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionHeadingTxt}>Donation categories</Text>
                </View>

                <View style={styles.catList}>
                  {groupKeys.map(cat => {
                    const group = groupedDonations[cat];
                    return (
                      <TouchableOpacity 
                        key={cat} 
                        style={styles.catCard}
                        activeOpacity={0.9}
                        onPress={() => setSelectedCategoryView(cat)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={styles.catIconContainer}>
                            <FolderHeart size={20} color="#c9973f" />
                          </View>
                          <View style={[styles.catBody, { flex: 1 }]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                              <Text style={styles.catMeta}>{group.items.length} {group.items.length === 1 ? 'donation' : 'donations'} in range</Text>
                            </View>
                            <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {groupKeys.length === 0 && (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No donation categories for this period.</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      
      {/* ── Add Donation Modal ── */}
      <Modal visible={showAddDonationModal} animationType="slide" transparent>
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <View style={styles.addExpHeader}>
              <Text style={styles.addExpTitle}>{editDonationId ? 'Edit Donation' : 'Add Donation'}</Text>
              <TouchableOpacity style={styles.addExpClose} onPress={() => setShowAddDonationModal(false)}>
                <X size={20} color="#645d54" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.addExpBody} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.helperText}>Record a new donation entry.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Donor Name</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter donor name"
                  placeholderTextColor="#a89f92"
                  value={donationDonorName}
                  onChangeText={setDonationDonorName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#a89f92"
                  value={donationDonorPhone}
                  onChangeText={setDonationDonorPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#a89f92"
                  value={donationAmount}
                  onChangeText={setDonationAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity 
                  style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' }}>{addDonCategory}</Text>
                  <ChevronRight size={16} color="#a89f92" style={{ transform: [{ rotate: showCategoryDropdown ? '-90deg' : '90deg' }] }} />
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenu}>
                    {categories.map(cat => (
                      <TouchableOpacity 
                        key={cat} 
                        style={[styles.dropdownItem, addDonCategory === cat && styles.dropdownItemActive]}
                        onPress={() => { setAddDonCategory(cat); setShowCategoryDropdown(false); }}
                      >
                        <Text style={[styles.dropdownItemTxt, addDonCategory === cat && styles.dropdownItemTxtActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: '#f4efe6' }]}
                      onPress={() => {
                        setShowCategoryDropdown(false);
                        setShowCategoryModal(true);
                      }}
                    >
                      <Text style={[styles.dropdownItemTxt, { color: '#c9973f', fontWeight: '600' }]}>+ Create new category</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={styles.input} onPress={() => {}}>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' }}>{donationDate}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <TouchableOpacity 
                      style={[styles.pmBtn, donationPaymentMethod === 'Cash' && styles.pmBtnActive]} 
                      onPress={() => setDonationPaymentMethod('Cash')}
                    >
                      <Text style={[styles.pmBtnTxt, donationPaymentMethod === 'Cash' && styles.pmBtnTxtActive]}>Cash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.pmBtn, donationPaymentMethod === 'Online' && styles.pmBtnActive]} 
                      onPress={() => setDonationPaymentMethod('Online')}
                    >
                      <Text style={[styles.pmBtnTxt, donationPaymentMethod === 'Online' && styles.pmBtnTxtActive]}>Online</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Additional details..."
                  placeholderTextColor="#a89f92"
                  value={donationNotes}
                  onChangeText={setDonationNotes}
                  multiline
                />
              </View>
              
              <View style={{ height: 100 }} />
            </ScrollView>
            
            <View style={styles.addExpFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDonation}>
                <Save size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnTxt}>Save Donation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Invoice Preview Modal ── */}
      <Modal visible={showInvoicePreviewModal} transparent animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <View style={styles.addExpHeader}>
              <Text style={styles.addExpTitle}>Receipt Preview</Text>
              <TouchableOpacity style={styles.addExpClose} onPress={() => setShowInvoicePreviewModal(false)}>
                <X size={20} color="#645d54" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 100 }}>
              <ViewShot ref={invoiceRef} options={{ format: "png", quality: 1.0 }} style={{ backgroundColor: '#f4f6f8', padding: 15, paddingBottom: 30, paddingTop: 30, borderRadius: 12 }}>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderTopWidth: 6, borderTopColor: '#c9973f' }}>
                  
                  <View style={{ alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f4efe6', paddingBottom: 20 }}>
                    {churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto ? (
                      <Image source={{ uri: churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 12, borderWidth: 2, borderColor: '#c9973f' }} />
                    ) : (
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#c9973f', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#141d33', fontWeight: '700' }}>
                          {(churchProfile?.name || member?.churchId || 'W').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#1b2a4a', fontWeight: '700', textAlign: 'center' }}>
                      {churchProfile?.name || member?.churchId || "We Christian Church"}
                    </Text>
                    {churchProfile?.address || churchProfile?.mailingCity ? (
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginTop: 4, textAlign: 'center' }}>
                        {churchProfile?.address || `${churchProfile.mailingCity}, ${churchProfile.mailingState || ''}`}
                      </Text>
                    ) : null}
                    {churchProfile?.phone ? (
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginTop: 2, textAlign: 'center' }}>
                        Phone: {churchProfile.phone}
                      </Text>
                    ) : null}
                  </View>

                  {selectedDonationForInvoice && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>RECEIPT NO</Text>
                        <Text style={styles.invValue}>{(churchProfile?.name || 'WEC').substring(0, 3).toUpperCase()}-DON-{getSequentialDonationNumber(selectedDonationForInvoice.id)}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>DATE</Text>
                        <Text style={styles.invValue}>{selectedDonationForInvoice.date}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>RECEIVED FROM</Text>
                        <Text style={styles.invValue}>{selectedDonationForInvoice.donorName}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>PHONE</Text>
                        <Text style={styles.invValue}>{selectedDonationForInvoice.donorPhone || 'N/A'}</Text>
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1b2a4a', paddingBottom: 8, marginBottom: 8 }}>
                    <Text style={[styles.invLabel, { flex: 2, color: '#1b2a4a' }]}>CATEGORY</Text>
                    <Text style={[styles.invLabel, { flex: 1, color: '#1b2a4a', textAlign: 'center' }]}>METHOD</Text>
                    <Text style={[styles.invLabel, { flex: 1.2, color: '#1b2a4a', textAlign: 'right' }]}>AMOUNT</Text>
                  </View>

                  {selectedDonationForInvoice && (
                    <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4efe6' }}>
                      <Text style={[styles.invRowText, { flex: 2, fontWeight: '600' }]}>{selectedDonationForInvoice.category}</Text>
                      <Text style={[styles.invRowText, { flex: 1, textAlign: 'center' }]}>{selectedDonationForInvoice.paymentMethod || 'Cash'}</Text>
                      <Text style={[styles.invRowText, { flex: 1.2, textAlign: 'right' }]}>₹{selectedDonationForInvoice.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  )}

                  {selectedDonationForInvoice?.notes ? (
                    <View style={{ paddingVertical: 8 }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: '#645d54' }}><Text style={{ fontWeight: '700' }}>Notes:</Text> {selectedDonationForInvoice.notes}</Text>
                    </View>
                  ) : null}

                  <View style={styles.grandTotalBlock}>
                    <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                    <Text style={styles.grandTotalAmt}>
                      ₹{selectedDonationForInvoice?.amount.toLocaleString('en-IN') || 0}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
                    <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Church Seal</Text>
                    </View>
                    <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Authorized Signature</Text>
                    </View>
                  </View>
                </View>
              </ViewShot>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#c9973f' }]} onPress={handleDownloadImage}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Save Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#1b2a4a' }]} onPress={handleShareImage}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#e7ebf3', borderWidth: 0 }]} onPress={() => selectedDonationForInvoice && handlePrint(selectedDonationForInvoice)}>
                  <Text style={[styles.invActionBtnTxt, { color: '#1b2a4a', fontSize: 11 }]}>Print</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Report Configuration Modal ── */}
      <Modal visible={showReportConfigModal} transparent animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={[styles.addExpModal, { height: '85%', paddingHorizontal: 22, width: '92%', maxWidth: 450 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#141d33', fontWeight: '700' }}>Configure Report</Text>
              <TouchableOpacity onPress={() => setShowReportConfigModal(false)}>
                <X size={20} color="#645d54" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#887d6d', marginBottom: 8 }}>DATE RANGE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
              {(['All Time', 'Today', 'Week', 'Month', 'Year', 'Custom Range'] as FilterPeriod[]).map(fp => (
                <TouchableOpacity 
                  key={fp}
                  style={[styles.filterChip, reportDateFilter === fp && styles.filterChipActive]}
                  onPress={() => {
                    setReportDateFilter(fp);
                    if (fp !== 'Custom Range') {
                      setTimeout(() => {
                        const catDons = donations.filter(e => e.category === selectedCategoryView);
                        let filtered = catDons;
                        const now = new Date();
                        if (fp === 'Today') {
                          const todayStr = now.toISOString().split('T')[0];
                          filtered = catDons.filter(e => e.date === todayStr);
                        } else if (fp === 'Week') {
                          const startOfWeek = new Date(now);
                          startOfWeek.setDate(now.getDate() - now.getDay());
                          startOfWeek.setHours(0,0,0,0);
                          filtered = catDons.filter(e => new Date(e.date) >= startOfWeek);
                        } else if (fp === 'Month') {
                          filtered = catDons.filter(e => {
                            const d = new Date(e.date);
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                          });
                        } else if (fp === 'Year') {
                          filtered = catDons.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
                        }
                        setSelectedDonationIds(filtered.map(d => d.id || ''));
                      }, 0);
                    }
                  }}
                >
                  <Text style={[styles.filterChipTxt, reportDateFilter === fp && styles.filterChipTxtActive]}>{fp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {reportDateFilter === 'Custom Range' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                <TouchableOpacity style={{ flex: 1, padding: 10, borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8 }} onPress={() => setShowReportStartPicker(true)}>
                  <Text style={{ fontSize: 12, color: '#645d54' }}>From: {reportCustomStartDate ? reportCustomStartDate.toISOString().split('T')[0] : 'Select'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: 10, borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8 }} onPress={() => setShowReportEndPicker(true)}>
                  <Text style={{ fontSize: 12, color: '#645d54' }}>To: {reportCustomEndDate ? reportCustomEndDate.toISOString().split('T')[0] : 'Select'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 10, backgroundColor: '#1b2a4a', borderRadius: 8, justifyContent: 'center' }} onPress={() => {
                    const catDons = donations.filter(e => e.category === selectedCategoryView);
                    const filtered = catDons.filter(e => {
                      const d = new Date(e.date);
                      return d >= (reportCustomStartDate || new Date(0)) && d <= (reportCustomEndDate || new Date());
                    });
                    setSelectedDonationIds(filtered.map(d => d.id || ''));
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {showReportStartPicker && (
              <DateTimePickerModal 
                isVisible={showReportStartPicker}
                date={reportCustomStartDate || new Date()} 
                mode="date" 
                display="default" 
                onConfirm={(date) => { setShowReportStartPicker(false); setReportCustomStartDate(date); }} 
                onCancel={() => setShowReportStartPicker(false)}
              />
            )}
            {showReportEndPicker && (
              <DateTimePickerModal 
                isVisible={showReportEndPicker}
                date={reportCustomEndDate || new Date()} 
                mode="date" 
                display="default" 
                onConfirm={(date) => { setShowReportEndPicker(false); setReportCustomEndDate(date); }} 
                onCancel={() => setShowReportEndPicker(false)}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#887d6d' }}>SELECT RECORDS TO INCLUDE</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1b2a4a' }}>{selectedDonationIds.length} Selected</Text>
            </View>

            <ScrollView style={{ flex: 1, borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 12, backgroundColor: '#f9f6f0' }} nestedScrollEnabled>
              {donations.filter(e => e.category === selectedCategoryView).map((don, idx) => {
                const isSelected = selectedDonationIds.includes(don.id || '');
                return (
                  <TouchableOpacity 
                    key={don.id || String(idx)} 
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5ddd0' }}
                    onPress={() => {
                      const id = don.id || '';
                      if (isSelected) {
                        setSelectedDonationIds(selectedDonationIds.filter(i => i !== id));
                      } else {
                        setSelectedDonationIds([...selectedDonationIds, id]);
                      }
                    }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: isSelected ? '#1b2a4a' : '#a89f92', backgroundColor: isSelected ? '#1b2a4a' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                      {isSelected && <CheckCircle2 size={14} color="#ffffff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#1b2a4a' }}>{don.donorName}</Text>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: '#645d54', marginTop: 2 }}>{don.date} • {don.paymentMethod || 'N/A'}</Text>
                    </View>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#1b2a4a' }}>₹{don.amount.toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                );
              })}
              {donations.filter(e => e.category === selectedCategoryView).length === 0 && (
                 <Text style={{ padding: 20, textAlign: 'center', color: '#645d54' }}>No donations found.</Text>
              )}
            </ScrollView>

            <View style={{ marginTop: 5, marginBottom: 15 }}>
              <TouchableOpacity 
                style={[{ backgroundColor: '#e6c079', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 }, { opacity: selectedDonationIds.length === 0 ? 0.5 : 1 }]} 
                disabled={selectedDonationIds.length === 0}
                onPress={() => {
                  setShowReportConfigModal(false);
                  setTimeout(() => {
                    setShowCategoryInvoiceModal(true);
                  }, 300);
                }}
              >
                <Text style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: '800', color: '#141d33', letterSpacing: 0.5 }}>Preview Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Category Report Preview Modal ── */}
      <Modal visible={showCategoryInvoiceModal} transparent animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <View style={styles.addExpHeader}>
              <Text style={styles.addExpTitle}>Report Preview</Text>
              <TouchableOpacity style={styles.addExpClose} onPress={() => setShowCategoryInvoiceModal(false)}>
                <X size={20} color="#645d54" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 100 }}>
              <ViewShot ref={categoryInvoiceRef} options={{ format: "png", quality: 1.0 }} style={{ backgroundColor: '#f4f6f8', padding: 15, paddingBottom: 30, paddingTop: 30, borderRadius: 12 }}>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderTopWidth: 6, borderTopColor: '#c9973f' }}>
                  
                  <View style={{ alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f4efe6', paddingBottom: 20 }}>
                    {churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto ? (
                      <Image source={{ uri: churchProfile?.theme?.logoUrl || churchProfile?.logoUrl || churchProfile?.profilePhoto }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 12, borderWidth: 2, borderColor: '#c9973f' }} />
                    ) : (
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#c9973f', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#141d33', fontWeight: '700' }}>
                          {(churchProfile?.name || member?.churchId || 'W').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#1b2a4a', fontWeight: '700', textAlign: 'center' }}>
                      {churchProfile?.name || member?.churchId || "We Christian Church"}
                    </Text>
                    {churchProfile?.address || churchProfile?.mailingCity ? (
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginTop: 4, textAlign: 'center' }}>
                        {churchProfile?.address || `${churchProfile.mailingCity}, ${churchProfile.mailingState || ''}`}
                      </Text>
                    ) : null}
                  </View>

                  {selectedCategoryView && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>REPORT NO</Text>
                        <Text style={styles.invValue}>{(churchProfile?.name || 'WEC').substring(0, 3).toUpperCase()}-REP-{Date.now().toString().slice(-6)}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>DATE RANGE</Text>
                        <Text style={styles.invValue}>{reportDateFilter === 'Custom Range' && reportCustomStartDate && reportCustomEndDate ? `${reportCustomStartDate.toISOString().split('T')[0]} to ${reportCustomEndDate.toISOString().split('T')[0]}` : reportDateFilter === 'All Time' ? 'All Time' : reportDateFilter}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>CATEGORY</Text>
                        <Text style={styles.invValue}>{selectedCategoryView}</Text>
                      </View>
                      <View style={{ width: '45%' }}>
                        <Text style={styles.invLabel}>TOTAL ITEMS</Text>
                        <Text style={styles.invValue}>{donations.filter(e => selectedDonationIds.includes(e.id || '')).length} donations</Text>
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1b2a4a', paddingBottom: 8, marginBottom: 8 }}>
                    <Text style={[styles.invLabel, { flex: 2, color: '#1b2a4a' }]}>DONOR NAME</Text>
                    <Text style={[styles.invLabel, { flex: 1, color: '#1b2a4a', textAlign: 'center' }]}>METHOD</Text>
                    <Text style={[styles.invLabel, { flex: 1.2, color: '#1b2a4a', textAlign: 'right' }]}>AMOUNT</Text>
                  </View>

                  {donations.filter(e => selectedDonationIds.includes(e.id || '')).map((don, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4efe6' }}>
                      <Text style={[styles.invRowText, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>{don.donorName || 'Unknown'}</Text>
                      <Text style={[styles.invRowText, { flex: 1, textAlign: 'center' }]}>{don.paymentMethod || 'Cash'}</Text>
                      <Text style={[styles.invRowText, { flex: 1.2, textAlign: 'right' }]}>₹{don.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}

                  <View style={styles.grandTotalBlock}>
                    <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                    <Text style={styles.grandTotalAmt}>
                      ₹{donations.filter(e => selectedDonationIds.includes(e.id || '')).reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
                    <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Church Seal</Text>
                    </View>
                    <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Authorized Signature</Text>
                    </View>
                  </View>
                </View>
              </ViewShot>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#c9973f' }]} onPress={handleDownloadCategoryImage}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Save Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#1b2a4a' }]} onPress={handleShareCategoryImage}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#e7ebf3', borderWidth: 0 }]} onPress={() => selectedCategoryView && handlePrintCategory(selectedCategoryView, donations.filter(e => e.category === selectedCategoryView))}>
                  <Text style={[styles.invActionBtnTxt, { color: '#1b2a4a', fontSize: 11 }]}>Print</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Create Category Modal ── */}
      <Modal visible={showCategoryModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.catModalCard}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>New Category</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowCategoryModal(false)}>
                <X size={18} color="#645d54" />
              </TouchableOpacity>
            </View>
            <Text style={styles.catModalLabel}>Category Name</Text>
            <TextInput 
              style={styles.catModalInput}
              placeholder="e.g. Special Offering"
              placeholderTextColor="#a89f92"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <TouchableOpacity style={styles.catModalSaveBtn} onPress={handleCreateCategory}>
              <Text style={styles.catModalSaveBtnTxt}>Create Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#141d33', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#ffffff', fontWeight: '600' }}>{toastMessage}</Text>
        </View>
      )}

      {/* Success Card */}
      {showSuccessCard && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 29, 51, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 30, alignItems: 'center', width: '80%' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle2 size={32} color="#15803d" />
            </View>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 24, color: '#1b2a4a', fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Success</Text>
            <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center' }}>Donation has been saved successfully.</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const FONTS = {
  sans: 'Outfit-Regular',
  serif: 'PlayfairDisplay-Regular',
  mono: 'JetBrainsMono-Regular'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4efe6' },
  loadingContainer: { flex: 1, backgroundColor: '#f4efe6', justifyContent: 'center', alignItems: 'center' },
  
  // Hero Section
  hero: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: 10, 
    paddingHorizontal: 22, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 26, 
    borderBottomRightRadius: 26,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 26, color: '#ffffff', fontWeight: '700', letterSpacing: 0.5 },
  heroSub: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', fontWeight: '500', letterSpacing: 0.5 },
  
  mainScroll: { padding: 20, paddingBottom: 100 },
  
  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, marginTop: 10 },
  sumCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  sumLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#a89f92', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sumValue: { fontFamily: FONTS.mono, fontSize: 20, color: '#1b2a4a', fontWeight: '700' },
  
  // Section Headings
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  sectionHeadingTxt: { fontFamily: FONTS.serif, fontSize: 18, color: '#1b2a4a', fontWeight: '700' },
  
  // Quick Actions
  quickActions: { flexDirection: 'column', gap: 10, marginBottom: 35 },
  qaBtn: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  qaIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#faf3e3',
    alignItems: 'center', justifyContent: 'center'
  },
  qaBtnTxt: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '600', color: '#1b2a4a' },
  
  // Buttons & Chips
  btnSecondary: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#c9973f', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20, shadowColor: '#c9973f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  btnSecondaryTxt: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#c9973f' },
  chipMini: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#e7ebf3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  chipMiniTxt: { fontFamily: FONTS.sans, fontSize: 11, fontWeight: '700', color: '#1a2d5a' },
  
  // Filter Row
  filterScroll: { marginBottom: 15 },
  filterChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  filterChipActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' },
  filterChipTxt: { fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', fontWeight: '600' },
  filterChipTxtActive: { color: '#ffffff' },
  
  // Custom Range
  customRangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#ffffff', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5ddd0' },
  customRangeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  customRangeBtnTxt: { fontFamily: FONTS.sans, fontSize: 12, color: '#241f1a', fontWeight: '600' },
  customRangeTo: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', paddingHorizontal: 10, fontWeight: '600' },
  customRangeApply: { backgroundColor: '#c9973f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  customRangeApplyTxt: { fontFamily: FONTS.sans, fontSize: 12, color: '#ffffff', fontWeight: '700' },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 25 },
  searchInput: { flex: 1, marginLeft: 12, fontFamily: FONTS.sans, fontSize: 15, color: '#241f1a' },
  
  // Category Cards
  catList: { gap: 14 },
  catCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  recentCatCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  catIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#faf3e3', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  catBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontFamily: FONTS.sans, fontSize: 16, color: '#1b2a4a', fontWeight: '700', marginBottom: 4 },
  catMeta: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', fontWeight: '500' },
  catAmt: { fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#1b2a4a' },
  emptyNote: { fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  
  // Create Category Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalCard: { width: '100%', backgroundColor: '#fcfaf6', borderRadius: 24, padding: 24, shadowColor: '#141d33', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 35, elevation: 10 },
  catModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  catModalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: '#1b2a4a', fontWeight: '700' },
  catModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3', alignItems: 'center', justifyContent: 'center' },
  catModalLabel: { fontFamily: FONTS.sans, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: '#645d54', marginBottom: 8 },
  catModalInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a', marginBottom: 20 },
  catModalSaveBtn: { backgroundColor: '#1b2a4a', borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  catModalSaveBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Add Donation Modal
  modalOverlayFull: { flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.65)', justifyContent: 'flex-end' },
  addExpModal: { backgroundColor: '#faf7f1', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', height: '90%' },
  addExpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5ddd0' },
  addExpTitle: { fontFamily: FONTS.serif, fontSize: 20, fontWeight: '700', color: '#1b2a4a' },
  addExpClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3', alignItems: 'center', justifyContent: 'center' },
  addExpBody: { paddingHorizontal: 22, paddingTop: 15 },
  helperText: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#645d54', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: FONTS.sans, color: '#241f1a' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  pmBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  pmBtnActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' },
  pmBtnTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#645d54' },
  pmBtnTxtActive: { color: '#ffffff' },
  addExpFooter: { padding: 22, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5ddd0' },
  saveBtn: { backgroundColor: '#c9973f', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' },
  
  // Dropdown
  dropdownMenu: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8, marginTop: 5, zIndex: 20 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f4efe6' },
  dropdownItemActive: { backgroundColor: '#1967d2' },
  dropdownItemTxt: { fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' },
  dropdownItemTxtActive: { color: '#ffffff', fontWeight: '500' },

  // Invoice Preview
  invLabel: { fontFamily: FONTS.sans, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#a89f92', letterSpacing: 0.5, marginBottom: 4 },
  invValue: { fontFamily: FONTS.mono, fontSize: 13, color: '#1b2a4a', fontWeight: '600' },
  invRowText: { fontFamily: FONTS.mono, fontSize: 13, color: '#645d54' },
  invActionBtn: { flex: 1, backgroundColor: '#e7ebf3', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  invActionBtnTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#1b2a4a' },
  grandTotalBlock: { backgroundColor: '#1b2a4a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  grandTotalLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#e7ebf3', letterSpacing: 0.5 },
  grandTotalAmt: { fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#e6c079' }
});
