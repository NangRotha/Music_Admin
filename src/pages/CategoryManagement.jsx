import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Search,
  Music,
  ArrowUpDown,
  Tag,
  Hash,
  Sparkles,
  CheckCircle2,
  FolderTree
} from 'lucide-react';

export const CategoryManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_kh: '',
    slug: '',
    description_en: '',
    description_kh: '',
    order_index: 0,
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } else {
        showAlert('error', 'បរាជ័យក្នុងការទាញយកបញ្ជីប្រភេទតន្ត្រី (Failed to fetch categories)');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'កំហុសបណ្ដាញពេលទាញយកទិន្នន័យ (Network error)');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch, showAlert]);

  useEffect(() => {
    fetchCategories();

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'CATEGORIES_UPDATED' || e.data?.type === 'MUSIC_UPDATED') {
          fetchCategories(true);
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, [fetchCategories]);

  const broadcastChange = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'CATEGORIES_UPDATED' });
      channel.close();
    } catch (e) {}
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name_en: '',
      name_kh: '',
      slug: '',
      description_en: '',
      description_kh: '',
      order_index: categories.length + 1,
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name_en: cat.name_en || '',
      name_kh: cat.name_kh || '',
      slug: cat.slug || '',
      description_en: cat.description_en || '',
      description_kh: cat.description_kh || '',
      order_index: cat.order_index ?? 0,
      is_active: Boolean(cat.is_active)
    });
    setFormError('');
    setModalOpen(true);
  };

  // Auto-generate slug from English Name when typing in create mode
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    if (!editingCategory && (!formData.slug || formData.slug === formData.name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))) {
      const autoSlug = val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, name_en: val, slug: autoSlug }));
    } else {
      setFormData(prev => ({ ...prev, name_en: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name_en.trim()) {
      setFormError('សូមបញ្ចូលឈ្មោះជាភាសាអង់គ្លេស (English Name is required)');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const payload = {
        name_en: formData.name_en.trim(),
        name_kh: formData.name_kh.trim() || null,
        slug: formData.slug.trim() || null,
        description_en: formData.description_en.trim() || null,
        description_kh: formData.description_kh.trim() || null,
        order_index: parseInt(formData.order_index, 10) || 0,
        is_active: formData.is_active
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showAlert('success', editingCategory ? 'កែប្រែប្រភេទតន្ត្រីជោគជ័យ! (Category updated)' : 'បានបង្កើតប្រភេទតន្ត្រីថ្មីដោយជោគជ័យ! (Category created)');
        setModalOpen(false);
        fetchCategories(true);
        broadcastChange();
      } else {
        const data = await res.json().catch(() => ({}));
        let detail = data.detail;
        if (Array.isArray(detail)) {
          detail = detail
            .map((d) => (d && typeof d === 'object' && d.msg ? d.msg : String(d)))
            .join('; ');
        } else if (detail && typeof detail === 'object') {
          detail = JSON.stringify(detail);
        }
        setFormError(
          typeof detail === 'string' && detail.trim()
            ? detail
            : 'បរាជ័យក្នុងការរក្សាទុក (Failed to save category)'
        );
      }
    } catch (err) {
      console.error(err);
      setFormError('កំហុសម៉ាស៊ីនបម្រើ (Server connection error)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      const res = await authFetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cat.is_active })
      });
      if (res.ok) {
        showAlert('success', `បានប្ដូរស្ថានភាពទៅជា ${!cat.is_active ? 'សកម្ម (Active)' : 'អសកម្ម (Inactive)'}`);
        fetchCategories(true);
        broadcastChange();
      } else {
        showAlert('error', 'បរាជ័យក្នុងការប្ដូរស្ថានភាព');
      }
    } catch (err) {
      showAlert('error', 'កំហុសបណ្ដាញ');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showAlert('success', 'បានលុបប្រភេទតន្ត្រីដោយជោគជ័យ (Category deleted)');
        setCategoryToDelete(null);
        fetchCategories(true);
        broadcastChange();
      } else {
        showAlert('error', 'មិនអាចលុបប្រភេទនេះបានទេ');
      }
    } catch (err) {
      showAlert('error', 'កំហុសបណ្ដាញពេលលុប');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name_en?.toLowerCase().includes(q) ||
      c.name_kh?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.description_en?.toLowerCase().includes(q) ||
      c.description_kh?.toLowerCase().includes(q)
    );
  });

  const totalTracks = categories.reduce((sum, c) => sum + (c.track_count || 0), 0);
  const activeCount = categories.filter(c => c.is_active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              គ្រប់គ្រងប្រភេទតន្ត្រី (Categories)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              បង្កើត កែប្រែ ឬលុបប្រភេទតន្ត្រី (Music Genres / Categories) សម្រាប់ចាត់ថ្នាក់បទចម្រៀង
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមប្រភេទថ្មី (Add Category)</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">ប្រភេទសរុប (Total Categories)</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{categories.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">កំពុងដំណើរការ (Active)</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{activeCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">បទចម្រៀងសរុប (Associated Tracks)</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{totalTracks}</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះភាសាខ្មែរ ឬអង់គ្លេស (Search categories)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2">
          បង្ហាញ {filteredCategories.length} ក្នុងចំណោម {categories.length}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 text-center w-14">ល.រ (Order)</th>
                <th className="py-3.5 px-4">ឈ្មោះអង់គ្លេស (English Name)</th>
                <th className="py-3.5 px-4">ឈ្មោះខ្មែរ (Khmer Name)</th>
                <th className="py-3.5 px-4">Slug / ផ្លូវកាត់</th>
                <th className="py-3.5 px-4 text-center">បទចម្រៀង (Tracks)</th>
                <th className="py-3.5 px-4 text-center">ស្ថានភាព (Status)</th>
                <th className="py-3.5 px-4 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    កំពុងទាញយកទិន្នន័យប្រភេទតន្ត្រី (Loading categories)...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    មិនមានប្រភេទតន្ត្រីត្រូវបានរកឃើញឡើយ (No categories found)
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr 
                    key={cat.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order Index */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                      #{cat.order_index}
                    </td>

                    {/* English Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>{cat.name_en}</span>
                      </div>
                      {cat.description_en && (
                        <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                          {cat.description_en}
                        </p>
                      )}
                    </td>

                    {/* Khmer Name */}
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {cat.name_kh ? (
                        <div>
                          <span>{cat.name_kh}</span>
                          {cat.description_kh && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {cat.description_kh}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Track Count Badge */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800">
                        <Music className="w-3 h-3 text-pink-500" />
                        <span>{cat.track_count || 0} បទ</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                          cat.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20'
                        }`}
                        title="ចុចដើម្បីប្ដូរស្ថានភាព"
                      >
                        {cat.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>សកម្ម (Active)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>អសកម្ម (Inactive)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors"
                          title="កែប្រែប្រភេទ (Edit)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="លុបប្រភេទ (Delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  {editingCategory ? 'កែប្រែប្រភេទតន្ត្រី (Edit Category)' : 'បន្ថែមប្រភេទតន្ត្រីថ្មី (Add Category)'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះជាភាសាអង់គ្លេស (Name EN) <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_en}
                    onChange={handleNameEnChange}
                    placeholder="e.g. Rock / Metal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះជាភាសាខ្មែរ (Name KH)
                  </label>
                  <input
                    type="text"
                    value={formData.name_kh}
                    onChange={(e) => setFormData({ ...formData, name_kh: e.target.value })}
                    placeholder="ឧ. រ៉ក់ / មេថល"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Slug & Order row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. rock-metal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    លំដាប់លំដោយបង្ហាញ (Display Order)
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ការពិពណ៌នាជាភាសាអង់គ្លេស (Description EN)
                </label>
                <textarea
                  rows="2"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Short description of this genre or music style..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Description KH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ការពិពណ៌នាជាភាសាខ្មែរ (Description KH)
                </label>
                <textarea
                  rows="2"
                  value={formData.description_kh}
                  onChange={(e) => setFormData({ ...formData, description_kh: e.target.value })}
                  placeholder="ការពិពណ៌នាសង្ខេបអំពីទម្រង់តន្ត្រីនេះ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Status active checkbox */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="category_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="category_is_active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  បើកឱ្យដំណើរការ (Active - Show on Storefront & Song Form)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-500/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? 'កំពុងរក្សាទុក...' : editingCategory ? 'រក្សាទុកការកែប្រែ (Save Changes)' : 'បង្កើតប្រភេទ (Create Category)'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="លុបប្រភេទតន្ត្រីនេះ?"
        message={`តើអ្នកពិតជាចង់លុបប្រភេទ "${categoryToDelete?.name_en || ''}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។`}
        confirmLabel="លុបចេញ (Delete)"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCategoryToDelete(null)}
      />

    </div>
  );
};
