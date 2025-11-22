
import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Module, User } from '../types';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';

const { NavLink, useLocation, Link } = ReactRouterDOM as any;

interface SidebarProps {
  onLogout: () => void;
  municipality: string | null;
  onChangeMunicipality: () => void;
  modules: Module[];
  isLoading?: boolean;
}

// --- Subcomponents ---

const ShimmerItem = () => (
    <div className="flex items-center px-3 py-2.5 my-1 mx-2 rounded-lg">
        <div className="w-5 h-5 rounded bg-brand-accent/50 animate-pulse mr-3"></div>
        <div className="h-4 bg-brand-accent/50 rounded w-24 animate-pulse"></div>
    </div>
);

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

const NavItem: React.FC<{ module: Module }> = ({ module }) => {
    const { view, icon, name } = module;
    const iconClass = "w-5 h-5";
    const location = useLocation();
    const isActive = location.pathname === `/${view}` || location.pathname.startsWith(`/${view}/`);

    return (
        <NavLink
            to={`/${view}`}
            className={`group flex items-center px-3 py-2.5 my-1 mx-2 rounded-lg transition-all duration-300 text-sm font-medium relative overflow-hidden ${
                isActive
                    ? 'bg-gradient-to-r from-brand-blue/90 to-brand-blue/70 text-white shadow-md'
                    : 'text-brand-light hover:bg-white/5 hover:text-white'
            }`}
            title={name}
        >
            {isActive && <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>}
            <ModuleIcon iconKey={icon} className={`${iconClass} mr-3 flex-shrink-0 transition-transform group-hover:scale-110`} />
            <span className="truncate relative z-10">{name}</span>
            
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10"></div>
            )}
        </NavLink>
    );
};

// Perfil Compacto no Topo
const UserProfileHeader: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
    if (!user) return null;
    const initial = user.username?.[0]?.toUpperCase() || 'U';

    return (
        <div className="p-4 border-b border-white/10 bg-gradient-to-b from-brand-secondary to-brand-primary">
            <div className="flex items-center gap-3">
                <Link to="/settings" className="relative group flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-brand-accent border border-white/10 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-brand-blue transition-all shadow-lg">
                         {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-white text-lg">{initial}</span>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-brand-primary rounded-full"></div>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-brand-blue transition-colors cursor-default">{user.username}</p>
                    <p className="text-xs text-brand-light truncate capitalize">{user.role}</p>
                </div>
                <button 
                    onClick={onLogout} 
                    className="p-1.5 rounded-md text-brand-light/70 hover:text-red-400 hover:bg-red-500/10 transition-all" 
                    title="Sair com segurança"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </div>
    );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <div className="px-5 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-light/50 flex items-center">
        <span className="flex-grow bg-brand-light/10 h-[1px] mr-2"></span>
        {label}
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ onLogout, municipality, onChangeMunicipality, modules, isLoading = false }) => {
    const { currentUser } = useAuth();

    // Agrupamento Lógico de Módulos usando a nova propriedade 'category'
    const groupedModules = useMemo(() => {
        const groups = {
            strategy: modules.filter(m => m.category === 'strategy' || ['dashboard', 'research'].includes(m.view)),
            entities: modules.filter(m => m.category === 'entities' || ['political', 'employees', 'companies'].includes(m.view)),
            intelligence: modules.filter(m => m.category === 'intelligence' || ['contracts', 'judicial', 'social', 'timeline', 'ocr'].includes(m.view)),
            others: modules.filter(m => !m.category && !['dashboard', 'research', 'political', 'employees', 'companies', 'contracts', 'judicial', 'social', 'timeline', 'ocr'].includes(m.view))
        };
        return groups;
    }, [modules]);

    return (
        <div className="w-64 bg-brand-secondary flex flex-col h-full border-r border-brand-accent/20 shadow-2xl">
            {/* Logo Section */}
            <div className="flex items-center justify-center h-16 border-b border-white/5 flex-shrink-0 bg-brand-secondary/50 backdrop-blur">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-brand-blue to-brand-purple p-1.5 rounded-lg shadow-lg shadow-blue-500/20 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white">S.I.E. <span className="text-brand-cyan text-xs bg-brand-cyan/10 px-1 py-0.5 rounded ml-1 border border-brand-cyan/20">3.0.3</span></h1>
                </div>
            </div>

            <UserProfileHeader user={currentUser} onLogout={onLogout} />

            <div className="flex-grow overflow-y-auto custom-scrollbar py-2">
                {municipality && (
                    <div className="mx-4 mb-4 mt-2">
                        <div className="bg-brand-primary/40 rounded-lg border border-white/5 p-3 group relative hover:border-brand-blue/30 transition-colors">
                             <p className="text-[10px] text-brand-light uppercase mb-0.5 font-bold">Jurisdição Ativa</p>
                             <p className="font-semibold text-white text-sm truncate pr-6 text-shadow" title={municipality}>{municipality}</p>
                             <button 
                                onClick={onChangeMunicipality}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-light hover:text-white bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-blue"
                                title="Trocar Município"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                <nav className="pb-4">
                    {isLoading ? (
                        <div className="mt-4 space-y-2">
                            <SectionLabel label="Carregando..." />
                            <ShimmerItem /> <ShimmerItem /> <ShimmerItem />
                        </div>
                    ) : (
                        <>
                            {groupedModules.strategy.length > 0 && <SectionLabel label="Estratégia" />}
                            {groupedModules.strategy.map(m => <NavItem key={m.id} module={m} />)}

                            {groupedModules.entities.length > 0 && <SectionLabel label="Entidades & Atores" />}
                            {groupedModules.entities.map(m => <NavItem key={m.id} module={m} />)}

                            {groupedModules.intelligence.length > 0 && <SectionLabel label="Inteligência de Dados" />}
                            {groupedModules.intelligence.map(m => <NavItem key={m.id} module={m} />)}

                            {groupedModules.others.length > 0 && (
                                <>
                                     <SectionLabel label="Outros" />
                                     {groupedModules.others.map(m => <NavItem key={m.id} module={m} />)}
                                </>
                            )}
                        </>
                    )}
                </nav>
            </div>

            <div className="px-4 pb-3 text-center border-t border-white/5 pt-3 bg-brand-secondary">
                <p className="text-[10px] text-brand-light/40">S.I.E. Intelligence System v3.0.3</p>
            </div>
        </div>
    );
};

export default Sidebar;
