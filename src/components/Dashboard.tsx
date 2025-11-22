
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { dbService } from '../services/dbService';
import type { DashboardData, DashboardWidget } from '../types';
import Spinner from './common/Spinner';

// Lazy Load de Widgets
const DashboardHeader = lazy(() => import('./dashboard/DashboardHeader'));
const MayorInfoCard = lazy(() => import('./dashboard/MayorInfoCard'));
const ReputationRadarWidget = lazy(() => import('./dashboard/ReputationRadarWidget'));
const CrisisThemesWidget = lazy(() => import('./dashboard/CrisisThemesWidget'));
const SentimentDistributionWidget = lazy(() => import('./dashboard/SentimentDistributionWidget'));
const IrregularitiesPanoramaWidget = lazy(() => import('./dashboard/IrregularitiesPanoramaWidget'));
const HighImpactNewsWidget = lazy(() => import('./dashboard/HighImpactNewsWidget'));
const MasterItemsTable = lazy(() => import('./dashboard/MasterItemsTable'));
const DataSourcesFooter = lazy(() => import('./dashboard/DataSourcesFooter'));

interface DashboardProps {
    municipality: string;
}

// Ícones SVG
const RefreshIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" />
    </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const WIDGET_LAYOUT_CONFIG: Record<string, string> = {
    mayor: "md:col-span-3",
    vice_mayor: "md:col-span-3",
    stats: "md:col-span-6",
    crisis: "md:col-span-3",
    news: "md:col-span-3",
    reputation: "md:col-span-2",
    irregularities: "md:col-span-2",
    sentiment: "md:col-span-2",
    master_table: "md:col-span-6",
    data_sources: "md:col-span-6",
};

const WidgetSkeleton = () => (
    <div className="h-full w-full min-h-[240px] bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30 flex flex-col animate-pulse">
        <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-brand-primary rounded-lg mr-4"></div>
            <div className="h-6 bg-brand-primary rounded w-1/2"></div>
        </div>
        <div className="flex-grow space-y-4">
            <div className="h-4 bg-brand-primary/50 rounded w-full"></div>
            <div className="h-4 bg-brand-primary/50 rounded w-5/6"></div>
            <div className="h-4 bg-brand-primary/50 rounded w-3/4"></div>
            <div className="h-24 bg-brand-primary/30 rounded-lg w-full mt-4"></div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ municipality }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const dragItemNode = useRef<HTMLDivElement | null>(null);
    const [nextUpdateLabel, setNextUpdateLabel] = useState('Calculando...');

    useEffect(() => {
        const loadWidgets = async () => {
            try {
                const widgetsConfig = await dbService.getDashboardWidgets();
                setWidgets(widgetsConfig);
            } catch (e) {
                console.error("Failed to load widgets", e);
            }
        };
        loadWidgets();
    }, []);

    const fetchData = useCallback(async (refresh = false) => {
        if (!municipality) return;
        
        if (refresh) {
            setIsRefreshing(true);
        } else {
            if (!data) setIsInitialLoading(true);
            setError(null);
        }

        try {
            const dashboardData = await dbService.getDashboardData(municipality, refresh);
            setData(dashboardData);
            setError(null);
        } catch (e) {
            console.error(e);
            if (!refresh) {
                setError('Não foi possível carregar os dados.');
            }
        } finally {
            setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    }, [municipality, data]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (data?.nextUpdate) {
                const now = new Date().getTime();
                const next = new Date(data.nextUpdate).getTime();
                const diff = next - now;

                if (diff <= 0) {
                    setNextUpdateLabel("Atualizando...");
                    if (!isRefreshing && !isInitialLoading) fetchData(false);
                } else {
                    const mins = Math.floor(diff / 60000);
                    setNextUpdateLabel(mins > 0 ? `${mins} min` : '< 1 min');
                }
            }
        }, 60000);
        return () => clearInterval(timer);
    }, [data?.nextUpdate, fetchData, isRefreshing, isInitialLoading]);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (!isEditMode) { e.preventDefault(); return; }
        setDraggedItemIndex(index);
        dragItemNode.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
        setTimeout(() => { if (dragItemNode.current) dragItemNode.current.classList.add('opacity-50', 'scale-95'); }, 0);
    }, [isEditMode]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (!isEditMode || draggedItemIndex === null || draggedItemIndex === index) return;
        setWidgets(prev => {
            const newWidgets = [...prev];
            const draggedItemContent = newWidgets[draggedItemIndex];
            newWidgets.splice(draggedItemIndex, 1);
            newWidgets.splice(index, 0, draggedItemContent);
            return newWidgets;
        });
        setDraggedItemIndex(index);
    }, [draggedItemIndex, isEditMode]);

    const handleDragEnd = useCallback(async () => {
        if (dragItemNode.current) dragItemNode.current.classList.remove('opacity-50', 'scale-95');
        setDraggedItemIndex(null);
        dragItemNode.current = null;
        await dbService.saveDashboardWidgets(widgets);
    }, [widgets]);
    
    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);
    const toggleEditMode = async () => {
        if (isEditMode) await dbService.saveDashboardWidgets(widgets);
        setIsEditMode(!isEditMode);
    };

    const renderWidgetContent = (widgetId: string) => {
        if (isInitialLoading && !data) return <WidgetSkeleton />;

        return (
            <Suspense fallback={<WidgetSkeleton />}>
                {(() => {
                    switch(widgetId) {
                        case 'mayor': return <MayorInfoCard official={data?.mayor} isLoading={isInitialLoading} />;
                        case 'vice_mayor': return <MayorInfoCard official={data?.viceMayor} isLoading={isInitialLoading} />;
                        case 'stats': return <DashboardHeader stats={data?.stats} isLoading={isInitialLoading} />;
                        case 'reputation': return <ReputationRadarWidget data={data?.reputationRadar} isLoading={isInitialLoading} />;
                        case 'crisis': return <CrisisThemesWidget data={data?.crisisThemes} isLoading={isInitialLoading} />;
                        case 'sentiment': return <SentimentDistributionWidget data={data?.sentimentDistribution} isLoading={isInitialLoading} />;
                        case 'irregularities': return <IrregularitiesPanoramaWidget data={data?.irregularitiesPanorama} isLoading={isInitialLoading} />;
                        case 'news': return <HighImpactNewsWidget data={data?.highImpactNews} isLoading={isInitialLoading} />;
                        case 'master_table': return <MasterItemsTable data={data?.masterItems} isLoading={isInitialLoading} />;
                        case 'data_sources': return <DataSourcesFooter sources={data?.dataSources} isLoading={isInitialLoading} />;
                        default: return null;
                    }
                })()}
            </Suspense>
        );
    };

    if (error && !data) {
         return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 animate-fade-in-up">
                <div className="bg-brand-secondary border border-red-500/30 p-8 rounded-xl max-w-lg shadow-2xl">
                    <h3 className="font-bold text-xl text-white mb-2">Ops! Algo deu errado.</h3>
                    <p className="text-brand-light mb-6">{error}</p>
                    <button onClick={() => fetchData(false)} className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">Tentar Novamente</button>
                </div>
            </div>
        );
    }
    
    if (widgets.length === 0) return <div className="w-full h-full flex flex-col items-center justify-center p-20"><Spinner /><p className="mt-4 text-brand-light">Carregando...</p></div>;

    return (
        <div className="space-y-6 animate-fade-in-up pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard de Análise</h2>
                    <p className="text-brand-light mt-1">Visão estratégica para: <span className="font-semibold text-brand-cyan">{municipality}</span></p>
                    
                    {data?.lastAnalysis && (
                        <div className="mt-3 flex items-center gap-3 bg-brand-secondary/80 border border-brand-accent rounded-full pl-2 pr-4 py-1.5 shadow-sm w-fit">
                            <button 
                                onClick={() => fetchData(true)} 
                                disabled={isInitialLoading || isRefreshing}
                                className="p-2 bg-brand-blue hover:bg-blue-600 text-white rounded-full shadow-md transition-all disabled:opacity-50 hover:scale-105 group"
                                title="Forçar Atualização IA Agora"
                            >
                                <RefreshIcon className={`h-4 w-4 group-hover:rotate-180 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            
                            <div className="flex flex-col leading-none">
                                <div className="flex items-center text-[10px] text-brand-light uppercase font-bold tracking-wider mb-0.5">
                                    <span>Última Análise:</span>
                                    <span className="ml-1 text-white font-mono">{new Date(data.lastAnalysis).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center text-[10px] text-brand-light uppercase font-bold tracking-wider">
                                    <span>Próxima:</span>
                                    <span className={`ml-1 font-mono ${nextUpdateLabel.includes('Atualizando') ? 'text-brand-blue animate-pulse' : 'text-green-400'}`}>{nextUpdateLabel}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={toggleEditMode} className={`flex items-center text-sm font-semibold py-2 px-4 rounded-lg transition-all shadow-sm ${isEditMode ? 'bg-green-600 text-white' : 'bg-brand-secondary text-brand-light hover:text-white'}`}>
                        {isEditMode ? <><SaveIcon className="mr-2" /> Salvar Layout</> : <><EditIcon className="mr-2" /> Personalizar</>}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {widgets.map((widget, index) => {
                    if (!widget.visible) return null;
                    return (
                        <div 
                            key={widget.id} 
                            className={`${WIDGET_LAYOUT_CONFIG[widget.id] || "md:col-span-6"} transition-all duration-300 ease-in-out rounded-lg ${isEditMode ? 'border-2 border-dashed border-brand-blue/50 bg-brand-primary/30 cursor-grab hover:bg-brand-primary/50 scale-[0.98]' : 'border-transparent'}`}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                        >
                            <div className={isEditMode ? 'pointer-events-none opacity-80' : ''}>{renderWidgetContent(widget.id)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
