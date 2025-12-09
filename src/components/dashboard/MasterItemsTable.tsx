
import React, { useState, useMemo, useEffect, memo } from 'react';
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

// Otimização: Componente de linha isolado e memoizado para evitar re-renderizações desnecessárias
const MasterItemRow = memo(({ item }: { item: MasterItem }) => (
    <tr className="hover:bg-brand-accent/30 transition-colors group">
        <td className="p-3 whitespace-nowrap text-brand-light text-xs font-mono">
            {new Date(item.date).toLocaleDateString('pt-BR')}
        </td>
        <td className="p-3 font-medium text-white max-w-sm">
            <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-brand-cyan hover:underline line-clamp-2 transition-colors block" 
                title={item.title}
            >
                {item.title}
            </a>
        </td>
        <td className="p-3 text-brand-light text-sm">{item.source}</td>
        <td className="p-3 text-brand-light text-sm">{item.platform}</td>
        <td className="p-3 whitespace-nowrap">{getSentimentPill(item.sentiment)}</td>
        <td className="p-3 whitespace-nowrap">{getImpactPill(item.impact)}</td>
        <td className="p-3 whitespace-nowrap">{getReliabilityPill(item.reliability)}</td>
    </tr>
));

interface MasterItemsTableProps {
    data?: MasterItem[];
    isLoading?: boolean;
}

const MasterItemsTable: React.FC<MasterItemsTableProps> = ({ data, isLoading }) => {
    const [sentimentFilter, setSentimentFilter] = useState('Todos');
    const [impactFilter, setImpactFilter] = useState('Todos');
    
    // Estado de Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default aumentado para 10

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const sentimentMatch = sentimentFilter === 'Todos' || item.sentiment === sentimentFilter;
            const impactMatch = impactFilter === 'Todos' || item.impact === impactFilter;
            return sentimentMatch && impactMatch;
        });
    }, [data, sentimentFilter, impactFilter]);

    // Reseta para a página 1 quando os filtros mudam
    useEffect(() => {
        setCurrentPage(1);
    }, [sentimentFilter, impactFilter]);

    // Cálculos de Paginação
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    // Otimização: Gera chave única baseada no conteúdo para ajudar o React
    const getItemKey = (item: MasterItem, index: number) => {
        return item.url ? `${item.url}-${index}` : `item-${index}-${item.date}`;
    };

    return (
        <Card title="Tabela Mestra de Itens">
            {isLoading || !data ? (
                <div className="h-64 flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Controles de Filtro */}
                    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-brand-primary/30 rounded-lg border border-brand-accent/20">
                        <div className="flex flex-col">
                            <label className="text-xs text-brand-light mb-1 font-semibold">Sentimento</label>
                            <select
                                value={sentimentFilter}
                                onChange={(e) => setSentimentFilter(e.target.value)}
                                className="bg-brand-secondary border border-brand-accent rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-blue min-w-[120px]"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Positivo">Positivo</option>
                                <option value="Negativo">Negativo</option>
                                <option value="Neutro">Neutro</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-brand-light mb-1 font-semibold">Impacto</label>
                            <select
                                value={impactFilter}
                                onChange={(e) => setImpactFilter(e.target.value)}
                                className="bg-brand-secondary border border-brand-accent rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-blue min-w-[120px]"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Crítico">Crítico</option>
                                <option value="Alto">Alto</option>
                                <option value="Médio">Médio</option>
                                <option value="Baixo">Baixo</option>
                            </select>
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto flex-grow min-h-[200px]">
                        <table className="w-full text-left text-sm table-auto">
                            <thead className="border-b border-brand-accent sticky top-0 bg-brand-secondary z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-24">Data</th>
                                    <th className="p-3 min-w-[200px]">Título</th>
                                    <th className="p-3 w-32">Fonte</th>
                                    <th className="p-3 w-24">Plataforma</th>
                                    <th className="p-3 w-24">Sentimento</th>
                                    <th className="p-3 w-24">Impacto</th>
                                    <th className="p-3 w-24">Confiab.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-accent/50">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item, index) => (
                                        <MasterItemRow key={getItemKey(item, index)} item={item} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-brand-light italic">
                                            Nenhum item encontrado com os filtros atuais.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Controles de Paginação */}
                    {filteredData.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-3 border-t border-brand-accent/30 gap-3">
                            <div className="flex items-center gap-2 text-sm text-brand-light">
                                <span>Itens por página:</span>
                                <select 
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-brand-primary border border-brand-accent rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="hidden sm:inline ml-2 border-l border-brand-accent pl-2">
                                    Total: <strong>{filteredData.length}</strong> registros
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 rounded bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors"
                                    title="Primeira Página"
                                >
                                    &laquo;
                                </button>
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors"
                                >
                                    Anterior
                                </button>
                                
                                <span className="text-sm text-white px-2 font-mono">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors"
                                >
                                    Próximo
                                </button>
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 rounded bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors"
                                    title="Última Página"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default memo(MasterItemsTable);
