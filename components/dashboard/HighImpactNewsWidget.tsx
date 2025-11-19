
import React from 'react';
import type { HighImpactNews } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

interface HighImpactNewsWidgetProps {
    data?: HighImpactNews[];
    isLoading?: boolean;
}

const getImpactPill = (impact: HighImpactNews['impact']) => {
    const styles: Record<HighImpactNews['impact'], string> = {
        'Crítico': 'bg-red-900 text-red-300',
        'Alto': 'bg-red-500/30 text-red-400',
        'Médio': 'bg-yellow-500/30 text-yellow-400',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[impact]}`}>{impact}</span>;
}

const HighImpactNewsWidget: React.FC<HighImpactNewsWidgetProps> = ({ data, isLoading }) => {
    return (
        <Card title="Notícias de Alto Impacto">
            {isLoading || !data ? (
                <div className="h-64 flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <div className="space-y-3 h-64 overflow-y-auto pr-2">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-brand-primary rounded-md hover:bg-brand-accent transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-brand-text pr-2">{item.title}</p>
                                    {getImpactPill(item.impact)}
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xs text-brand-light">
                                    <span>{item.source} - {new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-brand-light">Nenhuma notícia de alto impacto encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default HighImpactNewsWidget;
