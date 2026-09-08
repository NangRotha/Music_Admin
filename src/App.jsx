import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './pages/DashboardOverview';
import { MusicManagement } from './pages/MusicManagement';
import { CategoryManagement } from './pages/CategoryManagement';
import { SlideManagement } from './pages/SlideManagement';
import { PromoManagement } from './pages/PromoManagement';
import { AlertManagement } from './pages/AlertManagement';
import { AboutManagement } from './pages/AboutManagement';
import { OrdersLog } from './pages/OrdersLog';
import { SiteSettings } from './pages/SiteSettings';
import { Loader2, Menu, Music, ExternalLink } from 'lucide-react';

const AdminCMS = () => {
  const { token, admin, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [siteSettings, setSiteSettings] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setSiteSettings(data);
          // Sync browser title icon / favicon from site logo
          if (data.logo_url) {
            const iconLinks = document.querySelectorAll("link[rel*='icon']");
            iconLinks.forEach(link => {
              link.href = data.logo_url;
            });
            const titleName = data.site_name_kh || data.site_name_en;
            if (titleName) {
              document.title = `${titleName} - Admin CMS (ផ្ទាំងគ្រប់គ្រង)`;
            }
          }
        }
      })
      .catch(err => console.error('Failed to load site settings:', err));
  };

  useEffect(() => {
    fetchSettings();

    // Listen for broadcast sync
    let channel;
    try {
      channel = new BroadcastChannel('khmer_beats_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'SETTINGS_UPDATED') {
          fetchSettings();
        }
      };
    } catch (e) {}

    return () => {
      if (channel) channel.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <span className="text-xs font-medium">Loading admin session...</span>
      </div>
    );
  }

  if (!token || !admin) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Mobile Top Navbar (Hidden on Desktop) */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 cursor-pointer"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {siteSettings?.site_name_en || 'KhmerBeats'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold">
              Admin
            </span>
          </div>
        </div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      {/* Admin Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        siteSettings={siteSettings}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Fade-up transition whenever the active tab changes */}
          <div key={currentTab} className="animate-fade-up">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              setCurrentTab={setCurrentTab}
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'music' && (
            <MusicManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'categories' && (
            <CategoryManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'slides' && (
            <SlideManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'promos' && (
            <PromoManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'about' && (
            <AboutManagement
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersLog
              siteSettings={siteSettings}
            />
          )}

          {currentTab === 'settings' && (
            <SiteSettings
              siteSettings={siteSettings}
              refreshSettings={fetchSettings}
            />
          )}
          </div>
        </div>
      </main>

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <AdminCMS />
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
