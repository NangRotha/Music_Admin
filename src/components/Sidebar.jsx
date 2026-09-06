import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Music,
  Tag,
  ShoppingBag,
  Settings,
  LogOut,
  ExternalLink,
  X,
  Sun,
  Moon,
  Bell,
  BookOpen,
  Film,
  Layers
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, siteSettings, mobileOpen, setMobileOpen }) => {
  const { admin, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'ផ្ទាំងសង្ខេប (Dashboard)', icon: LayoutDashboard },
    { id: 'music', label: 'គ្រប់គ្រងបទចម្រៀង (Music)', icon: Music },
    { id: 'categories', label: 'ប្រភេទតន្ត្រី (Categories)', icon: Layers },
    { id: 'slides', label: 'គ្រប់គ្រង Slides (Media Slides)', icon: Film },
    { id: 'promos', label: 'កូដបញ្ចុះតម្លៃ (Promo Codes)', icon: Tag },
    { id: 'alerts', label: 'គ្រប់គ្រង Alert Popup (Alerts)', icon: Bell },
    { id: 'about', label: 'គ្រប់គ្រងអំពីយើង (About Us)', icon: BookOpen },
    { id: 'orders', label: 'ការកុម្ម៉ង់ Telegram (Orders)', icon: ShoppingBag },
    { id: 'settings', label: 'កំណត់ Logo, ឈ្មោះ & Password', icon: Settings },
  ];

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen transition-all duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Top Brand */}
        <div>
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt="Logo"
                  className="h-8 w-auto object-contain shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/30">
                  <Music className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-tight truncate">
                  {siteSettings?.site_name_en || 'KhmerBeats'}
                </h2>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Admin CMS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 sm:p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
          
          {/* Light / Dark Mode Switch */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{isDark ? 'ពន្លឺ (Light Mode)' : 'ងងឹត (Dark Mode)'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 border border-slate-200 dark:border-transparent uppercase">
              {theme}
            </span>
          </button>

          {/* Open Store Link */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>មើលគេហទំព័រ (Store)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">:5173</span>
          </a>

          {/* Admin Info & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                {admin?.username ? admin.username[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                  {admin?.username || 'Admin'}
                </span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="ចាកចេញ (Logout)"
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};
