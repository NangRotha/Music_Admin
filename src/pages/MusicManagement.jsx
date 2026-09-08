import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { 
  Plus, Search, Edit2, Trash2, Play, Pause, 
  UploadCloud, Sparkles, X, Music as MusicIcon, AlertCircle, CheckCircle2 
} from 'lucide-react';

export const MusicManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Audio playback inside admin
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Delete modal state
  const [trackToDelete, setTrackToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title_en: '',
    title_kh: '',
    artist_en: '',
    artist_kh: '',
    genre: 'Pop',
    price: 5.0,
    discount_percent: 0.0,
    cover_image_url: '',
    preview_audio_url: '',
    duration: '3:30',
    is_featured: false,
    description_en: '',
    description_kh: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [customGenreMode, setCustomGenreMode] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchMusic = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      if (Array.isArray(data)) setMusicList(data);
    } catch (err) {
      console.error('Failed to fetch music:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMusic();
    fetchCategories();
    const audio = audioRef.current;
    audio.onended = () => setPlayingId(null);

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'MUSIC_UPDATED') {
          fetchMusic(true);
        }
        if (e.data?.type === 'CATEGORIES_UPDATED') {
          fetchCategories();
        }
      };
    } catch (e) {}

    // Real-time: silently refresh the catalog while this tab is visible so edits
    // made from other browsers/tabs (or the storefront) appear automatically.
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchMusic(true);
        fetchCategories();
      }
    }, 12000);

    return () => {
      audio.pause();
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [fetchMusic, fetchCategories]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'MUSIC_UPDATED' });
    } catch (e) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handlePlayPreview = (track) => {
    const audio = audioRef.current;
    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = track.preview_audio_url;
      audio.load();
      audio.play().catch(e => console.log('Admin play error:', e));
      setPlayingId(track.id);
    }
  };

  const openAddModal = () => {
    setEditingTrack(null);
    setFormData({
      title_en: '',
      title_kh: '',
      artist_en: '',
      artist_kh: '',
      genre: categories.length > 0 ? categories[0].name_en : 'Pop',
      price: 5.0,
      discount_percent: 0.0,
      cover_image_url: '',
      preview_audio_url: '',
      duration: '3:30',
      is_featured: false,
      description_en: '',
      description_kh: ''
    });
    setCustomGenreMode(false);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (track) => {
    setEditingTrack(track);
    setFormData({
      title_en: track.title_en || '',
      title_kh: track.title_kh || '',
      artist_en: track.artist_en || '',
      artist_kh: track.artist_kh || '',
      genre: track.genre || 'Pop',
      price: track.price || 0,
      discount_percent: track.discount_percent || 0,
      cover_image_url: track.cover_image_url || '',
      preview_audio_url: track.preview_audio_url || '',
      duration: track.duration || '3:30',
      is_featured: Boolean(track.is_featured),
      description_en: track.description_en || '',
      description_kh: track.description_kh || ''
    });
    const exists = categories.some(
      c => c.name_en.toLowerCase() === (track.genre || '').toLowerCase() || c.name_kh === track.genre
    );
    setCustomGenreMode(!exists && !!track.genre && track.genre !== 'Pop');
    setFormError('');
    setModalOpen(true);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    if (type === 'cover') setUploadingCover(true);
    if (type === 'audio') setUploadingAudio(true);

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const resData = await res.json();
      if (resData.url) {
        if (type === 'cover') {
          setFormData(prev => ({ ...prev, cover_image_url: resData.url }));
        } else if (type === 'audio') {
          setFormData(prev => ({ ...prev, preview_audio_url: resData.url }));
        }
      }
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការ Upload ឯកសារ',
        message: err.message
      });
    } finally {
      if (type === 'cover') setUploadingCover(false);
      if (type === 'audio') setUploadingAudio(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editingTrack ? `/api/music/${editingTrack.id}` : '/api/music';
      const method = editingTrack ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_percent: parseFloat(formData.discount_percent) || 0,
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save track');
      }

      setModalOpen(false);
      fetchMusic();
      notifySync();
      const actionTitle = editingTrack ? 'កែប្រែបទចម្រៀងជោគជ័យ' : 'បានបន្ថែមបទចម្រៀងថ្មីជោគជ័យ';
      const actionMsg = editingTrack 
        ? `បទចម្រៀង "${formData.title_en}" ត្រូវបានកែប្រែដោយជោគជ័យ។` 
        : `បទចម្រៀង "${formData.title_en}" ត្រូវបានបន្ថែមចូលប្រព័ន្ធដោយជោគជ័យ។`;
      showToast(actionTitle);
      showAlert({
        type: 'success',
        title: actionTitle,
        message: actionMsg
      });
    } catch (err) {
      setFormError(err.message);
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការរក្សាទុកបទចម្រៀង',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!trackToDelete) return;
    setDeleting(true);

    try {
      const res = await authFetch(`/api/music/${trackToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }
      
      const deletedTitle = trackToDelete.title_en;
      setTrackToDelete(null);
      fetchMusic();
      notifySync();
      const delMsg = `បានលុបបទចម្រៀង "${deletedTitle}" ដោយជោគជ័យចេញពីប្រព័ន្ធ។`;
      showToast(delMsg);
      showAlert({
        type: 'success',
        title: 'បានលុបបទចម្រៀងជោគជ័យ',
        message: delMsg
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការលុបបទចម្រៀង',
        message: err.message
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredMusic = musicList.filter(m => {
    const q = search.toLowerCase();
    return (
      m.title_en?.toLowerCase().includes(q) ||
      m.title_kh?.toLowerCase().includes(q) ||
      m.artist_en?.toLowerCase().includes(q) ||
      m.artist_kh?.toLowerCase().includes(q) ||
      m.genre?.toLowerCase().includes(q)
    );
  });

  const currencySymbol = siteSettings?.currency_symbol || '$';

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            គ្រប់គ្រងបទចម្រៀង (Music Management)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            បន្ថែម កែប្រែ និងលុបបទចម្រៀង កំណត់តម្លៃ និងការបញ្ចុះតម្លៃ
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមបទថ្មី (Add Track)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ស្វែងរកតាមចំណងជើង ឬឈ្មោះតារាចម្រៀង..."
          className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <span className="text-[11px] text-slate-400 mr-2 font-mono">
          {filteredMusic.length} បទចម្រៀង
        </span>
      </div>

      {/* Music Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Preview</th>
                <th className="p-3.5">បទចម្រៀង (Title & Artist)</th>
                <th className="p-3.5">ប្រភេទ (Genre)</th>
                <th className="p-3.5">តម្លៃដើម</th>
                <th className="p-3.5">បញ្ចុះតម្លៃ (%)</th>
                <th className="p-3.5">តម្លៃលក់</th>
                <th className="p-3.5">Featured</th>
                <th className="p-3.5 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMusic.map((track) => {
                const isPlaying = playingId === track.id;
                const salePrice = track.sale_price ?? track.price;
                return (
                  <tr key={track.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Cover and Audio Preview Button */}
                    <td className="p-3.5">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-950 group">
                        <img
                          src={track.cover_image_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80"}
                          alt={track.title_en}
                          className="w-full h-full object-cover"
                        />
                        {track.preview_audio_url && (
                          <button
                            onClick={() => handlePlayPreview(track)}
                            className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-white opacity-80 hover:opacity-100 hover:bg-purple-600/80 transition-all cursor-pointer"
                            title={isPlaying ? 'Pause' : 'Play Preview'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Title and Artist */}
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-white text-xs truncate">
                        {track.title_en}
                      </div>
                      {track.title_kh && (
                        <div className="text-[11px] text-pink-400 truncate">
                          {track.title_kh}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {track.artist_en} {track.artist_kh ? `(${track.artist_kh})` : ''}
                      </div>
                    </td>

                    {/* Genre */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium">
                        {track.genre}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="p-3.5 font-mono text-slate-300">
                      {currencySymbol}{track.price.toFixed(2)}
                    </td>

                    {/* Discount % */}
                    <td className="p-3.5">
                      {track.discount_percent > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-bold text-[10px]">
                          -{track.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>

                    {/* Sale Price */}
                    <td className="p-3.5 font-mono font-bold text-pink-400">
                      {currencySymbol}{salePrice.toFixed(2)}
                    </td>

                    {/* Featured */}
                    <td className="p-3.5">
                      {track.is_featured ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold flex items-center gap-1 w-max">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">No</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(track)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="កែប្រែ (Edit)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTrackToDelete(track)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="លុប (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-app Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(trackToDelete)}
        onClose={() => setTrackToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="បញ្ជាក់ការលុបបទចម្រៀង"
        message={`តើអ្នកប្រាកដជាចង់លុបបទ "${trackToDelete?.title_en}" (${trackToDelete?.artist_en}) នេះចេញពីប្រព័ន្ធមែនទេ? ការលុបនេះមិនអាចត្រឡប់វិញបានឡើយ។`}
        loading={deleting}
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingTrack ? 'កែប្រែព័ត៌មានបទចម្រៀង (Edit Track)' : 'បន្ថែមបទចម្រៀងថ្មី (Add New Music)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Titles in EN & KH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ចំណងជើងជាភាសាអង់គ្លេស (Title EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="e.g. Moonlight over Angkor"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ចំណងជើងជាភាសាខ្មែរ (Title KH)
                  </label>
                  <input
                    type="text"
                    value={formData.title_kh}
                    onChange={(e) => setFormData({ ...formData, title_kh: e.target.value })}
                    placeholder="ឧទាហរណ៍៖ ពន្លឺចន្ទលើអង្គរ"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Artists in EN & KH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ឈ្មោះសិល្បករ (Artist EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.artist_en}
                    onChange={(e) => setFormData({ ...formData, artist_en: e.target.value })}
                    placeholder="e.g. VannDa"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ឈ្មោះសិល្បករជាខ្មែរ (Artist KH)
                  </label>
                  <input
                    type="text"
                    value={formData.artist_kh}
                    onChange={(e) => setFormData({ ...formData, artist_kh: e.target.value })}
                    placeholder="ឧទាហរណ៍៖ វណ្ណដា"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Genre, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      ប្រភេទភ្លេង (Category / Genre)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomGenreMode(!customGenreMode)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                    >
                      {customGenreMode ? 'ជ្រើសរើសពីបញ្ជី (Select from List)' : 'បញ្ចូលផ្ទាល់ខ្លួន (Custom)'}
                    </button>
                  </div>
                  {customGenreMode ? (
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      placeholder="ឧ. Trap Soul, Jazz Khmer..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <select
                      value={formData.genre}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomGenreMode(true);
                        } else {
                          setFormData({ ...formData, genre: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name_en}>
                          {cat.name_en} {cat.name_kh ? `(${cat.name_kh})` : ''}
                        </option>
                      ))}
                      {formData.genre && !categories.some(c => c.name_en === formData.genre) && (
                        <option value={formData.genre}>{formData.genre} (Custom)</option>
                      )}
                      <option value="__custom__">+ បញ្ចូលផ្ទាល់ខ្លួន (Enter Custom)...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    រយៈពេល (Duration)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="3:45"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    តម្លៃដើម (Original Price in {currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    បញ្ចុះតម្លៃ (Discount %)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    placeholder="e.g. 20 for 20% off"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Cover Image Upload / URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  រូបភាពក្រប (Cover Artwork)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="Upload image or paste image URL"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingCover ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'cover')}
                    />
                  </label>
                </div>
                {formData.cover_image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={formData.cover_image_url}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                    />
                    <span className="text-[11px] text-slate-400">Preview Artwork</span>
                  </div>
                )}
              </div>

              {/* Track Audio File (also the paid download file) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ឯកសារសំឡេងបទ (Audio File) — MP3, WAV, M4A, FLAC, OGG...
                </label>
                <p className="text-[10px] text-slate-500 mb-1.5">
                  អតិថិជនស្ដាប់សាកល្បង និងទាញយកឯកសារនេះបន្ទាប់ពីទូទាត់ជោគជ័យ • Buyers listen &amp; download this exact file after paying
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.preview_audio_url}
                    onChange={(e) => setFormData({ ...formData, preview_audio_url: e.target.value })}
                    placeholder="Upload any audio file or paste audio URL"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingAudio ? '...' : 'Upload Audio'}</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.opus,.aac,.webm"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                    />
                  </label>
                </div>
                {formData.preview_audio_url && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivered to buyers after ABA payment
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(function () {
                        const p = (formData.preview_audio_url || '').split(/[?#]/)[0];
                        const m = p.match(/\.([a-z0-9]{2,5})$/i);
                        return m ? m[1].toUpperCase() + ' file' : 'file (type detected at download)';
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950"
                />
                <label htmlFor="is_featured" className="text-xs text-slate-300 cursor-pointer">
                  ដាក់ជាបទចម្រៀងពិសេស (Featured on Homepage)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingTrack ? 'កែប្រែ (Save Changes)' : 'រក្សាទុក (Save Track)')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
