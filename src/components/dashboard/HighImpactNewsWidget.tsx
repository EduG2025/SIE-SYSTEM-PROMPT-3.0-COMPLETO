
import React, { useState } from 'react';
import type { HighImpactNews } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';

interface HighImpactNewsWidgetProps {
    data?: HighImpactNews[];
    isLoading?: boolean;
}

const getImpactPill = (impact: HighImpactNews['impact']) => {
    const styles: Record<HighImpactNews['impact'], string> = {
        'Crítico': 'bg-red-500/20 text-red-400 border border-red-500/30',
        'Alto': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        'Médio': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    };
    return <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${styles[impact]}`}>{impact}</span>;
}

const HighImpactNewsWidget: React.FC<HighImpactNewsWidgetProps> = ({ data, isLoading }) => {
    const [selectedNews, setSelectedNews] = useState<HighImpactNews | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [iframeError, setIframeError] = useState(false);

    const handleOpenNews = (news: HighImpactNews) => {
        setSelectedNews(news);
        setIframeError(false);
    };

    const NewsList: React.FC<{ items: HighImpactNews[]; limit?: number }> = ({ items, limit }) => (
        <div className="space-y-3 pr-2 custom-scrollbar">
            {items.slice(0, limit || items.length).map((item, index) => (
                <div 
                    key={index} 
                    onClick={() => handleOpenNews(item)}
                    className="block p-3 bg-brand-primary/50 border border-brand-accent/30 rounded-lg hover:bg-brand-primary hover:border-brand-blue/50 transition-all cursor-pointer group relative"
                >
                    <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-brand-text pr-2 text-sm line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
                        <div className="flex-shrink-0 ml-2">{getImpactPill(item.impact)}</div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-brand-light">
                        <div className="flex items-center gap-2">
                            <span className="font-mono opacity-70">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            <span className="w-1 h-1 rounded-full bg-brand-accent"></span>
                            <span>{item.source}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Card 
                title="Notícias de Impacto"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                infoTooltip="Monitoramento em tempo real de mídia. Clique para ler."
                onExpand={() => setIsExpanded(true)}
            >
                {isLoading || !data ? (
                    <div className="h-64 flex items-center justify-center">
                        <Spinner />
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-brand-light">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p>Nenhuma notícia relevante.</p>
                    </div>
                ) : (
                    <div className="h-64 overflow-y-auto custom-scrollbar pr-1">
                        <NewsList items={data} />
                    </div>
                )}
            </Card>

            {/* Modal de Lista Expandida */}
            {isExpanded && data && (
                <Modal title="Feed de Notícias Completo" onClose={() => setIsExpanded(false)} size="2xl">
                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <NewsList items={data} />
                    </div>
                </Modal>
            )}

            {/* Modal de Leitura Imersiva */}
            {selectedNews && (
                <Modal title="Leitura Imersiva" onClose={() => setSelectedNews(null)} size="4xl">
                    <div className="flex flex-col h-[80vh]">
                        <div className="mb-4 pb-4 border-b border-brand-accent/30 flex justify-between items-start">
                            <div className="pr-8">
                                <h2 className="text-2xl font-bold text-white leading-tight mb-2">{selectedNews.title}</h2>
                                <div className="flex items-center gap-3 text-sm text-brand-light">
                                    <span className="bg-brand-blue/10 text-brand-blue px-2 py-1 rounded font-mono text-xs border border-brand-blue/20">{selectedNews.source}</span>
                                    <span className="opacity-60">{new Date(selectedNews.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    {getImpactPill(selectedNews.impact)}
                                </div>
                            </div>
                            <a 
                                href={selectedNews.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center bg-brand-secondary hover:bg-brand-accent text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors border border-brand-accent"
                            >
                                Abrir no Navegador
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>

                        <div className="flex-grow bg-white rounded-xl overflow-hidden relative border border-brand-accent/30 shadow-inner">
                            {!iframeError ? (
                                <iframe 
                                    src={selectedNews.url} 
                                    className="w-full h-full border-0"
                                    title="News Content"
                                    sandbox="allow-scripts allow-same-origin"
                                    onError={() => setIframeError(true)}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8 text-center bg-gray-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <h3 className="text-xl font-bold mb-2 text-gray-700">Visualização Protegida</h3>
                                    <p className="max-w-md mb-6 text-gray-500">
                                        O site de origem ({selectedNews.source}) não permite a exibição embutida por segurança.
                                    </p>
                                    <a 
                                        href={selectedNews.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                                    >
                                        Ler Artigo Original
                                    </a>
                                </div>
                            )}
                            
                            {!iframeError && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs backdrop-blur-md cursor-pointer hover:bg-black/90 transition-colors" onClick={() => setIframeError(true)}>
                                    Não carregou? Clique aqui.
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default HighImpactNewsWidget;
