
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { Company, CompanyAlert } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

// Ícones
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const AlertBadge: React.FC<{ alert: CompanyAlert }> = ({ alert }) => {
    const color = alert.severity === 'Alta' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return (
        <div className={`flex items-start p-2 rounded border ${color} mb-2`}>
            <AlertIcon />
            <div className="ml-2">
                <p className="text-xs font-bold uppercase">{alert.type}</p>
                <p className="text-xs">{alert.description}</p>
            </div>
        </div>
    );
};

const CompanyCard: React.FC<{ company: Company; expanded: boolean; onToggle: () => void; isHighlighted: boolean }> = ({ company, expanded, onToggle, isHighlighted }) => {
    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    return (
        <div className={`bg-brand-primary/30 border ${isHighlighted ? 'border-brand-blue ring-2 ring-brand-blue/30' : 'border-brand-accent'} rounded-lg overflow-hidden transition-all duration-300`}>
            {/* Header do Card */}
            <div className="p-4 cursor-pointer hover:bg-brand-primary/50 transition-colors" onClick={onToggle}>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg text-white">{company.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-brand-light mt-1">
                            <span className="font-mono">{company.cnpj || 'CNPJ não informado'}</span>
                            <span>•</span>
                            <span>{company.cnae || 'Atividade não informada'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-xs text-brand-light">Score de Risco</div>
                         <div className={`text-xl font-bold ${company.riskScore > 7 ? 'text-red-500' : company.riskScore > 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                             {company.riskScore}/10
                         </div>
                    </div>
                </div>
                
                {/* Badges de Resumo */}
                <div className="flex gap-2 mt-3">
                    {company.alerts && company.alerts.length > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 flex items-center">
                            <AlertIcon /> <span className="ml-1">{company.alerts.length} Alertas</span>
                        </span>
                    )}
                    <span className="text-xs bg-brand-secondary px-2 py-1 rounded border border-brand-accent text-brand-light">
                        {formatCurrency(company.totalContractsValue)} em contratos
                    </span>
                </div>
            </div>

            {/* Conteúdo Expandido (Abas) */}
            {expanded && (
                <div className="border-t border-brand-accent bg-brand-secondary/30 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Coluna 1: Sócios (QSA) */}
                        <div>
                            <h5 className="text-sm font-bold text-brand-cyan mb-2 flex items-center"><UsersIcon /> <span className="ml-2">Quadro Societário</span></h5>
                            {company.partners && company.partners.length > 0 ? (
                                <ul className="space-y-2">
                                    {company.partners.map((p, i) => (
                                        <li key={i} className="text-sm bg-brand-primary p-2 rounded border border-brand-accent/50">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-white">{p.name}</span>
                                                {p.isPoliticallyExposed && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded">PEP</span>}
                                            </div>
                                            <p className="text-xs text-brand-light">{p.role}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-brand-light italic">Nenhum sócio listado.</p>
                            )}
                        </div>

                        {/* Coluna 2: Alertas de Fraude */}
                        <div>
                            <h5 className="text-sm font-bold text-red-400 mb-2 flex items-center"><AlertIcon /> <span className="ml-2">Sinais de Alerta</span></h5>
                            {company.alerts && company.alerts.length > 0 ? (
                                company.alerts.map((alert, i) => <AlertBadge key={i} alert={alert} />)
                            ) : (
                                <p className="text-xs text-green-400 flex items-center"><span className="mr-1">✓</span> Sem alertas críticos detectados.</p>
                            )}
                        </div>

                         {/* Coluna 3: Conexões e Contratos */}
                         <div>
                             <h5 className="text-sm font-bold text-brand-blue mb-2 flex items-center"><DocumentIcon /> <span className="ml-2">Contratos & Vínculos</span></h5>
                             <div className="text-sm text-brand-light mb-2">
                                 <p>Total Contratado: <span className="text-white font-mono">{formatCurrency(company.totalContractsValue)}</span></p>
                             </div>
                             <button className="text-xs bg-brand-blue hover:bg-blue-600 text-white py-1.5 px-3 rounded w-full transition-colors">
                                 Ver Todos os Contratos
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const CompaniesModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
    
    const location = useLocation();
    const highlightedName = new URLSearchParams(location.search).get('highlight');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await dbService.getCompanies();
                setCompanies(data || []);
                
                // Auto-expand if highlighted
                if (highlightedName) {
                    const match = data.find(c => c.name.toLowerCase().includes(highlightedName.toLowerCase()));
                    if (match) setExpandedCompanyId(match.id);
                }
            } catch (error) {
                console.error("Failed to load companies", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [highlightedName]);

    const filteredCompanies = useMemo(() => {
        if (!searchTerm) return companies;
        return companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm));
    }, [searchTerm, companies]);

    if (loading) return <div className="flex justify-center h-full items-center"><Spinner /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Empresas e Contratos</h2>
                    <p className="text-brand-light">Análise forense de fornecedores, quadro societário e detecção de laranjas.</p>
                </div>
                <div className="flex gap-2">
                     <input
                        type="text"
                        placeholder="Buscar por nome ou CNPJ..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-brand-secondary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    <button 
                        onClick={() => dbService.getCompanies().then(setCompanies)} 
                        className="bg-brand-blue hover:bg-blue-600 text-white p-2 rounded-lg"
                        title="Atualizar Dados"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
                    </button>
                </div>
            </div>

            <div className="bg-brand-secondary p-6 rounded-xl shadow-lg">
                {filteredCompanies.length === 0 ? (
                    <div className="text-center py-12 text-brand-light border border-dashed border-brand-accent rounded-lg">
                        Nenhuma empresa encontrada. Tente atualizar a base de dados.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCompanies.map(company => (
                            <CompanyCard 
                                key={company.id} 
                                company={company} 
                                expanded={expandedCompanyId === company.id}
                                onToggle={() => setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id)}
                                isHighlighted={highlightedName ? company.name.toLowerCase().includes(highlightedName.toLowerCase()) : false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompaniesModule;
