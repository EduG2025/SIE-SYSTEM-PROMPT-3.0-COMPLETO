
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { AdminViewType } from '../../types';

const { NavLink } = ReactRouterDOM as any;

interface AdminSidebarProps {
  onLogout: () => void;
}

// Tipos extendidos para incluir os novos módulos
type ExtendedAdminViewType = AdminViewType | 'updates' | 'themes';

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  view: ExtendedAdminViewType;
}> = ({ icon, label, view }) => {
  return (
    <li>
      <NavLink
        to={`/admin/${view}`}
        className={({ isActive }: { isActive: boolean }) =>
          `flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
            isActive
              ? 'bg-brand-blue text-white shadow-lg'
              : 'text-brand-light hover:bg-brand-accent hover:text-white'
          }`
        }
      >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
      </NavLink>
    </li>
  );
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const iconClass = "w-6 h-6";

  const navItems: { view: ExtendedAdminViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Visão Geral', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { view: 'updates', label: 'Gerenciador de Atualizações', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg> },
    { view: 'themes', label: 'Temas & Aparência', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
    // Itens existentes reorganizados
    { view: 'system', label: 'Configurações Gerais', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { view: 'users', label: 'Gerenciar Usuários', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ];

  return (
    <div className="w-64 bg-brand-secondary p-4 flex flex-col h-full">
      <div className="flex items-center mb-6 px-2">
        <div className="bg-brand-blue p-2 rounded-lg shadow-lg shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2 2m0 0l-2-2m2 2V3" /></svg>
        </div>
        <h1 className="text-xl font-bold ml-3 tracking-tight">S.I.E. 3.0 <span className="block text-xs text-brand-light font-normal">Admin</span></h1>
      </div>

      <nav className="flex-grow overflow-y-auto custom-scrollbar">
        <p className="text-xs font-bold text-brand-light uppercase px-3 mb-2 mt-2">Principal</p>
        <ul className="space-y-1">
            {navItems.slice(0, 3).map(item => (
                <NavItem key={item.view} icon={item.icon} label={item.label} view={item.view} />
            ))}
        </ul>
        
        <p className="text-xs font-bold text-brand-light uppercase px-3 mb-2 mt-6">Avançado</p>
        <ul className="space-y-1">
             {navItems.slice(3).map(item => (
                <NavItem key={item.view} icon={item.icon} label={item.label} view={item.view} />
            ))}
        </ul>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-brand-accent/20">
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-brand-light hover:bg-brand-red/10 hover:text-brand-red group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-4 font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
