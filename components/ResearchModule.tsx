
import React, { useState, useEffect } from 'react';
import { performDeepInvestigation } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import type { SearchFilters, InvestigationResult, ExtractedEntity, SearchSource, MediaResult } from '../types';
import Spinner from './common/Spinner';
import MarkdownIt from 'markdown-it';
import { Link } from 'react-router-dom';

// --- Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

// Entity Icons
const PersonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CompanyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// --- Components ---

const FilterBadge: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        aria-pressed={active}
        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-blue ${
            active 
                ? 'bg-brand-blue border-brand-blue text-white' 
                : 'bg-transparent border-brand-accent text-brand-light hover:border-brand-blue hover:text-white'
        }`}
    >
        {label}
    </button>
);

const SourceCard: React.FC<{ source: SearchSource; index: number }> = ({ source, index }) => (
    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="block bg-brand-primary/50 border border-brand-accent/30 p-3 rounded-lg hover:bg-brand-accent/30 transition-colors group h-full focus:ring-2 focus:ring-brand-blue focus:outline-none">
        <div className="flex items-center mb-2">
            <div className="bg-brand-accent/50 text-brand-light text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full mr-2">
                {index + 1}
            </div>
            <p className="text-sm font-semibold text-brand-text truncate flex-1 group-hover:text-brand-cyan">{source.title}</p>
        </div>
        <p className="text-xs text-brand-light truncate opacity-70">{new URL(source.uri).hostname}</p>
    </a>
);

const EntityIntegrationTable: React.FC<{ entities: ExtractedEntity[] }> = ({ entities }) => {
    if (entities.length === 0) return null;

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'Person': return <PersonIcon />;
            case 'Company': return <CompanyIcon />;
            case 'Value': return <CurrencyIcon />;
            case 'Date': return <CalendarIcon />;
            case 'Location': return <LocationIcon />;
            default: return <GlobeIcon />;
        }
    };

    const formatEntityName = (entity: ExtractedEntity) => {
        if (entity.type === 'Value') {
            // Se for apenas números, tenta formatar. Se já vier com R$, deixa como está.
            const raw = entity.name.replace(/[^\d,.-]/g, '').replace(',', '.');
            const val = parseFloat(raw);
            if (!isNaN(val) && !entity.name.includes('R$')) {
                return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        }
        return entity.name;
    };

    return (
        <div className="bg-brand-primary/20 rounded-lg border border-brand-accent/30 overflow-hidden mt-6 shadow-sm">
            <div className="bg-brand-accent/10 px-4 py-3 border-b border-brand-accent/30 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-blue mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h4 className="font-semibold text-sm text-brand-text">Conexões com o Sistema (Cross-Linking)</h4>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-brand-light uppercase bg-brand-secondary/30">
                        <tr>
                            <th className="p-3 w-1/4">Entidade</th>
                            <th className="p-3 w-1/4">Tipo</th>
                            <th className="p-3 w-1/4">Contexto</th>
                            <th className="p-3 w-1/4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/20">
                        {entities.map((entity, idx) => (
                            <tr key={idx} className="hover:bg-brand-accent/10 transition-colors">
                                <td className="p-3 font-medium text-white font-mono">{formatEntityName(entity)}</td>
                                <td className="p-3 text-brand-light">
                                    <span className="flex items-center">
                                        {getTypeIcon(entity.type)} 
                                        {entity.type === 'Person' ? 'Pessoa' : 
                                         entity.type === 'Company' ? 'Empresa' : 
                                         entity.type === 'Value' ? 'Valor' :
                                         entity.type === 'Date' ? 'Data' :
                                         entity.type === 'Location' ? 'Local' : entity.type}
                                    </span>
                                </td>
                                <td className="p-3 text-xs text-brand-light truncate max-w-xs" title={entity.context}>
                                    {entity.context}
                                </td>
                                <td className="p-3 text-right">
                                    {entity.dbMatchId ? (
                                        <Link 
                                            to={entity.dbMatchType === 'politician' ? `/political/${entity.dbMatchId}` : `/companies?highlight=${encodeURIComponent(entity.name)}`} 
                                            className="text-xs bg-brand-blue/20 text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-1 rounded transition-colors inline-block border border-brand-blue/30"
                                        >
                                            Visualizar Perfil
                                        </Link>
                                    ) : (
                                        entity.type === 'Person' || entity.type === 'Company' ? (
                                            <span className="text-xs text-gray-500 cursor-not-allowed opacity-50" title="Monitoramento em breve">Adicionar +</span>
                                        ) : null
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const MediaItem: React.FC<{ item: MediaResult }> = ({ item }) => {
    const [hasError, setHasError] = useState(false);

    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group relative rounded-lg overflow-hidden border border-brand-accent hover:border-brand-blue transition-all bg-brand-secondary">
            <div className="aspect-video bg-brand-accent/20 flex items-center justify-center text-brand-light group-hover:text-brand-cyan relative">
                {/* Tenta renderizar imagem se não houver erro e for tipo imagem */}
                {!hasError && (item.type === 'image' || item.url.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                    <img 
                        src={item.url} 
                        alt={item.description} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <ImageIcon />
                )}
                
                {/* Overlay de indicação de link externo */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
            </div>
            <div className="p-2">
                <p className="text-xs font-bold text-white truncate">{item.description || 'Mídia Encontrada'}</p>
                <p className="text-[10px] text-brand-light truncate">{item.source}</p>
            </div>
        </a>
    );
};

const MediaGallery: React.FC<{ media: MediaResult[] }> = ({ media }) => {
    if (!media || media.length === 0) return (
        <div className="text-center p-8 text-brand-light border border-dashed border-brand-accent rounded-lg">
            <ImageIcon />
            <p className="mt-2 text-sm">Nenhuma mídia visual encontrada diretamente.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((item, index) => (
                <MediaItem key={index} item={item} />
            ))}
        </div>
    );
}

const ResearchModule: React.FC = () => {
    const { currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<InvestigationResult | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        fileType: 'any',
        sourceType: 'any',
        dateRange: 'any',
    });
    const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'media' | 'relations'>('overview');

    const municipality = localStorage.getItem('selectedMunicipality') || '';

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
    });

    // Enrich entities with DB data (Cross-Linking)
    const enrichEntities = async (rawEntities: ExtractedEntity[]) => {
        const politicians = await dbService.getAllPoliticians();
        const companies = await dbService.getCompanies();
        
        return rawEntities.map(ent => {
            const polMatch = politicians.find(p => p.name.toLowerCase().includes(ent.name.toLowerCase()));
            if (polMatch) return { ...ent, dbMatchId: polMatch.id, dbMatchType: 'politician' as const };
            
            const compMatch = companies.find(c => c.name.toLowerCase().includes(ent.name.toLowerCase()));
            if (compMatch) return { ...ent, dbMatchId: String(compMatch.id), dbMatchType: 'company' as const };
            
            return ent;
        });
    };

    const executeSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setResult(null);
        setActiveTab('overview');

        try {
            const investigation = await performDeepInvestigation(searchQuery, filters, currentUser);
            const enrichedEntities = await enrichEntities(investigation.entities);
            setResult({ ...investigation, entities: enrichedEntities });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(query);
    };

    // Active by Default Suggestions
    const quickStarters = [
        { label: `Investigar Contratos da Saúde`, query: `Irregularidades contratos saúde prefeitura ${municipality} valores` },
        { label: `Gastos com Educação`, query: `Gastos educação merenda escolar ${municipality} denúncias` },
        { label: `Empresas Vencedoras`, query: `Empresas vencedoras licitação ${municipality} sócios` },
        { label: `Escândalos Recentes`, query: `Escândalos corrupção ${municipality} último ano` },
    ];

    return (
        <div className="h-full flex flex-col bg-brand-primary">
            {/* Search Header */}
            <div className="bg-brand-secondary p-6 shadow-lg border-b border-brand-accent/20 flex-shrink-0 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto w-full">
                    <form onSubmit={handleSearch} className="relative mb-4">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue to-brand-cyan rounded-xl opacity-30 group-hover:opacity-60 blur transition duration-500"></div>
                            <div className="relative flex">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Investigar dados em ${municipality || '...'}`}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder-brand-light focus:outline-none text-shadow shadow-inner focus:ring-2 focus:ring-brand-blue"
                                    autoFocus
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-light">
                                    <SearchIcon />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSearching || !query.trim()}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brand-blue hover:bg-blue-600 text-white p-2.5 rounded-lg transition-all shadow-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-brand-blue"
                                    aria-label="Pesquisar"
                                >
                                     {isSearching ? <Spinner /> : <SearchIcon />}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center text-brand-light/70 text-xs font-bold uppercase tracking-wider mr-2">
                            <FilterIcon /> <span className="ml-1">Filtros:</span>
                        </div>
                        <FilterBadge label="Oficial (Gov/Jus)" active={filters.sourceType === 'official'} onClick={() => setFilters({...filters, sourceType: filters.sourceType === 'official' ? 'any' : 'official'})} />
                        <FilterBadge label="PDF / Docs" active={filters.fileType === 'pdf'} onClick={() => setFilters({...filters, fileType: filters.fileType === 'pdf' ? 'any' : 'pdf'})} />
                        <FilterBadge label="Últimas 24h" active={filters.dateRange === '24h'} onClick={() => setFilters({...filters, dateRange: filters.dateRange === '24h' ? 'any' : '24h'})} />
                        <FilterBadge label="Semana" active={filters.dateRange === 'week'} onClick={() => setFilters({...filters, dateRange: filters.dateRange === 'week' ? 'any' : 'week'})} />
                        <FilterBadge label="Mês" active={filters.dateRange === 'month'} onClick={() => setFilters({...filters, dateRange: filters.dateRange === 'month' ? 'any' : 'month'})} />
                        <FilterBadge label="Ano" active={filters.dateRange === 'year'} onClick={() => setFilters({...filters, dateRange: filters.dateRange === 'year' ? 'any' : 'year'})} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto w-full p-6">
                    
                    {/* Zero State / Quick Starters */}
                    {!isSearching && !result && (
                        <div className="flex flex-col items-center justify-center mt-20 animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-2">DeepSearch Intel</h2>
                            <p className="text-brand-light mb-10 text-center max-w-lg">Motor de busca investigativa com IA. Varre fontes oficiais, cruza dados e gera relatórios forenses.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                                {quickStarters.map((qs, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuery(qs.query); executeSearch(qs.query); }}
                                        className="text-left p-5 bg-brand-secondary border border-brand-accent hover:border-brand-blue rounded-xl transition-all hover:shadow-lg hover:shadow-brand-blue/10 group focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                    >
                                        <p className="font-bold text-white group-hover:text-brand-cyan mb-1">{qs.label}</p>
                                        <p className="text-xs text-brand-light">{qs.query}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isSearching && (
                         <div className="flex flex-col items-center justify-center mt-32 opacity-80">
                            <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-xl font-semibold text-white animate-pulse">Auditando Fontes Públicas...</p>
                            <p className="text-sm text-brand-light mt-2">Cruzando Diários Oficiais, Portais de Transparência e Notícias.</p>
                        </div>
                    )}

                    {/* Results View */}
                    {!isSearching && result && (
                        <div className="animate-fade-in-up space-y-6">
                            {/* Top Sources Bar */}
                            {result.sources.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {result.sources.slice(0, 5).map((src, i) => (
                                        <div key={i} className="min-w-[200px] max-w-[200px]">
                                            <SourceCard source={src} index={i} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tab Navigation */}
                            <div className="border-b border-brand-accent/50">
                                <nav className="flex space-x-6">
                                    <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-brand-light hover:text-white'}`}>Visão Geral</button>
                                    <button onClick={() => setActiveTab('sources')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sources' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-brand-light hover:text-white'}`}>Todas as Fontes ({result.sources.length})</button>
                                    <button onClick={() => setActiveTab('media')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'media' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-brand-light hover:text-white'}`}>Mídia (Beta)</button>
                                    <button onClick={() => setActiveTab('relations')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'relations' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-brand-light hover:text-white'}`}>Grafo de Relações</button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[400px]">
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="bg-brand-secondary p-6 rounded-xl shadow-lg border border-brand-accent/20">
                                                 <div className="prose prose-invert max-w-none prose-a:text-brand-blue prose-headings:text-brand-cyan text-gray-300 leading-relaxed">
                                                    <div dangerouslySetInnerHTML={{ __html: md.render(result.answer) }} />
                                                </div>
                                            </div>
                                            
                                            {/* Follow-up Questions */}
                                            {result.followUpQuestions.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-brand-light uppercase tracking-wider mb-3">Perguntas Sugeridas</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.followUpQuestions.map((q, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={() => { setQuery(q); executeSearch(q); }}
                                                                className="bg-brand-primary border border-brand-accent/50 hover:border-brand-blue text-sm text-brand-text hover:text-white px-4 py-2 rounded-lg transition-colors"
                                                            >
                                                                {q}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="lg:col-span-1 space-y-6">
                                            <div className="bg-brand-secondary p-4 rounded-xl border border-brand-accent/30 sticky top-6">
                                                <h3 className="font-bold text-white mb-4 flex items-center"><GlobeIcon /> <span className="ml-2">Entidades Identificadas</span></h3>
                                                <div className="space-y-3">
                                                    {result.entities.slice(0, 5).map((ent, i) => (
                                                        <div key={i} className="flex items-start p-2 bg-brand-primary rounded border border-brand-accent/20">
                                                            <div className="mt-1 mr-2 text-brand-blue">
                                                                {ent.type === 'Person' ? <PersonIcon /> : 
                                                                 ent.type === 'Company' ? <CompanyIcon /> :
                                                                 ent.type === 'Value' ? <CurrencyIcon /> : <GlobeIcon />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">{ent.name}</p>
                                                                <p className="text-xs text-brand-light line-clamp-2">{ent.context}</p>
                                                                {ent.dbMatchId && <span className="text-[10px] text-green-400 font-bold">● No Banco de Dados</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {result.entities.length > 5 && (
                                                     <button onClick={() => setActiveTab('relations')} className="w-full mt-4 text-xs text-brand-cyan hover:underline">Ver todas ({result.entities.length})</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'sources' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.sources.map((src, i) => (
                                            <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="p-4 bg-brand-secondary border border-brand-accent rounded-lg hover:bg-brand-accent/20 transition-colors">
                                                <h4 className="font-bold text-brand-blue mb-1 truncate">{src.title}</h4>
                                                <p className="text-xs text-brand-light truncate mb-2">{src.uri}</p>
                                                <p className="text-sm text-gray-400">{src.snippet || 'Sem descrição disponível.'}</p>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <MediaGallery media={result.media} />
                                )}

                                {activeTab === 'relations' && (
                                    <div>
                                        <p className="text-brand-light text-sm mb-4">Esta tabela cruza os dados encontrados na pesquisa com o banco de dados atual do sistema.</p>
                                        <EntityIntegrationTable entities={result.entities} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResearchModule;
