import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertModal } from '../components/AlertModal';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success', // 'success' | 'error' | 'warning' | 'info'
    duration: 3500,
  });

  const showAlert = useCallback(({ title, message, type = 'success', duration = 3500 }) => {
    setAlertState({
      isOpen: true,
      title: title || (type === 'success' ? 'ជោគជ័យ (Success)' : 'បរាជ័យ (Error)'),
      message: message || '',
      type,
      duration,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        duration={alertState.duration}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
