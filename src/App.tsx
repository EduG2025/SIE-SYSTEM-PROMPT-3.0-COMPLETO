
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';

// Core Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MunicipalitySelector from './components/MunicipalitySelector';
import Login from './components/Login';
import LoadingScreen from './components/LoadingScreen';
import AdminLayout from './components/admin/AdminLayout';
import AIChat from './components/AIChat';
import Spinner from './components/common/Spinner';
import GlobalLoadingBar from './components/common/GlobalLoadingBar';

// Contexts & Services
import { AuthContext } from './contexts/AuthContext';
import { MunicipalityContext } from './contexts/MunicipalityContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { municipalities as initialMunicipalities } from './data/municipalities';
import type { User, Module, ViewType } from './types';
// FIX: Ensure relative path is used to avoid alias resolution issues in browser
import { dbService } from './services/dbService'; 
import { moduleRegistry } from './moduleRegistry';

const { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDOM as any;

// Lazy Load Additional Views
const PoliticalModule = lazy(() => import('./components/PoliticalModule')); 
const ModuleDetails = lazy(() => import('./components/ModuleDetails')); 
const Homepage = lazy(() => import('./components/Homepage')); 

// Lazy Load Settings
const DashboardSettings = lazy(() => import('./components/settings/DashboardSettings'));
const PoliticalSettings = lazy(() => import('./components/settings/PoliticalSettings'));
const EmployeesSettings = lazy(() => import('./components/settings/EmployeesSettings'));
const CompaniesSettings = lazy(() => import('./components/settings/CompaniesSettings'));
const ContractsSettings = lazy(() => import('./components/settings/ContractsSettings'));
const JudicialSettings = lazy(() => import('./components/settings/JudicialSettings'));
const SocialMediaSettings = lazy(() => import('./components/settings/SocialMediaSettings'));
const TimelineSettings = lazy(() => import('./components/settings/TimelineSettings'));
const UserSettings = lazy(() => import('./components/settings/UserSettings'));

// Registry for Settings Components based on ViewType
const settingsRegistry: Partial<Record<ViewType, React.LazyExoticComponent<React.FC<any>>>> = {
    dashboard: DashboardSettings,
    political: PoliticalSettings,
    employees: EmployeesSettings,
    companies: CompaniesSettings,
    contracts: ContractsSettings,
    judicial: JudicialSettings,
    social: SocialMediaSettings,
    timeline: TimelineSettings,
};

const AppContent: React.FC = () => {
  const [municipality, setMunicipality] = useState<string | null>(() => localStorage.getItem('selectedMunicipality'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<User | null>(null);
  const [municipalities, setMunicipalities] = useState<string[]>(initialMunicipalities);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  
  const { homepage, isLoading: isConfigLoading } = useConfig();
  
  const location = useLocation();
  const navigate = useNavigate();

  const authContextValue = useMemo(() => ({ currentUser, setCurrentUser }), [currentUser]);
  const municipalityContextValue = useMemo(() => ({ municipalities, setMunicipalities }), [municipalities]);

  // Session Validation
  useEffect(() => {
    const validateSession = async () => {
      setIsAuthLoading(true);
      try {
        const user = await dbService.validateSession();
        if (user) setCurrentUser(user);
      } catch (error) {
        console.warn('Sessão inválida ou expirada.');
      } finally {
        setIsAuthLoading(false);
      }
    };
    validateSession();
  }, []);

  // Sync Modules
  useEffect(() => {
    const syncModules = async () => {
        setIsLoadingModules(true);
        if (currentUser) {
            try {
                const modules = await dbService.getUserActiveModules(currentUser);
                setActiveModules(modules);
            } catch (e) {
                console.error("Error syncing modules", e);
            }
        } else {
            setActiveModules([]);
        }
        setIsLoadingModules(false);
    };

    syncModules();
  }, [currentUser?.id, currentUser?.planId, currentUser?.role]);

  useEffect(() => {
    if (municipality) {
      localStorage.setItem('selectedMunicipality', municipality);
    } else {
      localStorage.removeItem('selectedMunicipality');
    }
  }, [municipality]);

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      dbService.logActivity('INFO', `Usuário '${user.username}' logado.`, user.username);
      navigate('/dashboard');
  };
  
  const handleLogout = () => {
      if(currentUser) {
        dbService.logActivity('INFO', `Usuário '${currentUser.username}' saiu.`, currentUser.username);
      }
      setCurrentUser(null);
      localStorage.removeItem('auth_token');
      setMunicipality(null);
      setImpersonatingAdmin(null);
      setIsLoading(false);
      setActiveModules([]);
      navigate('/login');
  };

  const handleSelectMunicipality = (selectedMunicipality: string) => {
    setMunicipality(selectedMunicipality);
    setIsLoading(true);
  };

  const handleChangeMunicipality = () => {
    setMunicipality(null);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleImpersonate = (userToImpersonate: User) => {
    if (currentUser && currentUser.role === 'admin') {
        dbService.logActivity('AUDIT', `Admin '${currentUser.username}' impersonando '${userToImpersonate.username}'.`, currentUser.username);
        setImpersonatingAdmin(currentUser);
        setCurrentUser(userToImpersonate);
        setMunicipality(null);
        navigate('/');
    }
  };

  const handleStopImpersonation = () => {
      if (impersonatingAdmin) {
          dbService.logActivity('AUDIT', `Fim da impersonação.`, impersonatingAdmin.username);
          setCurrentUser(impersonatingAdmin);
          setImpersonatingAdmin(null);
          setMunicipality(null);
          navigate('/admin/dashboard');
      }
  };
  
  const renderUserRoutes = () => {
    const currentPath = location.pathname.split('/')[1] || 'dashboard';
    
    // Verificação de segurança
    if (activeModules.length > 0 && !['settings', 'dashboard', 'admin', 'modules'].includes(currentPath)) {
        const isAllowed = activeModules.some(m => m.view === currentPath);
        if (!isAllowed) return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="flex h-screen bg-brand-primary text-brand-text font-sans transition-colors duration-300">
        <GlobalLoadingBar />
        {isLoading && <LoadingScreen municipality={municipality!} onComplete={handleLoadingComplete} view={currentPath} />}
        <Sidebar 
            onLogout={handleLogout} 
            municipality={municipality}
            onChangeMunicipality={handleChangeMunicipality}
            modules={activeModules}
            isLoading={isLoadingModules}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
            <Header modules={activeModules} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-primary p-4 md:p-6 lg:p-8 animate-fade-in-up" key={location.pathname}>
                <Suspense fallback={<div className="flex justify-center p-10"><Spinner /></div>}>
                    <Routes>
                      {/* Configurações Globais */}
                      <Route path="/settings" element={<UserSettings />} />
                      
                      {/* Rota de Detalhe Genérico de Módulos */}
                      <Route path="/modules/:moduleId" element={<ModuleDetails />} />

                      {/* Rotas Dinâmicas */}
                      {activeModules.map(module => {
                          const Component = moduleRegistry[module.view as ViewType];
                          const SettingsComponent = settingsRegistry[module.view as ViewType];
                          
                          if (!Component) return null;

                          return (
                              <React.Fragment key={module.id}>
                                  <Route path={`/${module.view}`} element={
                                      module.view === 'dashboard' ? <Component municipality={municipality || ''} /> : <Component />
                                  } />
                                  
                                  {module.hasSettings && SettingsComponent && (
                                      <Route path={`/${module.view}/settings`} element={<SettingsComponent />} />
                                  )}
                              </React.Fragment>
                          );
                      })}

                      {/* Rotas Específicas / Nested */}
                      <Route path="/political/:politicianId" element={<PoliticalModule />} />

                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
        <AIChat />
      </div>
    );
  };

  if (isConfigLoading || isAuthLoading) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-primary space-y-4">
            <Spinner />
            <p className="text-brand-light text-sm animate-pulse">Carregando S.I.E...</p>
        </div>
      );
  }

  const renderContent = () => {
    if (!currentUser) {
      return (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={homepage?.active ? <Suspense fallback={<Spinner />}><Homepage config={homepage} /></Suspense> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }
  
    if (currentUser.role === 'admin' && !impersonatingAdmin) {
      return (
        <Routes>
          <Route path="/admin/*" element={<AdminLayout onLogout={handleLogout} onImpersonate={handleImpersonate} currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      );
    }
    
    if (!municipality) {
      return <MunicipalitySelector onSelect={handleSelectMunicipality} />;
    }
  
    return renderUserRoutes();
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <MunicipalityContext.Provider value={municipalityContextValue}>
        <NotificationProvider>
            {renderContent()}
            {impersonatingAdmin && (
                <div className="fixed bottom-0 left-0 right-0 bg-brand-yellow text-brand-primary p-3 flex justify-center items-center z-[100] shadow-lg">
                    <p className="font-bold mr-4">
                        Visualizando como {currentUser?.username}.
                    </p>
                    <button onClick={handleStopImpersonation} className="bg-brand-primary text-white font-semibold py-1 px-4 rounded-lg hover:bg-brand-secondary transition-colors">
                        Voltar ao Painel de Admin
                    </button>
                </div>
            )}
        </NotificationProvider>
      </MunicipalityContext.Provider>
    </AuthContext.Provider>
  );
};

const App: React.FC = () => (
  <ConfigProvider>
    <HashRouter>
        <AppContent />
    </HashRouter>
  </ConfigProvider>
);

export default App;
