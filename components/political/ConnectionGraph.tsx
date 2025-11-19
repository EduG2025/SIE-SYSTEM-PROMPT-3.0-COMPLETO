import React, { useState } from 'react';
import type { Politician, RiskLevel } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ConnectionGraphProps {
    politician: Politician;
    onSelectPolitician: (id: string) => void;
}

const riskColors: Record<RiskLevel, { stroke: string; fill: string }> = {
    'Baixo': { stroke: '#22C55E', fill: 'rgba(34, 197, 94, 0.1)' },
    'Médio': { stroke: '#EAB308', fill: 'rgba(234, 179, 8, 0.1)' },
    'Alto': { stroke: '#F97316', fill: 'rgba(249, 115, 22, 0.1)' },
    'Crítico': { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.1)' },
};

const ConnectionNode: React.FC<{
    conn: Politician['connections'][0];
    x: number;
    y: number;
    isRisky: boolean;
    highlightRisky: boolean;
    onClick: () => void;
}> = ({ conn, x, y, isRisky, highlightRisky, onClick }) => {
    const isClickable = conn.type === 'Político' || conn.type === 'Empresa' || conn.type === 'Doador';

    return (
        <g
            transform={`translate(${x}, ${y})`}
            className={isClickable ? 'cursor-pointer group' : ''}
            onClick={onClick}
        >
            {highlightRisky && isRisky && (
                <circle r="40" fill={riskColors[conn.risk].fill} stroke={riskColors[conn.risk].stroke} strokeWidth="1.5" strokeDasharray="3,3">
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.5s" repeatCount="indefinite" />
                </circle>
            )}
            <circle r="30" fill="#161B22" stroke={riskColors[conn.risk].stroke} strokeWidth="2" />
            <text fill="#E6EDF3" textAnchor="middle" fontSize="10" className="group-hover:fill-brand-cyan transition-colors">
                {conn.name.split(' ').slice(0, 2).map((word, lineIndex) => (
                    <tspan x="0" dy={lineIndex === 0 ? '-0.5em' : '1.2em'} key={lineIndex}>{word}</tspan>
                ))}
            </text>
        </g>
    );
};


const ConnectionGraph: React.FC<ConnectionGraphProps> = ({ politician, onSelectPolitician }) => {
    const [highlightRisky, setHighlightRisky] = useState(false);
    const navigate = useNavigate();
    const width = 500;
    const height = 384;
    const center = { x: width / 2, y: height / 2 };
    const radius = Math.min(width, height) / 2.5;

    const connections = politician.connections;
    const angleStep = (2 * Math.PI) / (connections.length || 1);

    return (
        <div className="relative w-full h-full">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                {/* Center Node */}
                <g transform={`translate(${center.x}, ${center.y})`}>
                    <circle r="40" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                    <text fill="#fff" textAnchor="middle" dy=".3em" fontSize="12" fontWeight="bold">
                        {politician.name.split(' ')[0]}
                    </text>
                </g>

                {/* Connection Nodes and Lines */}
                {connections.map((conn, i) => {
                    const angle = i * angleStep;
                    const x = center.x + radius * Math.cos(angle);
                    const y = center.y + radius * Math.sin(angle);
                    const isRisky = conn.risk === 'Alto' || conn.risk === 'Crítico';
                    
                    const handleNodeClick = () => {
                        if (conn.type === 'Político') {
                            onSelectPolitician(conn.id);
                        } else if (conn.type === 'Empresa' || conn.type === 'Doador') {
                            navigate(`/companies?highlight=${encodeURIComponent(conn.name)}`);
                        }
                    };

                    return (
                        <g key={conn.id}>
                            <line
                                x1={center.x}
                                y1={center.y}
                                x2={x}
                                y2={y}
                                stroke={riskColors[conn.risk].stroke}
                                strokeWidth="1"
                                strokeDasharray={conn.type === 'Político' ? "5,5" : "none"}
                            />
                           <ConnectionNode 
                                conn={conn} 
                                x={x} 
                                y={y} 
                                isRisky={isRisky}
                                highlightRisky={highlightRisky}
                                onClick={handleNodeClick}
                           />
                        </g>
                    );
                })}
            </svg>
            <div className="absolute bottom-2 right-2">
                 <button
                    onClick={() => setHighlightRisky(!highlightRisky)}
                    className={`text-xs font-semibold py-1 px-3 rounded-full transition-colors ${highlightRisky ? 'bg-red-500 text-white' : 'bg-brand-accent text-brand-light'}`}
                >
                    Destacar Conexões de Risco
                </button>
            </div>
        </div>
    );
};

export default ConnectionGraph;