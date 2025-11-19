
import React, { useState, useMemo } from 'react';
import type { MasterItem } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

const getSentimentPill = (sentiment: MasterItem['sentiment']) => {
    const styles: Record<MasterItem['sentiment'], string> = {
        'Positivo': 'bg-green-500/20 text-green-400',
        'Negativo': 'bg-red-500/20 text-red-400',
        'Neutro': 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[sentiment]}`}>{sentiment}</span>;
};

const getImpactPill = (impact: MasterItem['impact']) => {
    const styles: Record<MasterItem['impact'], string> = {
        'Crítico': 'bg-red-900 text-red-300',
        'Alto': 'bg-red-500/30 text-red-400',
        'Médio': 'bg-yellow-500/30 text-yellow-400',
        'Baixo': 'bg-blue-500/30 text-blue-400',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[impact]}`}>{impact}</span>;
};

const getReliabilityPill = (reliability: MasterItem['reliability']) => {
    if (!reliability) {
        return null;
    }
    const styles: Record<NonNullable<MasterItem['reliability']>, string> = {
        'Alta': 'bg-green-500/20 text-green-400',
        'Média': 'bg-yellow-500/20 text-yellow-400',
        'Baixa': 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[reliability]}`}>{reliability}</span>;
};

const FilterButton: React.FC<{ label: string; value: string; activeValue: string; onClick: (value: string) => void; }> = ({ label, value, activeValue, onClick }) => (
    <button 
        onClick={() => onClick(value)}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${activeValue === value ? 'bg-brand-blue text-white' : 'bg-brand-primary text-brand-light hover:bg-brand-accent'}`}
    >
        {label}
    </button>
);

interface MasterItemsTableProps {
    data?: MasterItem[];
    isLoading?: boolean;
}

const MasterItemsTable: React.FC<MasterItemsTableProps> = ({ data, isLoading }) => {
    const [sentimentFilter, setSentimentFilter] = useState('Todos');
    const [impactFilter, setImpactFilter] = useState('Todos');

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const sentimentMatch = sentimentFilter === 'Todos' || item.sentiment === sentimentFilter;
            const impactMatch = impactFilter === 'Todos' || item.impact === impactFilter;
            return sentimentMatch && impactMatch;
        });
    }, [data, sentimentFilter, impactFilter]);

    return (
        <Card title="Tabela Mestra de Itens">
            {isLoading || !data ? (
                <div className="h-64 flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Sentimento:</span>
                            <FilterButton label="Todos" value="Todos" activeValue={sentimentFilter} onClick={setSentimentFilter} />
                            <FilterButton label="Positivo" value="Positivo" activeValue={sentimentFilter} onClick={setSentimentFilter} />
                            <FilterButton label="Negativo" value="Negativo" activeValue={sentimentFilter} onClick={setSentimentFilter} />
                            <FilterButton label="Neutro" value="Neutro" activeValue={sentimentFilter} onClick={setSentimentFilter} />
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Impacto:</span>
                            <FilterButton label="Todos" value="Todos" activeValue={impactFilter} onClick={setImpactFilter} />
                            <FilterButton label="Crítico" value="Crítico" activeValue={impactFilter} onClick={setImpactFilter} />
                            <FilterButton label="Alto" value="Alto" activeValue={impactFilter} onClick={setImpactFilter} />
                            <FilterButton label="Médio" value="Médio" activeValue={impactFilter} onClick={setImpactFilter} />
                             <FilterButton label="Baixo" value="Baixo" activeValue={impactFilter} onClick={setImpactFilter} />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-brand-accent sticky top-0 bg-brand-secondary">
                                <tr>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Título</th>
                                    <th className="p-3">Fonte</th>
                                    <th className="p-3">Plataforma</th>
                                    <th className="p-3">Sentimento</th>
                                    <th className="p-3">Impacto</th>
                                    <th className="p-3">Confiab.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-accent/50">
                                {filteredData.map((item, index) => (
                                    <tr key={index} className="hover:bg-brand-accent/30">
                                        <td className="p-3 whitespace-nowrap">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-3 font-medium text-white max-w-sm">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline line-clamp-2" title={item.title}>{item.title}</a>
                                        </td>
                                        <td className="p-3 text-brand-light">{item.source}</td>
                                        <td className="p-3 text-brand-light">{item.platform}</td>
                                        <td className="p-3">{getSentimentPill(item.sentiment)}</td>
                                        <td className="p-3">{getImpactPill(item.impact)}</td>
                                        <td className="p-3">{getReliabilityPill(item.reliability)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Card>
    );
};

export default MasterItemsTable;
