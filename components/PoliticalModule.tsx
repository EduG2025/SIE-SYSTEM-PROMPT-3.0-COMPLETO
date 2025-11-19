
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PoliticianDataResponse, Politician } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

// Import components
import AssetGrowth from './political/AssetGrowth';
import HistoryTimeline from './political/HistoryTimeline';
import DonationsReceived from './political/DonationsReceived';
import AnalysisTools from './political/AnalysisTools';
import RiskIndicator from './political/RiskIndicator';

// Lazy load
const ConnectionGraph = lazy(() => import('./political/ConnectionGraph'));
const GeminiAnalysis = lazy(() => import('./political/GeminiAnalysis'));

// --- Icons ---
const RefreshIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>;
const StarIcon = ({ filled, className }: { filled: boolean; className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const UserIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CurrencyIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShareIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const SparklesIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

type Tab = 'overview' | 'financial' | 'network' | 'intel';

const PoliticalModule: React.FC = () => {
    const { politicianId } = useParams<{ politicianId: string }>();
    const navigate = useNavigate();
    const [response, setResponse] = useState<PoliticianDataResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [error, setError] = useState<string | null>(null);

    const loadDataForId = useCallback(async (id: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const data = await dbService.getPoliticianAnalysisData(id);
            setResponse(data);
        } catch (e) {
            setError('Político não encontrado. Tente voltar ao Dashboard.');
            setResponse(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (politicianId) loadDataForId(politicianId);
        else navigate('/dashboard');
    }, [politicianId, loadDataForId, navigate]);

    const handleRefresh = useCallback(async () => {
        if (!politicianId) return;
        setIsRefreshing(true);
        try {
            const data = await dbService.refreshPoliticianAnalysisData(politicianId);
            setResponse(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    }, [politicianId]);

    const handleToggleMonitor = useCallback(async () => {
        if (!politicianId || !response?.data) return;
        setResponse(prev => prev ? { ...prev, data: { ...prev.data, monitored: !prev.data.monitored } } : null);
        try { await dbService.togglePoliticianMonitoring(politicianId); } catch (e) { console.error(e); }
    }, [politicianId, response]);

    if (isLoading) return <div className="w-full h-screen flex items-center justify-center"><Spinner /></div>;
    if (error || !response?.data) return <div className="text-center text-red-400 p-8">{error}</div>;

    const politician = response.data;
    const isDataShallow = !politician.bio || politician.bio.length < 50;

    return (
        <div className="min-h-screen bg-brand-primary text-gray-200 font-sans animate-fade-in-up">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-r from-sie-blue-950 to-sie-blue-900 border-b border-white/10 shadow-lg">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="relative">
                            <img 
                                src={politician.imageUrl} 
                                alt={politician.name} 
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 object-cover shadow-2xl"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(politician.name)}&background=random&size=128`; }}
                            />
                            {politician.monitored && (
                                <div className="absolute -bottom-2 -right-2 bg-brand-yellow text-brand-primary p-1.5 rounded-full border-2 border-sie-blue-900 shadow-sm" title="Monitorado">
                                    <StarIcon filled={true} className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-4xl font-bold text-white">{politician.name}</h1>
                                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${politician.risks.judicial === 'Crítico' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {politician.risks.judicial === 'Crítico' ? 'Alto Risco' : 'Em Análise'}
                                </span>
                            </div>
                            <p className="text-lg text-brand-cyan font-medium">{politician.position}</p>
                            <p className="text-brand-light text-sm">{politician.party} • {politician.state}</p>
                            
                            <div className="flex gap-4 mt-4">
                                <div className="flex gap-2">
                                    <RiskIndicator level={politician.risks.judicial} title="" />
                                    <span className="text-xs text-brand-light self-center">Judicial</span>
                                </div>
                                <div className="flex gap-2">
                                    <RiskIndicator level={politician.risks.financial} title="" />
                                    <span className="text-xs text-brand-light self-center">Financeiro</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${isDataShallow ? 'bg-brand-red hover:bg-red-600 text-white animate-pulse' : 'bg-brand-blue hover:bg-blue-600 text-white'}`}
                            >
                                {isRefreshing ? <Spinner /> : <RefreshIcon className="w-5 h-5" />}
                                <span>{isDataShallow ? 'Iniciar Investigação' : 'Atualizar Dados IA'}</span>
                            </button>
                            <button
                                onClick={handleToggleMonitor}
                                className="flex items-center justify-center space-x-2 px-6 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-brand-light hover:text-white transition-colors"
                            >
                                <StarIcon filled={!!politician.monitored} className="w-5 h-5" />
                                <span>{politician.monitored ? 'Parar Monitoramento' : 'Monitorar'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <nav className="flex space-x-8 overflow-x-auto custom-scrollbar" aria-label="Tabs">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: <UserIcon className="w-5 h-5" /> },
                            { id: 'financial', label: 'Histórico & Patrimônio', icon: <CurrencyIcon className="w-5 h-5" /> },
                            { id: 'network', label: 'Rede de Conexões', icon: <ShareIcon className="w-5 h-5" /> },
                            { id: 'intel', label: 'Inteligência Artificial', icon: <SparklesIcon className="w-5 h-5" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`
                                    flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                                    ${activeTab === tab.id 
                                        ? 'border-brand-cyan text-brand-cyan' 
                                        : 'border-transparent text-brand-light hover:text-white hover:border-white/30'}
                                `}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-brand-secondary border border-white/10 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Biografia & Contexto</h3>
                                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                                    {politician.bio || "Nenhuma biografia detalhada disponível. Utilize a função de investigação para coletar dados."}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-6">
                                    {politician.salary && (
                                        <div className="bg-brand-primary/50 px-4 py-2 rounded-lg border border-white/5">
                                            <p className="text-xs text-brand-light">Salário Estimado</p>
                                            <p className="text-lg font-mono font-bold text-green-400">
                                                {politician.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    )}
                                    {politician.socialMedia?.followers && (
                                        <div className="bg-brand-primary/50 px-4 py-2 rounded-lg border border-white/5">
                                            <p className="text-xs text-brand-light">Alcance Social</p>
                                            <p className="text-lg font-mono font-bold text-blue-400">
                                                {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(politician.socialMedia.followers)} seg.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <AnalysisTools politician={politician} />
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-brand-secondary border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Conexões Rápidas</h3>
                                <div className="space-y-3">
                                    {politician.connections.slice(0, 5).map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-brand-primary/30 rounded hover:bg-brand-primary/50 cursor-pointer transition-colors" onClick={() => navigate(`/companies?highlight=${encodeURIComponent(c.name)}`)}>
                                            <div className="flex items-center overflow-hidden">
                                                <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${c.risk === 'Alto' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                <span className="text-sm text-brand-text truncate">{c.name}</span>
                                            </div>
                                            <span className="text-xs text-brand-light">{c.relationship}</span>
                                        </div>
                                    ))}
                                    {politician.connections.length === 0 && <p className="text-sm text-brand-light italic">Nenhuma conexão mapeada.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <AssetGrowth assets={politician.assets} />
                        </div>
                        <div className="bg-brand-secondary border border-white/10 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><span className="mr-2">🗳️</span> Histórico Eleitoral</h3>
                            <HistoryTimeline items={politician.electoralHistory} type="electoral" />
                        </div>
                        <div className="bg-brand-secondary border border-white/10 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><span className="mr-2">🚩</span> Histórico Partidário</h3>
                            <HistoryTimeline items={politician.partyHistory} type="party" />
                        </div>
                        <div className="md:col-span-2 bg-brand-secondary border border-white/10 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Doações de Campanha</h3>
                            <DonationsReceived donations={politician.donations.received} />
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="h-[600px] bg-brand-secondary border border-white/10 rounded-xl overflow-hidden relative">
                         <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
                            <ConnectionGraph 
                                politician={politician} 
                                onSelectPolitician={(id) => navigate(`/political/${id}`)} 
                            />
                        </Suspense>
                    </div>
                )}

                {activeTab === 'intel' && (
                    <div className="space-y-6">
                        <Suspense fallback={<div className="py-12 flex justify-center"><Spinner /></div>}>
                            <GeminiAnalysis politician={politician} />
                        </Suspense>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PoliticalModule;
