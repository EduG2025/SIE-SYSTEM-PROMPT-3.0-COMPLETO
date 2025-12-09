import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Donation, RiskLevel } from '../../types';
import RiskIndicator from './RiskIndicator';

const { Link } = ReactRouterDOM as any;

interface DonationsReceivedProps {
    donations: Donation[];
}

const ITEMS_PER_PAGE = 8;

const DonationsReceived: React.FC<DonationsReceivedProps> = ({ donations }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const riskRowColor: Record<RiskLevel, string> = {
        'Baixo': 'hover:bg-green-500/10',
        'Médio': 'hover:bg-yellow-500/10',
        'Alto': 'hover:bg-orange-500/10',
        'Crítico': 'hover:bg-red-500/10',
    };

    // Cálculos de Paginação
    const totalPages = Math.ceil(donations.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = donations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (donations.length === 0) {
        return <div className="text-brand-light text-center py-8 text-sm italic">Nenhuma doação registrada.</div>;
    }

    return (
        <div>
            <div className="overflow-x-auto rounded-lg border border-brand-accent/30">
                <table className="w-full text-left text-sm">
                    <thead className="bg-brand-secondary/80 backdrop-blur-sm border-b border-brand-accent/30">
                        <tr>
                            <th className="p-3 text-brand-light font-medium">Doador</th>
                            <th className="p-3 text-brand-light font-medium">Valor</th>
                            <th className="p-3 text-brand-light font-medium">Risco</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/10">
                        {currentItems.map(d => (
                             <tr key={d.id} className={`transition-colors ${riskRowColor[d.risk]}`}>
                                <td className="p-3 font-medium">
                                    <Link to={`/companies?highlight=${encodeURIComponent(d.donorName)}`} className="hover:text-brand-blue hover:underline text-white">
                                        {d.donorName}
                                    </Link>
                                    <div className="text-[10px] text-brand-light opacity-70">{d.type}</div>
                                </td>
                                <td className="p-3 text-brand-text font-mono">
                                    {d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="p-3"><RiskIndicator level={d.risk} title="" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-xs">
                    <span className="text-brand-light">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, donations.length)} de {donations.length}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-brand-primary border border-brand-accent rounded hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 bg-brand-secondary border border-brand-accent rounded text-brand-text font-mono">
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-brand-primary border border-brand-accent rounded hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DonationsReceived;