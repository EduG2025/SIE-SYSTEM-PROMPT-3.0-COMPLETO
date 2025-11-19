
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import type { Politician } from '../types';
import Spinner from './common/Spinner';
import RiskIndicator from './political/RiskIndicator';

const ITEMS_PER_PAGE = 12;

const PoliticalNetwork: React.FC = () => {
    const [politicians, setPoliticians] = useState<Politician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    const topRef = useRef<HTMLDivElement>(null);
    const municipality = localStorage.getItem('selectedMunicipality') || 'Município Desconhecido';

    const fetchPoliticians = async () => {
        const data = await dbService.getAllPoliticians();
        
        // Se a lista estiver vazia, busca automaticamente a liderança (Prefeito/Vice)
        if (data.length === 0) {
            setIsScanning(true);
            const leadership = await dbService.ensurePoliticalLeadership(municipality);
            setPoliticians(leadership);
            setIsScanning(false);
        } else {
            setPoliticians(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPoliticians();
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        await dbService.scanPoliticalSquad(municipality);
        const updatedList = await dbService.getAllPoliticians();
        setPoliticians(updatedList);
        setIsScanning(false);
    };

    const toggleMonitoring = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Previne navegação ao clicar na estrela
        e.stopPropagation();
        await dbService.togglePoliticianMonitoring(id);
        // Atualiza o estado local para refletir a mudança imediatamente
        setPoliticians(prev => prev.map(p => p.id === id ? { ...p, monitored: !p.monitored } : p));
    };

    // Lógica de Paginação
    const totalPages = Math.ceil(politicians.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPoliticians = politicians.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <Spinner />
                <p className="mt-4 text-brand-light animate-pulse">Iniciando módulo político e identificando liderança...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in-up" ref={topRef}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sie-blue-900/50 p-6 rounded-xl border border-brand-accent">
                <div>
                    <h2 className="text-3xl font-bold text-white">Rede Política de {municipality}</h2>
                    <p className="text-brand-light mt-1">
                        Monitorando <strong className="text-brand-cyan">{politicians.length}</strong> atores políticos nesta jurisdição.
                    </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="flex items-center bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:outline-none"
                    aria-label="Mapear novos atores políticos"
                >
                    {isScanning ? (
                        <>
                            <Spinner />
                            <span className="ml-2">IA Mapeando Rede...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Mapear Rede Política
                        </>
                    )}
                </button>
            </div>

            {politicians.length === 0 && !isScanning ? (
                <div className="text-center py-12 bg-brand-secondary/30 rounded-xl border border-dashed border-brand-accent">
                    <p className="text-brand-light text-lg mb-4">Nenhum político encontrado. Verifique sua conexão ou clique em "Mapear".</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentPoliticians.map((pol) => (
                            <Link 
                                to={`/political/${pol.id}`} 
                                key={pol.id}
                                className="group bg-brand-secondary border border-brand-accent rounded-xl overflow-hidden hover:border-brand-blue/50 transition-all hover:shadow-lg hover:shadow-brand-blue/10 flex flex-col relative focus:ring-2 focus:ring-brand-blue focus:outline-none"
                                aria-label={`Ver perfil de ${pol.name}`}
                            >
                                <div className="h-24 bg-gradient-to-r from-brand-blue/20 to-brand-primary"></div>
                                
                                {/* Botão de Monitoramento (Estrela) */}
                                <button 
                                    onClick={(e) => toggleMonitoring(e, pol.id)}
                                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                                        pol.monitored ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20' : 'text-brand-light/30 hover:text-yellow-400 hover:bg-brand-primary/50'
                                    }`}
                                    title={pol.monitored ? "Monitorado constantemente" : "Adicionar ao monitoramento"}
                                    aria-pressed={pol.monitored}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={pol.monitored ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>

                                <div className="px-6 relative flex-grow">
                                    <div className="w-20 h-20 rounded-full border-4 border-brand-secondary bg-brand-primary absolute -top-10 overflow-hidden shadow-md">
                                        <img 
                                            src={pol.imageUrl} 
                                            alt={pol.name} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                // Fallback seguro para imagem quebrada
                                                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pol.name)}&background=random&color=fff&size=128`;
                                            }} 
                                        />
                                    </div>
                                    <div className="mt-12 mb-4">
                                        <h3 className="font-bold text-lg text-white group-hover:text-brand-cyan transition-colors line-clamp-1" title={pol.name}>{pol.name}</h3>
                                        <p className="text-brand-blue text-sm font-semibold">{pol.position}</p>
                                        <p className="text-xs text-brand-light">{pol.party} • {pol.state}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <RiskIndicator level={pol.risks.judicial} title="Judicial" />
                                        <RiskIndicator level={pol.risks.financial} title="Financeiro" />
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-brand-primary/30 border-t border-brand-accent/30 flex justify-between items-center">
                                    <span className="text-xs text-brand-light">Clique para ver dossiê</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-light group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Controles de Paginação */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-brand-accent/30 mt-6 gap-4">
                            <p className="text-sm text-brand-light">
                                Mostrando <span className="font-bold text-white">{startIndex + 1}</span> a <span className="font-bold text-white">{Math.min(startIndex + ITEMS_PER_PAGE, politicians.length)}</span> de <span className="font-bold text-white">{politicians.length}</span> atores
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm font-mono bg-brand-secondary px-3 py-2 rounded border border-brand-accent">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg bg-brand-primary border border-brand-accent text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                >
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PoliticalNetwork;
