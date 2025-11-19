
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import type { DashboardData, DashboardWidget } from '../types';
import Spinner from './common/Spinner';
import DashboardHeader from './dashboard/DashboardHeader';
import MayorInfoCard from './dashboard/MayorInfoCard';
import ReputationRadarWidget from './dashboard/ReputationRadarWidget';
import CrisisThemesWidget from './dashboard/CrisisThemesWidget';
import SentimentDistributionWidget from './dashboard/SentimentDistributionWidget';
import IrregularitiesPanoramaWidget from './dashboard/IrregularitiesPanoramaWidget';
import HighImpactNewsWidget from './dashboard/HighImpactNewsWidget';
import MasterItemsTable from './dashboard/MasterItemsTable';
import DataSourcesFooter from './dashboard/DataSourcesFooter';

interface DashboardProps {
    municipality: string;
}

const Dashboard: React.FC<DashboardProps> = ({ municipality }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Drag and Drop State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const dragItemNode = useRef<HTMLDivElement | null>(null);

    // Load Widgets Config immediately
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

    // Load Data when municipality changes
    useEffect(() => {
        const fetchData = async () => {
            if (municipality) {
                setData(null);
                setError(null);
                try {
                    const dashboardData = await dbService.getDashboardData(municipality);
                    setData(dashboardData);
                } catch (e) {
                    setError('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
                    console.error(e);
                }
            }
        };
        fetchData();
    }, [municipality]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedItemIndex(index);
        dragItemNode.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        // Torna o elemento transparente visualmente durante o arraste (opcional, mas ajuda na UX)
        setTimeout(() => {
             if (dragItemNode.current) dragItemNode.current.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newWidgets = [...widgets];
        const draggedItemContent = newWidgets[draggedItemIndex];
        
        // Remove o item da posição antiga e insere na nova
        newWidgets.splice(draggedItemIndex, 1);
        newWidgets.splice(index, 0, draggedItemContent);

        setDraggedItemIndex(index);
        setWidgets(newWidgets);
    };

    const handleDragEnd = async () => {
        setDraggedItemIndex(null);
        if (dragItemNode.current) dragItemNode.current.style.opacity = '1';
        dragItemNode.current = null;
        
        // Persiste a nova ordem
        await dbService.saveDashboardWidgets(widgets);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessário para permitir o drop
    };

    if (error) {
         return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
                    <h3 className="font-bold text-lg">Ocorreu um Erro</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }
    
    // Only block if widgets config is not loaded yet. Data loading is handled by individual components.
    if (widgets.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <Spinner />
                <p className="mt-4 text-brand-light">Carregando layout...</p>
            </div>
        );
    }

    const isLoading = !data;

    // Helper to determine layout span
    const getColSpanClass = (widgetId: string) => {
        switch(widgetId) {
            case 'stats': return "md:col-span-6";
            case 'mayor': return "md:col-span-3";
            case 'vice_mayor': return "md:col-span-3";
            case 'reputation': return "md:col-span-2";
            case 'crisis': return "md:col-span-2";
            case 'sentiment': return "md:col-span-2";
            case 'irregularities': return "md:col-span-3";
            case 'news': return "md:col-span-3";
            case 'master_table': return "md:col-span-6";
            case 'data_sources': return "md:col-span-6";
            default: return "md:col-span-6";
        }
    };

    // Helper to render content
    const renderWidgetContent = (widgetId: string) => {
        switch(widgetId) {
            case 'stats': return <DashboardHeader stats={data?.stats} isLoading={isLoading} />;
            case 'mayor': return <MayorInfoCard official={data?.mayor} isLoading={isLoading} />;
            case 'vice_mayor': return <MayorInfoCard official={data?.viceMayor} isLoading={isLoading} />;
            case 'reputation': return <ReputationRadarWidget data={data?.reputationRadar} isLoading={isLoading} />;
            case 'crisis': return <CrisisThemesWidget data={data?.crisisThemes} isLoading={isLoading} />;
            case 'sentiment': return <SentimentDistributionWidget data={data?.sentimentDistribution} isLoading={isLoading} />;
            case 'irregularities': return <IrregularitiesPanoramaWidget data={data?.irregularitiesPanorama} isLoading={isLoading} />;
            case 'news': return <HighImpactNewsWidget data={data?.highImpactNews} isLoading={isLoading} />;
            case 'master_table': return <MasterItemsTable data={data?.masterItems} isLoading={isLoading} />;
            case 'data_sources': return <DataSourcesFooter sources={data?.dataSources} isLoading={isLoading} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">Dashboard de Análise</h2>
                    <p className="text-brand-light">
                        Exibindo visão estratégica para: <span className="font-semibold text-brand-text">{municipality}</span>
                        {isLoading && <span className="ml-2 text-xs animate-pulse">(Atualizando...)</span>}
                    </p>
                </div>
                <p className="text-xs text-brand-light/50 italic hidden md:block">Arraste os widgets para reorganizar</p>
            </div>

            {/* Flexible Grid Layout with Drag and Drop */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {widgets.map((widget, index) => {
                    if (!widget.visible) return null;

                    return (
                        <div 
                            key={widget.id} 
                            className={`${getColSpanClass(widget.id)} cursor-move transition-all duration-300 ease-in-out`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                        >
                            {renderWidgetContent(widget.id)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
