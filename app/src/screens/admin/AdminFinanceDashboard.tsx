import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Image,
  Alert
} from 'react-native';
import { 
  Plus, 
  ChevronLeft,
  Calendar,
  Search,
  Home,
  DollarSign,
  Archive,
  ChevronRight,
  PlusCircle,
  Save,
  CheckCircle2,
  FileText,
  Trash2,
  X,
  Pencil,
  Gift
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { ChurchExpense, ChurchInvoice } from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { formatDateDisplay } from '../../utils/DateUtils';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import firestore from '@react-native-firebase/firestore';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom Range';
type SubTab = 'dashboard' | 'expenses' | 'invoices' | 'editor';

const EXPENSE_GROUPS: Record<string, string[]> = {
  'General': ['Water', 'Snacks', 'Tea', 'Flowers', 'Sound System', 'Décor', 'Transport', 'Printing', 'Electricity', 'Stationery', 'Cleaning Supplies', 'Musical Instruments', 'Honorarium'],
  'Vegetables': ['Tomato', 'Onion', 'Potato', 'Carrot', 'Cabbage', 'Chilli', 'Garlic', 'Ginger', 'Beans', 'Brinjal', 'Lemon', 'Coriander'],
  'Groceries': ['Rice', 'Sugar', 'Salt', 'Cooking Oil', 'Dal', 'Spices', 'Wheat/Atta', 'Milk', 'Tea Powder', 'Coffee Powder']
};

export default function AdminFinanceDashboard({ navigation, routeParams }: any) {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useContext(AdminTabContext);
  const { member } = useAuth();
  const { activeChurch } = useChurch();
  // churchProfile is now sourced from activeChurch (ChurchContext)
  const [expenses, setExpenses] = useState<ChurchExpense[]>([]);
  const [invoices, setInvoices] = useState<ChurchInvoice[]>([]);

  const [loading, setLoading] = useState(true);
  const invoiceRef = React.useRef<any>(null);
  
  // Local UI State
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>('dashboard');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [isCategorySelecting, setIsCategorySelecting] = useState(false);
  const [selectedCategoryExpenses, setSelectedCategoryExpenses] = useState<string[]>([]);
  const [selectedMultiCategories, setSelectedMultiCategories] = useState<string[]>([]);
  const [isMultiCatSelecting, setIsMultiCatSelecting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // churchProfile replaced by activeChurch

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
  const [showCustomEndPicker, setShowCustomEndPicker] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([
    'Sunday Service', 
    'Youth Meeting', 
    'Bible Study', 
    'Church Maintenance', 
    "Women's Prayer", 
    'Outreach'
  ]);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [addExpCategory, setAddExpCategory] = useState('Sunday Service');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<Record<string, { qty: string, price: string }>>({});
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [expenseStatus, setExpenseStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptFile, setReceiptFile] = useState<{ uri: string, name: string } | null>(null);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [addingItemToGroup, setAddingItemToGroup] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [customExpenseItems, setCustomExpenseItems] = useState<Record<string, string[]>>({});
  
  // Success Card State
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // Expense View Modal State
  const [showExpenseViewModal, setShowExpenseViewModal] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<ChurchExpense | null>(null);

  // Generate Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCategory, setInvoiceCategory] = useState('Sunday Service');
  const [showInvoiceCategoryDropdown, setShowInvoiceCategoryDropdown] = useState(false);
  const [selectedInvoiceExpenses, setSelectedInvoiceExpenses] = useState<string[]>([]);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  
  // Approval State
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([]);
  const [selectedApproverNames, setSelectedApproverNames] = useState<string[]>([]);
  const [showApproverDropdown, setShowApproverDropdown] = useState(false);
  const [showApprovalActionModal, setShowApprovalActionModal] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState<'Approve' | 'Reject' | 'Request Changes' | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [selectedInvoiceForApproval, setSelectedInvoiceForApproval] = useState<ChurchInvoice | null>(null);



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
          if (docData.customExpenseItems && typeof docData.customExpenseItems === 'object') {
            const sanitized: Record<string, string[]> = {};
            for (const [grp, arr] of Object.entries(docData.customExpenseItems)) {
              if (Array.isArray(arr)) {
                const defaultItems = EXPENSE_GROUPS[grp] || [];
                const defaultLower = new Set(defaultItems.map(i => i.trim().toLowerCase()));
                const seen = new Set<string>();
                sanitized[grp] = arr.filter((item: any) => {
                  if (typeof item !== 'string') return false;
                  const trimmed = item.trim();
                  const lower = trimmed.toLowerCase();
                  if (!trimmed || defaultLower.has(lower) || seen.has(lower)) {
                    return false;
                  }
                  seen.add(lower);
                  return true;
                });
              }
            }
            setCustomExpenseItems(sanitized);
          }
          if (docData.customCategories && Array.isArray(docData.customCategories)) {
            setCategories(prev => Array.from(new Set([...prev, ...docData.customCategories])));
          }
        }
      }

      const [expData, invData, adminsData] = await Promise.all([
        FirestoreService.getExpenses(200),
        FirestoreService.getInvoices(200),
        FirestoreService.getAdminMembers()
      ]);
      setExpenses(expData);
      setInvoices(invData);
      setAdmins(adminsData);
      
      const usedCategories = expData.map(e => e.category).filter(Boolean);
      setCategories(prev => Array.from(new Set([...prev, ...usedCategories])));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  
  useEffect(() => {
    const handleHighlight = async () => {
      if (routeParams?.highlightInvoiceId) {
        const targetId = String(routeParams.highlightInvoiceId).trim();
        let inv = invoices.find(i => i.id === targetId);
        
        if (!inv) {
          try {
            const invoicesRef = await FirestoreService.getCollection('invoices');
            const doc = await invoicesRef.doc(targetId).get();
            if (doc.data()) {
              inv = { id: doc.id, ...doc.data() } as ChurchInvoice;
            }
          } catch (err) {
            console.error('Error fetching specific invoice:', err);
          }
        }

        if (inv) {
          setInvoiceCategory(inv.category || 'General');
          setSelectedInvoiceExpenses(inv.expenseIds || []);
          setSelectedInvoiceForApproval(inv);
          setShowInvoicePreviewModal(true);
          setCurrentSubTab('invoices');
        } else {
          Alert.alert("Invoice Not Found", `Could not locate invoice ${targetId}.`);
        }
        
        // Always clear parameter so it doesn't pop up or alert again on re-renders
        if (navigation && navigation.setParams) {
          navigation.setParams({ highlightInvoiceId: undefined });
        }
      }
    };

    handleHighlight();
  }, [routeParams?.highlightInvoiceId]);
const openAddExpense = () => {
    // Reset form
    setEditExpenseId(null);
    setAddExpCategory(categories.length > 0 ? categories[0] : 'Sunday Service');
    setShowCategoryDropdown(false);
    setSelectedTypes([]);
    setLineItems({});
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setVendorName('');
    setPaymentMethod('Cash');
    setExpenseStatus('Paid');
    setExpenseNotes('');
    setReceiptFile(null);
    setShowAddExpenseModal(true);
  };

  const openEditExpense = (exp: ChurchExpense) => {
    setEditExpenseId(exp.id || null);
    setAddExpCategory(exp.category);
    setShowCategoryDropdown(false);
    
    const t: string[] = [];
    const li: Record<string, { qty: string, price: string }> = {};
    if (exp.lineItems && exp.lineItems.length > 0) {
      exp.lineItems.forEach(item => {
        t.push(item.type);
        li[item.type] = { qty: String(item.quantity), price: String(item.pricePerUnit) };
      });
    } else {
      t.push(exp.title || 'General');
      li[exp.title || 'General'] = { qty: '1', price: String(exp.amount) };
    }
    setSelectedTypes(Array.from(new Set(t)));
    setLineItems(li);
    
    setExpenseDate(exp.date);
    setVendorName(exp.vendorName || '');
    setPaymentMethod(exp.paymentMethod || 'Cash');
    setExpenseStatus(exp.status || 'Paid');
    setExpenseNotes(exp.notes || '');
    setReceiptFile(null);
    setShowAddExpenseModal(true);
  };

  const handleDownloadImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant permission to save photos to your gallery.');
        return;
      }

      if (invoiceRef.current) {
        const uri = await invoiceRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Invoice saved to your gallery!');
      } else {
        Alert.alert('Error', 'Could not capture invoice.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save image.');
    }
  };

  const generateInvoiceHtml = () => {
    const invDate = new Date().toISOString().split('T')[0];
    const cName = activeChurch?.name || "We Christian Finance";
    const userName = member?.name || (member?.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Admin');
    const cAddress = activeChurch?.address || (activeChurch as any)?.mailingCity ? `${(activeChurch as any).mailingCity}, ${(activeChurch as any).mailingState || ''}` : "";
    const cPhone = (activeChurch as any)?.phone || "";
    const logoUrl = activeChurch?.theme?.logoUrl || (activeChurch as any)?.logoUrl || (activeChurch as any)?.profilePhoto || null;
    
    const filteredExp = expenses.filter(e => selectedInvoiceExpenses.includes(e.id || ''));
    const totalAmt = filteredExp.reduce((sum, e) => sum + e.amount, 0);
    
    const groupedByCat = filteredExp.reduce((acc, curr) => {
      const cat = curr.category || 'General';
      if (!acc[cat]) acc[cat] = { items: [], total: 0 };
      acc[cat].items.push(curr);
      acc[cat].total += curr.amount;
      return acc;
    }, {} as Record<string, { items: ChurchExpense[], total: number }>);

    let rowsHtml = '';
    
    Object.keys(groupedByCat).forEach(cat => {
      rowsHtml += `
        <tr>
          <td colspan="4" style="background-color: #faf3e3; color: #c9973f; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px;">${cat} - Subtotal: ₹${groupedByCat[cat].total.toLocaleString('en-IN')}</td>
        </tr>
      `;
      groupedByCat[cat].items.forEach(e => {
        if (e.lineItems && e.lineItems.length > 0) {
          e.lineItems.forEach(item => {
            rowsHtml += `
              <tr>
                <td style="padding-left: 20px;">${item.type}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">₹${item.pricePerUnit}</td>
                <td style="text-align:right;">₹${item.total.toLocaleString('en-IN')}</td>
              </tr>
            `;
          });
        } else {
          rowsHtml += `
            <tr>
              <td style="padding-left: 20px;">${e.title || 'General Expense'}</td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">₹${e.amount}</td>
              <td style="text-align:right;">₹${e.amount?.toLocaleString('en-IN')}</td>
            </tr>
          `;
        }
      });
    });

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
              <div class="meta-box"><div class="label">INVOICE NO</div><div class="value">${selectedInvoiceForApproval?.id || ('INV-' + (activeChurch?.name || 'WEC').substring(0, 3).toUpperCase() + '-' + String(invoices.length + 1).padStart(7, '0'))}</div></div>
              <div class="meta-box"><div class="label">INVOICE DATE</div><div class="value">${formatDateDisplay(invDate)}</div></div>
              <div class="meta-box"><div class="label">CATEGORY</div><div class="value">${invoiceCategory}</div></div>
              <div class="meta-box"><div class="label">PREPARED BY</div><div class="value">${selectedInvoiceForApproval?.preparedBy || userName}</div></div>
              <div class="meta-box"><div class="label">REPORTED BY</div><div class="value">${(selectedInvoiceForApproval?.reportedByNames && selectedInvoiceForApproval.reportedByNames.length > 0) ? selectedInvoiceForApproval.reportedByNames.join(', ') : (selectedInvoiceForApproval?.reportedByName || userName)}</div></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>EXPENSE</th>
                  <th style="text-align:center;">QTY</th>
                  <th style="text-align:right;">UNIT</th>
                  <th style="text-align:right;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div class="total-box">
              <div class="total-label">GRAND TOTAL</div>
              <div class="total-value">₹${totalAmt.toLocaleString('en-IN')}</div>
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

  const toggleExpenseType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
      const newLineItems = {...lineItems};
      delete newLineItems[type];
      setLineItems(newLineItems);
    } else {
      setSelectedTypes(Array.from(new Set([...selectedTypes, type])));
      setLineItems({...lineItems, [type]: { qty: '1', price: '0' }});
    }
  };

  const updateLineItem = (type: string, field: 'qty' | 'price', value: string) => {
    setLineItems({
      ...lineItems,
      [type]: { ...lineItems[type], [field]: value }
    });
  };

  const grandTotal = selectedTypes.reduce((sum, type) => {
    const item = lineItems[type];
    if (!item) return sum;
    const q = parseFloat(item.qty) || 0;
    const p = parseFloat(item.price) || 0;
    return sum + (q * p);
  }, 0);

  const handleGenerateInvoice = async () => {
    if (selectedInvoiceExpenses.length === 0) {
      displayToast("Please select at least one expense record");
      return;
    }
    if (selectedApproverIds.length === 0) {
      displayToast("Please select at least one approver");
      return;
    }
    const totalAmt = expenses.filter(e => selectedInvoiceExpenses.includes(e.id!)).reduce((sum, e) => sum + e.amount, 0);
    const churchCode = (activeChurch?.name || 'WEC').substring(0, 3).toUpperCase();
    const uniqueId = String(invoices.length + 1).padStart(7, '0');
    const newInvId = `INV-${churchCode}-${uniqueId}`;
    const invData: Partial<ChurchInvoice> = {
      id: newInvId,
      category: invoiceCategory || '',
      date: new Date().toISOString().split('T')[0],
      amount: totalAmt,
      preparedBy: member?.name || 'Pastor',
      expenseIds: selectedInvoiceExpenses,
      status: 'Pending Approval',
      reportedByUserIds: selectedApproverIds,
      reportedByNames: selectedApproverNames,
      submitterPhone: member?.phone,
    };
    try {
      await FirestoreService.saveInvoice(invData);
      setSelectedInvoiceForApproval(invData as ChurchInvoice);
      fetchData();

      // Send Push Notifications to Approvers
      const approvers = admins.filter(a => selectedApproverIds.includes(a.id));
      for (const approver of approvers) {
        if (approver.phone) {
          try {
            await FirestoreService.createNotificationBroadcast({
              title: 'New Expense Invoice Approval',
              content: `${member?.name || 'A user'} has submitted a new expense invoice (${newInvId}) for your approval.`,
              type: 'invoice',
              id: newInvId,
              targetChurchId: activeChurch?.id || '',
              targetPhone: approver.phone,
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            });
          } catch(e) {
            console.error('Failed to notify approver', e);
          }
        }
      }
      setShowInvoiceModal(false);
      setShowInvoicePreviewModal(true);
    } catch (e) {
      displayToast("Failed to save invoice");
    }
  };

  const handleInvoiceApprovalAction = async (actionType: 'Approve' | 'Reject' | 'Request Changes') => {
    if (!selectedInvoiceForApproval || !selectedInvoiceForApproval.id) return;
    
    try {
      const updateData: Partial<ChurchInvoice> = {
        status: actionType === 'Approve' ? 'Approved' : (actionType === 'Reject' ? 'Rejected' : 'Changes Requested'),
        approvalComments: approvalComments || ''
      };
      
      await FirestoreService.updateInvoice(selectedInvoiceForApproval.id, updateData);

      // Send Push Notification back to Submitter
      if (selectedInvoiceForApproval.submitterPhone) {
        try {
          await FirestoreService.createNotificationBroadcast({
            title: 'Expense Invoice Update',
            content: `Your expense invoice (${selectedInvoiceForApproval.id}) was ${actionType === 'Approve' ? 'Approved' : (actionType === 'Reject' ? 'Rejected' : 'marked for Changes Requested')} by ${member?.name || 'an Admin'}.`,
            type: 'invoice',
            id: selectedInvoiceForApproval.id,
            targetChurchId: activeChurch?.id || '',
            targetPhone: selectedInvoiceForApproval.submitterPhone,
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
          });
        } catch (e) {
          console.error('Failed to notify submitter', e);
        }
      }
      
      displayToast(`Invoice ${actionType === 'Approve' ? 'Approved' : (actionType === 'Reject' ? 'Rejected' : 'Changes Requested')}`);
      setShowApprovalActionModal(false);
      setApprovalComments('');
      
      // Update local state temporarily to reflect change instantly
      setSelectedInvoiceForApproval({ ...selectedInvoiceForApproval, ...updateData });
      fetchData(); // refresh list
    } catch (e) {
      displayToast("Failed to update invoice status");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await FirestoreService.deleteExpense(id);
      displayToast("Expense deleted");
      fetchData();
    } catch (e) {
      displayToast("Failed to delete expense");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await FirestoreService.deleteInvoice(id);
      displayToast("Invoice deleted");
      fetchData();
    } catch (e) {
      displayToast("Failed to delete invoice");
    }
  };

  const handleSaveExpense = async () => {
    if (selectedTypes.length === 0) {
      displayToast("Please select at least one expense type");
      return;
    }
    
    setEditorSaving(true);
    try {
      const itemsToSave = selectedTypes.map(t => ({
        type: t,
        quantity: parseFloat(lineItems[t]?.qty) || 1,
        pricePerUnit: parseFloat(lineItems[t]?.price) || 0,
        total: (parseFloat(lineItems[t]?.qty) || 1) * (parseFloat(lineItems[t]?.price) || 0)
      }));

      let newExpId = editExpenseId;
      if (!editExpenseId) {
        const churchCode = (activeChurch?.name || 'WEC').substring(0, 3).toUpperCase();
        const uniqueId = String(expenses.length + 1).padStart(6, '0');
        newExpId = `Exp-${churchCode}-${uniqueId}`;
      }

      const expenseData: Partial<ChurchExpense> = {
        id: newExpId || undefined,
        category: addExpCategory,
        amount: grandTotal,
        date: expenseDate,
        status: expenseStatus,
        paymentMethod: paymentMethod,
        vendorName: vendorName,
        notes: expenseNotes,
        receiptUrl: receiptFile ? receiptFile.uri : null, // Assuming local URI for now, a proper upload logic to Storage is needed
        lineItems: itemsToSave,
        createdBy: member?.id || 'admin'
      };
      
      if (editExpenseId) {
        await FirestoreService.updateExpense(editExpenseId, expenseData);
      } else {
        await FirestoreService.createExpense(expenseData);
      }
      setShowAddExpenseModal(false);
      setShowSuccessCard(true);
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      displayToast("Failed to save expense");
    } finally {
      setEditorSaving(false);
    }
  };

  const handlePickReceipt = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name
        });
      }
    } catch (err) {
      console.error('Error picking document', err);
      displayToast('Failed to pick file');
    }
  };

  // Calculate stats robustly using local date strings
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayObj = new Date();
  const todayStr = getLocalDateStr(todayObj);
  
  const weekStartObj = new Date();
  weekStartObj.setDate(weekStartObj.getDate() - weekStartObj.getDay()); // Sunday start
  const weekStartStr = getLocalDateStr(weekStartObj);
  
  const weekEndObj = new Date(weekStartObj);
  weekEndObj.setDate(weekStartObj.getDate() + 6); // Saturday end
  const weekEndStr = getLocalDateStr(weekEndObj);
  
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const currentYearStr = todayStr.substring(0, 4); // YYYY
  
  const stats = {
    today: expenses.filter(e => e.date === todayStr).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    thisWeek: expenses.filter(e => e.date >= weekStartStr && e.date <= weekEndStr).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    thisMonth: expenses.filter(e => e.date && e.date.startsWith(currentMonthStr)).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    thisYear: expenses.filter(e => e.date && e.date.startsWith(currentYearStr)).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  };

  // Filter expenses by period
  const filteredExpenses = expenses.filter(e => {
    if (filterPeriod === 'Today') return e.date === todayStr;
    if (filterPeriod === 'Week') return e.date >= weekStartStr && e.date <= weekEndStr;
    if (filterPeriod === 'Month') return e.date && e.date.startsWith(currentMonthStr);
    if (filterPeriod === 'Year') return e.date && e.date.startsWith(currentYearStr);
    if (filterPeriod === 'Custom Range') {
      if (customStartDate && customEndDate) {
        const startD = getLocalDateStr(customStartDate);
        const endD = getLocalDateStr(customEndDate);
        return e.date >= startD && e.date <= endD;
      }
      return true;
    }
    return true;
  }).filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (e.title || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q) || (e.relatedMeeting || '').toLowerCase().includes(q);
  });

  // Group By Category
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const categoryName = expense.category || 'Uncategorized';

    if (!groups[categoryName]) {
      groups[categoryName] = {
        title: categoryName,
        date: expense.date,
        total: 0,
        items: []
      };
    }
    // Update date if this is more recent
    if (expense.date > groups[categoryName].date) {
      groups[categoryName].date = expense.date;
    }
    groups[categoryName].items.push(expense);
    groups[categoryName].total += expense.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchExpense[] }>);
  
  const groupKeys = Object.keys(groupedExpenses).sort((a,b) => {
      return new Date(groupedExpenses[b].date).getTime() - new Date(groupedExpenses[a].date).getTime();
  });

  // Global grouping for the Dashboard (ignores the 'Today' filter)
  const globalGroupedExpenses = expenses.reduce((groups, expense) => {
    const categoryName = expense.category || 'Uncategorized';

    if (!groups[categoryName]) {
      groups[categoryName] = {
        title: categoryName,
        date: expense.date,
        total: 0,
        items: []
      };
    }
    // Update date if this is more recent
    if (expense.date > groups[categoryName].date) {
      groups[categoryName].date = expense.date;
    }
    groups[categoryName].items.push(expense);
    groups[categoryName].total += expense.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchExpense[] }>);
  
  const globalGroupKeys = Object.keys(globalGroupedExpenses).sort((a,b) => {
      return new Date(globalGroupedExpenses[b].date).getTime() - new Date(globalGroupedExpenses[a].date).getTime();
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
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity 
              onPress={() => {
                if (currentSubTab === 'expenses' && selectedCategoryView) {
                  setSelectedCategoryView(null);
                  setIsCategorySelecting(false);
                  setSelectedCategoryExpenses([]);
                } else if (currentSubTab === 'expenses' || currentSubTab === 'invoices') {
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
                <Text style={[styles.heroTitle, currentSubTab === 'dashboard' && { color: '#FCD34D' }, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>
                  {currentSubTab === 'dashboard' ? 'Dashboard' : 
                   currentSubTab === 'expenses' ? (selectedCategoryView ? 'Expenses' : 'Expenses') : 'Invoices'}
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#c9973f', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 10, flexShrink: 0 }}
                  onPress={openAddExpense}
                >
                  <Text style={{ color: '#141d33', fontSize: 11, fontWeight: '700' }}>+ New Expense</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.heroSub, { marginTop: 4 }]} numberOfLines={1}>
                {currentSubTab === 'dashboard' ? 'Every offering, accounted for' : 
                 currentSubTab === 'expenses' ? (selectedCategoryView ? selectedCategoryView : 'Track every category, line by line') : 'Generated and saved automatically'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.mainScroll, { paddingBottom: 110 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        
        {/* ================= DASHBOARD ================= */}
        {currentSubTab === 'dashboard' && (
          <View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryRow}>
                <View style={styles.sumCard}>
                  <Text style={styles.sumLabel}>Today</Text>
                  <Text style={styles.sumValue} numberOfLines={1} adjustsFontSizeToFit>₹{stats.today.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.sumCard}>
                  <Text style={styles.sumLabel}>This Week</Text>
                  <Text style={styles.sumValue} numberOfLines={1} adjustsFontSizeToFit>₹{stats.thisWeek.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.sumCard}>
                  <Text style={styles.sumLabel}>This Month</Text>
                  <Text style={styles.sumValue} numberOfLines={1} adjustsFontSizeToFit>₹{stats.thisMonth.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.sumCard}>
                  <Text style={styles.sumLabel}>This Year</Text>
                  <Text style={styles.sumValue} numberOfLines={1} adjustsFontSizeToFit>₹{stats.thisYear.toLocaleString('en-IN')}</Text>
                </View>
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
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={openAddExpense}>
                <View style={styles.qaIcon}><DollarSign size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Add Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.qaBtn} 
                activeOpacity={0.8} 
                onPress={() => {
                  setInvoiceCategory(categories.length > 0 ? categories[0] : 'Sunday Service');
                  setSelectedInvoiceExpenses([]);
                  setSelectedApproverIds([]);
                  setSelectedApproverNames([]);
                  setShowInvoiceModal(true);
                }}
              >
                <View style={styles.qaIcon}><FileText size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Generate Invoice</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionHeadingTxt}>Recent expenses</Text>
            </View>
            
            <View style={styles.catList}>
              {globalGroupKeys.slice(0, 3).map(key => {
                const group = globalGroupedExpenses[key];
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={styles.recentCatCard} 
                    activeOpacity={0.9} 
                    onPress={() => {
                      setCurrentSubTab('expenses');
                      setSelectedCategoryView(key);
                    }}
                  >
                    <View style={styles.catBody}>
                      <View>
                        <Text style={styles.catName}>{group.title}</Text>
                        <Text style={styles.catMeta}>{group.items.length} items • {formatDateDisplay(group.date)}</Text>
                      </View>
                      <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {globalGroupKeys.length === 0 && (
                <Text style={styles.emptyNote}>No recent expenses found.</Text>
              )}
            </View>

            {globalGroupKeys.length > 0 && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentSubTab('expenses')}>
                <Text style={styles.btnSecondaryTxt}>View All Expenses</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= EXPENSES LIST ================= */}
        {currentSubTab === 'expenses' && (
          <View style={{ borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 16, padding: 16, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 }}>
            {selectedCategoryView ? (
              <View style={{ paddingTop: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                  onPress={() => {
                    setSelectedCategoryView(null);
                    setIsCategorySelecting(false);
                    setSelectedCategoryExpenses([]);
                  }}
                >
                  <ChevronRight size={14} color="#e6c079" style={{ transform: [{ rotate: '180deg' }], marginRight: 4 }} />
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#e6c079', fontWeight: '600' }}>Back to categories</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#141d33', fontWeight: '700' }}>{selectedCategoryView}</Text>
                  <TouchableOpacity 
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5ddd0', backgroundColor: isCategorySelecting ? '#141d33' : '#ffffff' }}
                    onPress={() => {
                      if (isCategorySelecting) {
                        setIsCategorySelecting(false);
                        setSelectedCategoryExpenses([]);
                      } else {
                        setIsCategorySelecting(true);
                      }
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: isCategorySelecting ? '#ffffff' : '#141d33', fontWeight: '600' }}>
                      {isCategorySelecting ? 'Cancel' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {expenses
                  .filter(e => e.category === selectedCategoryView)
                  .map((exp, idx) => {
                    const isSelected = selectedCategoryExpenses.includes(exp.id!);
                    return (
                      <TouchableOpacity 
                        key={exp.id || idx} 
                        style={{ 
                          backgroundColor: isSelected ? '#faf3e3' : '#ffffff', 
                          borderRadius: 16, 
                          padding: 16, 
                          marginBottom: 14, 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderWidth: 1, 
                          borderColor: isSelected ? '#c9973f' : '#e5ddd0',
                          shadowColor: '#1b2a4a',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2
                        }}
                        activeOpacity={isCategorySelecting ? 0.7 : 1}
                        onPress={() => {
                          if (isCategorySelecting && exp.id) {
                            if (isSelected) {
                              setSelectedCategoryExpenses(prev => prev.filter(id => id !== exp.id));
                            } else {
                              setSelectedCategoryExpenses(prev => [...prev, exp.id!]);
                            }
                          } else {
                            setSelectedExpenseForView(exp);
                            setShowExpenseViewModal(true);
                          }
                        }}
                        onLongPress={() => {
                          if (!isCategorySelecting && exp.id) {
                            setIsCategorySelecting(true);
                            setSelectedCategoryExpenses([exp.id]);
                          }
                        }}
                      >
                        <View style={{ flexDirection: 'row', flex: 1, paddingRight: 10 }}>
                          {isCategorySelecting && (
                            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: isSelected ? '#c9973f' : '#a89f92', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#c9973f' : 'transparent', marginTop: 2 }}>
                              {isSelected && <CheckCircle2 size={12} color="#ffffff" />}
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 16, fontWeight: '700', color: '#1b2a4a', marginBottom: 4 }} numberOfLines={1}>
                              {exp.vendorName 
                                ? exp.vendorName 
                                : (exp.lineItems && exp.lineItems.length > 0)
                                  ? exp.lineItems[0].type + (exp.lineItems.length > 1 ? ` (+${exp.lineItems.length - 1} more)` : '')
                                  : exp.title || `${exp.category} Expense`}
                            </Text>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: '#645d54', marginTop: 2 }}>
                              {formatDateDisplay(exp.date)} • {exp.paymentMethod || 'Cash'} {exp.lineItems && exp.lineItems.length > 0 ? `• ${exp.lineItems.length} items` : ''}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                              <View style={{ backgroundColor: exp.status === 'Pending' ? '#fef3c7' : '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ fontSize: 11, color: exp.status === 'Pending' ? '#b45309' : '#15803d', fontWeight: '700' }}>
                                  {exp.status || 'Paid'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: 70 }}>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#1b2a4a' }}>
                            ₹{exp.amount?.toLocaleString('en-IN') || 0}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity 
                              onPress={() => openEditExpense(exp)}
                              style={{ padding: 8, backgroundColor: '#f4efe6', borderRadius: 8, marginRight: 8 }}
                            >
                              <Pencil size={14} color="#1b2a4a" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => {
                                if (exp.id) handleDeleteExpense(exp.id);
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
                  
                {expenses.filter(e => e.category === selectedCategoryView).length === 0 && (
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No records found.</Text>
                )}
                
                {expenses.filter(e => e.category === selectedCategoryView).length > 0 && (
                  <View style={{ backgroundColor: '#f4efe6', borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#c9973f' }}>
                    <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#141d33', fontWeight: '700' }}>Category Total</Text>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 22, color: '#141d33', fontWeight: '700' }}>
                      ₹{expenses.filter(e => e.category === selectedCategoryView).reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20, gap: 12 }}>
                  <TouchableOpacity 
                    style={[styles.btnSecondary, { flex: 1, backgroundColor: '#ffffff', borderColor: '#141d33', borderWidth: 1 }]}
                    onPress={() => {
                      setAddExpCategory(selectedCategoryView);
                      setSelectedCategoryView(null);
                      openAddExpense();
                    }}
                  >
                    <Text style={[styles.btnSecondaryTxt, { color: '#141d33' }]}>+ Add Expenses</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.btnSecondary, { flex: 1, backgroundColor: '#1b2a4a', borderColor: '#1b2a4a', opacity: (isCategorySelecting && selectedCategoryExpenses.length === 0) ? 0.5 : 1 }]}
                    disabled={isCategorySelecting && selectedCategoryExpenses.length === 0}
                    onPress={async () => {
                      const categoryName = selectedCategoryView || '';
                      setInvoiceCategory(categoryName);
                      let expIds: string[] = [];
                      if (isCategorySelecting) {
                        expIds = selectedCategoryExpenses;
                      } else {
                        expIds = expenses.filter(e => e.category === categoryName).map(e => e.id!);
                      }
                      setSelectedInvoiceExpenses(expIds);

                      setSelectedApproverIds([]);
                      setSelectedApproverNames([]);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <Text style={[styles.btnSecondaryTxt, { color: '#ffffff' }]}>
                      {isCategorySelecting && selectedCategoryExpenses.length > 0 ? `Generate (${selectedCategoryExpenses.length})` : 'Generate Invoice'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.filterLabel}>Filter by date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingRight: 20 }}>
              {(['Today', 'Week', 'Month', 'Year', 'Custom Range'] as FilterPeriod[]).map(period => (
                <TouchableOpacity 
                  key={period}
                  style={[styles.chip, filterPeriod === period && styles.chipActive]}
                  onPress={() => setFilterPeriod(period)}
                >
                  <Text style={[styles.chipTxt, filterPeriod === period && styles.chipTxtActive]}>{period}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filterPeriod === 'Custom Range' && (
              <View style={styles.customRangeBox}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, flex: 1 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customRangeLabel}>FROM</Text>
                    <TouchableOpacity 
                      style={styles.customRangeInput}
                      onPress={() => setShowCustomStartPicker(true)}
                    >
                      <Text style={[styles.customRangeInputTxt, !customStartDate && { color: '#a89f92' }]} numberOfLines={1} adjustsFontSizeToFit>
                        {customStartDate ? formatDateDisplay(getLocalDateStr(customStartDate)) : 'Select'}
                      </Text>
                      <Calendar size={14} color="#1b2a4a" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customRangeLabel}>TO</Text>
                    <TouchableOpacity 
                      style={styles.customRangeInput}
                      onPress={() => setShowCustomEndPicker(true)}
                    >
                      <Text style={[styles.customRangeInputTxt, !customEndDate && { color: '#a89f92' }]} numberOfLines={1} adjustsFontSizeToFit>
                        {customEndDate ? formatDateDisplay(getLocalDateStr(customEndDate)) : 'Select'}
                      </Text>
                      <Calendar size={14} color="#1b2a4a" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.customRangeApplyBtn}
                  onPress={() => {
                    // Triggers re-render which automatically updates filteredExpenses
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
              <Text style={[styles.sectionHeadingTxt, { flex: 1, marginRight: 8 }]} numberOfLines={1} adjustsFontSizeToFit>Expense categories</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ marginRight: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: isMultiCatSelecting ? '#141d33' : '#ffffff', borderWidth: 1, borderColor: '#e5ddd0' }} 
                  onPress={() => {
                    if (isMultiCatSelecting) {
                      setIsMultiCatSelecting(false);
                      setSelectedMultiCategories([]);
                    } else {
                      setIsMultiCatSelecting(true);
                    }
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isMultiCatSelecting ? '#ffffff' : '#141d33' }}>
                    {isMultiCatSelecting ? 'Cancel' : 'Select Multiple'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipMini} onPress={openAddExpense}>
                  <Plus size={12} color="#1a2d5a" />
                  <Text style={styles.chipMiniTxt}>New</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.catList}>
              {groupKeys.map(cat => {
                const group = groupedExpenses[cat];
                const isSelected = selectedMultiCategories.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.catCard, isSelected && { backgroundColor: '#faf3e3', borderColor: '#c9973f', borderWidth: 1 }]}
                    activeOpacity={isMultiCatSelecting ? 0.7 : 0.9}
                    onPress={() => {
                      if (isMultiCatSelecting) {
                        if (isSelected) {
                          setSelectedMultiCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setSelectedMultiCategories(prev => [...prev, cat]);
                        }
                      } else {
                        setSelectedCategoryView(cat);
                      }
                    }}
                    onLongPress={() => {
                      if (!isMultiCatSelecting) {
                        setIsMultiCatSelecting(true);
                        setSelectedMultiCategories([cat]);
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {isMultiCatSelecting && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? '#c9973f' : '#a89f92', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#c9973f' : 'transparent' }}>
                          {isSelected && <CheckCircle2 size={14} color="#ffffff" />}
                        </View>
                      )}
                      {!isMultiCatSelecting && <LinearGradient colors={['#141d33', '#c9973f']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.catArch} />}
                      <View style={[styles.catBody, { flex: 1 }]}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                          <Text style={styles.catMeta}>{group.items.length} {group.items.length === 1 ? 'expense' : 'expenses'} in range</Text>
                        </View>
                        <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {groupKeys.length === 0 && (
                <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No expense categories for this period.</Text>
              )}
            </View>
            
            {isMultiCatSelecting && selectedMultiCategories.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity 
                  style={[styles.btnSecondary, { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' }]}
                  onPress={async () => {
                    // Collect all expenses from all selected categories
                    let expIds: string[] = [];
                    let totalAmt = 0;
                    selectedMultiCategories.forEach(cat => {
                      const group = groupedExpenses[cat];
                      if (group && group.items) {
                        group.items.forEach(e => {
                          expIds.push(e.id!);
                          totalAmt += e.amount;
                        });
                      }
                    });
                    
                    if (expIds.length === 0) return;

                    setInvoiceCategory("Multiple Categories");
                    setSelectedInvoiceExpenses(expIds);

                      setSelectedApproverIds([]);
                      setSelectedApproverNames([]);
                      setShowInvoiceModal(true);
                  }}
                >
                  <Text style={[styles.btnSecondaryTxt, { color: '#ffffff' }]}>
                    Generate Master Invoice ({selectedMultiCategories.length} Categories)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

              </View>
            )}
          </View>
        )}

        {/* ================= INVOICES ================= */}
        {currentSubTab === 'invoices' && (
          <View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 24, fontWeight: '700', color: '#141d33', marginBottom: 6 }}>Invoices</Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54' }}>Manage, view, and share all your generated expense reports. You can tap on any invoice below to view its details.</Text>
            </View>

            <View style={styles.searchBar}>
              <Search size={18} color="#a89f92" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search invoice no. or category..."
                placeholderTextColor="#a89f92"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.catList}>
              {invoices.filter(inv => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (inv.id || '').toLowerCase().includes(q) || (inv.category || '').toLowerCase().includes(q);
              }).map(inv => (
                <TouchableOpacity 
                  key={inv.id} 
                  style={styles.catCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    setInvoiceCategory(inv.category);
                    setSelectedInvoiceExpenses(inv.expenseIds || []);
                    setSelectedInvoiceForApproval(inv);
                    setShowInvoicePreviewModal(true);
                  }}
                >
                  <LinearGradient colors={['#141d33', '#c9973f']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.catArch} />
                  <View style={styles.catBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.catName, { fontFamily: FONTS.serif, fontWeight: '700' }]}>{inv.id}</Text>
                      <Text style={styles.catMeta}>{inv.category} • {formatDateDisplay(inv.date)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.catAmt, { fontSize: 14 }]}>₹{(inv.amount || 0).toLocaleString('en-IN')}</Text>
                      {inv.status && (
                        <View style={{ backgroundColor: inv.status === 'Approved' ? '#e6f4ea' : inv.status === 'Pending Approval' ? '#fef7e0' : '#fce8e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, fontFamily: FONTS.sans, fontWeight: '700', color: inv.status === 'Approved' ? '#137333' : inv.status === 'Pending Approval' ? '#b06000' : '#c5221f' }}>{inv.status}</Text>
                        </View>
                      )}
                      <TouchableOpacity 
                        onPress={() => handleDeleteInvoice(inv.id)}
                        style={{ marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fdf2f2', borderRadius: 4 }}
                      >
                        <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '600' }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {invoices.length === 0 && (
                <View style={styles.emptyState}>
                  <Archive size={48} color="#cbd5e1" />
                  <Text style={styles.emptyStateText}>No invoices generated yet.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={[styles.tabbar, { bottom: Math.max(insets.bottom, 14) + (Platform.OS === 'ios' ? 14 : 10) }]}>
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setCurrentSubTab('dashboard')}
        >
          <Home size={20} color={currentSubTab === 'dashboard' ? '#c9973f' : '#645d54'} />
          <Text style={[styles.tabBtnTxt, currentSubTab === 'dashboard' && styles.tabBtnTxtActive]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setCurrentSubTab('expenses')}
        >
          <DollarSign size={20} color={currentSubTab === 'expenses' ? '#c9973f' : '#645d54'} />
          <Text style={[styles.tabBtnTxt, currentSubTab === 'expenses' && styles.tabBtnTxtActive]}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setCurrentSubTab('invoices')}
        >
          <FileText size={20} color={currentSubTab === 'invoices' ? '#c9973f' : '#645d54'} />
          <Text style={[styles.tabBtnTxt, currentSubTab === 'invoices' && styles.tabBtnTxtActive]}>Invoices</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {showToast && (
        <View style={[styles.toastContainer, { bottom: 100 + insets.bottom }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* ── Create Category Modal ── */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>Create Category</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowCategoryModal(false)}>
                <X size={18} color="#1b2a4a" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.catModalLabel}>CATEGORY NAME</Text>
            <TextInput
              style={styles.catModalInput}
              placeholder="e.g. Christmas Celebration"
              placeholderTextColor="#a89f92"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            
            <TouchableOpacity 
              style={styles.catModalSaveBtn}
              onPress={async () => {
                if (newCategoryName.trim()) {
                  const name = newCategoryName.trim();
                  if (!categories.includes(name)) {
                    setCategories([...categories, name]);
                    try {
                      const churchId = member?.churchId || member?.primaryChurchId;
                      if (churchId) {
                        await firestore().collection('churches').doc(churchId).set({
                          customCategories: firestore.FieldValue.arrayUnion(name)
                        }, { merge: true });
                      }
                    } catch(e) {
                      console.error("Failed to save custom category", e);
                    }
                  }
                  displayToast(`Category "${name}" created!`);
                  setNewCategoryName('');
                  setShowCategoryModal(false);
                }
              }}
            >
              <Text style={styles.catModalSaveBtnTxt}>Save Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Add Expense Modal ── */}
      <Modal visible={showAddExpenseModal} transparent animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22 }} nestedScrollEnabled={true}>
              
              <View style={styles.catModalHeader}>
                <Text style={styles.catModalTitle}>{editExpenseId ? 'Edit Expense' : 'Add Expenses'}</Text>
                <TouchableOpacity style={styles.catModalClose} onPress={() => setShowAddExpenseModal(false)}>
                  <X size={18} color="#1b2a4a" />
                </TouchableOpacity>
              </View>

              <Text style={styles.catModalLabel}>CATEGORY</Text>
              <View style={{ zIndex: 10 }}>
                <TouchableOpacity 
                  style={[styles.catModalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }]}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a' }}>{addExpCategory}</Text>
                  <ChevronRight size={18} color="#241f1a" style={{ transform: [{ rotate: showCategoryDropdown ? '-90deg' : '90deg' }] }} />
                </TouchableOpacity>
                
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenu}>
                    <View>
                      {categories.map((cat, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.dropdownItem, addExpCategory === cat && styles.dropdownItemActive]}
                          onPress={() => {
                            setAddExpCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemTxt, addExpCategory === cat && styles.dropdownItemTxtActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <Text style={[styles.catModalLabel, { marginTop: showCategoryDropdown ? 10 : 0 }]}>SELECT EXPENSE TYPES</Text>
              
              {Object.entries(EXPENSE_GROUPS).map(([groupName, items]) => {
                const seen = new Set<string>();
                const combinedItems: string[] = [];
                [...items, ...(customExpenseItems[groupName] || [])].forEach(rawType => {
                  const t = typeof rawType === 'string' ? rawType.trim() : '';
                  if (t && !seen.has(t.toLowerCase())) {
                    seen.add(t.toLowerCase());
                    combinedItems.push(t);
                  }
                });

                return (
                  <View key={groupName} style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#c9973f', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{groupName}</Text>
                    <View style={styles.expChipsGrid}>
                      {combinedItems.map((type, typeIdx) => {
                        const isSelected = selectedTypes.includes(type);
                        return (
                          <TouchableOpacity 
                            key={`${groupName}-${type}-${typeIdx}`} 
                            style={[styles.expChip, isSelected && styles.expChipActive]}
                            onPress={() => toggleExpenseType(type)}
                          >
                            <Text style={[styles.expChipTxt, isSelected && styles.expChipTxtActive]}>{type}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      {addingItemToGroup === groupName ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4efe6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <TextInput 
                            value={newItemName}
                            onChangeText={setNewItemName}
                            placeholder="Item Name"
                            placeholderTextColor="#a89f92"
                            style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#141d33', minWidth: 80, padding: 0 }}
                            autoFocus
                          />
                          <TouchableOpacity 
                            onPress={async () => {
                              const name = newItemName.trim();
                              if (!name) {
                                setAddingItemToGroup(null);
                                return;
                              }

                              const currentItems = [...(EXPENSE_GROUPS[groupName] || []), ...(customExpenseItems[groupName] || [])];
                              const existing = currentItems.find(i => i.trim().toLowerCase() === name.toLowerCase());

                              if (existing) {
                                if (!selectedTypes.includes(existing)) {
                                  setSelectedTypes(prev => [...prev, existing]);
                                }
                                setAddingItemToGroup(null);
                                setNewItemName('');
                                return;
                              }

                              setCustomExpenseItems(prev => ({
                                ...prev,
                                [groupName]: [...(prev[groupName] || []), name]
                              }));
                              setSelectedTypes(prev => Array.from(new Set([...prev, name])));
                              setAddingItemToGroup(null);
                              setNewItemName('');
                              
                              try {
                                const churchId = member?.churchId || member?.primaryChurchId;
                                if (churchId) {
                                  await firestore().collection('churches').doc(churchId).set({
                                    customExpenseItems: {
                                      [groupName]: firestore.FieldValue.arrayUnion(name)
                                    }
                                  }, { merge: true });
                                }
                              } catch(e) {
                                console.error("Failed to save custom item", e);
                              }
                            }} 
                            style={{ marginLeft: 8, backgroundColor: '#c9973f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                          >
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Add</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { setAddingItemToGroup(null); setNewItemName(''); }} style={{ marginLeft: 6 }}>
                            <X size={14} color="#645d54" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={[styles.expChip, { backgroundColor: '#f4efe6', borderColor: '#c9973f', borderStyle: 'dashed' }]}
                          onPress={() => setAddingItemToGroup(groupName)}
                        >
                          <Text style={{ fontSize: 12, color: '#c9973f', fontWeight: '700' }}>+ New Item</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              <Text style={styles.helperText}>Select expense types above to add line items.</Text>

              {/* Line Items */}
              {selectedTypes.length > 0 && (
                <View style={{ marginTop: 10, gap: 12 }}>
                  {Array.from(new Set(selectedTypes)).map((type, idx) => {
                    const item = lineItems[type] || { qty: '1', price: '0' };
                    const q = parseFloat(item.qty) || 0;
                    const p = parseFloat(item.price) || 0;
                    return (
                      <View key={`line-item-${type}-${idx}`} style={styles.lineItemCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={styles.lineItemTitle}>{type}</Text>
                          <TouchableOpacity onPress={() => toggleExpenseType(type)}>
                            <Text style={styles.lineItemRemove}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.catModalLabel}>QUANTITY</Text>
                            <TextInput 
                              style={styles.lineItemInput} 
                              value={item.qty} 
                              onChangeText={v => updateLineItem(type, 'qty', v)}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.catModalLabel}>PRICE PER UNIT</Text>
                            <TextInput 
                              style={styles.lineItemInput} 
                              value={item.price} 
                              onChangeText={v => updateLineItem(type, 'price', v)}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        <Text style={styles.lineItemSubtotal}>₹{(q * p).toLocaleString('en-IN')}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Grand Total */}
              <View style={styles.grandTotalBlock}>
                <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                <Text style={styles.grandTotalAmt}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              </View>

              <Text style={styles.catModalLabel}>EXPENSE DATE</Text>
              <TouchableOpacity 
                style={[styles.catModalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ flex: 1, fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a' }}>
                  {formatDateDisplay(expenseDate)}
                </Text>
                <Calendar size={18} color="#241f1a" />
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={new Date(expenseDate)}
                onConfirm={(date) => {
                  setExpenseDate(date.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />

              <Text style={styles.catModalLabel}>VENDOR NAME</Text>
              <TextInput
                style={styles.catModalInput}
                placeholder="e.g. Sharma Traders"
                placeholderTextColor="#a89f92"
                value={vendorName}
                onChangeText={setVendorName}
              />

              <Text style={styles.catModalLabel}>STATUS</Text>
              <View style={styles.expChipsGrid}>
                {['Paid', 'Pending'].map(st => (
                  <TouchableOpacity 
                    key={st} 
                    style={[styles.expChip, expenseStatus === st && styles.expChipActive]}
                    onPress={() => setExpenseStatus(st as any)}
                  >
                    <Text style={[styles.expChipTxt, expenseStatus === st && styles.expChipTxtActive]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.catModalLabel}>PAYMENT METHOD</Text>
              <View style={styles.expChipsGrid}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(pm => (
                  <TouchableOpacity 
                    key={pm} 
                    style={[styles.expChip, paymentMethod === pm && styles.expChipActive]}
                    onPress={() => setPaymentMethod(pm)}
                  >
                    <Text style={[styles.expChipTxt, paymentMethod === pm && styles.expChipTxtActive]}>{pm}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.catModalLabel}>NOTES</Text>
              <TextInput
                style={[styles.catModalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Optional note"
                placeholderTextColor="#a89f92"
                value={expenseNotes}
                onChangeText={setExpenseNotes}
                multiline
              />

              <Text style={styles.catModalLabel}>UPLOAD RECEIPT (OPTIONAL)</Text>
              <TouchableOpacity style={[styles.catModalInput, { flexDirection: 'row', alignItems: 'center' }]} onPress={handlePickReceipt}>
                <View style={{ backgroundColor: '#e7ebf3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontFamily: FONTS.sans, color: '#1b2a4a', fontWeight: '600' }}>Choose File</Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: FONTS.sans, color: receiptFile ? '#241f1a' : '#a89f92', flex: 1 }} numberOfLines={1}>
                  {receiptFile ? receiptFile.name : 'No file chosen'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.catModalSaveBtn, { marginTop: 10, marginBottom: 40 }, editorSaving && { opacity: 0.7 }]}
                onPress={handleSaveExpense}
                disabled={editorSaving}
              >
                {editorSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.catModalSaveBtnTxt}>Save Expenses</Text>}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Generate Invoice Modal ── */}
      <Modal visible={showInvoiceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>Generate Invoice</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowInvoiceModal(false)}>
                <X size={18} color="#1b2a4a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.catModalLabel}>SELECT CATEGORY</Text>
            <View style={{ zIndex: 10, marginBottom: 20 }}>
              <TouchableOpacity 
                style={[styles.catModalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 0 }]}
                onPress={() => setShowInvoiceCategoryDropdown(!showInvoiceCategoryDropdown)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a' }}>{invoiceCategory}</Text>
                <ChevronRight size={18} color="#241f1a" style={{ transform: [{ rotate: showInvoiceCategoryDropdown ? '-90deg' : '90deg' }] }} />
              </TouchableOpacity>
              
              {showInvoiceCategoryDropdown && (
                <View style={[styles.dropdownMenu, { top: 48 }]}>
                  <View>
                    {categories.map((cat, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.dropdownItem, invoiceCategory === cat && styles.dropdownItemActive]}
                        onPress={() => {
                          setInvoiceCategory(cat);
                          setShowInvoiceCategoryDropdown(false);
                          setSelectedInvoiceExpenses([]); // Reset selection on category change
                        }}
                      >
                        <Text style={[styles.dropdownItemTxt, invoiceCategory === cat && styles.dropdownItemTxtActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.catModalLabel}>REPORTED BY (APPROVER)</Text>
            <View style={{ zIndex: 9, marginBottom: 20 }}>
              <TouchableOpacity 
                style={[styles.catModalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 0 }]}
                onPress={() => setShowApproverDropdown(!showApproverDropdown)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontFamily: FONTS.sans, color: selectedApproverNames.length > 0 ? '#241f1a' : '#a89f92' }}>
                  {selectedApproverNames.length > 0 ? selectedApproverNames.join(', ') : 'Select Approvers'}
                </Text>
                <ChevronRight size={18} color="#241f1a" style={{ transform: [{ rotate: showApproverDropdown ? '-90deg' : '90deg' }] }} />
              </TouchableOpacity>
              
              {showApproverDropdown && (
                <View style={[styles.dropdownMenu, { top: 48 }]}>
                  <View style={{ maxHeight: 150 }}>
                    <ScrollView nestedScrollEnabled>
                      {admins.map((admin, idx) => {
                        const adminName = admin.name || (admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Admin');
                        return (
                          <TouchableOpacity 
                            key={admin.id || idx} 
                            style={[styles.dropdownItem, selectedApproverIds.includes(admin.id) && styles.dropdownItemActive]}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (selectedApproverIds.includes(admin.id)) {
                                setSelectedApproverIds(prev => prev.filter(id => id !== admin.id));
                                setSelectedApproverNames(prev => prev.filter(name => name !== adminName));
                              } else {
                                setSelectedApproverIds(prev => [...prev, admin.id]);
                                setSelectedApproverNames(prev => [...prev, adminName]);
                              }
                            }}
                          >
                            <Text style={[styles.dropdownItemTxt, selectedApproverIds.includes(admin.id) && styles.dropdownItemTxtActive]}>{adminName}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      {admins.length === 0 && (
                        <View style={{ padding: 12 }}>
                          <Text style={{ fontFamily: FONTS.sans, color: '#a89f92' }}>No admins found.</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.catModalLabel}>SELECT EXPENSE RECORDS</Text>
            <ScrollView style={{ maxHeight: 250, marginBottom: 20 }} nestedScrollEnabled={true}>
              {expenses
                .filter(e => e.category === invoiceCategory)
                .map((exp, idx) => {
                  const isSelected = selectedInvoiceExpenses.includes(exp.id || String(idx));
                  return (
                    <TouchableOpacity 
                      key={exp.id || idx} 
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f4efe6' }}
                      onPress={() => {
                        const id = exp.id || String(idx);
                        if (isSelected) {
                          setSelectedInvoiceExpenses(selectedInvoiceExpenses.filter(i => i !== id));
                        } else {
                          setSelectedInvoiceExpenses([...selectedInvoiceExpenses, id]);
                        }
                      }}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: isSelected ? '#1b2a4a' : '#a89f92', backgroundColor: isSelected ? '#1b2a4a' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                        {isSelected && <CheckCircle2 size={14} color="#ffffff" />}
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#1b2a4a' }}>
                          {exp.vendorName || exp.title || 'Unknown Vendor'}
                        </Text>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: '#645d54', marginTop: 2 }}>
                          {formatDateDisplay(exp.date)} • {exp.paymentMethod || 'N/A'}
                        </Text>
                      </View>
                      
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', color: '#1b2a4a' }}>
                        ₹{exp.amount?.toLocaleString('en-IN') || 0}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
              {expenses.filter(e => e.category === invoiceCategory).length === 0 && (
                <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#a89f92', textAlign: 'center', marginTop: 20 }}>
                  No expenses found for this category.
                </Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.catModalSaveBtn}
              onPress={handleGenerateInvoice}
            >
              <Text style={styles.catModalSaveBtnTxt}>Generate Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Generated Invoice Preview Modal ── */}
      <Modal visible={showInvoicePreviewModal} transparent animationType="slide">
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
              
              <View style={styles.catModalHeader}>
                <Text style={styles.catModalTitle}>Invoice</Text>
                <TouchableOpacity style={styles.catModalClose} onPress={() => setShowInvoicePreviewModal(false)}>
                  <X size={18} color="#1b2a4a" />
                </TouchableOpacity>
              </View>

              <ViewShot ref={invoiceRef} options={{ format: 'png', quality: 1 }}>
                <View style={styles.invoiceCard}>
                  {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  {activeChurch?.theme?.logoUrl || (activeChurch as any)?.logoUrl || (activeChurch as any)?.profilePhoto ? (
                    <Image source={{ uri: activeChurch?.theme?.logoUrl || (activeChurch as any)?.logoUrl || (activeChurch as any)?.profilePhoto }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 12 }} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#c9973f', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#141d33', fontWeight: '700' }}>
                        {(activeChurch?.name || 'W').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#1b2a4a', fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 }}>
                    {activeChurch?.name || "We Christian Finance"}
                  </Text>
                  {activeChurch?.address || (activeChurch as any)?.mailingCity ? (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                      {activeChurch?.address || `${(activeChurch as any).mailingCity}, ${(activeChurch as any).mailingState || ''}`}
                    </Text>
                  ) : null}
                  {(activeChurch as any)?.phone ? (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginTop: 2, textAlign: 'center' }}>
                      Phone: {(activeChurch as any).phone}
                    </Text>
                  ) : null}
                  <View style={{ height: 1, backgroundColor: '#c9973f', width: '100%', marginTop: 15 }} />
                </View>

                {/* Metadata Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
                  <View style={{ width: '45%' }}>
                    <Text style={styles.invLabel}>INVOICE NO</Text>
                    <Text style={styles.invValue}>{selectedInvoiceForApproval?.id || ('INV-' + (activeChurch?.name || 'WEC').substring(0, 3).toUpperCase() + '-' + String(invoices.length + 1).padStart(7, '0'))}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={styles.invLabel}>INVOICE DATE</Text>
                    <Text style={styles.invValue}>{formatDateDisplay(new Date().toISOString().split('T')[0])}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={styles.invLabel}>CATEGORY</Text>
                    <Text style={styles.invValue}>{invoiceCategory}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={styles.invLabel}>PREPARED BY</Text>
                    <Text style={styles.invValue}>{selectedInvoiceForApproval?.preparedBy || member?.name || 'Pastor'}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={styles.invLabel}>REPORTED BY</Text>
                    <Text style={styles.invValue}>{(selectedInvoiceForApproval?.reportedByNames && selectedInvoiceForApproval.reportedByNames.length > 0) ? selectedInvoiceForApproval.reportedByNames.join(', ') : (selectedInvoiceForApproval?.reportedByName || selectedApproverNames.join(', ') || member?.name || 'Admin')}</Text>
                  </View>
                </View>

                {/* Table Header */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1b2a4a', paddingBottom: 8, marginBottom: 8 }}>
                  <Text style={[styles.invLabel, { flex: 2, color: '#1b2a4a' }]}>EXPENSE</Text>
                  <Text style={[styles.invLabel, { flex: 0.8, color: '#1b2a4a', textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.invLabel, { flex: 1, color: '#1b2a4a', textAlign: 'right' }]}>UNIT</Text>
                  <Text style={[styles.invLabel, { flex: 1.2, color: '#1b2a4a', textAlign: 'right' }]}>AMOUNT</Text>
                </View>

                {/* Table Rows */}
                {expenses
                  .filter(e => selectedInvoiceExpenses.includes(e.id || ''))
                  .flatMap(e => e.lineItems || [])
                  .map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4efe6' }}>
                      <Text style={[styles.invRowText, { flex: 2 }]}>{item.type}</Text>
                      <Text style={[styles.invRowText, { flex: 0.8, textAlign: 'center' }]}>{item.quantity}</Text>
                      <Text style={[styles.invRowText, { flex: 1, textAlign: 'right' }]}>₹{item.pricePerUnit}</Text>
                      <Text style={[styles.invRowText, { flex: 1.2, textAlign: 'right' }]}>₹{item.total.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                  
                {/* Fallback if no line items but an amount exists */}
                {expenses
                  .filter(e => selectedInvoiceExpenses.includes(e.id || '') && (!e.lineItems || e.lineItems.length === 0))
                  .map((e, idx) => (
                    <View key={`fb-${idx}`} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4efe6' }}>
                      <Text style={[styles.invRowText, { flex: 2 }]}>{e.title || 'General Expense'}</Text>
                      <Text style={[styles.invRowText, { flex: 0.8, textAlign: 'center' }]}>1</Text>
                      <Text style={[styles.invRowText, { flex: 1, textAlign: 'right' }]}>₹{e.amount}</Text>
                      <Text style={[styles.invRowText, { flex: 1.2, textAlign: 'right' }]}>₹{e.amount?.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}

                {/* Grand Total */}
                <View style={[styles.grandTotalBlock, { marginVertical: 15, borderRadius: 8 }]}>
                  <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                  <Text style={styles.grandTotalAmt}>
                    ₹{expenses
                      .filter(e => selectedInvoiceExpenses.includes(e.id || ''))
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Footer details */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                  <View>
                    <Text style={styles.invLabel}>PAYMENT METHOD</Text>
                    <Text style={styles.invRowText}>
                      {expenses.filter(e => selectedInvoiceExpenses.includes(e.id || ''))[0]?.paymentMethod || 'Mixed'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.invLabel}>VENDOR</Text>
                    <Text style={styles.invRowText}>
                      {expenses.filter(e => selectedInvoiceExpenses.includes(e.id || ''))[0]?.vendorName || 'Multiple'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 40 }}>
                  <Text style={[styles.invRowText, { color: '#241f1a' }]}>
                    <Text style={{ fontWeight: '700' }}>Notes:</Text> {invoiceCategory} Expenses
                  </Text>
                </View>

                {/* Signatures */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ width: '40%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Church Seal</Text>
                  </View>
                  <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#241f1a', paddingTop: 8, alignItems: 'center' }}>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: '#645d54' }}>Authorized Signature</Text>
                  </View>
                </View>
              </View>
            </ViewShot>

            {/* Action Buttons & Approval Flow */}
            {selectedInvoiceForApproval?.status === 'Pending Approval' && (selectedInvoiceForApproval?.reportedByUserId === member?.id || selectedInvoiceForApproval?.reportedByUserIds?.includes(member?.id || '')) ? (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 16, color: '#1b2a4a', marginBottom: 10, textAlign: 'center' }}>Approval Required</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                  <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#137333', borderWidth: 0 }]} onPress={() => handleInvoiceApprovalAction('Approve')}>
                    <Text style={[styles.invActionBtnTxt, { color: '#ffffff' }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#c5221f', borderWidth: 0 }]} onPress={() => { setApprovalActionType('Reject'); setShowApprovalActionModal(true); }}>
                    <Text style={[styles.invActionBtnTxt, { color: '#ffffff' }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#b06000', borderWidth: 0 }]} onPress={() => { setApprovalActionType('Request Changes'); setShowApprovalActionModal(true); }}>
                    <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 12 }]}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : selectedInvoiceForApproval?.status === 'Approved' || !selectedInvoiceForApproval?.status ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#c9973f' }]} onPress={handleDownloadImage}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Save Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#1b2a4a' }]} onPress={async () => {
                  try {
                    const html = generateInvoiceHtml();
                    const { uri } = await Print.printToFileAsync({ html });
                    const cleanFileName = `Invoice-${invoiceCategory.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
                    const newUri = FileSystemLegacy.cacheDirectory + cleanFileName;
                      
                    // Copy to clean filename using legacy API
                    await FileSystemLegacy.copyAsync({ from: uri, to: newUri });
                      
                    if (Platform.OS === 'android') {
                      try {
                        const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
                        if (permissions.granted) {
                          const base64Data = await FileSystemLegacy.readAsStringAsync(newUri, { encoding: FileSystemLegacy.EncodingType.Base64 });
                          const savedUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(permissions.directoryUri, cleanFileName, 'application/pdf');
                          await FileSystemLegacy.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystemLegacy.EncodingType.Base64 });
                          Alert.alert('Success', 'Invoice downloaded successfully.');
                        } else {
                          await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
                        }
                      } catch (err) {
                        await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
                      }
                    } else {
                      // Open the native share/save sheet for iOS
                      await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
                    }
                  } catch (e: any) {
                    Alert.alert("Download Error", e?.message || "Unknown error");
                  }
                }}>
                  <Text style={[styles.invActionBtnTxt, { color: '#ffffff', fontSize: 11 }]}>Save PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invActionBtn, { flex: 1, backgroundColor: '#e7ebf3', borderWidth: 0 }]} onPress={async () => {
                  try {
                    const html = generateInvoiceHtml();
                    await Print.printAsync({ html });
                  } catch (e: any) {
                    Alert.alert("Print Error", e?.message || "Unknown error");
                  }
                }}>
                  <Text style={[styles.invActionBtnTxt, { color: '#1b2a4a', fontSize: 11 }]}>Print</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f4f6f8', borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54' }}>
                  Status: <Text style={{ fontWeight: '700', color: selectedInvoiceForApproval?.status === 'Rejected' ? '#c5221f' : '#b06000' }}>{selectedInvoiceForApproval?.status}</Text>
                  </Text>
                  {selectedInvoiceForApproval?.approvalComments && (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#241f1a', marginTop: 8, textAlign: 'center' }}>"{selectedInvoiceForApproval.approvalComments}"</Text>
                  )}
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Success Card Modal ── */}
      <Modal visible={showSuccessCard} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.categoryModal, { alignItems: 'center', paddingVertical: 40 }]}>
            <CheckCircle2 size={64} color="#c9973f" style={{ marginBottom: 20 }} />
            <Text style={[styles.catModalTitle, { marginBottom: 10 }]}>Success!</Text>
            <Text style={styles.helperText}>Expenses have been saved successfully.</Text>
            
            <TouchableOpacity 
              style={[styles.catModalSaveBtn, { marginTop: 20, width: '100%' }]}
              onPress={() => setShowSuccessCard(false)}
            >
              <Text style={styles.catModalSaveBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Approval Action Modal ── */}
      <Modal visible={showApprovalActionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.categoryModal, { paddingBottom: 20 }]}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>{approvalActionType === 'Reject' ? 'Reject Invoice' : 'Request Changes'}</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowApprovalActionModal(false)}>
                <X size={18} color="#1b2a4a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.catModalLabel}>REASON / COMMENTS</Text>
            <TextInput
              style={[styles.catModalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Why are you rejecting or requesting changes?"
              placeholderTextColor="#a89f92"
              value={approvalComments}
              onChangeText={setApprovalComments}
              multiline
            />
            <TouchableOpacity 
              style={[styles.catModalSaveBtn, { marginTop: 20, backgroundColor: approvalActionType === 'Reject' ? '#c5221f' : '#b06000' }]}
              onPress={() => handleInvoiceApprovalAction(approvalActionType!)}
            >
              <Text style={styles.catModalSaveBtnTxt}>Confirm {approvalActionType}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Expense Details View Modal ── */}
      <Modal visible={showExpenseViewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>Expense Details</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowExpenseViewModal(false)}>
                <X size={18} color="#1b2a4a" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {selectedExpenseForView && (
                <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5ddd0' }}>
                  <Text style={{ fontFamily: FONTS.serif, fontSize: 20, color: '#1b2a4a', fontWeight: '700', marginBottom: 6 }}>
                    {selectedExpenseForView.id || 'N/A'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5ddd0', paddingBottom: 16, marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Date</Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 14, color: '#241f1a' }}>{formatDateDisplay(selectedExpenseForView.date)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Amount</Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 18, color: '#1b2a4a', fontWeight: '700' }}>₹{selectedExpenseForView.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                  
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Category</Text>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 15, color: '#241f1a' }}>{selectedExpenseForView.category}</Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Vendor / Title</Text>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 15, color: '#241f1a' }}>{selectedExpenseForView.vendorName || selectedExpenseForView.title || 'N/A'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Status</Text>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: selectedExpenseForView.status === 'Pending' ? '#b45309' : '#15803d', fontWeight: '700' }}>{selectedExpenseForView.status || 'Paid'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</Text>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' }}>{selectedExpenseForView.paymentMethod || 'Cash'}</Text>
                    </View>
                  </View>

                  {selectedExpenseForView.lineItems && selectedExpenseForView.lineItems.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 8 }}>Line Items</Text>
                      {selectedExpenseForView.lineItems.map((item, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#241f1a', flex: 1 }}>{item.type} x{item.quantity}</Text>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: '#241f1a' }}>₹{item.total.toLocaleString('en-IN')}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedExpenseForView.notes ? (
                    <View style={{ padding: 12, backgroundColor: '#f4efe6', borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: '#645d54', textTransform: 'uppercase', marginBottom: 4 }}>Notes</Text>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#241f1a' }}>{selectedExpenseForView.notes}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f1' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf7f1' },
  
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  
  mainScroll: { padding: 18, paddingBottom: 120, minHeight: 520 },
  
  // Dashboard
  summaryGrid: { flexDirection: 'column', gap: 12, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  sumCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    paddingVertical: 16, paddingHorizontal: 14,
    borderTopWidth: 3, borderTopColor: '#c9973f', // gold-500
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 3,
  },
  sumLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#645d54' },
  sumValue: { fontFamily: FONTS.mono, fontSize: 19, fontWeight: '600', color: '#1b2a4a', marginTop: 5 },
  
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionHeadingTxt: { fontFamily: FONTS.serif, fontSize: 16, color: '#1b2a4a', fontWeight: '700' },
  
  quickActions: { flexDirection: 'column', gap: 10 },
  qaBtn: {
    flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  qaIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#faf3e3', // gold-050
    alignItems: 'center', justifyContent: 'center'
  },
  qaBtnTxt: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '600', color: '#1b2a4a' },
  
  catList: { flexDirection: 'column', gap: 12 },
  
  // Dashboard Recent Expenses
  recentCatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5ddd0',
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 3,
  },
  recentCatArch: { height: 8, backgroundColor: '#c9973f' },
  
  // Expenses Tab Categories
  catCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  catArch: { height: 8 }, 
  catBody: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontFamily: FONTS.serif, fontSize: 15.5, fontWeight: '600', color: '#1b2a4a' },
  catMeta: { fontSize: 11.5, color: '#645d54', marginTop: 3 },
  catAmt: { fontFamily: FONTS.mono, fontWeight: '600', color: '#1b2a4a', fontSize: 15 },
  
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#1b2a4a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 12
  },
  btnSecondaryTxt: { color: '#1b2a4a', fontSize: 13.5, fontWeight: '700' },
  
  // Expenses Filter & Search
  filterLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: '#645d54', marginBottom: 9 },
  filterRow: { flexDirection: 'row', paddingBottom: 6, marginBottom: 16 },
  chip: {
    borderWidth: 1, borderColor: '#e5ddd0',
    backgroundColor: '#ffffff',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 3 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#1b2a4a' },
  chipTxtActive: { color: '#ffffff' },
  
  chipMini: {
    borderWidth: 1, borderColor: '#e5ddd0',
    backgroundColor: '#ffffff',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 20,
    flexDirection: 'row', alignItems: 'center'
  },
  chipMiniTxt: { fontSize: 11.5, color: '#1b2a4a', fontWeight: '600', marginLeft: 4 },

  customRangeBox: {
    borderWidth: 1, borderColor: '#d4c2a5', borderStyle: 'dashed', borderRadius: 16,
    padding: 14, marginBottom: 16,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12
  },
  customRangeLabel: { fontSize: 10, fontWeight: '700', color: '#887d6d', letterSpacing: 0.5, marginBottom: 6 },
  customRangeInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  customRangeInputTxt: { flex: 1, marginRight: 4, fontFamily: FONTS.mono, fontSize: 13, color: '#1b2a4a', fontWeight: '600' },
  customRangeApplyBtn: {
    backgroundColor: '#1b2a4a', borderRadius: 8,
    paddingVertical: 11, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center'
  },
  customRangeApplyTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700', color: '#ffffff' },

  searchBar: {
    flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 9,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 13, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 18,
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 2
  },
  searchInput: { flex: 1, fontSize: 13.5, fontFamily: FONTS.sans, padding: 0, color: '#241f1a' },
  
  fab: {
    position: 'absolute',
    right: 2, bottom: 20,
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: '#e6c079', // gold-300
    shadowColor: '#c9973f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 6,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20
  },
  
  emptyNote: { textAlign: 'center', color: '#645d54', fontSize: 12.5, paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { color: '#64748b', marginTop: 12, fontSize: 14, fontWeight: '500' },
  
  // Editor Form Styles
  backBtnInline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 16 },
  backBtnInlineTxt: { fontFamily: FONTS.sans, fontSize: 13.5, color: '#1b2a4a', fontWeight: '600' },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5ddd0',
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 3,
    marginBottom: 20
  },
  formBody: { paddingVertical: 20, paddingHorizontal: 18 },
  formLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: '#645d54', marginBottom: 8 },
  formInput: { 
    backgroundColor: '#faf7f1',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a',
    marginBottom: 20
  },
  primaryActionBtn: {
    backgroundColor: '#e6c079',
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 14,
    shadowColor: '#c9973f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 6,
  },
  primaryActionBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#141d33' },

  tabbar: {
    position: 'absolute', left: 20, right: 20, bottom: Platform.OS === 'ios' ? 40 : 32,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1.5, borderColor: '#c9973f',
    flexDirection: 'row',
    paddingVertical: 10, paddingHorizontal: 12,
    zIndex: 10,
    shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6, gap: 3
  },
  tabBtnTxt: { fontFamily: FONTS.sans, fontSize: 10.5, fontWeight: '600', color: '#645d54' },
  tabBtnTxtActive: { color: '#1b2a4a' },
  
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 80
  },
  toast: { backgroundColor: '#141d33', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.18, shadowRadius: 34, elevation: 6 },
  toastText: { color: '#ffffff', fontSize: 12.5 },
  
  // Category Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 20
  },
  categoryModal: {
    backgroundColor: '#faf7f1',
    borderRadius: 24, padding: 22,
    width: '92%', maxWidth: 360,
    shadowColor: '#141d33', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 35, elevation: 10
  },
  catModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  catModalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: '#1b2a4a', fontWeight: '700' },
  catModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3', alignItems: 'center', justifyContent: 'center' },
  catModalLabel: { fontFamily: FONTS.sans, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: '#645d54', marginBottom: 8 },
  catModalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a',
    marginBottom: 20
  },
  catModalSaveBtn: {
    backgroundColor: '#1b2a4a',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center'
  },
  catModalSaveBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Add Expense Modal
  modalOverlayFull: {
    flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.65)',
    justifyContent: 'flex-end'
  },
  addExpModal: {
    backgroundColor: '#faf7f1',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    width: '100%', height: '90%'
  },
  expChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  expChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  expChipActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' },
  expChipTxt: { fontFamily: FONTS.sans, fontSize: 13, color: '#1b2a4a', fontWeight: '500' },
  expChipTxtActive: { color: '#ffffff' },
  helperText: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginBottom: 20 },
  lineItemCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5ddd0', padding: 14 },
  lineItemTitle: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#1b2a4a' },
  lineItemRemove: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '500', color: '#7a2e2e' },
  lineItemInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, fontFamily: FONTS.sans, color: '#241f1a' },
  lineItemSubtotal: { textAlign: 'right', fontFamily: FONTS.mono, fontSize: 14, fontWeight: '600', color: '#c9973f', marginTop: 10 },
  grandTotalBlock: { backgroundColor: '#1b2a4a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  grandTotalLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#e7ebf3', letterSpacing: 0.5 },
  grandTotalAmt: { fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#e6c079' },
  
  // Dropdown
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 8,
    marginTop: 5,
    zIndex: 20
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f4efe6' },
  dropdownItemActive: { backgroundColor: '#1967d2' },
  dropdownItemTxt: { fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' },
  dropdownItemTxtActive: { color: '#ffffff', fontWeight: '500' },
  
  // Invoice Preview
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  invLabel: { fontFamily: FONTS.sans, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#a89f92', letterSpacing: 0.5, marginBottom: 4 },
  invValue: { fontFamily: FONTS.mono, fontSize: 13, color: '#1b2a4a', fontWeight: '600' },
  invRowText: { fontFamily: FONTS.mono, fontSize: 13, color: '#645d54' },
  invActionBtn: { flex: 1, backgroundColor: '#e7ebf3', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  invActionBtnTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#1b2a4a' },

  // Add Donation Styles
  addBtn: {
    backgroundColor: '#1b2a4a',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6
  },
  addBtnTxt: {
    fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#ffffff'
  },
  addExpHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 22, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5ddd0'
  },
  addExpTitle: {
    fontFamily: FONTS.serif, fontSize: 20, fontWeight: '700', color: '#1b2a4a'
  },
  addExpClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3',
    alignItems: 'center', justifyContent: 'center'
  },
  addExpBody: {
    paddingHorizontal: 22, paddingTop: 15
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#645d54', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, fontFamily: FONTS.sans, color: '#241f1a'
  },
  row: { flexDirection: 'column', gap: 15 },
  pmBtn: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0',
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14
  },
  pmBtnActive: {
    backgroundColor: '#1b2a4a', borderColor: '#1b2a4a'
  },
  pmBtnTxt: {
    fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#645d54'
  },
  pmBtnTxtActive: {
    color: '#ffffff'
  },
  addExpFooter: {
    padding: 22, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5ddd0'
  },
  saveBtn: {
    backgroundColor: '#c9973f', borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  saveBtnTxt: {
    fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff'
  }
});
