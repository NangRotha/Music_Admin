import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  X,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  UploadCloud,
  ImageIcon
} from 'lucide-react';

export const AlertManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnimated, setModalAnimated] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title_en: '',
    title_kh: '',
    message_en: '',
    message_kh: '',
    date: new Date().toISOString().split('T')[0],
    expire_date: '',
    image_url: '',
    badge_en: 'Special Notice',
    badge_kh: 'ដំណឹងពិសេស',
    link_url: '#catalog',
    link_text_en: 'Explore Tracks',
    link_text_kh: 'ស្វែងរកបទចម្រៀង',
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Preview modal state
  const [previewAlert, setPreviewAlert] = useState(null);
  const [previewAnimated, setPreviewAnimated] = useState(false);
  const [previewLang, setPreviewLang] = useState('kh');

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/admin/alerts');
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAlerts();

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'ALERTS_UPDATED') {
          fetchAlerts(true);
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, [fetchAlerts]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'ALERTS_UPDATED' });
    } catch (e) {}
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateAfterDays = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isExpired = (alert) => {
    if (!alert.expire_date || !alert.expire_date.trim()) return false;
    return alert.expire_date.trim() < getTodayString();
  };

  const getExpiryStatus = (alert) => {
    if (!alert.expire_date || !alert.expire_date.trim()) {
      return { type: 'permanent', label: 'គ្មានថ្ងៃផុតកំណត់', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    }
    const todayStr = getTodayString();
    if (alert.expire_date.trim() < todayStr) {
      return { type: 'expired', label: 'ផុតកំណត់ (Expired)', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(alert.expire_date);
      exp.setHours(0, 0, 0, 0);
      const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (days <= 3) {
        return { 
          type: 'soon', 
          label: days === 0 ? 'ផុតកំណត់ថ្ងៃនេះ' : `នៅសល់ ${days} ថ្ងៃ`, 
          color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 animate-pulse' 
        };
      }
      return { type: 'valid', label: `នៅសល់ ${days} ថ្ងៃ`, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    } catch (e) {
      return { type: 'valid', label: 'មានសុពលភាព', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadingImage(true);
    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const resData = await res.json();
      if (resData.url) {
        setFormData(prev => ({ ...prev, image_url: resData.url }));
        showAlert('បាន Upload រូបភាពដោយជោគជ័យ', 'success');
      }
    } catch (err) {
      showAlert('បរាជ័យក្នុងការ Upload រូបភាព: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingAlert(null);
    setFormData({
      title_en: '',
      title_kh: '',
      message_en: '',
      message_kh: '',
      date: getTodayString(),
      expire_date: getDateAfterDays(14),
      image_url: '',
      badge_en: 'Special Notice',
      badge_kh: 'ដំណឹងពិសេស',
      link_url: '#catalog',
      link_text_en: 'Explore Tracks',
      link_text_kh: 'ស្វែងរកបទចម្រៀង',
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setModalAnimated(true);
      });
    });
  };

  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setFormData({
      title_en: alert.title_en || '',
      title_kh: alert.title_kh || '',
      message_en: alert.message_en || '',
      message_kh: alert.message_kh || '',
      date: alert.date || getTodayString(),
      expire_date: alert.expire_date || '',
      image_url: alert.image_url || '',
      badge_en: alert.badge_en || 'Special Notice',
      badge_kh: alert.badge_kh || 'ដំណឹងពិសេស',
      link_url: alert.link_url || '',
      link_text_en: alert.link_text_en || 'Explore Tracks',
      link_text_kh: alert.link_text_kh || 'ស្វែងរកបទចម្រៀង',
      is_active: alert.is_active ?? true
    });
    setFormError('');
    setModalOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setModalAnimated(true);
      });
    });
  };

  const closeModal = () => {
    setModalAnimated(false);
    setTimeout(() => {
      setModalOpen(false);
    }, 250);
  };

  const openPreviewModal = (alert) => {
    setPreviewAlert(alert);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPreviewAnimated(true);
      });
    });
  };

  const closePreviewModal = () => {
    setPreviewAnimated(false);
    setTimeout(() => {
      setPreviewAlert(null);
    }, 250);
  };

  const handleToggleStatus = async (alert) => {
    try {
      const res = await authFetch(`/api/admin/alerts/${alert.id}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a));
        showAlert(
          updated.is_active 
            ? `បានបើកដំណើរការ Popup "${updated.title_en}"` 
            : `បានបិទ Popup "${updated.title_en}"`,
          'success'
        );
        notifySync();
      } else {
        showAlert('មិនអាចប្តូរស្ថានភាព Alert Popup បានទេ', 'error');
      }
    } catch (err) {
      showAlert('មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title_en.trim() && !formData.title_kh.trim()) {
      setFormError('សូមបញ្ចូលចំណងជើងយ៉ាងហោចណាស់មួយភាសា (Please enter title)');
      return;
    }
    if (!formData.message_en.trim() && !formData.message_kh.trim()) {
      setFormError('សូមបញ្ចូលសារយ៉ាងហោចណាស់មួយភាសា (Please enter message)');
      return;
    }
    if (!formData.date.trim()) {
      setFormError('សូមជ្រើសរើសកាលបរិច្ឆេទ (Please select date)');
      return;
    }
    if (formData.expire_date && formData.expire_date.trim() < formData.date.trim()) {
      setFormError('ថ្ងៃផុតកំណត់ (Expire Date) ត្រូវតែនៅក្រោយកាលបរិច្ឆេទចាប់ផ្តើម (Date)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title_en: formData.title_en.trim() || formData.title_kh.trim(),
        title_kh: formData.title_kh.trim() || formData.title_en.trim(),
        message_en: formData.message_en.trim() || formData.message_kh.trim(),
        message_kh: formData.message_kh.trim() || formData.message_en.trim(),
        date: formData.date.trim(),
        expire_date: formData.expire_date ? formData.expire_date.trim() : null,
        image_url: formData.image_url ? formData.image_url.trim() : null,
        badge_en: formData.badge_en.trim() || 'Special Notice',
        badge_kh: formData.badge_kh.trim() || 'ដំណឹងពិសេស',
        link_url: formData.link_url.trim() || null,
        link_text_en: formData.link_text_en.trim() || 'Explore Tracks',
        link_text_kh: formData.link_text_kh.trim() || 'ស្វែងរកបទចម្រៀង',
        is_active: Boolean(formData.is_active)
      };

      let res;
      if (editingAlert) {
        res = await authFetch(`/api/admin/alerts/${editingAlert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await authFetch('/api/admin/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save alert popup');
      }

      const saved = await res.json();
      showAlert(
        editingAlert 
          ? `បានកែប្រែ Alert Popup "${saved.title_en}" ដោយជោគជ័យ` 
          : `បានបង្កើត Alert Popup "${saved.title_en}" ដោយជោគជ័យ`,
        'success'
      );
      closeModal();
      fetchAlerts(true);
      notifySync();
    } catch (err) {
      setFormError(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក Alert Popup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!alertToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/alerts/${alertToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showAlert(`បានលុប Alert Popup "${alertToDelete.title_en}" រួចរាល់`, 'success');
        setAlerts(prev => prev.filter(a => a.id !== alertToDelete.id));
        setAlertToDelete(null);
        notifySync();
      } else {
        showAlert('មិនអាចលុប Alert Popup បានទេ', 'error');
      }
    } catch (err) {
      showAlert('មានបញ្ហាក្នុងការតភ្ជាប់ពេលលុប', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = alerts.filter(a => a.is_active && !isExpired(a)).length;
  const expiredCount = alerts.filter(a => isExpired(a)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with rich aesthetic */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-600/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>គ្រប់គ្រង Alert Popup (Alerts)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold border border-pink-500/20">
                  Image & Expire Date
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                កំណត់ការជូនដំណឹង Popup សម្រាប់ភ្ញៀវចូលមើល Store ជាមួយរូបភាព, កាលបរិច្ឆេទ & ថ្ងៃផុតកំណត់ (Expire Date)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>បង្កើត Alert Popup ថ្មី</span>
        </button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:border-purple-500/40 transition-colors duration-200">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alert Popups សរុប</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{alerts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        {/* Active & Valid */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:border-emerald-500/40 transition-colors duration-200">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">កំពុងបង្ហាញលើ Store</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Expired */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:border-rose-500/40 transition-colors duration-200">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ផុតកំណត់ (Expired)</span>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{expiredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:border-blue-500/40 transition-colors duration-200">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">កាលបរិច្ឆេទថ្ងៃនេះ</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{getTodayString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alerts Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-pink-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              បញ្ជី Alert Popups ទាំងអស់ ({alerts.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeCount > 0 ? `មាន ${activeCount} កំពុងដំណើរការបង្ហាញលើ Store` : 'មិនទាន់មាន Alert ដំណើរការលើ Store ទេ'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">កំពុងទាញទិន្នន័យ Alert Popups...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">មិនទាន់មាន Alert Popup នៅឡើយទេ</p>
            <p className="text-xs text-slate-500 mt-1">ចុចប៊ូតុងខាងលើដើម្បីបង្កើត Popup ជូនដំណឹងដំបូងរបស់អ្នក</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + បង្កើត Alert ថ្មី
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">ស្ថានភាព</th>
                  <th className="py-3 px-4">រូបភាព</th>
                  <th className="py-3 px-4">កាលបរិច្ឆេទ & ផុតកំណត់</th>
                  <th className="py-3 px-4">ចំណងជើង & ស្លាក</th>
                  <th className="py-3 px-4">ខ្លឹមសារសារ (Message)</th>
                  <th className="py-3 px-4">Link & Button</th>
                  <th className="py-3 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {alerts.map((alert) => {
                  const expiry = getExpiryStatus(alert);
                  const expired = isExpired(alert);

                  return (
                    <tr 
                      key={alert.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150 ${
                        expired ? 'opacity-70 bg-slate-50/30 dark:bg-slate-950/30' : ''
                      }`}
                    >
                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            onClick={() => handleToggleStatus(alert)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 ${
                              alert.is_active
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                            title="ចុចដើម្បីបើក/បិទការបង្ហាញ"
                          >
                            {alert.is_active ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                          {expired && (
                            <span className="text-[10px] text-rose-500 font-semibold pl-1">
                              (ផុតសុពលភាព)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {alert.image_url ? (
                          <div className="relative group w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                            <img 
                              src={alert.image_url} 
                              alt="Alert" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Dates: Start Date & Expire Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {/* Start Date */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-pink-500" />
                            <span>ចាប់ផ្តើម៖ <strong>{alert.date || 'N/A'}</strong></span>
                          </div>

                          {/* Expire Date */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>ផុតកំណត់៖ <strong>{alert.expire_date || 'គ្មានកាលកំណត់'}</strong></span>
                          </div>

                          {/* Status pill */}
                          <div className="pt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${expiry.color}`}>
                              {expiry.type === 'expired' && <AlertTriangle className="w-3 h-3" />}
                              {expiry.type === 'valid' && <ShieldCheck className="w-3 h-3" />}
                              <span>{expiry.label}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Title & Badge */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                              {alert.badge_kh || alert.badge_en}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {alert.title_kh || alert.title_en}
                          </span>
                          {alert.title_en && alert.title_kh && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {alert.title_en}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Message Preview */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2 text-xs leading-relaxed">
                          {alert.message_kh || alert.message_en}
                        </p>
                      </td>

                      {/* Link */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {alert.link_url ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {alert.link_text_kh || alert.link_text_en || 'Link'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {alert.link_url}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">គ្មាន Link</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview */}
                          <button
                            onClick={() => openPreviewModal(alert)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-150 cursor-pointer transform hover:scale-110 active:scale-90"
                            title="មើលរូបរាង Popup (Preview)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(alert)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-150 cursor-pointer transform hover:scale-110 active:scale-90"
                            title="កែប្រែ (Edit)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setAlertToDelete(alert)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 cursor-pointer transform hover:scale-110 active:scale-90"
                            title="លុប (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL WITH SMOOTH TRANSITION */}
      {modalOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250 ease-out ${
            modalAnimated ? 'bg-slate-950/80 backdrop-blur-sm opacity-100' : 'bg-slate-950/0 backdrop-blur-none opacity-0'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div 
            className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-8 overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              modalAnimated ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-inner">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingAlert ? 'កែប្រែ Alert Popup' : 'បង្កើត Alert Popup ថ្មី'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    បញ្ចូលព័ត៌មានជូនដំណឹង popup សម្រាប់ភ្ញៀវចូលមើលវេបសាយ ជាមួយរូបភាព និងថ្ងៃផុតកំណត់
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer transform hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* IMAGE UPLOAD ZONE */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <span>រូបភាព Flyer / Banner ជូនដំណឹង (Image)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">ស្រេចចិត្ត (Optional)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Image Preview Box */}
                  {formData.image_url ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                        title="លុបរូបភាព"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white/50 dark:bg-slate-900/50">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                      <span className="text-[9px]">គ្មានរូបភាព</span>
                    </div>
                  )}

                  {/* Input & Upload Button */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="បញ្ចូល Link រូបភាព ឬចុចប៊ូតុង Upload"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />

                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold cursor-pointer shrink-0 transition-all shadow-sm">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingImage ? '...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      គាំទ្រប្រភេទ JPG, PNG, WEBP, SVG (ទំហំសមស្រប 800x450px)
                    </p>
                  </div>
                </div>
              </div>

              {/* DATE & EXPIRE DATE FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    <span>កាលបរិច្ឆេទចាប់ផ្តើម (Date)</span> <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, date: getTodayString() })}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-pink-600 dark:text-pink-400 transition-colors cursor-pointer shrink-0"
                      title="ជ្រើសរើសថ្ងៃនេះ"
                    >
                      ថ្ងៃនេះ
                    </button>
                  </div>
                </div>

                {/* Expire Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>កាលបរិច្ឆេទផុតកំណត់ (Expire Date)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">ស្រេចចិត្ត</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expire_date || ''}
                    onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {/* Quick Expire Helpers */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expire_date: getDateAfterDays(3) })}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-pink-500 cursor-pointer"
                    >
                      +3 ថ្ងៃ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expire_date: getDateAfterDays(7) })}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-pink-500 cursor-pointer"
                    >
                      +7 ថ្ងៃ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expire_date: getDateAfterDays(30) })}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-pink-500 cursor-pointer"
                    >
                      +30 ថ្ងៃ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expire_date: '' })}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      គ្មានផុតកំណត់
                    </button>
                  </div>
                </div>
              </div>

              {/* BADGES (Khmer & English) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>ស្លាក Badge (Khmer & English)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ស្លាកជាភាសាខ្មែរ (ឧ. ដំណឹងពិសេស)"
                    value={formData.badge_kh}
                    onChange={(e) => setFormData({ ...formData, badge_kh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Badge in English (e.g. Special Notice)"
                    value={formData.badge_en}
                    onChange={(e) => setFormData({ ...formData, badge_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* TITLES (Khmer & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ចំណងជើងជាភាសាខ្មែរ (Title KH)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. ប្រូម៉ូសិនពិសេសប្រចាំខែ"
                    value={formData.title_kh}
                    onChange={(e) => setFormData({ ...formData, title_kh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ចំណងជើងជា English (Title EN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Promotion This Month"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* MESSAGES (Khmer & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    សារជាភាសាខ្មែរ (Message KH)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="សរសេរសារជូនដំណឹងរបស់អ្នកនៅទីនេះ..."
                    value={formData.message_kh}
                    onChange={(e) => setFormData({ ...formData, message_kh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    សារជា English (Message EN)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write your announcement message here..."
                    value={formData.message_en}
                    onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>
              </div>

              {/* LINK & BUTTON TEXT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    តំណភ្ជាប់ Link URL (ស្រេចចិត្ត)
                  </label>
                  <input
                    type="text"
                    placeholder="#catalog ឬ link telegram"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    អក្សរប៊ូតុង KH
                  </label>
                  <input
                    type="text"
                    placeholder="ស្វែងរកបទចម្រៀង"
                    value={formData.link_text_kh}
                    onChange={(e) => setFormData({ ...formData, link_text_kh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    អក្សរប៊ូតុង EN
                  </label>
                  <input
                    type="text"
                    placeholder="Explore Tracks"
                    value={formData.link_text_en}
                    onChange={(e) => setFormData({ ...formData, link_text_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* ACTIVE STATUS CHECKBOX */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    បើកដំណើរការបង្ហាញលើ Store ភ្លាមៗ (Active Popup)
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingAlert ? 'រក្សាទុកការកែប្រែ' : 'បង្កើត Alert Popup'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL WITH MATCHING SMOOTH ANIMATION & IMAGE */}
      {previewAlert && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250 ease-out ${
            previewAnimated ? 'bg-slate-950/80 backdrop-blur-sm opacity-100' : 'bg-slate-950/0 backdrop-blur-none opacity-0'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePreviewModal();
          }}
        >
          <div 
            className={`relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              previewAnimated ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
            }`}
          >
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60 pointer-events-none" />

            {/* Preview Banner Bar */}
            <div className="relative bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs z-10">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-pink-500" />
                <span>ការមើលសាកល្បង (Preview Mode)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewLang(previewLang === 'kh' ? 'en' : 'kh')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-pink-600 dark:text-pink-400 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {previewLang === 'kh' ? 'ភាសាខ្មែរ' : 'English'}
                </button>
                <button
                  onClick={closePreviewModal}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popup Preview Content */}
            <div className="relative p-6 text-center space-y-4 z-10 max-h-[80vh] overflow-y-auto">
              
              {/* Optional Flyer / Image */}
              {previewAlert.image_url && (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <img 
                    src={previewAlert.image_url} 
                    alt="Notice Banner" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}

              {/* Badge */}
              <div className="flex flex-col items-center gap-2">
                {!previewAlert.image_url && (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/15 to-purple-600/15 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-inner">
                    <Bell className="w-6 h-6 animate-bounce" style={{ animationDuration: '2.5s' }} />
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {previewLang === 'kh' ? (previewAlert.badge_kh || previewAlert.badge_en) : (previewAlert.badge_en || previewAlert.badge_kh)}
                  </span>
                </div>
              </div>

              {/* DATE & EXPIRE DATE PILLS */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-pink-500" />
                  <span>
                    {previewLang === 'kh' ? 'កាលបរិច្ឆេទ៖ ' : 'Date: '}
                    <strong>{previewAlert.date}</strong>
                  </span>
                </div>

                {previewAlert.expire_date && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {previewLang === 'kh' ? 'ផុតកំណត់៖ ' : 'Expires: '}
                      <strong>{previewAlert.expire_date}</strong>
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {previewLang === 'kh' ? (previewAlert.title_kh || previewAlert.title_en) : (previewAlert.title_en || previewAlert.title_kh)}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                {previewLang === 'kh' ? (previewAlert.message_kh || previewAlert.message_en) : (previewAlert.message_en || previewAlert.message_kh)}
              </p>

              {previewAlert.link_url && (
                <div className="pt-2">
                  <a
                    href={previewAlert.link_url}
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-pink-500/20"
                  >
                    <span>
                      {previewLang === 'kh' ? (previewAlert.link_text_kh || 'ស្វែងរកបទចម្រៀង') : (previewAlert.link_text_en || 'Explore Tracks')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={closePreviewModal}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {previewLang === 'kh' ? 'បិទផ្ទាំងសាកល្បង' : 'Close Preview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(alertToDelete)}
        onClose={() => setAlertToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="លុប Alert Popup?"
        message={`តើអ្នកពិតជាចង់លុប Alert Popup "${alertToDelete?.title_en || alertToDelete?.title_kh}" នេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានឡើយ។`}
        loading={deleting}
      />
    </div>
  );
};
