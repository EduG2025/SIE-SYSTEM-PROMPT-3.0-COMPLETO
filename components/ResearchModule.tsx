
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { performDeepInvestigation } from '../services/geminiService';
import { dbService } from '../services/dbService';
import type { SearchFilters, InvestigationReport, InvestigativeConnection, InvestigativeMedia } from '../types';
import Spinner from './common/Spinner';
import MarkdownIt from 'markdown-it';
import { Link } from 'react-router-dom';

// --- Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const DocumentSearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-80 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UserAddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const LightningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

// --- Components ---

const FilterBadge: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
            active 
                ? 'bg-brand-blue border-brand-blue text-white' 
                : 'bg-brand-primary border-brand-accent text-brand-light hover:border-brand-light'
        }`}
    >
        {label}
    </button>
);

const SourceCard: React.FC<{ source: any; index: number }> = ({ source, index }) => (
    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-48 bg-brand-primary border border-brand-accent p-3 rounded-lg hover:border-brand-blue transition-colors group">
        <div className="flex items-center mb-2">
            <div className="w-5 h-5 rounded-full bg-brand-accent/50 text-brand-light text-[10px] flex items-center justify-center mr-2 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                {index + 1}
            </div>
            <p className="text-xs font-semibold text-brand-text truncate group-hover:text-brand-cyan">{source.title}</p>
        </div>
        <p className="text-[10px] text-brand-light truncate">{new URL(source.uri).hostname}</p>
    </a>
);

const MediaGallery: React.FC<{ media?: InvestigativeMedia[] }> = ({ media }) => {
    if (!media || media.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-brand-light mb-3">Mídia & Evidências Visuais</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((item, i) => (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" key={i} className="group relative block aspect-video bg-brand-primary rounded-lg overflow-hidden border border-brand-accent hover:border-brand-blue transition-all">
                        {/* Tenta renderizar se for imagem, senão mostra ícone */}
                        {item.type === 'Image' ? (
                            <img src={item.url} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" onError={(e) => {e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('flex','items-center','justify-center')}} />
                        ) : (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <PlayIcon />
                            </div>
                        )}
                        {/* Fallback visual se imagem falhar ou carregando */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <ImageIcon />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white truncate">{item.description || 'Mídia Detectada'}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

const InvestigationDashboard: React.FC<{ report: InvestigationReport }> = ({ report }) => {
    const md = new MarkdownIt({ html: true, linkify: true });
    const [activeConnections, setActiveConnections] = useState<InvestigativeConnection[]>([]);

    // Cross-check connections with DB on mount
    useEffect(() => {
        const checkDb = async () => {
            const politicians = await dbService.getAllPoliticians();
            const companies = await dbService.getCompanies();
            
            const enriched = report.connections.map(conn => {
                const polMatch = politicians.find(p => p.name.toLowerCase().includes(conn.name.toLowerCase()));
                if (polMatch) return { ...conn, dbMatchId: polMatch.id, linkToModule: `/political/${polMatch.id}` };
                
                const compMatch = companies.find(c => c.name.toLowerCase().includes(conn.name.toLowerCase()));
                if (compMatch) return { ...conn, dbMatchId: String(compMatch.id), linkToModule: `/companies?highlight=${encodeURIComponent(conn.name)}` };
                
                return conn;
            });
            setActiveConnections(enriched);
        };
        checkDb();
    }, [report.connections]);

    const sentimentColor = {
        'Positivo': 'text-green-400',
        'Neutro': 'text-gray-400',
        'Negativo': 'text-red-400'
    }[report.sentiment.label];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-brand-secondary p-4 rounded-lg border border-brand-accent/50">
                    <p className="text-xs text-brand-light uppercase tracking-wider mb-1">Sentimento da Análise</p>
                    <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${sentimentColor}`}>{report.sentiment.label}</span>
                        <div className="h-2 w-24 bg-brand-primary rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${report.sentiment.label === 'Positivo' ? 'bg-green-500' : report.sentiment.label === 'Negativo' ? 'bg-red-500' : 'bg-gray-500'}`} 
                                style={{ width: `${Math.abs(report.sentiment.score)}%` }}
                            ></div>
                        </div>
                    </div>
                    <p className="text-xs text-brand-light mt-1">{report.sentiment.summary}</p>
                </div>
                <div className="bg-brand-secondary p-4 rounded-lg border border-brand-accent/50">
                    <p className="text-xs text-brand-light uppercase tracking-wider mb-1">Pontos de Atenção (Red Flags)</p>
                    <p className="text-2xl font-bold text-white">{report.redFlags.length}</p>
                    <p className="text-xs text-brand-light mt-1">Indicadores de risco identificados.</p>
                </div>
                <div className="bg-brand-secondary p-4 rounded-lg border border-brand-accent/50">
                    <p className="text-xs text-brand-light uppercase tracking-wider mb-1">Fontes Analisadas</p>
                    <p className="text-2xl font-bold text-brand-cyan">{report.sources.length}</p>
                    <p className="text-xs text-brand-light mt-1">Cruzamento de dados oficiais.</p>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Summary & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Executive Summary */}
                    <div className="bg-brand-secondary p-6 rounded-xl shadow-lg border border-brand-accent/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <SparklesIcon /> <span className="ml-2">Síntese Executiva</span>
                        </h3>
                        <div 
                            className="prose prose-invert max-w-none prose-sm text-gray-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: md.render(report.executiveSummary) }}
                        />
                    </div>

                    {/* Media Gallery if available */}
                    <MediaGallery media={report.media} />

                    {/* Red Flags */}
                    {report.redFlags.length > 0 && (
                        <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-red-400 mb-4">Alertas de Risco</h3>
                            <div className="space-y-3">
                                {report.redFlags.map((flag, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-brand-primary/50 p-3 rounded-lg">
                                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${flag.severity === 'Crítico' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{flag.title}</p>
                                            <p className="text-xs text-brand-light mt-1">{flag.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sources Horizontal Scroll */}
                    <div>
                        <h4 className="text-sm font-bold text-brand-light mb-3">Fontes da Investigação</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {report.sources.map((src, i) => (
                                <SourceCard key={i} source={src} index={i} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Connections & Timeline */}
                <div className="space-y-6">
                    {/* Network Graph (List View) */}
                    <div className="bg-brand-secondary p-5 rounded-xl border border-brand-accent/30">
                        <h3 className="text-lg font-bold text-white mb-4">Rede de Conexões</h3>
                        <div className="space-y-3">
                            {activeConnections.length === 0 ? (
                                <p className="text-sm text-brand-light italic">Nenhuma conexão direta mapeada.</p>
                            ) : (
                                activeConnections.map((conn, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-brand-primary/50 rounded border border-brand-accent/20">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${conn.type === 'Pessoa' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {conn.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{conn.name}</p>
                                                <p className="text-[10px] text-brand-light truncate">{conn.role}</p>
                                            </div>
                                        </div>
                                        {conn.linkToModule && (
                                            <Link to={conn.linkToModule} className="text-brand-cyan hover:text-white p-1.5 rounded hover:bg-brand-cyan/20 transition-colors" title="Ver Perfil no Sistema">
                                                <LinkIcon />
                                            </Link>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Detected Profiles Section */}
                        {report.detectedProfiles && report.detectedProfiles.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-brand-accent/30">
                                <h4 className="text-sm font-bold text-brand-light mb-2">Novos Perfis Detectados</h4>
                                <div className="space-y-2">
                                    {report.detectedProfiles.map((profile, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs bg-brand-primary/30 p-2 rounded">
                                            <div>
                                                <span className="text-white font-medium">{profile.name}</span>
                                                <span className="text-brand-light block">{profile.role}</span>
                                            </div>
                                            <button className="text-green-400 hover:text-green-300 bg-green-900/20 p-1 rounded" title="Adicionar ao Monitoramento">
                                                <UserAddIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-brand-secondary p-5 rounded-xl border border-brand-accent/30 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <h3 className="text-lg font-bold text-white mb-4">Linha do Tempo Factual</h3>
                        <div className="relative pl-4 border-l border-brand-accent/50 space-y-6">
                            {report.timeline.map((fact, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-blue border-2 border-brand-secondary"></div>
                                    <span className="text-xs font-mono text-brand-cyan bg-brand-blue/10 px-2 py-0.5 rounded">{fact.date}</span>
                                    <p className="text-sm text-brand-light mt-1 leading-snug">{fact.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResearchModule: React.FC = () => {
    const { currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [report, setReport] = useState<InvestigationReport | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        fileType: 'any',
        sourceType: 'any',
        dateRange: 'any',
    });
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

    const municipality = localStorage.getItem('selectedMunicipality') || '';

    useEffect(() => {
        const loadSuggestions = async () => {
            const newSuggestions: string[] = [];
            
            // Busca paralela de dados para sugestões
            const [politicians, dashboardData] = await Promise.all([
                dbService.getAllPoliticians(),
                dbService.getDashboardData(municipality, false) // Usa cache se disponível
            ]);

            // 1. Políticos Monitorados
            const monitored = politicians.filter(p => p.monitored).slice(0, 2);
            monitored.forEach(p => {
                newSuggestions.push(`Investigar evolução patrimonial de ${p.name}`);
                newSuggestions.push(`Contratos e vínculos empresariais de ${p.name}`);
            });

            // 2. Temas de Crise (Dashboard)
            if (dashboardData?.crisisThemes && dashboardData.crisisThemes.length > 0) {
                const topTheme = dashboardData.crisisThemes[0];
                newSuggestions.push(`Investigar irregularidades sobre ${topTheme.theme} em ${municipality}`);
            }

            // 3. Fallbacks Genéricos se faltar dados
            if (newSuggestions.length < 4) {
                newSuggestions.push(`Quais empresas venceram mais licitações em ${municipality}?`);
                newSuggestions.push(`Levantar histórico de processos judiciais da Prefeitura de ${municipality}`);
            }

            setDynamicSuggestions(newSuggestions.slice(0, 4)); // Limita a 4 sugestões
        };
        
        if (municipality) {
            loadSuggestions();
        }
    }, [municipality]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setReport(null);
        
        // Simula feedback de passos de raciocínio
        const steps = ["Interpretando solicitação...", "Varrendo fontes oficiais e diários...", "Cruzando dados com base interna...", "Gerando dossiê forense..."];
        let stepIdx = 0;
        setLoadingStep(steps[0]);
        
        const interval = setInterval(() => {
            stepIdx++;
            if (stepIdx < steps.length) setLoadingStep(steps[stepIdx]);
        }, 1500);

        try {
            const result = await performDeepInvestigation(query, filters, currentUser);
            setReport(result);
        } catch (error) {
            console.error(error);
        } finally {
            clearInterval(interval);
            setIsSearching(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-brand-primary relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-blue/10 blur-[120px] pointer-events-none"></div>

            <div className="flex-grow overflow-y-auto custom-scrollbar z-10">
                <div className="max-w-6xl mx-auto w-full p-6 md:p-10">
                    
                    {/* Search Area - Moves to top if report exists */}
                    <div className={`transition-all duration-500 ease-in-out ${report || isSearching ? 'mb-8' : 'mt-[15vh] mb-12 text-center'}`}>
                        {!report && !isSearching && (
                            <>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                    Pesquisa <span className="text-brand-cyan">Investigativa</span>
                                </h1>
                                <p className="text-brand-light text-lg mb-8 max-w-2xl mx-auto">
                                    Faça perguntas complexas em linguagem natural. O S.I.E. cruza dados oficiais, notícias e redes sociais para gerar relatórios forenses detalhados.
                                </p>
                            </>
                        )}

                        <div className={`relative max-w-3xl ${!report && !isSearching ? 'mx-auto' : ''}`}>
                            <form onSubmit={handleSearch} className="relative z-20">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-purple rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ex: Investigar contratos da empresa X nos últimos 2 anos..."
                                        className="w-full bg-brand-secondary border border-brand-accent/50 rounded-xl py-4 pl-6 pr-16 text-lg text-white placeholder-brand-light/50 shadow-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all"
                                        autoFocus
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isSearching || !query.trim()}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-brand-blue hover:bg-blue-600 text-white p-2 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {isSearching ? <Spinner /> : <SearchIcon />}
                                    </button>
                                </div>
                            </form>

                            {/* Quick Filters */}
                            <div className="flex gap-2 mt-4 justify-center md:justify-start">
                                <FilterBadge label="Fontes Oficiais" active={filters.sourceType === 'official'} onClick={() => setFilters(p => ({...p, sourceType: p.sourceType === 'official' ? 'any' : 'official'}))} />
                                <FilterBadge label="Últimas 24h" active={filters.dateRange === '24h'} onClick={() => setFilters(p => ({...p, dateRange: p.dateRange === '24h' ? 'any' : '24h'}))} />
                                <FilterBadge label="PDFs/Docs" active={filters.fileType === 'pdf'} onClick={() => setFilters(p => ({...p, fileType: p.fileType === 'pdf' ? 'any' : 'pdf'}))} />
                            </div>
                        </div>

                        {/* Suggestions when idle */}
                        {!report && !isSearching && dynamicSuggestions.length > 0 && (
                            <div className="mt-12 max-w-3xl mx-auto">
                                <p className="text-sm text-brand-light uppercase tracking-wider mb-4 text-center md:text-left">Sugestões de Auditoria (Baseadas no Monitoramento)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dynamicSuggestions.map((s, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => { setQuery(s); handleSearch(); }}
                                            className="text-left p-4 bg-brand-secondary/50 border border-brand-accent/30 hover:border-brand-blue/50 rounded-xl transition-all hover:bg-brand-secondary group"
                                        >
                                            <div className="flex items-start">
                                                <div className="mt-1 mr-3 text-brand-light group-hover:text-brand-cyan">
                                                    {i % 2 === 0 ? <LightningIcon /> : <DocumentSearchIcon />}
                                                </div>
                                                <p className="text-sm text-brand-light group-hover:text-white font-medium leading-snug">{s}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loading State with Chain of Thought */}
                    {isSearching && (
                        <div className="max-w-3xl mx-auto text-center py-12">
                            <div className="inline-flex items-center justify-center p-4 bg-brand-secondary/80 backdrop-blur rounded-full border border-brand-accent mb-6 shadow-xl">
                                <Spinner />
                            </div>
                            <h3 className="text-2xl font-bold text-white animate-pulse mb-2">{loadingStep}</h3>
                            <p className="text-brand-light text-sm">O motor forense está processando milhares de registros.</p>
                        </div>
                    )}

                    {/* Results Dashboard */}
                    {report && <InvestigationDashboard report={report} />}

                </div>
            </div>
        </div>
    );
};

export default ResearchModule;
