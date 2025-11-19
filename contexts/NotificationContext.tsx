import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

interface NotificationContextType {
    notify: (message: string, type: 'success' | 'error') => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const notify = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    }, []);

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}
        </NotificationContext.Provider>
    );
};
