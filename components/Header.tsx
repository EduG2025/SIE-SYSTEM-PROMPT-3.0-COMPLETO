
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Module } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';

const { useLocation, Link } = ReactRouterDOM as any;

interface HeaderProps {
    modules: Module[];
}

const Header: React.FC<HeaderProps> = ({ modules }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const userInitial = currentUser?.username?.[0]?.toUpperCase() || '?';
  
  const pathParts = location.pathname.split('/');
  const currentView = pathParts[1];
  const isSettingsPage = pathParts[2] === 'settings';

  const activeModule = modules.find(m => m.view === currentView);
  let title = activeModule?.name || 'Dashboard';

  if (isSettingsPage && activeModule) {
      title = `Configurações - ${activeModule.name}`;
  } else if (currentView === 'settings') {
      title = 'Minhas Configurações';
  }

  // Sync Status Monitoring
  const [syncStatus, setSyncStatus] = useState<'Conectado' | 'Desconectado' | 'Sincronizando' | 'Erro'>('Desconectado');

  useEffect(() => {
      const checkSync = async () => {
          const config = await dbService.getDbConfig();
          setSyncStatus(config.status);
      };
      
      checkSync();
      const interval = setInterval(checkSync, 2000); // Poll status
      return () => clearInterval(interval);
  }, []);

  const getSyncIcon = () => {
      switch(syncStatus) {
          case 'Conectado':
              return <span className="text-brand-green" title="Sincronizado com a Nuvem">☁️</span>;
          case 'Sincronizando':
              return <span className="text-brand-yellow animate-pulse" title="Enviando dados...">🔄</span>;
          case 'Erro':
              return <span className="text-brand-red" title="Erro de Sincronização">❌</span>;
          default:
              return <span className="text-brand-light opacity-30" title="Modo Local (Offline)">☁️</span>;
      }
  };

  return (
    <header className="bg-brand-secondary shadow-md flex justify-between items-center gap-4 px-4 md:px-6 py-3 shrink-0">
      <h2 className="text-xl md:text-2xl font-bold text-white truncate">{title}</h2>
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Indicador de Sync */}
        <div className="hidden md:flex items-center mr-2 bg-brand-primary/50 px-2 py-1 rounded-full border border-brand-accent/30">
             {getSyncIcon()}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Busca rápida..."
            className="bg-brand-accent rounded-full py-2 pl-4 pr-8 w-40 md:w-64 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300"
          />
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-light absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        {activeModule?.hasSettings && !isSettingsPage && (
            <Link 
                to={`/${currentView}/settings`}
                className="p-2 rounded-full hover:bg-brand-accent transition-colors flex-shrink-0"
                title={`Configurações de ${activeModule.name}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </Link>
        )}

        <Link to="/settings" className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-brand-blue transition-all overflow-hidden" title={`Usuário: ${currentUser?.username}`}>
          {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
              <span className="font-bold text-white text-lg">{userInitial}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;