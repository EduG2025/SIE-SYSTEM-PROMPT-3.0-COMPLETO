
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { dbService } from '../services/dbService';
import type { Politician, RiskLevel } from '../types';
import Spinner from './common/Spinner';
import RiskIndicator from './political/RiskIndicator';

const { Link, useNavigate } = ReactRouterDOM as any;

const ITEMS_PER_PAGE = 12;

// --- Tipos e Constantes do Grafo ---
type ViewMode = 'grid' | 'graph';

interface GraphNode {
    id: string;
    x: number;
    y: number;
    r: number;
    data: Politician;
    riskColor: string;
}

interface GraphLink {
    source: string;
    target: string;
    value: number;
}

const RISK_COLORS: Record<string, string> = {
    'Baixo': '#22C55E',   // Green
    'Médio': '#EAB308',   // Yellow
    'Alto': '#F97316',    // Orange
    'Crítico': '#EF4444', // Red
};

const getHighestRiskColor = (p: Politician): string => {
    if (p.risks.judicial === 'Crítico' || p.risks.financial === 'Crítico') return RISK_COLORS['Crítico'];
    if (p.risks.judicial === 'Alto' || p.risks.financial === 'Alto') return RISK_COLORS['Alto'];
    if (p.risks.judicial === 'Médio' || p.risks.financial === 'Médio') return RISK_COLORS['Médio'];
    return RISK_COLORS['Baixo'];
};

// --- Componente de Grafo Interativo ---
const NetworkGraph: React.FC<{ 
    politicians: Politician[], 
    onNodeClick: (p: Politician) => void 
}> = ({ politicians, onNodeClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Simulação de Layout de Força (Simplificado para evitar bibliotecas pesadas)
    const { nodes, links } = useMemo(() => {
        const width = 1200;
        const height = 800;
        const nodesData: GraphNode[] = [];
        const linksData: GraphLink[] = [];

        // 1. Criar Nós
        politicians.forEach((p, i) => {
            // Distribuição radial baseada no índice para evitar sobreposição inicial
            const angle = (i / (politicians.length || 1)) * 2 * Math.PI;
            const radius = 300 + (Math.random() * 100); // Variação orgânica
            
            nodesData.push({
                id: p.id,
                x: (width / 2) + Math.cos(angle) * radius,
                y: (height / 2) + Math.sin(angle) * radius,
                r: p.monitored ? 25 : 15, // Nós monitorados são maiores
                data: p,
                riskColor: getHighestRiskColor(p)
            });
        });

        // 2. Criar Links (Baseado em conexões declaradas ou mesmo partido)
        // Simplificação: Conecta todos ao "centro" virtual ou por partido
        // Em um cenário real, usaríamos p.connections, mas aqui usamos partido para agrupar visualmente
        nodesData.forEach((source, i) => {
            nodesData.forEach((target, j) => {
                if (i < j && source.data.party === target.data.party) {
                    linksData.push({ source: source.id, target: target.id, value: 1 });
                }
            });
        });

        return { nodes: nodesData, links: linksData };
    }, [politicians]);

    // Manipuladores de Zoom e Pan
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAdjustment = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(0.2, zoom + scaleAdjustment), 4);
        setZoom(newZoom);
    }, [zoom]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Filtro de Busca
    const activeNodes = useMemo(() => {
        if (!searchTerm) return nodes;
        const lowerTerm = searchTerm.toLowerCase();
        return nodes.filter(n => 
            n.data.name.toLowerCase().includes(lowerTerm) || 
            n.data.party.toLowerCase().includes(lowerTerm)
        );
    }, [nodes, searchTerm]);

    // Centralizar no nó buscado
    useEffect(() => {
        if (searchTerm && activeNodes.length > 0) {
            const target = activeNodes[0];
            // Centraliza a view no primeiro resultado
            // 600/400 é metade do w/h assumido do container
            setPan({ 
                x: -target.x * zoom + 600, 
                y: -target.y * zoom + 400 
            });
        }
    }, [searchTerm, activeNodes, zoom]);

    return (
        <div className="relative w-full h-[600px] bg-brand-secondary rounded-xl border border-brand-accent overflow-hidden">
            {/* Controles de UI Sobrepostos */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 w-64">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar na rede..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-brand-primary/90 backdrop-blur border border-brand-accent rounded-lg py-2 pl-8 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-blue outline-none shadow-lg"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-light absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                <div className="bg-brand-primary/90 backdrop-blur p-3 rounded-lg border border-brand-accent shadow-lg">
                    <p className="text-xs font-bold text-brand-light mb-2 uppercase tracking-wider">Legenda de Risco</p>
                    <div className="space-y-1.5">
                        {Object.entries(RISK_COLORS).map(([label, color]) => (
                            <div key={label} className="flex items-center text-xs">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                                <span className="text-gray-300">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 4))} className="bg-brand-primary hover:bg-brand-accent text-white p-2 rounded-lg shadow border border-brand-accent">+</button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))} className="bg-brand-primary hover:bg-brand-accent text-white p-2 rounded-lg shadow border border-brand-accent">-</button>
                <button onClick={() => { setZoom(1); setPan({x:0,y:0}); }} className="bg-brand-primary hover:bg-brand-accent text-white px-3 py-2 rounded-lg shadow border border-brand-accent text-xs font-bold">Reset</button>
            </div>

            {/* Área do SVG */}
            <svg 
                ref={svgRef}
                className="w-full h-full cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                    {/* Links (Linhas) */}
                    {links.map((link, i) => {
                        const source = nodes.find(n => n.id === link.source);
                        const target = nodes.find(n => n.id === link.target);
                        if (!source || !target) return null;
                        
                        // Se estamos buscando, ocultar links irrelevantes
                        const isRelevant = !searchTerm || (
                            activeNodes.includes(source) || activeNodes.includes(target)
                        );
                        
                        return (
                            <line 
                                key={i}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke={isRelevant ? "#30363D" : "#30363D30"}
                                strokeWidth={1}
                                opacity={isRelevant ? 0.6 : 0.1}
                            />
                        );
                    })}

                    {/* Nodes (Círculos) */}
                    {nodes.map((node) => {
                        const isDimmed = searchTerm && !activeNodes.includes(node);
                        const isActive = activeNodes.includes(node);

                        return (
                            <g 
                                key={node.id} 
                                transform={`translate(${node.x},${node.y})`}
                                onClick={() => onNodeClick(node.data)}
                                className="cursor-pointer transition-opacity duration-300"
                                style={{ opacity: isDimmed ? 0.1 : 1 }}
                            >
                                {/* Halo de Risco */}
                                {isActive && (
                                    <circle r={node.r + 5} fill={node.riskColor} opacity={0.2} className="animate-pulse" />
                                )}
                                
                                {/* Corpo do Nó */}
                                <circle 
                                    r={node.r} 
                                    fill="#0D1117" 
                                    stroke={node.riskColor} 
                                    strokeWidth={isActive ? 3 : 1.5} 
                                />
                                
                                {/* Imagem (Avatar) */}
                                <clipPath id={`clip-${node.id}`}>
                                    <circle r={node.r} />
                                </clipPath>
                                <image 
                                    href={node.data.imageUrl || `https://ui-avatars.com/api/?name=${node.data.name}`} 
                                    x={-node.r} y={-node.r} 
                                    width={node.r * 2} height={node.r * 2} 
                                    clipPath={`url(#clip-${node.id})`}
                                    preserveAspectRatio="xMidYMid slice"
                                />

                                {/* Label (Nome) */}
                                <text 
                                    y={node.r + 15} 
                                    textAnchor="middle" 
                                    className="text-[10px] fill-white font-medium pointer-events-none select-none shadow-black drop-shadow-md"
                                    style={{ fontSize: 10 / zoom }} // Scale text inverse to zoom
                                >
                                    {node.data.name.split(' ')[0]}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

const PoliticalNetwork: React.FC = () => {
    const [politicians, setPoliticians] = useState<Politician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedNode, setSelectedNode] = useState<Politician | null>(null);
    
    const topRef = useRef<HTMLDivElement>(null);
    const municipality = localStorage.getItem('selectedMunicipality') || 'Município Desconhecido';
    const navigate = useNavigate();

    const fetchPoliticians = async () => {
        const data = await dbService.getAllPoliticians();
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
        e.preventDefault();
        e.stopPropagation();
        await dbService.togglePoliticianMonitoring(id);
        setPoliticians(prev => prev.map(p => p.id === id ? { ...p, monitored: !p.monitored } : p));
    };

    const handleInvestigateNode = () => {
        if (selectedNode) {
            // Deep Linking para o módulo de Pesquisa com contexto
            const query = `Investigar profundamente as conexões, contratos e riscos de ${selectedNode.name} (${selectedNode.position}) em ${selectedNode.state}.`;
            navigate(`/research?autoQuery=${encodeURIComponent(query)}`);
        }
    };

    // Lógica de Paginação (Apenas para Grade)
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sie-blue-900/50 p-6 rounded-xl border border-brand-accent shadow-lg">
                <div>
                    <h2 className="text-3xl font-bold text-white">Rede Política de {municipality}</h2>
                    <p className="text-brand-light mt-1">
                        Monitorando <strong className="text-brand-cyan">{politicians.length}</strong> atores políticos nesta jurisdição.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="bg-brand-primary p-1 rounded-lg border border-brand-accent flex">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-brand-secondary text-white shadow' : 'text-brand-light hover:text-white'}`}
                        >
                            Grade
                        </button>
                        <button 
                            onClick={() => setViewMode('graph')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-brand-secondary text-white shadow' : 'text-brand-light hover:text-white'}`}
                        >
                            Teia Global
                        </button>
                    </div>

                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="flex items-center bg-brand-blue hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <>
                                <Spinner />
                                <span className="ml-2">IA Mapeando...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                Mapear Rede
                            </>
                        )}
                    </button>
                </div>
            </div>

            {politicians.length === 0 && !isScanning ? (
                <div className="text-center py-12 bg-brand-secondary/30 rounded-xl border border-dashed border-brand-accent">
                    <p className="text-brand-light text-lg mb-4">Nenhum político encontrado. Verifique sua conexão ou clique em "Mapear".</p>
                </div>
            ) : (
                <>
                    {viewMode === 'graph' ? (
                        <div className="flex gap-6 h-[600px]">
                            <div className="flex-grow">
                                <NetworkGraph politicians={politicians} onNodeClick={setSelectedNode} />
                            </div>
                            {/* Painel Lateral de Detalhes do Nó */}
                            {selectedNode && (
                                <div className="w-80 bg-brand-secondary border border-brand-accent rounded-xl p-5 shadow-2xl flex flex-col animate-fade-in-up">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-white leading-tight">{selectedNode.name}</h3>
                                        <button onClick={() => setSelectedNode(null)} className="text-brand-light hover:text-white">&times;</button>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={selectedNode.imageUrl} className="w-12 h-12 rounded-full object-cover bg-brand-primary" referrerPolicy="no-referrer" />
                                        <div>
                                            <p className="text-sm font-semibold text-brand-blue">{selectedNode.position}</p>
                                            <p className="text-xs text-brand-light">{selectedNode.party}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <RiskIndicator level={selectedNode.risks.judicial} title="Judicial" />
                                        <RiskIndicator level={selectedNode.risks.financial} title="Financeiro" />
                                    </div>
                                    <div className="mt-auto space-y-2">
                                        <Link 
                                            to={`/political/${selectedNode.id}`}
                                            className="block w-full bg-brand-primary hover:bg-brand-accent border border-brand-accent text-white text-center py-2 rounded text-sm font-medium transition-colors"
                                        >
                                            Ver Dossiê Completo
                                        </Link>
                                        <button 
                                            onClick={handleInvestigateNode}
                                            className="block w-full bg-brand-blue hover:bg-blue-600 text-white text-center py-2 rounded text-sm font-bold transition-colors shadow-lg"
                                        >
                                            🔍 Investigar na Teia
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Grid View Original */
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
                                        
                                        <button 
                                            onClick={(e) => toggleMonitoring(e, pol.id)}
                                            className={`absolute top-3 right-3 p-2 rounded-full transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                                                pol.monitored ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20' : 'text-brand-light/30 hover:text-yellow-400 hover:bg-brand-primary/50'
                                            }`}
                                            title={pol.monitored ? "Monitorado constantemente" : "Adicionar ao monitoramento"}
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
                                                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pol.name)}&background=random&color=fff&size=128&font-size=0.4`;
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
                </>
            )}
        </div>
    );
};

export default PoliticalNetwork;