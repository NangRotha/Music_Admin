import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Tag, ShoppingBag, Plus, Sparkles, ArrowRight, RefreshCw, Send } from 'lucide-react';

export const DashboardOverview = ({ setCurrentTab, siteSettings }) => {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState({ total_music: 0, total_promos: 0, total_orders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      authFetch('/api/stats').then(res => res.json()),
      authFetch('/api/orders').then(res => res.json()),
    ])
      .then(([statsData, ordersData]) => {
        if (statsData) setStats(statsData);
        if (Array.isArray(ordersData)) setRecentOrders(ordersData.slice(0, 5));
      })
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [authFetch]);

  useEffect(() => {
    fetchDashboardData();

    // Listen for broadcast sync from new orders or catalog changes
    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = () => {
        fetchDashboardData(true);
      };
    } catch (e) {}

    // Periodic real-time poll every 3.5 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 3500);

    return () => {
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const currencySymbol = siteSettings?.currency_symbol || '$';

  return (
    <div className="space-y-6 sm:space-y-8 transition-colors duration-200">
      
      {/* Welcome Banner */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-100 via-pink-50 to-slate-100 dark:from-purple-900/40 dark:via-pink-900/20 dark:to-slate-900 border border-purple-200 dark:border-purple-500/20 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ផ្ទាំងគ្រប់គ្រងពាណិជ្ជកម្មតន្ត្រី (Music Store CMS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            សូមស្វាគមន៍មកកាន់ {siteSettings?.site_name_kh || 'KhmerBeats Admin'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            គ្រប់គ្រងបទចម្រៀង កូដបញ្ចុះតម្លៃ ឈ្មោះ Logo វេបសាយ និងតាមដានរាល់ការកុម្ម៉ង់ទិញរបស់អតិថិជនតាម Telegram ទាំងអស់ពីទីនេះ។
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">បទចម្រៀងសរុប (Music Tracks)</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total_music}</div>
            <button 
              onClick={() => setCurrentTab('music')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>គ្រប់គ្រងបទចម្រៀង</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Music className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">កូដបញ្ចុះតម្លៃសកម្ម (Active Promos)</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total_promos}</div>
            <button 
              onClick={() => setCurrentTab('promos')}
              className="text-xs text-pink-600 dark:text-pink-400 hover:underline font-semibold mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>គ្រប់គ្រង Promo Codes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ការកុម្ម៉ង់ Telegram សរុប (Total Orders)</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total_orders}</div>
            <button 
              onClick={() => setCurrentTab('orders')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold mt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>ពិនិត្យមើល Orders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-4">ផ្លូវកាត់រហ័ស (Quick Actions)</h3>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button
            onClick={() => setCurrentTab('music')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមបទចម្រៀងថ្មី (Add Music)</span>
          </button>

          <button
            onClick={() => setCurrentTab('promos')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/20 cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span>បង្កើត Promo Code ថ្មី</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <span>ប្ដូរ Logo, ឈ្មោះ & Telegram Handle</span>
          </button>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">ការកុម្ម៉ង់ទិញថ្មីៗ (Recent Inquiries via Telegram)</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Real-time live sync" />
          </div>
          <button
            onClick={() => setCurrentTab('orders')}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            មើលទាំងអស់ ({stats.total_orders})
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            មិនទាន់មានការកុម្ម៉ង់ទិញនៅឡើយទេ។
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="pb-3">Order Ref</th>
                  <th className="pb-3">បទចម្រៀង (Song)</th>
                  <th className="pb-3">តម្លៃដើម</th>
                  <th className="pb-3">Promo Code</th>
                  <th className="pb-3">តម្លៃចុងក្រោយ</th>
                  <th className="pb-3">កាលបរិច្ឆេទ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-purple-600 dark:text-purple-400 font-bold">#{order.reference_code}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{order.music_title}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{currencySymbol}{order.original_price.toFixed(2)}</td>
                    <td className="py-3">
                      {order.promo_code ? (
                        <span className="px-2 py-0.5 rounded bg-pink-500/15 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 font-mono text-[10px]">
                          {order.promo_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {currencySymbol}{order.final_price.toFixed(2)}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
