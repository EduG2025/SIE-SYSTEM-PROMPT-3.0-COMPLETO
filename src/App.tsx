
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

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
import type { User, Module } from './types';
import { dbService } from './services/dbService';

// Lazy Load Views
const Dashboard = lazy(() => import('./components/Dashboard'));
const PoliticalModule = lazy(() => import('./components/PoliticalModule'));
const PoliticalNetwork = lazy(() => import('./components/PoliticalNetwork')); 
const EmployeesModule = lazy(() => import('./components/EmployeesModule'));
const CompaniesModule = lazy(() => import('./components/CompaniesModule'));
const ContractsModule = lazy(() => import('./components/ContractsModule'));
const JudicialModule = lazy(() => import('./components/JudicialModule'));
const SocialMediaModule = lazy(() => import('./components/SocialMediaModule'));
const TimelineModule = lazy(() => import('./components/TimelineModule'));
const OcrModule = lazy(() => import('./components/OcrModule'));
const ResearchModule = lazy(() => import('./components/ResearchModule'));
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

const AppContent: React.FC = () => {
  const [municipality, setMunicipality] = useState<string | null>(() => localStorage.getItem('selectedMunicipality'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<User | null>(null);
  const [municipalities, setMunicipalities] = useState<string[]>(initialMunicipalities);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  
  const { homepage, isLoading: isConfigLoading } = useConfig();
  
  const location = useLocation();
  const navigate = useNavigate();

  const authContextValue = useMemo(() => ({ currentUser, setCurrentUser }), [currentUser]);
  const municipalityContextValue = useMemo(() => ({ municipalities, setMunicipalities }), [municipalities]);

  // Sync modules when user permissions change
  useEffect(() => {
    const syncModules = async () => {
        setIsLoadingModules(true);
        if (currentUser) {
            try {
                await new Promise(r => setTimeout(r, 500)); // Small UX delay for smooth transition
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
  }, [currentUser?.id, currentUser?.role, currentUser?.planId]);

  // Persist municipality selection
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
  
  // Logic to prevent access to modules not allowed by plan
  const renderUserRoutes = () => {
    const currentPath = location.pathname.split('/')[1] || 'dashboard';
    
    if (activeModules.length > 0 && 
        !['settings', 'dashboard', 'admin'].includes(currentPath)) {
        
        const isAllowed = activeModules.some(m => m.view === currentPath);
        if (!isAllowed) {
             return <Navigate to="/dashboard" replace />;
        }
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
                      <Route path="/dashboard" element={<Dashboard municipality={municipality || ''} />} />
                      <Route path="/dashboard/settings" element={<DashboardSettings />} />
                      <Route path="/research" element={<ResearchModule />} />
                      <Route path="/political" element={<PoliticalNetwork />} />
                      <Route path="/political/:politicianId" element={<PoliticalModule />} />
                      <Route path="/political/settings" element={<PoliticalSettings />} />
                      <Route path="/employees" element={<EmployeesModule />} />
                      <Route path="/employees/settings" element={<EmployeesSettings />} />
                      <Route path="/companies" element={<CompaniesModule />} />
                      <Route path="/companies/settings" element={<CompaniesSettings />} />
                      <Route path="/contracts" element={<ContractsModule />} />
                      <Route path="/contracts/settings" element={<ContractsSettings />} />
                      <Route path="/judicial" element={<JudicialModule />} />
                      <Route path="/judicial/settings" element={<JudicialSettings />} />
                      <Route path="/social" element={<SocialMediaModule />} />
                      <Route path="/social/settings" element={<SocialMediaSettings />} />
                      <Route path="/timeline" element={<TimelineModule />} />
                      <Route path="/timeline/settings" element={<TimelineSettings />} />
                      <Route path="/ocr" element={<OcrModule />} />
                      <Route path="/settings" element={<UserSettings />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
        <AIChat />
      </div>
    );
  };

  if (isConfigLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-brand-primary"><Spinner /></div>;
  }

  const renderContent = () => {
    if (!currentUser) {
      return (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route 
            path="/" 
            element={
                homepage?.active 
                ? <Suspense fallback={<Spinner />}><Homepage config={homepage} /></Suspense> 
                : <Navigate to="/login" replace />
            } 
          />
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
