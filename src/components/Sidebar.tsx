
import React, { useMemo, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Module, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { NavLink, Link } = ReactRouterDOM as any;

interface SidebarProps {
  onLogout: () => void;
  municipality: string | null;
  onChangeMunicipality: () => void;
  modules: Module[];
  isLoading?: boolean;
}

// --- Icons ---
const ChevronLeftIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

const ModuleIcon: React.FC<{ iconKey: string; className: string }> = ({ iconKey, className }) => {
    const icons: Record<string, React.ReactNode> = {
        dashboard: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
        political: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        employees: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.956 1-1 1H5a1 1 0 00-1 1v9a1 1 0 001 1h14a1 1 0 001-1V8a1 1 0 00-1-1h-1c-.043 0-1-.116-1-1" /></svg>,
        companies: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
        contracts: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        judicial: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
        social: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
        timeline: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        'document-text': <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        'search-circle': <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    };
    return icons[iconKey] || <div className={className} />;
};

const NavItem: React.FC<{ module: Module; collapsed: boolean }> = ({ module, collapsed }) => {
    const { view, icon, name } = module;
    const iconClass = "w-5 h-5";
    
    return (
        <NavLink
            to={`/${view}`}
            className={({ isActive }: { isActive: boolean }) => `group flex items-center px-3 py-2.5 my-1 mx-2 rounded-lg transition-all duration-200 text-sm font-medium relative overflow-hidden ${
                isActive
                    ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20'
                    : 'text-brand-light hover:bg-white/5 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? name : ''}
        >
            <ModuleIcon iconKey={icon} className={`${iconClass} flex-shrink-0 transition-transform group-hover:scale-110 ${!collapsed && 'mr-3'}`} />
            
            {!collapsed && (
                <span className="truncate relative z-10">{name}</span>
            )}
        </NavLink>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ onLogout, municipality, onChangeMunicipality, modules, isLoading = false }) => {
    const { currentUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);

    // Agrupamento dinâmico
    const grouped = useMemo(() => {
        return {
            main: modules.filter(m => ['dashboard', 'research', 'political'].includes(m.view)),
            entities: modules.filter(m => ['employees', 'companies', 'contracts'].includes(m.view)),
            intel: modules.filter(m => ['judicial', 'social', 'timeline', 'ocr'].includes(m.view))
        };
    }, [modules]);

    return (
        <div className={`${collapsed ? 'w-20' : 'w-64'} bg-brand-secondary flex flex-col h-full border-r border-brand-accent/20 shadow-2xl transition-all duration-300 relative z-50`}>
            
            {/* Collapse Toggle */}
            <button 
                onClick={toggleSidebar}
                className="absolute -right-3 top-8 bg-brand-primary border border-brand-accent text-brand-light hover:text-white rounded-full p-1 shadow-md z-50 transition-transform hover:scale-110 hidden md:flex items-center justify-center"
            >
                {collapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
            </button>

            {/* Header / Logo */}
            <div className="flex items-center justify-center h-16 border-b border-white/5 flex-shrink-0 bg-brand-secondary/50 backdrop-blur overflow-hidden">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-brand-blue to-brand-purple p-1.5 rounded-lg shadow-lg mr-0 md:mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    {!collapsed && (
                        <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap animate-fade-in-up">S.I.E. <span className="text-brand-cyan text-xs px-1 rounded border border-brand-cyan/30 ml-1">3.1</span></h1>
                    )}
                </div>
            </div>

            {/* User Mini Profile */}
            <div className={`p-4 border-b border-white/5 transition-all ${collapsed ? 'px-2 flex justify-center' : ''}`}>
                <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
                    <Link to="/settings" className="relative group flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-brand-blue transition-colors">
                             {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-white">{currentUser?.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-brand-secondary rounded-full"></div>
                    </Link>
                    
                    {!collapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{currentUser?.username}</p>
                            <p className="text-xs text-brand-light truncate capitalize">{currentUser?.role}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto custom-scrollbar py-4 space-y-6">
                {/* Municipality Selector */}
                {municipality && (
                    <div className={`mx-3 ${collapsed ? 'flex justify-center' : ''}`}>
                        <div className={`bg-brand-primary/50 rounded-lg border border-white/5 p-2 group relative hover:border-brand-blue/30 transition-colors cursor-pointer ${collapsed ? 'w-10 h-10 flex items-center justify-center' : ''}`} onClick={onChangeMunicipality}>
                             {!collapsed ? (
                                 <div>
                                     <p className="text-[10px] text-brand-light uppercase font-bold mb-0.5">Analisando</p>
                                     <p className="font-semibold text-white text-sm truncate">{municipality}</p>
                                 </div>
                             ) : (
                                 <span className="font-bold text-brand-cyan text-xs" title={municipality}>{municipality.substring(0, 2).toUpperCase()}</span>
                             )}
                        </div>
                    </div>
                )}

                {/* Navigation Groups */}
                <nav className="space-y-1">
                    {isLoading ? (
                        <div className="px-4 text-brand-light text-xs animate-pulse">Carregando...</div>
                    ) : (
                        <>
                            {!collapsed && <div className="px-5 mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-light/40">Estratégia</div>}
                            {grouped.main.map(m => <NavItem key={m.id} module={m} collapsed={collapsed} />)}

                            {!collapsed && <div className="px-5 mb-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-brand-light/40">Entidades</div>}
                            {grouped.entities.map(m => <NavItem key={m.id} module={m} collapsed={collapsed} />)}

                            {!collapsed && <div className="px-5 mb-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-brand-light/40">Inteligência</div>}
                            {grouped.intel.map(m => <NavItem key={m.id} module={m} collapsed={collapsed} />)}
                        </>
                    )}
                </nav>
            </div>

            {/* Footer Actions */}
            <div className={`p-3 border-t border-white/5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                <button 
                    onClick={onLogout}
                    className={`flex items-center w-full p-2 rounded-lg text-brand-light hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                    title="Sair"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    {!collapsed && <span className="ml-3 text-sm font-medium">Encerrar Sessão</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
