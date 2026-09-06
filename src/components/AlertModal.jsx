import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const AlertModal = ({ isOpen, onClose, title, message, type = 'success', duration = 3500 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    if (!duration || duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgGlow: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-300 dark:border-emerald-500/40',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      progressBg: 'bg-emerald-500',
      defaultTitle: 'ប្រតិបត្តិការជោគជ័យ (Success)'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-rose-500 dark:text-rose-400',
      bgGlow: 'bg-rose-500/10 dark:bg-rose-500/20',
      borderColor: 'border-rose-300 dark:border-rose-500/40',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      progressBg: 'bg-rose-500',
      defaultTitle: 'មានបញ្ហាបរាជ័យ (Error)'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgGlow: 'bg-amber-500/10 dark:bg-amber-500/20',
      borderColor: 'border-amber-300 dark:border-amber-500/40',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      progressBg: 'bg-amber-500',
      defaultTitle: 'ការព្រមាន (Warning)'
    },
    info: {
      icon: Info,
      iconColor: 'text-sky-500 dark:text-sky-400',
      bgGlow: 'bg-sky-500/10 dark:bg-sky-500/20',
      borderColor: 'border-sky-300 dark:border-sky-500/40',
      btnBg: 'bg-sky-600 hover:bg-sky-700 text-white',
      progressBg: 'bg-sky-500',
      defaultTitle: 'ដំណឹង (Information)'
    }
  };

  const current = typeConfig[type] || typeConfig.info;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border ${current.borderColor} rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-950/40 overflow-hidden transform animate-in zoom-in-95 duration-200`}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Top Progress Bar */}
        {duration > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
            <div 
              className={`h-full ${current.progressBg} transition-all duration-75 ease-linear`} 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Alert"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Content Layout */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Circular Glow Icon Badge */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl ${current.bgGlow} border ${current.borderColor} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${current.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title || current.defaultTitle}
          </h3>

          {/* Message Body */}
          {message && (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs sm:max-w-sm">
              {message}
            </p>
          )}

          {/* Action Button */}
          <div className="mt-6 w-full">
            <button
              onClick={onClose}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all ${current.btnBg}`}
            >
              យល់ព្រម (OK)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
