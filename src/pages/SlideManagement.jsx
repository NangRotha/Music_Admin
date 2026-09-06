import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  Eye,
  UploadCloud,
  ImageIcon,
  Video,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';

// Helper to convert standard YouTube watch or youtu.be URL to embed URL
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}&enablejsapi=1`;
  }
  return url;
};

export const SlideManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title_kh: '',
    title_en: '',
    subtitle_kh: '',
    subtitle_en: '',
    badge_kh: 'ពិសេស',
    badge_en: 'Featured',
    media_type: 'image', // 'image', 'video', 'youtube'
    media_url: '',
    thumbnail_url: '',
    link_url: '#/products',
    link_text_kh: 'ស្វែងរកឥឡូវនេះ',
    link_text_en: 'Explore Now',
    order_index: 0,
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Delete modal state
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Preview modal state
  const [previewSlide, setPreviewSlide] = useState(null);

  const fetchSlides = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/admin/slides');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSlides(data);
      }
    } catch (err) {
      console.error('Failed to fetch slides:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSlides();

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'SLIDES_UPDATED') {
          fetchSlides(true);
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, [fetchSlides]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'SLIDES_UPDATED' });
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingSlide(null);
    setFormData({
      title_kh: '',
      title_en: '',
      subtitle_kh: '',
      subtitle_en: '',
      badge_kh: 'ពិសេស',
      badge_en: 'Featured',
      media_type: 'image',
      media_url: '',
      thumbnail_url: '',
      link_url: '#/products',
      link_text_kh: 'ស្វែងរកឥឡូវនេះ',
      link_text_en: 'Explore Now',
      order_index: slides.length + 1,
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title_kh: slide.title_kh || '',
      title_en: slide.title_en || '',
      subtitle_kh: slide.subtitle_kh || '',
      subtitle_en: slide.subtitle_en || '',
      badge_kh: slide.badge_kh || 'ពិសេស',
      badge_en: slide.badge_en || 'Featured',
      media_type: slide.media_type || 'image',
      media_url: slide.media_url || '',
      thumbnail_url: slide.thumbnail_url || '',
      link_url: slide.link_url || '#/products',
      link_text_kh: slide.link_text_kh || 'ស្វែងរកឥឡូវនេះ',
      link_text_en: slide.link_text_en || 'Explore Now',
      order_index: slide.order_index ?? 0,
      is_active: slide.is_active ?? true
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 50MB for video, < 10MB for image)
    const isVideo = file.type.startsWith('video');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError(`ទំហំឯកសារធំពេក (Max size is ${isVideo ? '50MB' : '10MB'})`);
      return;
    }

    setUploadingMedia(true);
    setFormError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data
      });

      if (!res.ok) throw new Error('Upload failed');
      const resData = await res.json();
      if (resData.url) {
        setFormData(prev => ({
          ...prev,
          media_url: resData.url,
          media_type: isVideo ? 'video' : 'image'
        }));
        showAlert({
          type: 'success',
          title: 'ជោគជ័យ (Success)',
          message: 'បានបង្ហោះឯកសារដោយជោគជ័យ (Media uploaded successfully)'
        });
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      setFormError('ការបង្ហោះឯកសារមិនបានសម្រេច (Failed to upload media)');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title_en.trim()) {
      setFormError('សូមបញ្ចូលចំណងជើងជាភាសាអង់គ្លេស (Title EN is required)');
      return;
    }
    if (!formData.media_url.trim()) {
      setFormError('សូមបញ្ចូលតំណភ្ជាប់រូបភាព ឬវីដេអូ (Media URL is required)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title_kh: formData.title_kh.trim() || null,
        title_en: formData.title_en.trim(),
        subtitle_kh: formData.subtitle_kh.trim() || null,
        subtitle_en: formData.subtitle_en.trim() || null,
        badge_kh: formData.badge_kh.trim() || null,
        badge_en: formData.badge_en.trim() || null,
        media_type: formData.media_type,
        media_url: formData.media_url.trim(),
        thumbnail_url: formData.thumbnail_url.trim() || null,
        link_url: formData.link_url.trim() || null,
        link_text_kh: formData.link_text_kh.trim() || null,
        link_text_en: formData.link_text_en.trim() || null,
        order_index: parseInt(formData.order_index, 10) || 0,
        is_active: Boolean(formData.is_active)
      };

      const url = editingSlide ? `/api/admin/slides/${editingSlide.id}` : '/api/admin/slides';
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to save slide');
      }

      setModalOpen(false);
      fetchSlides();
      notifySync();

      showAlert({
        type: 'success',
        title: 'ជោគជ័យ (Success)',
        message: editingSlide
          ? 'បានកែប្រែ Slide ដោយជោគជ័យ (Slide updated successfully)'
          : 'បានបង្កើត Slide ថ្មីដោយជោគជ័យ (Slide created successfully)'
      });
    } catch (err) {
      setFormError(err.message || 'ប្រតិបត្តិការបរាជ័យ (Operation failed)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      const res = await authFetch(`/api/admin/slides/${slide.id}/toggle`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Toggle failed');

      setSlides(prev =>
        prev.map(s => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s))
      );
      notifySync();

      showAlert({
        type: 'info',
        title: 'បានផ្លាស់ប្តូរស្ថានភាព (Status Changed)',
        message: `Slide "${slide.title_kh || slide.title_en}" ត្រូវបាន ${!slide.is_active ? 'បើកដំណើរការ' : 'បិទដំណើរការ'}`
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'កំហុស (Error)',
        message: 'មិនអាចប្តូរស្ថានភាពបានទេ'
      });
    }
  };

  const confirmDelete = async () => {
    if (!slideToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/slides/${slideToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');

      const deletedTitle = slideToDelete.title_kh || slideToDelete.title_en;
      setSlides(prev => prev.filter(s => s.id !== slideToDelete.id));
      setSlideToDelete(null);
      notifySync();

      showAlert({
        type: 'success',
        title: 'បានលុបដោយជោគជ័យ',
        message: `បានលុប Slide "${deletedTitle}" ចេញពីប្រព័ន្ធរួចរាល់`
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'កំហុស (Error)',
        message: 'មិនអាចលុប Slide បានទេ'
      });
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = slides.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>គ្រប់គ្រង Slides (Media Slides CMS)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              បន្ថែម កែប្រែ ឬលុប Banner Slides (រូបភាព, វីដេអូ MP4/WebM, និងវីដេអូ YouTube ឬតំណភ្ជាប់ផ្សេងៗ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400">សរុប:</span>
            <span className="font-bold text-slate-800 dark:text-white">{slides.length}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} កំពុងបង្ហាញ</span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែម Slide ថ្មី (Add Slide)</span>
          </button>
        </div>
      </div>

      {/* Slides Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-3">កំពុងទាញយកទិន្នន័យ... (Loading slides...)</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">មិនទាន់មាន Slide នៅឡើយទេ</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ចុចប៊ូតុង "បន្ថែម Slide ថ្មី" ខាងលើដើម្បីបង្កើត Slide បង្ហាញលើទំព័រដើម Storefront
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-16 text-center">ល.រ (Order)</th>
                  <th className="py-3.5 px-4 w-28">ប្រភេទ & មេឌៀ (Media)</th>
                  <th className="py-3.5 px-4">ចំណងជើង & ស្លាក (Title & Badge)</th>
                  <th className="py-3.5 px-4 max-w-xs">តំណភ្ជាប់ប៊ូតុង (Button Action)</th>
                  <th className="py-3.5 px-4 text-center w-28">ស្ថានភាព (Status)</th>
                  <th className="py-3.5 px-4 text-right w-36">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {slides.map((item) => {
                  const isYoutube = item.media_type === 'youtube';
                  const isVideo = item.media_type === 'video';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Order */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                          #{item.order_index}
                        </span>
                      </td>

                      {/* Media Thumbnail & Type Badge */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setPreviewSlide(item)}
                          className="relative w-20 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group shrink-0 bg-slate-950"
                        >
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title_en}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : item.media_type === 'image' ? (
                            <img
                              src={item.media_url}
                              alt={item.title_en}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              {isYoutube ? <Video className="w-5 h-5 text-red-500" /> : <Film className="w-5 h-5 text-purple-500" />}
                            </div>
                          )}

                          {/* Type overlay indicator */}
                          <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9px] font-bold text-white uppercase flex items-center gap-0.5">
                            {isYoutube && <Video className="w-2.5 h-2.5 text-red-400" />}
                            {isVideo && <Film className="w-2.5 h-2.5 text-purple-400" />}
                            {!isYoutube && !isVideo && <ImageIcon className="w-2.5 h-2.5 text-pink-400" />}
                            <span>{item.media_type}</span>
                          </div>

                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </td>

                      {/* Title & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {item.title_kh || item.title_en}
                            </span>
                            {(item.badge_kh || item.badge_en) && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50">
                                {item.badge_kh || item.badge_en}
                              </span>
                            )}
                          </div>
                          {item.title_en && item.title_kh && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {item.title_en}
                            </div>
                          )}
                          {(item.subtitle_kh || item.subtitle_en) && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                              {item.subtitle_kh || item.subtitle_en}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Button Action Link */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.link_url ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 text-[11px]">
                              <span>{item.link_text_kh || item.link_text_en || 'Link'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                              {item.link_url}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
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
                            onClick={() => setPreviewSlide(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors cursor-pointer"
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
                            onClick={() => setSlideToDelete(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
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

      {/* Add / Edit Slide Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {editingSlide ? 'កែប្រែ Banner Slide (Edit Slide)' : 'បន្ថែម Banner Slide ថ្មី (Add Slide)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    កំណត់ប្រភពមេឌៀ (រូបភាព, វីដេអូ, ឬ YouTube) និងព័ត៌មាន Slide
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

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* MEDIA TYPE SELECTION CARDS */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  ប្រភេទមេឌៀ Slide (Media Type) *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, media_type: 'image' })}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.media_type === 'image'
                        ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs">រូបភាព (Image)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, media_type: 'video' })}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.media_type === 'video'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Film className="w-5 h-5" />
                    <span className="text-xs">វីដេអូផ្ទាល់ (Direct Video)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, media_type: 'youtube' })}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.media_type === 'youtube'
                        ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Video className="w-5 h-5 text-red-500" />
                    <span className="text-xs">YouTube / តំណភ្ជាប់</span>
                  </button>
                </div>
              </div>

              {/* MEDIA INPUT & UPLOAD SECTION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {formData.media_type === 'youtube'
                      ? 'តំណភ្ជាប់ YouTube (YouTube Video URL) *'
                      : formData.media_type === 'video'
                      ? 'ឯកសារវីដេអូ ឬតំណភ្ជាប់ (Video URL / MP4 File) *'
                      : 'ឯកសាររូបភាព ឬតំណភ្ជាប់ (Image URL / File) *'}
                  </label>
                  {formData.media_type !== 'youtube' && (
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60 font-semibold cursor-pointer hover:bg-pink-100 transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingMedia ? 'កំពុងបង្ហោះ...' : 'បង្ហោះឯកសារ (Upload File)'}</span>
                      <input
                        type="file"
                        accept={formData.media_type === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                        onChange={handleMediaUpload}
                        disabled={uploadingMedia}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder={
                    formData.media_type === 'youtube'
                      ? 'ឧ. https://www.youtube.com/watch?v=ScMzIvxBSi4 ឬ https://youtu.be/...'
                      : formData.media_type === 'video'
                      ? 'ឧ. /uploads/sample.mp4 ឬ https://.../video.mp4'
                      : 'ឧ. /uploads/banner.jpg ឬ https://images.unsplash.com/...'
                  }
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 font-mono text-[11px]"
                />

                {/* Optional Poster / Thumbnail input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    រូបភាពតំណាង Thumbnail (Optional Poster Image URL)
                  </label>
                  <input
                    type="url"
                    placeholder="ឧ. https://.../thumbnail.jpg (បង្ហាញជា Cover មុនពេលចាក់វីដេអូ)"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* BILINGUAL DETAILS (Khmer & English) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Khmer Column */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">ភាសាខ្មែរ (Khmer)</h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ចំណងជើងធំ (Title KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. តន្ត្រីខ្មែរ Original & សំឡេងស្ទូឌីយោ"
                      value={formData.title_kh}
                      onChange={(e) => setFormData({ ...formData, title_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ចំណងជើងរង (Subtitle KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. គាំទ្រផ្ទាល់ដល់អ្នកផលិតតន្ត្រីខ្មែរឯករាជ្យ"
                      value={formData.subtitle_kh}
                      onChange={(e) => setFormData({ ...formData, subtitle_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្លាកសម្គាល់ (Badge KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. បទចេញថ្មីពិសេស ឬ វីដេអូផ្សាយផ្ទាល់"
                      value={formData.badge_kh}
                      onChange={(e) => setFormData({ ...formData, badge_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះប៊ូតុងចុច (Button Text KH)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ស្វែងរកឥឡូវនេះ"
                      value={formData.link_text_kh}
                      onChange={(e) => setFormData({ ...formData, link_text_kh: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* English Column */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">English</h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title EN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Khmer Original Beats & Studio Masters"
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subtitle EN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Direct support for independent Cambodian musicians"
                      value={formData.subtitle_en}
                      onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Badge EN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Featured Release or Live Video"
                      value={formData.badge_en}
                      onChange={(e) => setFormData({ ...formData, badge_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Button Text EN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Explore Now"
                      value={formData.link_text_en}
                      onChange={(e) => setFormData({ ...formData, link_text_en: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION LINK & ORDER INDEX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    តំណភ្ជាប់ប៊ូតុងចុច (Button Action Link URL)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. #/products ឬ #/about ឬ https://t.me/..."
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ប្រើ #/products ដើម្បីទៅកាន់ទំព័របទចម្រៀង ឬ #/about ទៅកាន់អំពីយើង
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    លំដាប់លំដោយ (Order Index)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      បើកដំណើរការបង្ហាញលើទំព័រដើម (Active)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      បង្ហាញ Slide នេះនៅក្នុង Media Carousel នៅលើ Storefront
                    </span>
                  </div>
                </label>
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
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-pink-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'កំពុងរក្សាទុក...' : editingSlide ? 'កែប្រែ Slide (Save Changes)' : 'បង្កើត Slide (Create Slide)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-500" />
                <span>គំរូ Slide បង្ហាញលើទំព័រដើម (Slide Preview)</span>
              </span>
              <button
                onClick={() => setPreviewSlide(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-800">
                {previewSlide.media_type === 'youtube' ? (
                  <iframe
                    src={getYouTubeEmbedUrl(previewSlide.media_url)}
                    title={previewSlide.title_en}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : previewSlide.media_type === 'video' ? (
                  <video
                    src={previewSlide.media_url}
                    poster={previewSlide.thumbnail_url}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewSlide.media_url}
                    alt={previewSlide.title_en}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay Text Details */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 pointer-events-none">
                  {(previewSlide.badge_kh || previewSlide.badge_en) && (
                    <span className="inline-block self-start text-[10px] font-bold px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 mb-2">
                      {previewSlide.badge_kh || previewSlide.badge_en}
                    </span>
                  )}
                  <h4 className="text-lg font-extrabold text-white">
                    {previewSlide.title_kh || previewSlide.title_en}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 max-w-lg">
                    {previewSlide.subtitle_kh || previewSlide.subtitle_en}
                  </p>
                  {previewSlide.link_url && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs">
                        <span>{previewSlide.link_text_kh || previewSlide.link_text_en || 'Explore'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right">
              <button
                onClick={() => setPreviewSlide(null)}
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
        isOpen={Boolean(slideToDelete)}
        onClose={() => setSlideToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="បញ្ជាក់ការលុប Banner Slide (Confirm Delete)"
        message={`តើអ្នកពិតជាចង់លុប Slide "${slideToDelete?.title_kh || slideToDelete?.title_en}" នេះចេញពីប្រព័ន្ធមែនទេ?`}
      />
    </div>
  );
};
