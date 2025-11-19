import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PoliticianDataResponse } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

// Import newly created modular components
import ProfileCard from './political/ProfileCard';
import AssetGrowth from './political/AssetGrowth';
import HistoryTimeline from './political/HistoryTimeline';
import DonationsReceived from './political/DonationsReceived';
import Section from './political/Section';

// Lazy load complex components
const ConnectionGraph = lazy(() => import('./political/ConnectionGraph'));
const GeminiAnalysis = lazy(() => import('./political/GeminiAnalysis'));

// --- Helper Icon Component ---
const RefreshIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const FlagIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
);

const CashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
);


const PoliticalModule: React.FC = () => {
    const { politicianId } = useParams<{ politicianId: string }>();
    const navigate = useNavigate();
    const [response, setResponse] = useState<PoliticianDataResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDataForId = useCallback(async (id: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const data = await dbService.getPoliticianAnalysisData(id);
            setResponse(data);
        } catch (e) {
            // If data is missing in the 'stub', it might need detailed generation or ID is wrong
            setError('Político não encontrado ou dados ainda não coletados. Volte ao Dashboard e verifique o município.');
            setResponse(null);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (politicianId) {
            loadDataForId(politicianId);
        } else {
            // Redirect if no ID provided
            navigate('/dashboard');
        }
    }, [politicianId, loadDataForId, navigate]);

    const handleRefresh = useCallback(async () => {
        if (!politicianId) return;
        setError(null);
        setIsRefreshing(true);
        try {
            const data = await dbService.refreshPoliticianAnalysisData(politicianId);
            setResponse(data);
        } catch (e) {
            setError('Não foi possível atualizar os dados do político.');
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    }, [politicianId]);

    const handleSelectPolitician = useCallback((id: string) => {
        if (id !== politicianId) {
            navigate(`/political/${id}`);
        }
    }, [politicianId, navigate]);

    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>;
    }
    if (error || !response?.data) {
        return <div className="text-center text-red-400 p-8">{error || 'Dados não encontrados.'}</div>;
    }

    const politician = response.data;

    return (
        <div className="bg-sie-blue-950 p-4 md:p-6 min-h-screen text-gray-200 font-sans">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Módulo de Análise Política</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
                    <span className="ml-2">{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard politician={politician} />
                    <AssetGrowth assets={politician.assets} />
                </div>
                
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Section icon={<CalendarIcon />} title="Histórico Eleitoral">
                        <HistoryTimeline items={politician.electoralHistory} type="electoral" />
                    </Section>
                    <Section icon={<FlagIcon />} title="Histórico Partidário">
                        <HistoryTimeline items={politician.partyHistory} type="party" />
                    </Section>
                    <div className="md:col-span-2">
                        <Section icon={<CashIcon />} title="Doações de Campanha Recebidas">
                            <DonationsReceived donations={politician.donations.received} />
                        </Section>
                    </div>
                </div>
                
                <div className="lg:col-span-3">
                    <Section icon={<ShareIcon />} title="Teia de Conexões">
                        <div className="h-96">
                            <Suspense fallback={<div className="h-full flex items-center justify-center"><Spinner /></div>}>
                                <ConnectionGraph politician={politician} onSelectPolitician={handleSelectPolitician} />
                            </Suspense>
                        </div>
                    </Section>
                </div>

                <div className="lg:col-span-3">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Spinner /></div>}>
                        <GeminiAnalysis politician={politician} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default PoliticalModule;