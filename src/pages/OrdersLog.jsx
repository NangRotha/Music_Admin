import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ShoppingBag, Search, RefreshCw, Send, Tag, Trash2, CheckCircle2 } from 'lucide-react';

export const OrdersLog = ({ siteSettings }) => {
  const { authFetch } = useAuth();
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Delete modal state
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchOrders();

    // Listen for new orders via broadcast channel
    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'NEW_ORDER') {
          fetchOrders(true);
        }
      };
    } catch (e) {}

    // Poll periodically every 3.5s for real-time live data
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 3500);

    return () => {
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);

    try {
      const res = await authFetch(`/api/orders/${orderToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }
      
      const ref = orderToDelete.reference_code;
      setOrderToDelete(null);
      fetchOrders(true);
      const delMsg = `បានលុបកំណត់ត្រាការកុម្ម៉ង់ #${ref} ដោយជោគជ័យ។`;
      showToast(delMsg);
      showAlert({
        type: 'success',
        title: 'បានលុបកំណត់ត្រាកុម្ម៉ង់ជោគជ័យ',
        message: delMsg
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការលុបកំណត់ត្រា',
        message: err.message
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.reference_code?.toLowerCase().includes(q) ||
      o.music_title?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.promo_code?.toLowerCase().includes(q)
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              កំណត់ត្រាការទិញតាម Telegram (Orders Log)
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Live sync" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            រាល់ពេលអតិថិជនចុច "ទិញតាម Telegram" ប្រព័ន្ធនឹងកត់ត្រាទុកនូវវិក្កយបត្រនៅទីនេះ (Live Update)
          </p>
        </div>

        <button
          onClick={() => fetchOrders(false)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ស្វែងរកតាម Order Ref, បទចម្រៀង, ឬ Promo Code..."
          className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <span className="text-[11px] text-slate-400 mr-2 font-mono">
          {filteredOrders.length} Inquiries
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Ref ID</th>
                <th className="p-3.5">បទចម្រៀង (Song)</th>
                <th className="p-3.5">តម្លៃដើម</th>
                <th className="p-3.5">Promo Code</th>
                <th className="p-3.5">តម្លៃចុងក្រោយ</th>
                <th className="p-3.5">ព័ត៌មានអតិថិជន</th>
                <th className="p-3.5">កាលបរិច្ឆេទ</th>
                <th className="p-3.5 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400 text-xs">
                    {loading ? 'កំពុងទាញទិន្នន័យ...' : 'មិនមានទិន្នន័យការទិញនៅឡើយទេ។'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                      #{order.reference_code}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {order.music_title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.music_artist}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono">
                      {currencySymbol}{order.original_price.toFixed(2)}
                    </td>

                    <td className="p-3.5">
                      {order.promo_code ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-500/15 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 font-mono text-[10px] font-bold">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{order.promo_code} (-{currencySymbol}{order.promo_discount.toFixed(2)})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {currencySymbol}{order.final_price.toFixed(2)}
                    </td>

                    <td className="p-3.5">
                      {order.customer_name || order.customer_telegram ? (
                        <div>
                          {order.customer_name && <div className="font-medium text-slate-900 dark:text-white">{order.customer_name}</div>}
                          {order.customer_telegram && <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400">{order.customer_telegram}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Guest Buyer</span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      {order.telegram_url && (
                        <a
                          href={order.telegram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>បើក Chat</span>
                        </a>
                      )}
                      <button
                        onClick={() => setOrderToDelete(order)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="លុបកំណត់ត្រា"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-app Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="បញ្ជាក់ការលុបកំណត់ត្រាការទិញ"
        message={`តើអ្នកប្រាកដជាចង់លុបកំណត់ត្រា #${orderToDelete?.reference_code} នៃបទ "${orderToDelete?.music_title}" នេះមែនទេ?`}
        loading={deleting}
      />

    </div>
  );
};
