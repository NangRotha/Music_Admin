import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Plus, Tag, Edit2, Trash2, CheckCircle, XCircle, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PromoManagement = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: 10.0,
    min_spend: 0.0,
    max_discount: '',
    usage_limit: '',
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchPromos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/promos');
      const data = await res.json();
      if (Array.isArray(data)) setPromos(data);
    } catch (err) {
      console.error('Failed to fetch promos:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchPromos();

    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'PROMOS_UPDATED') {
          fetchPromos(true);
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, [fetchPromos]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'PROMOS_UPDATED' });
    } catch (e) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const openAddModal = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: 10.0,
      min_spend: 0.0,
      max_discount: '',
      usage_limit: '',
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_spend: promo.min_spend || 0,
      max_discount: promo.max_discount ?? '',
      usage_limit: promo.usage_limit ?? '',
      is_active: promo.is_active
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editingPromo ? `/api/promos/${editingPromo.id}` : '/api/promos';
      const method = editingPromo ? 'PUT' : 'POST';

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_spend: parseFloat(formData.min_spend) || 0,
        max_discount: formData.max_discount !== '' ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit !== '' ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save promo');
      }

      setModalOpen(false);
      fetchPromos();
      notifySync();
      const actionTitle = editingPromo ? 'កែប្រែ Promo Code ជោគជ័យ' : 'បានបង្កើត Promo Code ជោគជ័យ';
      const actionMsg = editingPromo
        ? `កូដបញ្ចុះតម្លៃ "${payload.code}" ត្រូវបានកែប្រែដោយជោគជ័យ។`
        : `កូដបញ្ចុះតម្លៃ "${payload.code}" ត្រូវបានបង្កើត និងដាក់ឱ្យប្រើប្រាស់ជោគជ័យ។`;
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
        title: 'បរាជ័យក្នុងការរក្សាទុក Promo Code',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!promoToDelete) return;
    setDeleting(true);

    try {
      const res = await authFetch(`/api/promos/${promoToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }
      
      const deletedCode = promoToDelete.code;
      setPromoToDelete(null);
      fetchPromos();
      notifySync();
      const delMsg = `បានលុប Promo Code "${deletedCode}" ដោយជោគជ័យ។`;
      showToast(delMsg);
      showAlert({
        type: 'success',
        title: 'បានលុប Promo Code ជោគជ័យ',
        message: delMsg
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការលុប Promo Code',
        message: err.message
      });
    } finally {
      setDeleting(false);
    }
  };

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
            គ្រប់គ្រងកូដបញ្ចុះតម្លៃ (Promo Codes Management)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            បង្កើតកូដបញ្ចុះតម្លៃជាភាគរយ (%) ឬទឹកប្រាក់ជាក់ស្ដែង ({currencySymbol}) សម្រាប់អ្នកទិញ
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-pink-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>បង្កើតកូដថ្មី (Create Promo)</span>
        </button>
      </div>

      {/* Promos Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">កូដ (Code)</th>
                <th className="p-3.5">ប្រភេទ (Type)</th>
                <th className="p-3.5">តម្លៃបញ្ចុះ (Discount)</th>
                <th className="p-3.5">ទិញអប្បបរមា (Min Spend)</th>
                <th className="p-3.5">បានប្រើប្រាស់ (Used)</th>
                <th className="p-3.5">ស្ថានភាព (Status)</th>
                <th className="p-3.5 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2 font-mono font-bold text-pink-600 dark:text-pink-400 text-sm">
                      <Tag className="w-3.5 h-3.5 text-pink-500" />
                      <span>{p.code}</span>
                    </div>
                  </td>

                  <td className="p-3.5 text-slate-700 dark:text-slate-300 capitalize">
                    {p.discount_type === 'percent' ? 'ភាគរយ (%)' : 'ទឹកប្រាក់ ($)'}
                  </td>

                  <td className="p-3.5 font-bold text-slate-900 dark:text-white font-mono">
                    {p.discount_type === 'percent' ? `${p.discount_value}% OFF` : `-${currencySymbol}${p.discount_value.toFixed(2)}`}
                  </td>

                  <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono">
                    {p.min_spend > 0 ? `${currencySymbol}${p.min_spend.toFixed(2)}` : 'គ្មាន'}
                  </td>

                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">
                    {p.used_count} ដង {p.usage_limit ? `/ ${p.usage_limit}` : ''}
                  </td>

                  <td className="p-3.5">
                    {p.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1 w-max">
                        <CheckCircle className="w-3 h-3" />
                        <span>សកម្ម (Active)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-semibold flex items-center gap-1 w-max">
                        <XCircle className="w-3 h-3" />
                        <span>បិទ (Inactive)</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="កែប្រែ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPromoToDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="លុប"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-app Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(promoToDelete)}
        onClose={() => setPromoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="បញ្ជាក់ការលុប Promo Code"
        message={`តើអ្នកប្រាកដជាចង់លុបកូដបញ្ចុះតម្លៃ "${promoToDelete?.code}" នេះមែនទេ? ការលុបនេះមិនអាចត្រឡប់វិញបានឡើយ។`}
        loading={deleting}
      />

      {/* Add / Edit Promo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingPromo ? 'កែប្រែ Promo Code' : 'បង្កើត Promo Code ថ្មី'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  កូដបញ្ចុះតម្លៃ (Code Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. KHMER2026"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-pink-600 dark:text-pink-400 focus:outline-none focus:border-pink-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ប្រភេទបញ្ចុះតម្លៃ *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="percent">ភាគរយ (%)</option>
                    <option value="fixed">ទឹកប្រាក់ ({currencySymbol})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ចំនួនទឹកប្រាក់បញ្ចុះ *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ទិញអប្បបរមា ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.min_spend}
                    onChange={(e) => setFormData({ ...formData, min_spend: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ចំនួនដងកំណត់ប្រើប្រាស់
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="គ្មានកំណត់"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_promo_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
                <label htmlFor="is_promo_active" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  បើកឱ្យប្រើប្រាស់ (Active)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'រក្សាទុក (Save)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
