import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { COURIER_OPTIONS, getCourierTrackingUrl, getCourierBrandStyle } from '../utils/courier';

export default function AdminDashboard() {
  const { 
    user, products, addProduct, updateProduct, deleteProduct, 
    storeDetails, updateStoreDetails, logout, orders, updateOrderStatus, 
    categories: contextCategories, addCategory, deleteCategory, 
    addSubCategory, deleteSubCategory,
    requestPasswordOtp, changeAdminPassword, expenses, addExpense, deleteExpense, getAccountingSummary 
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const fileInputRef = useRef(null);

  // Sidebar open/close state (persisted)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      try { localStorage.setItem('admin_sidebar_open', String(next)); } catch {}
      return next;
    });
  };

  // Profile dropdown menu state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileMenuOpen]);

  // Orders status tabs, search & filters state
  const [orderStatusTab, setOrderStatusTab] = useState('All');
  const [orderSearchText, setOrderSearchText] = useState('');
  const [orderCustomerFilter, setOrderCustomerFilter] = useState('');
  const [orderPhoneFilter, setOrderPhoneFilter] = useState('');
  const [orderFromDate, setOrderFromDate] = useState('');
  const [orderToDate, setOrderToDate] = useState('');

  const resetOrderFilters = () => {
    setOrderStatusTab('All');
    setOrderSearchText('');
    setOrderCustomerFilter('');
    setOrderPhoneFilter('');
    setOrderFromDate('');
    setOrderToDate('');
  };

  // Product form state
  const [editingId, setEditingId] = useState(null);
  const [costPrice, setCostPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  // Accounting & Expenses State (Option 1)
  const [accountingSummary, setAccountingSummary] = useState(null);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState('Marketing & Ads');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidFrom, setExpensePaidFrom] = useState('Cash in Hand');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);
  const [expenseFilterCat, setExpenseFilterCat] = useState('All');

  const refreshAccounting = async () => {
    try {
      const summary = await getAccountingSummary();
      if (summary) setAccountingSummary(summary);
    } catch (_) {}
  };

  useEffect(() => {
    if (activeTab === 'finances') {
      refreshAccounting();
    }
  }, [activeTab, orders, expenses]);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    setIsLoggingExpense(true);
    try {
      await addExpense({
        date: expenseDate,
        category: expenseCategory,
        amount: Number(expenseAmount),
        paidFrom: expensePaidFrom,
        supplierName: expenseSupplier.trim(),
        note: expenseNote.trim()
      });
      setExpenseAmount('');
      setExpenseNote('');
      setExpenseSupplier('');
      await refreshAccounting();
    } catch (err) {
      console.error('Error logging expense:', err);
    } finally {
      setIsLoggingExpense(false);
    }
  };
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mobiles');
  const [subCategory, setSubCategory] = useState('');
  const [sale, setSale] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [description, setDescription] = useState('');

  // Products table filter
  const [filterCategory, setFilterCategory] = useState('All');

  // Order Courier & Tracking Modal State
  const [editingTrackingOrder, setEditingTrackingOrder] = useState(null);
  const [courierInput, setCourierInput] = useState('PostEx');
  const [trackingNumInput, setTrackingNumInput] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  const openTrackingModal = (order) => {
    setEditingTrackingOrder(order);
    setCourierInput(order.courier || 'PostEx');
    setTrackingNumInput(order.trackingNumber || '');
  };

  const handleSaveTracking = async (e) => {
    if (e) e.preventDefault();
    if (!editingTrackingOrder) return;
    setIsSavingTracking(true);
    try {
      await updateOrderStatus(
        editingTrackingOrder.id,
        editingTrackingOrder.status || 'Shipped',
        courierInput,
        trackingNumInput.trim()
      );
      setEditingTrackingOrder(null);
    } catch (err) {
      console.error('Failed to update tracking:', err);
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Store details form state
  const [address, setAddress] = useState(storeDetails.address);
  const [hours, setHours] = useState(storeDetails.hours);
  const [phone, setPhone] = useState(storeDetails.phone);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordStep, setPasswordStep] = useState('input'); // 'input' or 'otp'
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdCountdown, setPwdCountdown] = useState(0);

  // Cloudflare Email Routing state
  const [cfRouting, setCfRouting] = useState({
    isConfigured: false,
    adminEmail: 'admin@icaregadget.store',
    currentForwardTo: '',
    ruleEnabled: false,
    addresses: []
  });
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState('');
  const [cfSuccess, setCfSuccess] = useState('');
  const [newDestinationEmail, setNewDestinationEmail] = useState('');
  const [cfActionLoading, setCfActionLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      content: "Hello Admin! I'm your AI Business Advisor & Data Handler. I have live access to your store metrics (orders, revenue, products). Ask me to calculate sales performance, diagnose inventory gaps, plan promotions, or discuss any business question!"
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecording, setAiRecording] = useState(false);
  const [aiMuted, setAiMuted] = useState(() => {
    try {
      return localStorage.getItem('icare_admin_ai_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const toggleAiMute = () => {
    setAiMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('icare_admin_ai_muted', String(next));
      } catch {}
      if (next) {
        stopAiVoice();
      }
      return next;
    });
  };
  const [aiLiveTranscript, setAiLiveTranscript] = useState('');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const aiMessagesEndRef = useRef(null);

  useEffect(() => {
    if (isAiChatOpen) {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAiChatOpen, aiMessages]);
  const aiRecognitionRef = useRef(null);
  const aiMediaRecorderRef = useRef(null);
  const aiAudioChunksRef = useRef([]);
  const aiCurrentAudioRef = useRef(null);

  const stopAiVoice = () => {
    try {
      if (aiCurrentAudioRef.current) {
        aiCurrentAudioRef.current.pause();
        aiCurrentAudioRef.current.currentTime = 0;
        aiCurrentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn('Stop audio error:', e);
    }
    setIsAiSpeaking(false);
  };

  const playAiVoice = (audioSrc) => {
    if (!audioSrc || aiMuted) return;
    try {
      stopAiVoice();
      const sound = new Audio(audioSrc);
      aiCurrentAudioRef.current = sound;

      sound.onplay = () => setIsAiSpeaking(true);
      sound.onended = () => {
        setIsAiSpeaking(false);
        aiCurrentAudioRef.current = null;
      };
      sound.onerror = () => {
        setIsAiSpeaking(false);
        aiCurrentAudioRef.current = null;
      };

      sound.play().catch(e => {
        console.warn('Audio auto-play blocked:', e);
        setIsAiSpeaking(false);
      });
    } catch (e) {
      console.warn('Playback error:', e);
      setIsAiSpeaking(false);
    }
  };

  const speakAiText = (text) => {
    if (aiMuted || !('speechSynthesis' in window)) return;
    stopAiVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleAiSend = async (customPrompt, audioBase64 = null) => {
    const text = (customPrompt !== undefined ? customPrompt : aiInput).trim();
    if (!text && !audioBase64) return;
    if (aiLoading) return;

    // Immediately display the user's spoken or typed words in chat
    const displayMsg = text || (audioBase64 ? "Transcribing voice command..." : "");
    const updated = [...aiMessages, { role: 'user', content: displayMsg }];
    setAiMessages(updated);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          audio: audioBase64,
          history: updated.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.reply || "I'm having a brief connection issue. Please try again.";

      // Replace the temporary transcription placeholder with the real transcribed text
      const finalUserText = data.userText || text || "[Voice Command]";
      setAiMessages([
        ...aiMessages,
        { role: 'user', content: finalUserText },
        { role: 'assistant', content: reply, audio: data.audio }
      ]);

      if (data.audio) {
        playAiVoice(data.audio);
      }
    } catch (err) {
      const finalUserText = text || "[Voice Command]";
      setAiMessages([
        ...aiMessages,
        { role: 'user', content: finalUserText },
        { role: 'assistant', content: "Failed to connect to AI server: " + err.message }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const startAiRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      aiAudioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      aiMediaRecorderRef.current = mediaRecorder;

      let recognizedSpeech = '';
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (e) => {
            let str = '';
            for (let i = 0; i < e.results.length; i++) {
              str += e.results[i][0].transcript;
            }
            recognizedSpeech = str;
            setAiLiveTranscript(str);
          };
          rec.onerror = (e) => console.warn('SpeechRecognition error:', e);
          rec.start();
          aiRecognitionRef.current = rec;
        } catch (e) {
          console.warn('SpeechRecognition error:', e);
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) aiAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (aiRecognitionRef.current) {
          try { aiRecognitionRef.current.stop(); } catch (_) {}
        }
        const blob = new Blob(aiAudioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          handleAiSend(recognizedSpeech, reader.result);
          setAiLiveTranscript('');
        };
      };

      mediaRecorder.start();
      setAiRecording(true);
      setAiLiveTranscript('');
    } catch (err) {
      console.warn("Microphone denied:", err);
      alert("Please allow microphone access to use voice commands.");
    }
  };

  const stopAiRecording = () => {
    if (aiMediaRecorderRef.current && aiRecording) {
      aiMediaRecorderRef.current.stop();
      setAiRecording(false);
    }
    if (aiRecognitionRef.current) {
      try { aiRecognitionRef.current.stop(); } catch (_) {}
    }
  };

  useEffect(() => {
    let timer;
    if (pwdCountdown > 0) {
      timer = setTimeout(() => setPwdCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [pwdCountdown]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const allCategories = Object.keys(contextCategories || {});
  const allSubCategories = (contextCategories && contextCategories[category]) ? contextCategories[category] : [];

  const filteredProducts = filterCategory === 'All'
    ? products
    : products.filter(p => p.category === filterCategory);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(async (file) => {
      if (file) {
        const compressed = await compressImage(file);
        setImagesPreview(prev => [...prev, compressed]);
      }
    });
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only capture paste events if we are on the products tab and not typing in a text input (unless it's an image)
      if (activeTab !== 'products') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            compressImage(file).then(compressed => {
              setImagesPreview(prev => [...prev, compressed]);
            });
          }
          break;
        }
      }
    };
    
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab]);

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setCostPrice(product.costPrice || '');
    setSupplierName(product.supplierName || '');
    setSupplierContact(product.supplierContact || '');
    setCategory(product.category);
    setSubCategory(product.subCategory || '');
    setSale(product.sale);
    setBestSeller(product.bestSeller || false);
    setImagesPreview(product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
    setDescription(product.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCostPrice('');
    setSupplierName('');
    setSupplierContact('');
    setSubCategory('');
    setImagesPreview([]);
    setDescription('');
    setSale(false);
    setBestSeller(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    
    // Automatically register category and subcategory if they don't exist
    if (category) {
      addCategory(category);
      if (subCategory) {
        addSubCategory(category, subCategory);
      }
    }

    const productPayload = {
      name, price, category, subCategory, sale, bestSeller, description,
      image: imagesPreview[0] || '', images: imagesPreview,
      costPrice: costPrice.trim() || '0',
      supplierName: supplierName.trim(),
      supplierContact: supplierContact.trim()
    };

    if (editingId) {
      updateProduct(editingId, productPayload);
      alert('Product updated successfully!');
    } else {
      addProduct(productPayload);
      alert('Product published successfully!');
    }
    handleCancelEdit();
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProduct(id);
    }
  };

  const handleUpdateStore = (e) => {
    e.preventDefault();
    updateStoreDetails({ address, hours, phone });
    alert('Store details updated successfully!');
  };

  const handleRequestPasswordOtp = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await requestPasswordOtp(currentPassword);
      if (res?.success) {
        setPasswordStep('otp');
        setPwdSuccess(res.message || 'Verification code sent to admin@icaregadget.store');
        setPwdCountdown(60);
      } else {
        setPwdError(res?.error || 'Failed to request code. Check current password.');
      }
    } catch (err) {
      setPwdError('Network error requesting code.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!passwordOtp || passwordOtp.trim().length !== 6) {
      setPwdError('Please enter the 6-digit verification code.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword, passwordOtp.trim());
      if (res?.success) {
        setPwdSuccess('Password updated successfully! Next time you log in, use your new password.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordOtp('');
        setPasswordStep('input');
      } else {
        setPwdError(res?.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setPwdError('Network error updating password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const fetchEmailRouting = async () => {
    try {
      setCfLoading(true);
      setCfError('');
      const res = await fetch('/api/admin/email-routing');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch email routing');
      setCfRouting(data);
    } catch (err) {
      console.error(err);
      setCfError(err.message || 'Error fetching email routing');
    } finally {
      setCfLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchEmailRouting();
    }
  }, [activeTab]);

  const handleAddDestination = async (e) => {
    e.preventDefault();
    if (!newDestinationEmail || !newDestinationEmail.includes('@')) {
      setCfError('Please enter a valid destination email address.');
      return;
    }
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch('/api/admin/email-routing/add-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newDestinationEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add destination address');
      setCfSuccess(data.message || 'Verification email sent by Cloudflare!');
      setNewDestinationEmail('');
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to add destination email.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleActivateDestination = async (targetEmail) => {
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch('/api/admin/email-routing/activate-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate forwarding rule');
      setCfSuccess(data.message || 'Forwarding rule activated successfully!');
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to activate forwarding rule.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleDeleteDestination = async (tag, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email} from Cloudflare?`)) {
      return;
    }
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch(`/api/admin/email-routing/destination/${tag}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete address');
      setCfSuccess(`Deleted ${email} from Cloudflare successfully.`);
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to delete destination address.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inputStyle = { width: '100%', padding: '6px 10px', borderRadius: '5px', border: '1px solid #d1d5db', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.8125rem' };
  const labelStyle = { display: 'block', fontWeight: '600', fontSize: '0.75rem', marginBottom: '4px', color: '#374151' };
  const focusHandler = (e) => e.target.style.borderColor = 'var(--orange)';
  const blurHandler = (e) => e.target.style.borderColor = '#d1d5db';

  const sidebarBtnStyle = (isActive) => ({
    textAlign: 'left', padding: '12px 16px', borderRadius: '8px',
    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: isActive ? 'white' : '#9ca3af',
    fontWeight: '500', transition: 'all 0.2s', border: 'none', cursor: 'pointer', width: '100%'
  });

  return (
    <div className="admin-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Sleek Admin Topbar (52px, Pure Black) */}
      <header style={{
        height: '52px',
        backgroundColor: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #1f1f1f',
        flexShrink: 0,
        zIndex: 50,
        userSelect: 'none'
      }}>
        {/* Left: Brand + Breadcrumb (Collapse button removed) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, letterSpacing: '0.5px', color: '#f59e0b', fontSize: '13px' }}>I CARE</span>
          <span style={{ color: '#4b5563' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
            {activeTab === 'orders' && 'Customer Orders'}
            {activeTab === 'finances' && 'Finances & P&L'}
            {activeTab === 'products' && 'Products'}
            {activeTab === 'categories' && 'Categories'}
            {activeTab === 'store' && 'Store Settings'}
            {activeTab === 'security' && 'Security & Password'}
          </span>
        </div>

        {/* Right: Storefront + Profile Icon (AI Advisor button removed) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Live Storefront */}
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            title="Open storefront website in new tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#141414',
              color: '#9ca3af',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#222222'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#141414'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Storefront</span>
          </button>

          {/* Admin Profile Dropdown */}
          <div ref={profileMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: profileMenuOpen ? '#374151' : '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '999px',
                padding: '3px 10px 3px 3px',
                cursor: 'pointer',
                color: '#ffffff',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#9ca3af'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#4b5563'}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--orange, #ea580c)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #10b981'
              }}>
                A
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Admin</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '220px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '6px 0',
                zIndex: 100
              }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Store Administrator</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{user?.email || 'admin@icaregadget.store'}</div>
                </div>
                
                <button
                  type="button"
                  onClick={() => { setActiveTab('store'); setProfileMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Store Settings
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('security'); setProfileMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Password & Security
                </button>

                <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#ef4444',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Horizontal Body Container (Sidebar + Main Workspace) */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Collapsible Sidebar */}
        <aside
          className="admin-sidebar"
          style={{
            width: sidebarOpen ? '200px' : '56px',
            overflow: 'hidden',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: '#000000',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderRight: '1px solid #1f1f1f',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Header with < or > button */}
          <div style={{
            height: '46px',
            borderBottom: '1px solid #1f1f1f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            padding: sidebarOpen ? '0 12px' : '0'
          }}>
            {sidebarOpen ? (
              <>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Navigation
                </span>
                <button 
                  type="button" 
                  onClick={toggleSidebar} 
                  title="Collapse sidebar (<)"
                  style={{
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#141414',
                    border: '1px solid #2a2a2a',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = '#262626'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = '#141414'; }}
                >
                  &lt;
                </button>
              </>
            ) : (
              <button 
                type="button" 
                onClick={toggleSidebar} 
                title="Expand sidebar (>)"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#141414',
                  border: '1px solid #2a2a2a',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = '#262626'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = '#141414'; }}
              >
                &gt;
              </button>
            )}
          </div>

          <nav style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
            
            <button 
              onClick={() => setActiveTab('orders')} 
              title="Customer Orders"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'orders' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'orders' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'orders' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'orders' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Customer Orders</span>}
              </div>
              {sidebarOpen && orders.length > 0 && <span style={{ backgroundColor: 'var(--orange, #ea580c)', color: 'white', padding: '1px 5px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700 }}>{orders.length}</span>}
            </button>

            <button 
              onClick={() => setActiveTab('finances')} 
              title="Finances & P&L"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'finances' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'finances' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'finances' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'finances' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Finances & P&L</span>}
              </div>
              {sidebarOpen && <span style={{ backgroundColor: '#10b981', color: 'white', padding: '1px 5px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 'bold' }}>P&L</span>}
            </button>

            <button 
              onClick={() => setActiveTab('products')} 
              title="Products"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'products' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'products' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'products' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'products' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Products</span>}
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('categories')} 
              title="Categories"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'categories' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'categories' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'categories' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'categories' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Categories</span>}
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('store')} 
              title="Store Settings"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'store' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'store' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'store' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'store' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Store Settings</span>}
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('security')} 
              title="Security & Password"
              style={{
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '8px',
                backgroundColor: activeTab === 'security' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'security' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => activeTab !== 'security' && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => activeTab !== 'security' && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {sidebarOpen && <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Security & Password</span>}
              </div>
            </button>

          </nav>

          <div style={{ padding: '10px 0', borderTop: '1px solid #1f1f1f' }}>
            <button 
              onClick={handleLogout} 
              title="Logout"
              style={{ 
                width: sidebarOpen ? 'calc(100% - 12px)' : '38px',
                height: sidebarOpen ? 'auto' : '38px',
                margin: sidebarOpen ? '0 6px' : '2px auto',
                padding: sidebarOpen ? '8px 12px' : '0',
                borderRadius: '6px', 
                color: '#f87171', 
                fontWeight: '500', 
                fontSize: '12.5px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: '10px', 
                transition: 'background 0.2s', 
                border: 'none', 
                cursor: 'pointer', 
                backgroundColor: 'transparent' 
              }} 
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)'} 
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Workspace (Wide, Compact 16px 20px padding) */}
        <main className="admin-main" style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          {/* ===== ORDERS TAB ===== */}
        {activeTab === 'orders' && (() => {
          const statusCounts = {
            All: orders.length,
            Pending: orders.filter(o => (o.status || 'Pending').toLowerCase() === 'pending').length,
            Processing: orders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
            Shipped: orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
            Delivered: orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
            Cancelled: orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length
          };

          const filteredOrders = orders.slice().reverse().filter(order => {
            if (orderStatusTab !== 'All') {
              if ((order.status || 'Pending').toLowerCase() !== orderStatusTab.toLowerCase()) {
                return false;
              }
            }
            if (orderSearchText.trim()) {
              const q = orderSearchText.trim().toLowerCase().replace('#', '');
              const idStr = String(order.id).toLowerCase();
              const nameStr = (order.userName || '').toLowerCase();
              const phoneStr = (order.phone || '').toLowerCase();
              const prodStr = (order.productName || '').toLowerCase();
              if (!idStr.includes(q) && !nameStr.includes(q) && !phoneStr.includes(q) && !prodStr.includes(q)) {
                return false;
              }
            }
            if (orderCustomerFilter.trim()) {
              const cName = orderCustomerFilter.trim().toLowerCase();
              if (!(order.userName || '').toLowerCase().includes(cName)) {
                return false;
              }
            }
            if (orderPhoneFilter.trim()) {
              const cPhone = orderPhoneFilter.trim().toLowerCase();
              if (!(order.phone || '').toLowerCase().includes(cPhone)) {
                return false;
              }
            }
            if (orderFromDate) {
              if (new Date(order.date) < new Date(orderFromDate)) return false;
            }
            if (orderToDate) {
              if (new Date(order.date) > new Date(orderToDate + 'T23:59:59')) return false;
            }
            return true;
          });

          return (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Header Title & Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Recent Orders</h2>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              </div>

              {/* Status Tabs with live counts */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { key: 'All', label: 'All', count: statusCounts.All },
                  { key: 'Pending', label: 'Pending', count: statusCounts.Pending },
                  { key: 'Processing', label: 'Processing', count: statusCounts.Processing },
                  { key: 'Shipped', label: 'Shipped', count: statusCounts.Shipped },
                  { key: 'Delivered', label: 'Delivered', count: statusCounts.Delivered },
                  { key: 'Cancelled', label: 'Cancelled', count: statusCounts.Cancelled }
                ].map(tab => {
                  const isActive = orderStatusTab.toLowerCase() === tab.key.toLowerCase();
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setOrderStatusTab(tab.key)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid ' + (isActive ? '#ea580c' : '#e5e7eb'),
                        backgroundColor: isActive ? '#ffedd5' : '#ffffff',
                        color: isActive ? '#ea580c' : '#4b5563',
                        fontSize: '11.5px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{
                        backgroundColor: isActive ? '#ea580c' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                        padding: '1px 5px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Comprehensive Filter Toolbar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 70px', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  value={orderSearchText}
                  onChange={e => setOrderSearchText(e.target.value)}
                  placeholder="Search ID, item..."
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <input
                  type="text"
                  value={orderCustomerFilter}
                  onChange={e => setOrderCustomerFilter(e.target.value)}
                  placeholder="Customer name..."
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <input
                  type="text"
                  value={orderPhoneFilter}
                  onChange={e => setOrderPhoneFilter(e.target.value)}
                  placeholder="Phone number..."
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>From:</span>
                  <input
                    type="date"
                    value={orderFromDate}
                    onChange={e => setOrderFromDate(e.target.value)}
                    style={{ height: '28px', padding: '0 4px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>To:</span>
                  <input
                    type="date"
                    value={orderToDate}
                    onChange={e => setOrderToDate(e.target.value)}
                    style={{ height: '28px', padding: '0 4px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', width: '100%' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={resetOrderFilters}
                  style={{ height: '28px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>

              {/* Table */}
              {filteredOrders.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                  No orders match your filter criteria.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Order ID</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Customer</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Product</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Total</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Date</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Order Status</th>
                        <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Courier & Tracking (CN #)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>#{order.id.toString().slice(-6)}</td>
                          <td style={{ padding: '8px 10px', color: '#4b5563' }}>
                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '12px' }}>{order.userName}</div>
                            {order.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>{order.phone}</div>}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#374151', maxWidth: '240px', fontSize: '11.5px' }}>{order.productName}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: '#111827', fontSize: '12px' }}>{order.price}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{order.date}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {/* Status Dropdown with White Background */}
                            <select
                              value={order.status || 'Pending'}
                              onChange={(e) => {
                                const newSt = e.target.value;
                                updateOrderStatus(order.id, newSt);
                                if (newSt === 'Shipped' && !order.trackingNumber) {
                                  openTrackingModal({ ...order, status: newSt });
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none',
                                border: '1px solid #d1d5db',
                                backgroundColor: '#ffffff',
                                color: '#111827',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {order.trackingNumber ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ 
                                    padding: '3px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    border: '1px solid ' + getCourierBrandStyle(order.courier).border,
                                    backgroundColor: getCourierBrandStyle(order.courier).bg,
                                    color: getCourierBrandStyle(order.courier).color
                                  }}>
                                    {order.courier || 'Courier'}: {order.trackingNumber}
                                  </span>
                                  {getCourierTrackingUrl(order.courier, order.trackingNumber) && (
                                    <a
                                      href={getCourierTrackingUrl(order.courier, order.trackingNumber)}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Track live with courier"
                                      style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openTrackingModal(order)}
                                    title="Edit Courier or Tracking #"
                                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', fontSize: '11px' }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openTrackingModal(order)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    border: '1px dashed #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  + Add Courier / CN #
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '14px' }}>
            
            {/* Products Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', margin: 0 }}>All Products ({filteredProducts.length})</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Mobiles', 'Audio', 'Accessories', 'Smart Home', 'Wearables'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                        backgroundColor: filterCategory === cat ? 'var(--orange)' : '#f3f4f6',
                        color: filterCategory === cat ? 'white' : '#4b5563',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Product</th>
                      <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Category</th>
                      <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Price & Cost</th>
                      <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Margin</th>
                      <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', fontSize: '11px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice().reverse().map(product => (
                      <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            )}
                          </div>
                          <span style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{product.name}</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>{product.category}</span>
                          {product.subCategory && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>{product.subCategory}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ color: '#111827', fontWeight: '600', fontSize: '0.875rem' }}>{product.price}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Cost: PKR {(parseInt(String(product.costPrice || '0').replace(/[^0-9]/g, ''), 10) || 0).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {(() => {
                            const sp = parseInt(String(product.price || '0').replace(/[^0-9]/g, ''), 10) || 0;
                            const cp = parseInt(String(product.costPrice || '0').replace(/[^0-9]/g, ''), 10) || 0;
                            if (sp > 0 && cp > 0) {
                              const margin = Number((((sp - cp) / sp) * 100).toFixed(0));
                              return (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  backgroundColor: margin >= 30 ? '#dcfce7' : margin >= 15 ? '#fef3c7' : '#fee2e2',
                                  color: margin >= 30 ? '#15803d' : margin >= 15 ? '#b45309' : '#b91c1c'
                                }}>
                                  {margin}%
                                </span>
                              );
                            }
                            return <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>;
                          })()}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => handleEditClick(product)} style={{ border: 'none', background: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                            <button onClick={() => handleDeleteClick(product.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add/Edit Product Form */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} style={{ fontSize: '0.875rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                )}
              </div>
              
              <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Image Upload Zone */}
                <div>
                  <label style={labelStyle}>Product Images</label>
                  <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', position: 'relative', overflow: 'hidden', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
                    {imagesPreview.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%', padding: '8px', zIndex: 10 }}>
                        {imagesPreview.map((src, i) => (
                          <div key={i} style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            <img src={src} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setImagesPreview(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>X</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ pointerEvents: 'none' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginBottom: '12px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Click to upload multiple or <strong style={{ color: '#111827' }}>Ctrl+V</strong> to paste</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleImageUpload} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                    placeholder="Enter product description"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. iPhone 15 Pro" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Selling Price (PKR) *</label>
                    <input type="text" value={price} onChange={e => setPrice(e.target.value)} required style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. Rs. 3,500" />
                  </div>
                  <div>
                    <label style={labelStyle}>Cost Price / COGS (PKR)</label>
                    <input type="text" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. 2,200" />
                  </div>
                </div>

                {/* Live Unit Margin Calculator */}
                {(() => {
                  const parseNum = (v) => parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0;
                  const sp = parseNum(price);
                  const cp = parseNum(costPrice);
                  if (sp > 0 && cp > 0) {
                    const profit = sp - cp;
                    const margin = Number(((profit / sp) * 100).toFixed(1));
                    const isGood = profit > 0;
                    return (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: isGood ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${isGood ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: '0.8rem',
                        color: isGood ? '#166534' : '#b91c1c',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Unit Profit: <strong>PKR {profit.toLocaleString()}</strong></span>
                        <span>Gross Margin: <strong>{margin}%</strong></span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Supplier Procurement Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Supplier Name (Optional)</label>
                    <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. Vendor A" />
                  </div>
                  <div>
                    <label style={labelStyle}>Supplier Contact / WhatsApp</label>
                    <input type="text" value={supplierContact} onChange={e => setSupplierContact(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. 0300-1234567" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <input 
                      list="category-options"
                      value={category} 
                      onChange={e => { setCategory(e.target.value); setSubCategory(''); }} 
                      style={inputStyle} 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                      placeholder="Select or type new..." 
                      required
                    />
                    <datalist id="category-options">
                      {allCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label style={labelStyle}>Sub-Category</label>
                    <input 
                      list="sub-category-options"
                      value={subCategory} 
                      onChange={e => setSubCategory(e.target.value)} 
                      style={inputStyle} 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                      placeholder="Optional sub-category..." 
                    />
                    <datalist id="sub-category-options">
                      {allSubCategories.map(sc => <option key={sc} value={sc} />)}
                    </datalist>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input type="checkbox" checked={sale} onChange={e => setSale(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                    On Sale
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input type="checkbox" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                    Best Seller
                  </label>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s', fontSize: '0.9375rem' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}>
                  {editingId ? 'Update Product' : 'Publish Product'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== CATEGORIES TAB ===== */}
        {activeTab === 'categories' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Categories Management</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>Manage the main categories and sub-categories that appear in the website header.</p>
              </div>
              <button 
                onClick={() => {
                  const name = prompt("Enter new category name:");
                  if (name && name.trim()) addCategory(name.trim());
                }}
                style={{ padding: '8px 16px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} 
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}
              >
                + Add Category
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.keys(contextCategories).map(catName => (
                <div key={catName} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{catName}</h3>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the category "${catName}"? This will move all its products to "Uncategorized".`)) {
                          deleteCategory(catName);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Delete Category
                    </button>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Sub-Categories</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {contextCategories[catName].map(sub => (
                        <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px', fontSize: '0.875rem', color: '#374151' }}>
                          {sub}
                          <button 
                            onClick={() => deleteSubCategory(catName, sub)}
                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            title="Remove sub-category"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const subName = prompt(`Enter new sub-category for ${catName}:`);
                          if (subName && subName.trim()) addSubCategory(catName, subName.trim());
                        }}
                        style={{ background: 'none', border: '1px dashed #d1d5db', color: '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
                      >
                        + Add Sub-Category
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STORE SETTINGS TAB ===== */}
        {activeTab === 'store' && (
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Update Store Details</h2>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '0.875rem' }}>These details appear in the "Visit the shop" section and Footer across the website.</p>
            
            <form onSubmit={handleUpdateStore} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Store Address (Directions)</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows="3" style={{ ...inputStyle, fontFamily: 'inherit' }} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <div>
                <label style={labelStyle}>Opening Hours</label>
                <input type="text" value={hours} onChange={e => setHours(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <div>
                <label style={labelStyle}>Phone Number (WhatsApp)</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '8px', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}>
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* ===== SECURITY & PASSWORD TAB ===== */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px', alignItems: 'start' }}>
            
            {/* Card 1: Change Admin Password */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Change Admin Password</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                To update your password, enter your existing password below. A 6-digit verification code will be sent to <strong>admin@icaregadget.store</strong> to authorize the change.
              </p>

              {pwdError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {pwdError}
                </div>
              )}

              {pwdSuccess && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {pwdSuccess}
                </div>
              )}

              {passwordStep === 'input' ? (
                <form onSubmit={handleRequestPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Current Password *</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Enter current password (default: admin123)"
                      required 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>New Password *</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Minimum 6 characters"
                      required 
                      minLength={6}
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm New Password *</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Re-enter new password"
                      required 
                      minLength={6}
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={pwdLoading}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: 'var(--orange)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 'bold', 
                      cursor: pwdLoading ? 'default' : 'pointer', 
                      alignSelf: 'flex-start', 
                      marginTop: '8px',
                      transition: 'opacity 0.2s' 
                    }}
                  >
                    {pwdLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#c2410c' }}>
                      Enter the 6-digit code sent to <strong>admin@icaregadget.store</strong> to confirm changing your password.
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>6-Digit Verification Code *</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={passwordOtp} 
                      onChange={e => setPasswordOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                      style={{ 
                        ...inputStyle, 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        fontWeight: '800', 
                        letterSpacing: '6px',
                        fontFamily: 'monospace'
                      }} 
                      placeholder="------"
                      required 
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      type="submit" 
                      disabled={pwdLoading}
                      style={{ 
                        padding: '12px 24px', 
                        backgroundColor: '#16a34a', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: 'bold', 
                        cursor: pwdLoading ? 'default' : 'pointer' 
                      }}
                    >
                      {pwdLoading ? 'Updating Password...' : 'Confirm & Update Password'}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => { setPasswordStep('input'); setPasswordOtp(''); setPwdError(''); setPwdSuccess(''); }}
                      style={{ 
                        padding: '12px 18px', 
                        backgroundColor: '#f3f4f6', 
                        color: '#4b5563', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Card 2: Cloudflare Email Routing & Forwarding */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Email Forwarding (Cloudflare)
                </h2>
                <button 
                  type="button" 
                  onClick={fetchEmailRouting}
                  disabled={cfLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151',
                    border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8125rem',
                    fontWeight: '600', cursor: cfLoading ? 'default' : 'pointer'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: cfLoading ? 'spin 1s linear infinite' : 'none' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  Refresh
                </button>
              </div>

              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                All 2FA login & security verification codes are sent to <strong>{cfRouting.adminEmail || 'admin@icaregadget.store'}</strong>. Cloudflare automatically forwards them to the active destination address below.
              </p>

              {/* Active Forwarding Banner */}
              <div style={{
                backgroundColor: cfRouting.currentForwardTo ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${cfRouting.currentForwardTo ? '#bbf7d0' : '#fef3c7'}`,
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: cfRouting.currentForwardTo ? '#15803d' : '#b45309', marginBottom: '4px' }}>
                    Active Forwarding Destination
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#111827' }}>
                    {cfRouting.currentForwardTo || 'No forwarding rule configured'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
                    {cfRouting.adminEmail || 'admin@icaregadget.store'} &rarr; {cfRouting.currentForwardTo || 'none'}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: cfRouting.currentForwardTo ? '#dcfce7' : '#fef3c7',
                  color: cfRouting.currentForwardTo ? '#15803d' : '#92400e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfRouting.currentForwardTo ? '#22c55e' : '#f59e0b' }}></span>
                  {cfRouting.currentForwardTo ? 'Active & Receiving' : 'Not Active'}
                </span>
              </div>

              {cfError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {cfError}
                </div>
              )}

              {cfSuccess && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {cfSuccess}
                </div>
              )}

              {/* Form: Add New Destination Address */}
              <form onSubmit={handleAddDestination} style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Add New Destination Email</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input 
                    type="email" 
                    value={newDestinationEmail} 
                    onChange={e => setNewDestinationEmail(e.target.value)} 
                    placeholder="e.g. newadmin@gmail.com"
                    style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
                    required
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                  <button 
                    type="submit" 
                    disabled={cfActionLoading || cfLoading}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'var(--black)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: (cfActionLoading || cfLoading) ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}
                  >
                    {cfActionLoading ? 'Sending...' : 'Add Destination'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '6px 0 0', lineHeight: '1.4' }}>
                  Cloudflare sends an email verification link to that address. Once you click that link, you can activate it below.
                </p>
              </form>

              {/* Registered Destination Addresses in Cloudflare */}
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
                  Cloudflare Registered Destinations ({cfRouting.addresses?.length || 0})
                </h3>

                {cfLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                    Loading Cloudflare destinations...
                  </div>
                ) : (!cfRouting.addresses || cfRouting.addresses.length === 0) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    No destination addresses registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cfRouting.addresses.map(addr => {
                      const isActive = cfRouting.currentForwardTo?.toLowerCase() === addr.email?.toLowerCase();
                      const isVerified = Boolean(addr.verified);

                      return (
                        <div 
                          key={addr.tag || addr.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: isActive ? '#f9fafb' : 'white',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              backgroundColor: isVerified ? '#dcfce7' : '#fef3c7',
                              color: isVerified ? '#15803d' : '#b45309',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {isVerified ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                                {addr.email}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: isVerified ? '#16a34a' : '#d97706' }}>
                                {isVerified ? 'Verified in Cloudflare' : 'Pending verification link'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isActive ? (
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: '#16a34a',
                                color: 'white'
                              }}>
                                Active Rule
                              </span>
                            ) : isVerified ? (
                              <button
                                type="button"
                                disabled={cfActionLoading}
                                onClick={() => handleActivateDestination(addr.email)}
                                style={{
                                  padding: '6px 14px',
                                  backgroundColor: 'var(--orange)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  fontWeight: '600',
                                  cursor: cfActionLoading ? 'default' : 'pointer'
                                }}
                              >
                                Activate
                              </button>
                            ) : (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                backgroundColor: '#f3f4f6'
                              }}>
                                Check Inbox
                              </span>
                            )}

                            {!isActive && (
                              <button
                                type="button"
                                title={`Delete ${addr.email} from Cloudflare`}
                                disabled={cfActionLoading}
                                onClick={() => handleDeleteDestination(addr.tag || addr.id, addr.email)}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: cfActionLoading ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fca5a5'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ===== FINANCES & P&L TAB (OPTION 1) ===== */}
        {activeTab === 'finances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Executive KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              {/* 1. Delivered Sales */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Delivered Revenue (Cash)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  PKR {(accountingSummary?.deliveredRevenue || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  {accountingSummary?.deliveredOrdersCount || 0} delivered orders
                </div>
              </div>

              {/* 2. Total COGS */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Delivered COGS (Cost)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  PKR {(accountingSummary?.deliveredCOGS || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Wholesale product cost
                </div>
              </div>

              {/* 3. Gross Profit */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Gross Profit (Margin)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  PKR {(accountingSummary?.grossProfit || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600', marginTop: '4px' }}>
                  {accountingSummary?.grossMarginPercent || 0}% Gross Margin
                </div>
              </div>

              {/* 4. Total Operating Expenses */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Operating Expenses
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  PKR {(accountingSummary?.totalExpenses || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  {expenses.length} logged expenses
                </div>
              </div>

              {/* 5. Net Bottom-Line Profit */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Net Operational Profit
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#111827', marginTop: '4px' }}>
                  PKR {(accountingSummary?.netProfit || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Gross Profit &minus; All Expenses
                </div>
              </div>

            </div>

            {/* Main Finances Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'flex-start' }}>
              
              {/* Left Column: Expense Ledger Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Expense Ledger ({expenses.length})
                  </h3>

                  {/* Filter chips */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
                    {['All', 'Marketing & Ads', 'Courier Fees', 'Packaging', 'Rent & Bills', 'Supplier Payment', 'Salaries', 'Other'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExpenseFilterCat(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '16px',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          backgroundColor: expenseFilterCat === cat ? '#111827' : '#f1f5f9',
                          color: expenseFilterCat === cat ? '#ffffff' : '#475569'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {expenses.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                    No expenses logged yet. Use the quick logger on the right to track ad spend, flyers, and courier charges!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>Date</th>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>Category</th>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>Source</th>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>Note / Vendor</th>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Amount (PKR)</th>
                          <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses
                          .filter(exp => expenseFilterCat === 'All' || exp.category === expenseFilterCat)
                          .map(exp => (
                            <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', color: '#334155', whiteSpace: 'nowrap' }}>{exp.date}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155'
                                }}>
                                  {exp.category}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {exp.paidFrom === 'Bank Account' ? 'Bank' : 'Cash'}
                              </td>
                              <td style={{ padding: '12px', color: '#475569', maxWidth: '180px' }}>
                                {exp.supplierName && <span style={{ fontWeight: '600', color: '#0f172a' }}>{exp.supplierName}: </span>}
                                <span>{exp.note || '—'}</span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#b91c1c', whiteSpace: 'nowrap' }}>
                                - PKR {Number(exp.amount).toLocaleString()}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm('Delete this expense entry?')) {
                                      await deleteExpense(exp.id);
                                      await refreshAccounting();
                                    }
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem' }}
                                  title="Delete Expense"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Quick Expense Logger & Supplier Balances */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Quick Log Expense Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
                    + Log Store Expense
                  </h3>

                  {/* Fast Preset Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {[
                      { label: 'Meta Ads', cat: 'Marketing & Ads', source: 'Bank Account' },
                      { label: 'Courier Fees', cat: 'Courier Fees', source: 'Cash in Hand' },
                      { label: 'Flyer Bags', cat: 'Packaging', source: 'Cash in Hand' },
                      { label: 'Shop Rent', cat: 'Rent & Bills', source: 'Bank Account' },
                      { label: 'Supplier Pay', cat: 'Supplier Payment', source: 'Bank Account' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setExpenseCategory(p.cat);
                          setExpensePaidFrom(p.source);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Date</label>
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={e => setExpenseDate(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Paid From</label>
                        <select
                          value={expensePaidFrom}
                          onChange={e => setExpensePaidFrom(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="Cash in Hand">Cash in Hand</option>
                          <option value="Bank Account">Bank Account</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Expense Category</label>
                      <select
                        value={expenseCategory}
                        onChange={e => setExpenseCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none' }}
                      >
                        <option value="Marketing & Ads">Marketing & Meta/TikTok Ads</option>
                        <option value="Courier Fees">Courier Freight & RTO Charges</option>
                        <option value="Packaging">Packaging Bags & Tape</option>
                        <option value="Rent & Bills">Shop Rent, Electricity & Bills</option>
                        <option value="Supplier Payment">Supplier Stock Payment</option>
                        <option value="Salaries">Staff Salaries & Wages</option>
                        <option value="Other">Miscellaneous / Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Amount (PKR) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                        required
                        min="1"
                      />
                    </div>

                    {expenseCategory === 'Supplier Payment' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Supplier / Vendor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Hall Road Vendor A"
                          value={expenseSupplier}
                          onChange={e => setExpenseSupplier(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Description / Note</label>
                      <input
                        type="text"
                        placeholder="e.g. 500 flyers or Weekend campaign ads"
                        value={expenseNote}
                        onChange={e => setExpenseNote(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingExpense}
                      style={{
                        marginTop: '6px',
                        padding: '11px',
                        borderRadius: '8px',
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: isLoggingExpense ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoggingExpense ? 'Saving Expense...' : 'Record Expense'}
                    </button>
                  </form>
                </div>

                {/* 2. Supplier Procurement Summary Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 14px 0' }}>
                    Suppliers Directory
                  </h3>

                  {(() => {
                    const supplierMap = {};
                    products.forEach(p => {
                      const sName = (p.supplierName || '').trim();
                      if (sName) {
                        if (!supplierMap[sName]) {
                          supplierMap[sName] = { name: sName, contact: p.supplierContact || '', productsCount: 0 };
                        }
                        supplierMap[sName].productsCount++;
                      }
                    });

                    const suppliers = Object.values(supplierMap);
                    if (suppliers.length === 0) {
                      return (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          No supplier info assigned to products yet. Enter supplier name when adding or editing products in the Products tab.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {suppliers.map((sup, idx) => (
                          <div key={idx} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{sup.name}</div>
                              {sup.contact && (
                                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                                  {sup.contact}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>
                              {sup.productsCount} items
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Courier & Tracking Modal */}
        {editingTrackingOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Assign Courier & Tracking (CN #)
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTrackingOrder(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '0.85rem' }}>
                <div>Order: <strong>#{editingTrackingOrder.id.toString().slice(-6)}</strong></div>
                <div>Customer: <strong>{editingTrackingOrder.userName}</strong> {editingTrackingOrder.phone ? `(${editingTrackingOrder.phone})` : ''}</div>
                {editingTrackingOrder.shippingAddress && (
                  <div style={{ marginTop: '2px', color: '#64748b' }}>{editingTrackingOrder.shippingAddress}</div>
                )}
              </div>

              <form onSubmit={handleSaveTracking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Courier Partner
                  </label>
                  <select
                    value={courierInput}
                    onChange={e => setCourierInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' }}
                  >
                    {COURIER_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Consignment / Tracking Number (CN #)
                  </label>
                  <input
                    type="text"
                    value={trackingNumInput}
                    onChange={e => setTrackingNumInput(e.target.value)}
                    placeholder="e.g. PE123456789PK or 77889900"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Copy this number from your PostEx, TCS, or Trax booking voucher.
                  </span>
                </div>

                {trackingNumInput.trim() && getCourierTrackingUrl(courierInput, trackingNumInput) && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#166534' }}>
                    Customers will have a direct 1-click tracking link to <strong>{courierInput}</strong>!
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingTrackingOrder(null)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTracking || !trackingNumInput.trim()}
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontWeight: '600',
                      cursor: isSavingTracking || !trackingNumInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSavingTracking || !trackingNumInput.trim() ? 0.6 : 1
                    }}
                  >
                    {isSavingTracking ? 'Saving...' : 'Save Tracking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
      </div>

      {/* ==================== FLOATING ADMIN AI CHAT SYSTEM ==================== */}
      {!isAiChatOpen && (
        <button
          type="button"
          onClick={() => setIsAiChatOpen(true)}
          className="orange-chat-trigger-btn"
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
          title="AI Business Advisor"
          aria-label="AI Business Advisor"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 11.5C20 15.6421 16.4183 19 12 19C10.7424 19 9.55163 18.7291 8.5 18.2435L4 20L5.34208 16.6448C4.50974 15.1764 4 13.4181 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z"
              fill="#ffffff"
            />
            <circle cx="8.5" cy="11.5" r="1.3" fill="#ea580c" className="chat-dot-1" />
            <circle cx="12" cy="11.5" r="1.3" fill="#ea580c" className="chat-dot-2" />
            <circle cx="15.5" cy="11.5" r="1.3" fill="#ea580c" className="chat-dot-3" />
          </svg>
        </button>
      )}

      {isAiChatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            height: '620px',
            maxHeight: 'calc(100vh - 48px)',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#111827',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#ffffff' }}>AI Business Co-Pilot</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Live metrics & catalog access</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Clear History */}
              <button
                type="button"
                onClick={() => setAiMessages([{
                  role: 'assistant',
                  content: "History cleared. What can I calculate or suggest for you?"
                }])}
                title="Clear Chat History"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                Clear
              </button>

              {/* Close / Minimize */}
              <button
                type="button"
                onClick={() => setIsAiChatOpen(false)}
                title="Close Co-Pilot"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Strategy Action Pills */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {[
              { label: 'Revenue', prompt: "Summarize today's revenue, total orders, and pending delivery status." },
              { label: 'Stock & Sales', prompt: "Which products are marked as Best Sellers and what items are currently on sale?" },
              { label: 'Campaigns', prompt: "Give me 3 practical high-converting promotional campaign ideas to boost accessory sales this weekend." },
              { label: 'Market Trends', prompt: "What are the most popular trending mobile accessories in Pakistan right now?" }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAiSend(chip.prompt)}
                disabled={aiLoading}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}
          >
            {aiMessages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: isUser ? '#111827' : '#ffffff',
                      color: isUser ? '#ffffff' : '#1f2937',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxShadow: isUser ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.content}
                    {!isUser && m.audio && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAiSpeaking && aiCurrentAudioRef.current) {
                              stopAiVoice();
                            } else {
                              stopAiVoice();
                              const sound = new Audio(m.audio);
                              aiCurrentAudioRef.current = sound;
                              sound.onplay = () => setIsAiSpeaking(true);
                              sound.onended = () => { setIsAiSpeaking(false); aiCurrentAudioRef.current = null; };
                              sound.onerror = () => { setIsAiSpeaking(false); aiCurrentAudioRef.current = null; };
                              sound.play().catch(e => console.warn('Play error:', e));
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          {isAiSpeaking ? 'Stop' : 'Replay Voice'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {aiLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '14px 14px 14px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  Analyzing live store data...
                </div>
              </div>
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          {/* Live Voice Recording Transcript */}
          {aiRecording && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '8px 14px',
                fontSize: '12px',
                color: '#111827',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {aiLiveTranscript || "Listening to your voice..."}
                </span>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAiSend();
            }}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff'
            }}
          >
            <input
              type="text"
              placeholder={aiRecording ? "Listening..." : "Ask: revenue, stock, pricing, campaigns..."}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={aiLoading || aiRecording}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: aiRecording ? '#fef2f2' : '#f9fafb'
              }}
              onFocus={e => e.target.style.borderColor = '#111827'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={aiRecording ? stopAiRecording : startAiRecording}
              disabled={aiLoading}
              title={aiRecording ? "Stop & Send Voice" : "Speak Voice Command"}
              style={{
                backgroundColor: aiRecording ? '#ef4444' : '#f1f5f9',
                color: aiRecording ? '#ffffff' : '#475569',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: aiRecording ? '1px solid #dc2626' : '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim() || aiRecording}
              style={{
                backgroundColor: '#111827',
                color: '#ffffff',
                padding: '0 14px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: aiLoading || !aiInput.trim() || aiRecording ? 'not-allowed' : 'pointer',
                opacity: aiLoading || !aiInput.trim() || aiRecording ? 0.5 : 1,
                flexShrink: 0
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}