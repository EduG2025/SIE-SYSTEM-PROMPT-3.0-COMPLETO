
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { dbService } from '../services/dbService';
import type { DashboardData, DashboardWidget } from '../types';
import Spinner from './common/Spinner';

// Lazy Load de Widgets para reduzir o tamanho do bundle inicial e renderização
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

// Ícone de Atualização Local
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

// Configuração de Layout da Grade (Mobile First -> Desktop)
// Prioriza visualmente Prefeito e Vice no topo, seguido de Stats e Crise
const WIDGET_LAYOUT_CONFIG: Record<string, string> = {
    mayor: "md:col-span-3",          // Linha 1: Esquerda (50%)
    vice_mayor: "md:col-span-3",     // Linha 1: Direita (50%)
    stats: "md:col-span-6",          // Linha 2: Cabeçalho de métricas completo
    crisis: "md:col-span-3",         // Linha 3: Crise (Esquerda)
    news: "md:col-span-3",           // Linha 3: Notícias (Direita)
    reputation: "md:col-span-2",     // Linha 4: Radar
    irregularities: "md:col-span-2", // Linha 4: Detalhes
    sentiment: "md:col-span-2",      // Linha 4: Métricas
    master_table: "md:col-span-6",   // Linha 5: Dados Brutos
    data_sources: "md:col-span-6",   // Rodapé
};

// Componente de Loading Placeholder para evitar layout shift brusco
const WidgetSkeleton = () => (
    <div className="h-full w-full min-h-[200px] bg-brand-secondary/50 rounded-lg animate-pulse flex items-center justify-center border border-brand-accent/30">
        <Spinner />
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ municipality }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Estados separados para carregamento inicial (esqueleto) vs atualização (spinner no botão)
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Drag and Drop State & Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const dragItemNode = useRef<HTMLDivElement | null>(null);

    // Carrega configuração dos widgets (Layout)
    useEffect(() => {
        const loadWidgets = async () => {
            try {
                const widgetsConfig = await dbService.getDashboardWidgets();
                setWidgets(widgetsConfig);
            } catch (e) {
                console.error("Failed to load dashboard widgets config", e);
            }
        };
        loadWidgets();
    }, []);

    // Função centralizada de busca de dados
    const fetchData = useCallback(async (refresh = false) => {
        if (!municipality) return;
        
        if (refresh) {
            setIsRefreshing(true);
        } else {
            setIsInitialLoading(true);
            setError(null);
        }

        try {
            const dashboardData = await dbService.getDashboardData(municipality, refresh);
            setData(dashboardData);
            setError(null);
        } catch (e) {
            console.error(e);
            if (!refresh) {
                setError('Não foi possível carregar os dados do dashboard. Verifique sua conexão ou tente novamente.');
            }
        } finally {
            setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    }, [municipality]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (!isEditMode) {
            e.preventDefault();
            return;
        }
        setDraggedItemIndex(index);
        dragItemNode.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
        
        setTimeout(() => {
             if (dragItemNode.current) dragItemNode.current.classList.add('opacity-50', 'scale-95');
        }, 0);
    }, [isEditMode]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (!isEditMode || draggedItemIndex === null || draggedItemIndex === index) return;

        setWidgets(prevWidgets => {
            const newWidgets = [...prevWidgets];
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
    
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const toggleEditMode = async () => {
        if (isEditMode) {
            await dbService.saveDashboardWidgets(widgets);
        }
        setIsEditMode(!isEditMode);
    };

    const renderWidgetContent = (widgetId: string) => {
        // Suspense permite que widgets pesados carreguem independentemente
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
                    <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">Ops! Algo deu errado.</h3>
                    <p className="text-brand-light mb-6">{error}</p>
                    <button 
                        onClick={() => fetchData(false)}
                        className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }
    
    if (widgets.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <Spinner />
                <p className="mt-4 text-brand-light animate-pulse">Carregando layout estratégico...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard de Análise</h2>
                    <p className="text-brand-light mt-1">
                        Visão estratégica para: <span className="font-semibold text-brand-cyan">{municipality}</span>
                        {isRefreshing && <span className="ml-2 text-xs text-brand-blue animate-pulse font-medium">• Coletando novos dados...</span>}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={toggleEditMode}
                        className={`flex items-center text-sm font-semibold py-2 px-4 rounded-lg transition-all shadow-sm ${
                            isEditMode 
                                ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-brand-primary' 
                                : 'bg-brand-secondary hover:bg-brand-accent text-brand-light hover:text-white'
                        }`}
                    >
                        {isEditMode ? (
                            <>
                                <SaveIcon className="mr-2" />
                                Salvar Layout
                            </>
                        ) : (
                            <>
                                <EditIcon className="mr-2" />
                                Personalizar
                            </>
                        )}
                    </button>

                    <button 
                        onClick={() => fetchData(true)}
                        disabled={isInitialLoading || isRefreshing}
                        className="flex items-center bg-brand-accent hover:bg-brand-blue text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <RefreshIcon className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Dados (IA)'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {widgets.map((widget, index) => {
                    if (!widget.visible) return null;

                    return (
                        <div 
                            key={widget.id} 
                            className={`
                                ${WIDGET_LAYOUT_CONFIG[widget.id] || "md:col-span-6"} 
                                transition-all duration-300 ease-in-out rounded-lg
                                ${isEditMode 
                                    ? 'border-2 border-dashed border-brand-blue/50 bg-brand-primary/30 cursor-grab hover:bg-brand-primary/50 scale-[0.98]' 
                                    : 'border-transparent'
                                }
                            `}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                        >
                            {isEditMode && (
                                <div className="absolute inset-0 z-10 bg-transparent" />
                            )}
                            
                            <div className={isEditMode ? 'pointer-events-none opacity-80' : ''}>
                                {renderWidgetContent(widget.id)}
                            </div>

                            {isEditMode && (
                                <div className="absolute top-2 right-2 p-1 bg-brand-blue rounded text-white shadow-md z-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
