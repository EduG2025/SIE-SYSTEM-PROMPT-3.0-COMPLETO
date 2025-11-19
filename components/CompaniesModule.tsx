

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Company } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const CompaniesModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const highlightedRowRef = useRef<HTMLTableRowElement>(null);

    const highlightedCompany = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('highlight');
    }, [location.search]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await dbService.getCompanies();
            setCompanies(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (highlightedRowRef.current) {
            highlightedRowRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [highlightedCompany, loading]);

    const filteredCompanies = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) {
            return companies;
        }
        return companies.filter(company =>
            company.name.toLowerCase().includes(lowercasedFilter) ||
            company.totalContractsValue.toString().includes(searchTerm)
        );
    }, [searchTerm, companies]);
    
    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Empresas e Contratos</h3>
                <input
                    type="text"
                    placeholder="Filtrar por nome ou valor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-xs bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-brand-accent">
                        <tr>
                        <th className="p-3">Nome da Empresa</th>
                        <th className="p-3">CNPJ</th>
                        <th className="p-3">Valor Total Contratado</th>
                        <th className="p-3">Pontuação de Risco</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompanies.length > 0 ? (
                            filteredCompanies.map((c) => {
                                const isHighlighted = c.name === highlightedCompany;
                                return (
                                <tr 
                                    key={c.id} 
                                    ref={isHighlighted ? highlightedRowRef : null}
                                    className={`border-b border-brand-accent/50 transition-all duration-500 ${isHighlighted ? 'bg-brand-blue/20 ring-2 ring-brand-blue' : 'hover:bg-brand-accent/50'}`}
                                >
                                    <td className="p-3 font-medium">{c.name}</td>
                                    <td className="p-3 text-brand-light">{c.cnpj}</td>
                                    <td className="p-3 text-brand-light">{c.totalContractsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3 font-bold" style={{ color: c.riskScore > 8 ? '#f87171' : c.riskScore > 6 ? '#fbbf24' : '#4ade80' }}>{c.riskScore}/10</td>
                                </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center p-4 text-brand-light">
                                    Nenhuma empresa encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompaniesModule;