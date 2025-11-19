
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { Module, User } from '../types';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface SidebarProps {
  onLogout: () => void;
  municipality: string | null;
  onChangeMunicipality: () => void;
  modules: Module[];
}

// Centralized Icon definitions for cleaner component structure
const ModuleIcon: React.FC<{ iconKey: string; className: string }> = ({ iconKey, className }) => {
    const icons: Record<string, React.ReactNode> = {
        dashboard: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
        political: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        employees: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        companies: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
        contracts: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        judicial: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" /></svg>,
        social: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
        timeline: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        'document-text': <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    };
    return icons[iconKey] || <div className={className} />;
};

const NavItem: React.FC<{ module: Module }> = ({ module }) => {
    const { view, icon, name, hasSettings } = module;
    const iconClass = "w-6 h-6";
    const location = useLocation();

    // Robust active detection logic:
    // Checks if the current path matches the module view exactly OR starts with the view (for sub-routes like details or settings)
    // Example: '/political' matches '/political' and '/political/settings' and '/political/123'
    const isActive = location.pathname === `/${view}` || location.pathname.startsWith(`/${view}/`);
    
    // Specific check for the settings page to style the gear icon distinctively
    const isSettingsActive = location.pathname === `/${view}/settings`;

    // Styles for the main container
    const containerClasses = isActive
        ? 'bg-brand-blue text-white shadow-lg'
        : 'text-brand-light hover:bg-brand-accent hover:text-white';

    // Styles for the settings button
    const settingsButtonClasses = isSettingsActive
        ? 'bg-white/20 text-white ring-1 ring-white/30'
        : isActive
            ? 'text-white hover:bg-white/20'
            : 'opacity-0 group-hover:opacity-100 text-brand-light hover:text-white hover:bg-brand-primary';

    return (
        <li className={`group flex items-center my-1 rounded-lg transition-all duration-200 ${containerClasses}`}>
            {/* Main Module Link */}
            <NavLink
                to={`/${view}`}
                className="flex-grow flex items-center p-3 min-w-0"
                title={`Visualizar Detalhes de ${name}`}
            >
                <ModuleIcon iconKey={icon} className={`${iconClass} flex-shrink-0`} />
                <span className="ml-4 font-medium truncate">{name}</span>
            </NavLink>
            
            {/* Settings Action Button */}
            {hasSettings && (
                <NavLink
                    to={`/${view}/settings`}
                    className={`p-2 mr-2 rounded-full transition-all duration-200 flex-shrink-0 ${settingsButtonClasses}`}
                    title={`Configurações de ${name}`}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </NavLink>
            )}
        </li>
    );
};

const QuotaIndicator: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
    const [stats, setStats] = useState<{ usage: number; limit: number; percentage: number } | null>(null);
    const { notify } = useNotification();

    useEffect(() => {
        const fetchQuota = async () => {
            if (currentUser) {
                const { usage, limit } = await dbService.getUserUsageStats(currentUser.id);
                const percentage = limit === -1 ? 0 : Math.min(100, Math.round((usage / limit) * 100));
                setStats({ usage, limit, percentage });

                if (percentage >= 80 && percentage < 100) {
                    // Could add notification here but need to avoid loops
                }
            }
        };

        fetchQuota();
        // Polling interval to update usage
        const interval = setInterval(fetchQuota, 10000);
        return () => clearInterval(interval);
    }, [currentUser]);

    if (!stats || stats.limit === -1) return null;

    const color = stats.percentage >= 90 ? 'bg-red-500' : stats.percentage >= 75 ? 'bg-brand-yellow' : 'bg-brand-green';

    return (
        <div className="mt-auto mb-2 px-3">
            <div className="bg-brand-primary/40 p-3 rounded-lg border border-brand-accent/30">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-brand-light tracking-wider">Cota Diária</span>
                    <span className={`text-xs font-mono ${stats.percentage >= 90 ? 'text-red-400' : 'text-brand-text'}`}>
                        {stats.usage}/{stats.limit}
                    </span>
                </div>
                <div className="w-full bg-brand-secondary rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${stats.percentage}%` }}></div>
                </div>
                {stats.percentage >= 90 && (
                    <p className="text-[10px] text-red-400 mt-1 text-center">Limite próximo! Atualize seu plano.</p>
                )}
            </div>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ onLogout, municipality, onChangeMunicipality, modules }) => {
    const location = useLocation();
    const { currentUser } = useAuth();
    
    // Global settings active state check
    const isSettingsActive = location.pathname === '/settings';

    return (
        <div className="w-64 bg-brand-secondary p-4 flex flex-col h-full border-r border-brand-accent/20">
            <div className="flex items-center mb-6 px-2">
                <div className="bg-brand-blue p-2 rounded-lg shadow-lg shadow-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2 2m0 0l-2-2m2 2V3" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold ml-3 tracking-tight">S.I.E. 3.0</h1>
            </div>

            {municipality && (
                <div className="p-4 mb-6 bg-brand-primary/50 rounded-xl border border-brand-accent/30 text-center relative group">
                    <p className="text-[10px] uppercase tracking-wider text-brand-light font-semibold mb-1">Município Ativo</p>
                    <p className="font-bold text-white truncate text-sm" title={municipality}>{municipality}</p>
                    <button 
                        onClick={onChangeMunicipality} 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-brand-accent rounded text-brand-light hover:text-white"
                        title="Trocar município"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                </div>
            )}

            <nav className="flex-grow overflow-y-auto custom-scrollbar">
                <ul className="space-y-1">
                    {modules.map(module => (
                        <NavItem key={module.view} module={module} />
                    ))}
                     <li className={`group flex items-center my-1 rounded-lg transition-all duration-200 ${
                            isSettingsActive
                                ? 'bg-brand-blue text-white shadow-lg'
                                : 'text-brand-light hover:bg-brand-accent hover:text-white'
                        }`}>
                        <NavLink
                            to="/settings"
                            className="flex-grow flex items-center p-3 min-w-0"
                            title="Configurações do Usuário"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="ml-4 font-medium truncate">Configurações do Usuário</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
            
            {/* Quota Indicator placed above the logout area */}
            <QuotaIndicator currentUser={currentUser} />
            
            <div className="pt-2 border-t border-brand-accent/20">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-brand-light hover:bg-brand-red/10 hover:text-brand-red group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="ml-4 font-medium">Sair</span>
                </button>
                
                <div className="mt-4 p-3 bg-brand-accent/10 rounded-lg border border-brand-accent/20">
                    <h4 className="text-[10px] uppercase font-bold text-brand-light/70 mb-2 tracking-wider">Princípios do S.I.E.</h4>
                    <ul className="space-y-2 text-xs text-brand-light/90">
                        <li className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span>Dados reais e oficiais.</span>
                        </li>
                        <li className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            <span>Sem alucinações.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
