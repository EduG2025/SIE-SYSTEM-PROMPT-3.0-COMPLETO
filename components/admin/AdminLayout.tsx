
import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import PlanManagement from './PlanManagement';
import SystemSettings from './SystemSettings';
import ModuleManagement from './ModuleManagement';
import DataManagement from './DataManagement';
import DataSourcesManagement from './DataSourcesManagement';
import { adminViewTitles } from '../../constants';
import type { AdminViewType, User } from '../../types';
import Toast from '../common/Toast';

interface AdminLayoutProps {
  onLogout: () => void;
  onImpersonate: (user: User) => void;
  currentUser: User;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, onImpersonate, currentUser }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const location = useLocation();

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Extend view type check locally to allow 'plans' without breaking types everywhere immediately if strict
    const currentView = (location.pathname.split('/admin/')[1] || 'dashboard');
    const title = adminViewTitles[currentView as AdminViewType] || 'Gerenciamento';
    
    return (
        <div className="flex h-screen bg-brand-primary text-brand-text font-sans">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <AdminSidebar onLogout={onLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                 <header className="bg-brand-secondary p-4 shadow-md">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-primary p-4 md:p-6 lg:p-8 animate-fade-in-up">
                   <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagement showToast={showToast} currentUser={currentUser} onImpersonate={onImpersonate} />} />
                        <Route path="plans" element={<PlanManagement showToast={showToast} />} />
                        <Route path="system" element={<SystemSettings showToast={showToast} currentUser={currentUser} />} />
                        <Route path="modules" element={<ModuleManagement showToast={showToast} />} />
                        <Route path="data" element={<DataManagement showToast={showToast} />} />
                        <Route path="datasources" element={<DataSourcesManagement showToast={showToast} />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                   </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
