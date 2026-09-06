import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { 
  Settings, Image, Lock, ShieldCheck, UploadCloud, 
  Send, CheckCircle, AlertCircle, Save, Phone, DollarSign, Globe 
} from 'lucide-react';

export const SiteSettings = ({ siteSettings, refreshSettings }) => {
  const { authFetch, admin, setAdmin } = useAuth();
  const { showAlert } = useAlert();

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    site_name_en: '',
    site_name_kh: '',
    logo_url: '',
    telegram_username: '',
    telegram_channel: '',
    currency_symbol: '$',
    contact_phone: '',
    banner_title_en: '',
    banner_title_kh: '',
    banner_sub_en: '',
    banner_sub_kh: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password / Credentials form state
  const [credForm, setCredForm] = useState({
    current_password: '',
    new_username: admin?.username || '',
    new_password: '',
    confirm_password: ''
  });

  const [savingCred, setSavingCred] = useState(false);
  const [credSuccess, setCredSuccess] = useState('');
  const [credError, setCredError] = useState('');

  useEffect(() => {
    if (siteSettings) {
      setSettingsForm({
        site_name_en: siteSettings.site_name_en || '',
        site_name_kh: siteSettings.site_name_kh || '',
        logo_url: siteSettings.logo_url || '',
        telegram_username: siteSettings.telegram_username || '',
        telegram_channel: siteSettings.telegram_channel || '',
        currency_symbol: siteSettings.currency_symbol || '$',
        contact_phone: siteSettings.contact_phone || '',
        banner_title_en: siteSettings.banner_title_en || '',
        banner_title_kh: siteSettings.banner_title_kh || '',
        banner_sub_en: siteSettings.banner_sub_en || '',
        banner_sub_kh: siteSettings.banner_sub_kh || ''
      });
    }
  }, [siteSettings]);

  useEffect(() => {
    if (admin) {
      setCredForm(prev => ({ ...prev, new_username: admin.username }));
    }
  }, [admin]);

  const notifySync = () => {
    try {
      const channel = new BroadcastChannel('khmer_beats_sync');
      channel.postMessage({ type: 'SETTINGS_UPDATED' });
    } catch (e) {}
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setSettingsError('');
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const resData = await res.json();
      if (resData.url) {
        setSettingsForm(prev => ({ ...prev, logo_url: resData.url }));
        showAlert({
          type: 'success',
          title: 'ជោគជ័យ (Success)',
          message: resData.provider === 'uploadthing'
            ? 'បានបង្ហោះ Logo ទៅ UploadThing CDN ដោយជោគជ័យ (Uploaded to UploadThing)'
            : 'បានបង្ហោះ Logo ដោយជោគជ័យ (Logo uploaded successfully)'
        });
      }
    } catch (err) {
      setSettingsError('Upload failed: ' + err.message);
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការ Upload Logo',
        message: err.message
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save Site Branding Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');

    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update settings');
      }

      const successMsg = 'បានរក្សាទុកព័ត៌មាន Logo និង ឈ្មោះវេបសាយដោយជោគជ័យ!';
      setSettingsSuccess(successMsg);
      showAlert({
        type: 'success',
        title: 'បានរក្សាទុកការកំណត់ជោគជ័យ',
        message: successMsg
      });
      if (refreshSettings) refreshSettings();
      notifySync();
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      setSettingsError(err.message);
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការរក្សាទុកការកំណត់',
        message: err.message
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Admin Username & Password
  const handleChangeCredentials = async (e) => {
    e.preventDefault();
    setSavingCred(true);
    setCredSuccess('');
    setCredError('');

    if (credForm.new_password) {
      if (credForm.new_password.length < 6) {
        const passErrMsg = 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ (Min 6 characters)';
        setCredError(passErrMsg);
        showAlert({
          type: 'warning',
          title: 'លេខសម្ងាត់ខ្លីពេក',
          message: passErrMsg
        });
        setSavingCred(false);
        return;
      }
      if (credForm.new_password !== credForm.confirm_password) {
        const passMatchMsg = 'លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ (Passwords do not match)';
        setCredError(passMatchMsg);
        showAlert({
          type: 'warning',
          title: 'លេខសម្ងាត់មិនត្រូវគ្នា',
          message: passMatchMsg
        });
        setSavingCred(false);
        return;
      }
    }

    try {
      const payload = {
        current_password: credForm.current_password,
        new_username: credForm.new_username.trim() || undefined,
        new_password: credForm.new_password ? credForm.new_password : undefined
      };

      const res = await authFetch('/api/admin/change-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update credentials');
      }

      const data = await res.json();
      const credSuccessMsg = 'បានប្ដូរឈ្មោះ និងលេខសម្ងាត់ Admin ដោយជោគជ័យ!';
      setCredSuccess(credSuccessMsg);
      showAlert({
        type: 'success',
        title: 'ប្ដូរព័ត៌មាន Admin ជោគជ័យ',
        message: credSuccessMsg
      });
      if (admin) setAdmin({ ...admin, username: data.username });
      setCredForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setTimeout(() => setCredSuccess(''), 4000);
    } catch (err) {
      setCredError(err.message);
      showAlert({
        type: 'error',
        title: 'បរាជ័យក្នុងការប្ដូរលេខសម្ងាត់',
        message: err.message
      });
    } finally {
      setSavingCred(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl transition-colors duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          កំណត់ Logo, ឈ្មោះវេបសាយ & Password (Settings & Security)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          កែប្រែ Logo, ឈ្មោះហាងតន្ត្រី, គណនី Telegram ទទួលការកុម្ម៉ង់, និងប្ដូរលេខសម្ងាត់ Admin (Real-time Sync)
        </p>
      </div>

      {/* SECTION 1: Site Branding & Telegram */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              កំណត់ Logo & ឈ្មោះហាង (Logo & Branding)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              ទិន្នន័យទាំងអស់នេះនឹងបង្ហាញផ្ទាល់នៅលើទំព័រមុខនៃ Music Store
            </p>
          </div>
        </div>

        {settingsSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{settingsSuccess}</span>
          </div>
        )}

        {settingsError && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{settingsError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-5">
          
          {/* Logo Upload / URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              រូបភាព Logo វេបសាយ (Site Logo)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-20 h-14 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-2 shrink-0">
                {settingsForm.logo_url ? (
                  <img
                    src={settingsForm.logo_url}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No Logo</span>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settingsForm.logo_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                    placeholder="Upload logo or paste logo URL..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                  <label className="px-3.5 sm:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-600/20 transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingLogo ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  ណែនាំទំហំ 200x60px ឬរូបភាព PNG / SVG ដែលមាន background ថ្លា
                </p>
              </div>
            </div>
          </div>

          {/* Site Names (EN & KH) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ឈ្មោះវេបសាយជាអង់គ្លេស (Site Name English) *
              </label>
              <input
                type="text"
                required
                value={settingsForm.site_name_en}
                onChange={(e) => setSettingsForm({ ...settingsForm, site_name_en: e.target.value })}
                placeholder="e.g. KhmerBeats Store"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ឈ្មោះវេបសាយជាភាសាខ្មែរ (Site Name Khmer) *
              </label>
              <input
                type="text"
                required
                value={settingsForm.site_name_kh}
                onChange={(e) => setSettingsForm({ ...settingsForm, site_name_kh: e.target.value })}
                placeholder="ឧទាហរណ៍៖ ហាងតន្ត្រី ខ្មែរប៊ីត"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Telegram Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>គណនី Telegram ទទួលការបញ្ជាទិញ (Admin Username) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                <input
                  type="text"
                  required
                  value={settingsForm.telegram_username}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegram_username: e.target.value.replace('@', '') })}
                  placeholder="admin_telegram_username"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-sky-600 dark:text-sky-300 focus:outline-none focus:border-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                ពេលអ្នកទិញចុច "ទិញតាម Telegram" វានឹងបើកផ្ញើសារចូល Telegram Username នេះផ្ទាល់។
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telegram Channel Link (បណ្តាញ Telegram)
              </label>
              <input
                type="text"
                value={settingsForm.telegram_channel}
                onChange={(e) => setSettingsForm({ ...settingsForm, telegram_channel: e.target.value })}
                placeholder="https://t.me/your_channel"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Currency Symbol and Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>សញ្ញារូបិយប័ណ្ណ (Currency Symbol)</span>
              </label>
              <input
                type="text"
                value={settingsForm.currency_symbol}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency_symbol: e.target.value })}
                placeholder="$ or ៛"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>លេខទូរស័ព្ទទំនាក់ទំនង (Contact Phone)</span>
              </label>
              <input
                type="text"
                value={settingsForm.contact_phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                placeholder="+855 12 345 678"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការផ្លាស់ប្ដូរ (Save Settings)'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* SECTION 2: Change Admin Username and Password */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              ប្ដូរឈ្មោះ និងលេខសម្ងាត់ Admin (Change Password & Username)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              សុវត្ថិភាពគណនីគ្រប់គ្រងប្រព័ន្ធ Admin
            </p>
          </div>
        </div>

        {credSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{credSuccess}</span>
          </div>
        )}

        {credError && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{credError}</span>
          </div>
        )}

        <form onSubmit={handleChangeCredentials} className="space-y-4">
          
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              លេខសម្ងាត់បច្ចុប្បន្ន (Current Password) *
            </label>
            <input
              type="password"
              required
              value={credForm.current_password}
              onChange={(e) => setCredForm({ ...credForm, current_password: e.target.value })}
              placeholder="Enter current password to authorize changes"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* New Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ឈ្មោះ Admin ថ្មី (New Admin Username)
            </label>
            <input
              type="text"
              value={credForm.new_username}
              onChange={(e) => setCredForm({ ...credForm, new_username: e.target.value })}
              placeholder="e.g. admin"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* New Password and Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                លេខសម្ងាត់ថ្មី (New Password)
              </label>
              <input
                type="password"
                value={credForm.new_password}
                onChange={(e) => setCredForm({ ...credForm, new_password: e.target.value })}
                placeholder="Leave blank if keeping current password"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm New Password)
              </label>
              <input
                type="password"
                value={credForm.confirm_password}
                onChange={(e) => setCredForm({ ...credForm, confirm_password: e.target.value })}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingCred}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/30 cursor-pointer disabled:opacity-50 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{savingCred ? 'កំពុងប្ដូរ...' : 'ប្ដូរឈ្មោះ និងលេខសម្ងាត់ (Update Credentials)'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
