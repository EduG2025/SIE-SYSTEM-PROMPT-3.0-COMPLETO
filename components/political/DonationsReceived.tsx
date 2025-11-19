import React from 'react';
import { Link } from 'react-router-dom';
import type { Donation, RiskLevel } from '../../types';
import RiskIndicator from './RiskIndicator';

interface DonationsReceivedProps {
    donations: Donation[];
}

const DonationsReceived: React.FC<DonationsReceivedProps> = ({ donations }) => {
    const riskRowColor: Record<RiskLevel, string> = {
        'Baixo': 'hover:bg-green-500/10',
        'Médio': 'hover:bg-yellow-500/10',
        'Alto': 'hover:bg-orange-500/10',
        'Crítico': 'hover:bg-red-500/10',
    };

    return (
        <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-sie-blue-900/80 backdrop-blur-sm">
                    <tr>
                        <th className="p-2">Doador</th>
                        <th className="p-2">Valor</th>
                        <th className="p-2">Risco</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {donations.map(d => (
                         <tr key={d.id} className={`transition-colors ${riskRowColor[d.risk]}`}>
                            <td className="p-2 font-medium">
                                <Link to={`/companies?highlight=${encodeURIComponent(d.donorName)}`} className="hover:text-brand-blue hover:underline">
                                    {d.donorName}
                                </Link>
                            </td>
                            <td className="p-2">{d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-2"><RiskIndicator level={d.risk} title="" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DonationsReceived;
