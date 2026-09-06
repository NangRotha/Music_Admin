import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  UploadCloud,
  ImageIcon,
  Eye,
  ArrowUpDown,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const AboutManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    title_kh: '',
    title_en: '',
    subtitle_kh: '',
    subtitle_en: '',
    badge_kh: '',
    badge_en: '',
    content_kh: '',
    content_en: '',
    image_url: '',
    order_index: 0,
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete modal state
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Preview Modal
  const [previewSection, setPreviewSection] = useState(null);

  const fetchSections = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/admin/about');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSections(data);
      }
    } catch (err) {
      console.error('Failed to fetch about sections:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSections();

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'ABOUT_UPDATED') {
          fetchSections(true);
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, [fetchSections]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'ABOUT_UPDATED' });
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingSection(null);
    setFormData({
      title_kh: '',
      title_en: '',
      subtitle_kh: '',
      subtitle_en: '',
      badge_kh: '',
      badge_en: '',
      content_kh: '',
      content_en: '',
      image_url: '',
      order_index: sections.length + 1,
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingSection(item);
    setFormData({
      title_kh: item.title_kh || '',
      title_en: item.title_en || '',
      subtitle_kh: item.subtitle_kh || '',
      subtitle_en: item.subtitle_en || '',
      badge_kh: item.badge_kh || '',
      badge_en: item.badge_en || '',
      content_kh: item.content_kh || '',
      content_en: item.content_en || '',
      image_url: item.image_url || '',
      order_index: item.order_index ?? 0,
      is_active: item.is_active ?? true
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('រូបភាពត្រូវមានទំហំតូចជាង 10MB (Image must be < 10MB)');
      return;
    }

    setUploadingImage(true);
    setFormError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const resData = await res.json();
      if (resData.url) {
        setFormData(prev => ({ ...prev, image_url: resData.url }));
        showAlert({
          type: 'success',
          title: 'ជោគជ័យ (Success)',
          message: 'បានបង្ហោះរូបភាពដោយជោគជ័យ (Image uploaded successfully)'
        });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setFormError('ការបង្ហោះរូបភាពមិនបានសម្រេច (Failed to upload image)');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title_kh.trim() || !formData.title_en.trim()) {
      setFormError('សូមបញ្ចូលចំណងជើងជាភាសាខ្មែរ និងអង់គ្លេស (Titles in Khmer & English are required)');
      return;
    }
    if (!formData.content_kh.trim() || !formData.content_en.trim()) {
      setFormError('សូមបញ្ចូលខ្លឹមសារជាភាសាខ្មែរ និងអង់គ្លេស (Contents in Khmer & English are required)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title_kh: formData.title_kh.trim(),
        title_en: formData.title_en.trim(),
        subtitle_kh: formData.subtitle_kh.trim() || null,
        subtitle_en: formData.subtitle_en.trim() || null,
        badge_kh: formData.badge_kh.trim() || null,
        badge_en: formData.badge_en.trim() || null,
        content_kh: formData.content_kh.trim(),
        content_en: formData.content_en.trim(),
        image_url: formData.image_url.trim() || null,
        order_index: parseInt(formData.order_index, 10) || 0,
        is_active: Boolean(formData.is_active)
      };

      const url = editingSection ? `/api/admin/about/${editingSection.id}` : '/api/admin/about';
      const method = editingSection ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to save about section');
      }

      setModalOpen(false);
      fetchSections();
      notifySync();

      showAlert({
        type: 'success',
        title: 'ជោគជ័យ (Success)',
        message: editingSection
          ? 'បានកែប្រែព័ត៌មានដោយជោគជ័យ (About section updated successfully)'
          : 'បានបង្កើតព័ត៌មានថ្មីដោយជោគជ័យ (About section created successfully)'
      });
    } catch (err) {
      setFormError(err.message || 'ប្រតិបត្តិការបរាជ័យ (Operation failed)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (section) => {
    try {
      const res = await authFetch(`/api/admin/about/${section.id}/toggle`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Toggle failed');

      // Update local state immediately
      setSections(prev =>
        prev.map(s => (s.id === section.id ? { ...s, is_active: !s.is_active } : s))
      );
      notifySync();

      showAlert({
        type: 'info',
        title: 'បានផ្លាស់ប្តូរស្ថានភាព (Status Changed)',
        message: `ផ្នែក "${section.title_kh || section.title_en}" ត្រូវបាន ${!section.is_active ? 'បើកដំណើរការ (Activated)' : 'បិទដំណើរការ (Deactivated)'}`
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'កំហុស (Error)',
        message: 'មិនអាចប្តូរស្ថានភាពបានទេ (Failed to toggle status)'
      });
    }
  };

  const confirmDelete = async () => {
    if (!sectionToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/about/${sectionToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');

      const deletedTitle = sectionToDelete.title_kh || sectionToDelete.title_en;
      setSections(prev => prev.filter(s => s.id !== sectionToDelete.id));
      setSectionToDelete(null);
      notifySync();

      showAlert({
        type: 'success',
        title: 'បានលុបដោយជោគជ័យ (Deleted Successfully)',
        message: `បានលុបផ្នែក "${deletedTitle}" ចេញពីប្រព័ន្ធរួចរាល់`
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'កំហុស (Error)',
        message: 'មិនអាចលុបបានទេ (Failed to delete about section)'
      });
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = sections.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>គ្រប់គ្រងអំពីយើង (About Us CMS)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              បន្ថែម កែប្រែ ឬលុបព័ត៌មានស្ទូឌីយោ និងបេសកកម្មតន្ត្រីរបស់អ្នកសម្រាប់បង្ហាញលើ Storefront
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400">សរុប:</span>
            <span className="font-bold text-slate-800 dark:text-white">{sections.length}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} កំពុងបង្ហាញ</span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមផ្នែកថ្មី (Add Section)</span>
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-3">កំពុងទាញយកទិន្នន័យ... (Loading sections...)</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">មិនទាន់មានព័ត៌មានអំពីយើងនៅឡើយទេ</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ចុចប៊ូតុង "បន្ថែមផ្នែកថ្មី" ខាងលើដើម្បីបង្កើតកាតព័ត៌មានដំបូងរបស់អ្នក
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-16 text-center">ល.រ (Order)</th>
                  <th className="py-3.5 px-4 w-24">រូបភាព (Image)</th>
                  <th className="py-3.5 px-4">ចំណងជើង & ស្លាក (Title & Badge)</th>
                  <th className="py-3.5 px-4 max-w-xs">ខ្លឹមសារ (Content)</th>
                  <th className="py-3.5 px-4 text-center w-28">ស្ថានភាព (Status)</th>
                  <th className="py-3.5 px-4 text-right w-36">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sections.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Order Index */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                        #{item.order_index}
                      </span>
                    </td>

                    {/* Image Thumbnail */}
                    <td className="py-3.5 px-4">
                      {item.image_url ? (
                        <div
                          onClick={() => setPreviewSection(item)}
                          className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group shrink-0"
                        >
                          <img
                            src={item.image_url}
                            alt={item.title_en}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Title & Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {item.title_kh}
                          </span>
                          {(item.badge_kh || item.badge_en) && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                              {item.badge_kh || item.badge_en}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.title_en}
                        </div>
                        {(item.subtitle_kh || item.subtitle_en) && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                            {item.subtitle_kh || item.subtitle_en}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Content Preview */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.content_kh || item.content_en}
                      </p>
                      {item.content_en && item.content_kh && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {item.content_en}
                        </p>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          item.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                        title="ចុចដើម្បីប្តូរស្ថានភាព (Click to toggle)"
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>បង្ហាញ (Active)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>លាក់ (Inactive)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setPreviewSection(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                          title="មើលគំរូ (Preview)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                          title="កែប្រែ (Edit)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSectionToDelete(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                          title="លុប (Delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {editingSection ? 'កែប្រែព័ត៌មានអំពីយើង (Edit About Section)' : 'បន្ថែមព័ត៌មានអំពីយើងថ្មី (Add About Section)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    បញ្ចូលព័ត៌មានជាភាសាខ្មែរ និងអង់គ្លេស រួមជាមួយរូបភាព
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Two Column Grid for Khmer & English */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Khmer Column */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      ព័ត៌មានជាភាសាខ្មែរ (Khmer)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ចំណងជើងធំ (Title KH) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. ទឹកចិត្តស្រឡាញ់តន្ត្រីខ្មែររបស់យើង"
                      value={formData.title_kh}
                      onChange={(e) => setFormData({ ...formData, title_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ចំណងជើងរង (Subtitle KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. លើកកម្ពស់អ្នកបង្កើត និងថែរក្សាកេរដំណែល"
                      value={formData.subtitle_kh}
                      onChange={(e) => setFormData({ ...formData, subtitle_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្លាកសម្គាល់ (Badge KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. រឿងរ៉ាវរបស់យើង ឬ បេសកកម្ម"
                      value={formData.badge_kh}
                      onChange={(e) => setFormData({ ...formData, badge_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ខ្លឹមសារលម្អិត (Content KH) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="ពិពណ៌នាអំពីស្ទូឌីយោ គោលបំណង ឬសេវាកម្មរបស់អ្នក..."
                      value={formData.content_kh}
                      onChange={(e) => setFormData({ ...formData, content_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>

                {/* English Column */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      English Information
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title EN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Our Passion for Khmer Music"
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subtitle EN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Empowering Creators & Preserving Heritage"
                      value={formData.subtitle_en}
                      onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Badge EN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Our Story or Our Mission"
                      value={formData.badge_en}
                      onChange={(e) => setFormData({ ...formData, badge_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Content EN *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your studio, music mission, or guarantees..."
                      value={formData.content_en}
                      onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload & URL Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  រូបភាពផ្នែក (Section Image)
                </label>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Upload input button */}
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingImage ? 'កំពុងបង្ហោះ...' : 'បង្ហោះរូបភាព (Upload File)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {/* Or Direct URL Input */}
                  <div className="flex-1 w-full">
                    <input
                      type="url"
                      placeholder="ឬបញ្ចូលតំណភ្ជាប់រូបភាព (Or image URL: https://...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div className="relative mt-2 w-full max-w-sm h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="លុបរូបភាពចេញ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Order Index & Active Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    លំដាប់លំដោយ (Order Index)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    លេខកាន់តែតូច នឹងបង្ហាញមុនគេ (Lower numbers appear first)
                  </span>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        បើកដំណើរការបង្ហាញ (Active)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        បង្ហាញកាតព័ត៌មាននេះនៅលើទំព័រមុខ Storefront
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'កំពុងរក្សាទុក...' : editingSection ? 'កែប្រែព័ត៌មាន (Save Changes)' : 'បង្កើតព័ត៌មាន (Create Section)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span>គំរូកាតបង្ហាញលើ Storefront (Card Preview)</span>
              </span>
              <button
                onClick={() => setPreviewSection(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-5">
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 dark:from-slate-800/60 dark:to-purple-950/20 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden shadow-md">
                {previewSection.image_url && (
                  <div className="w-full h-48 overflow-hidden bg-slate-950">
                    <img
                      src={previewSection.image_url}
                      alt={previewSection.title_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  {(previewSection.badge_kh || previewSection.badge_en) && (
                    <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                      {previewSection.badge_kh || previewSection.badge_en}
                    </span>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {previewSection.title_kh}
                    </h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {previewSection.title_en}
                    </p>
                  </div>
                  {(previewSection.subtitle_kh || previewSection.subtitle_en) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {previewSection.subtitle_kh || previewSection.subtitle_en}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {previewSection.content_kh}
                  </p>
                  {previewSection.content_en && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700/50">
                      {previewSection.content_en}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right">
              <button
                onClick={() => setPreviewSection(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="បញ្ជាក់ការលុបព័ត៌មានអំពីយើង (Confirm Delete)"
        message={`តើអ្នកពិតជាចង់លុបផ្នែក "${sectionToDelete?.title_kh || sectionToDelete?.title_en}" នេះចេញពីប្រព័ន្ធមែនទេ?`}
      />
    </div>
  );
};
