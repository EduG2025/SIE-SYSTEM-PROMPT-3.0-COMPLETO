import React from 'react';
import type { ElectoralHistoryEntry, PartyHistoryEntry } from '../../types';

export type TimelineType = 'electoral' | 'party';

interface HistoryTimelineProps {
    items: (ElectoralHistoryEntry | PartyHistoryEntry)[];
    type: TimelineType;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ items, type }) => {
    if (!items || items.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-brand-light text-sm italic border border-dashed border-brand-accent rounded-lg bg-brand-primary/20">
                Nenhum histórico disponível.
            </div>
        );
    }

    // Ordena decrescente por ano para mostrar o mais recente primeiro
    const sortedItems = [...items].sort((a, b) => b.year - a.year);

    return (
        <div className="relative pl-2 pr-2 max-h-80 overflow-y-auto custom-scrollbar py-2">
            {/* Linha contínua de fundo conectando os eventos */}
            <div className="absolute left-[19px] top-4 bottom-8 w-0.5 bg-brand-accent/40" />

            <div className="space-y-6">
                {sortedItems.map((item, index) => (
                    <div key={index} className="relative flex items-start group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Nó da Timeline (Bolinha) */}
                        <div className={`relative z-10 w-4 h-4 rounded-full mt-1.5 mr-4 border-2 border-brand-secondary flex-shrink-0 transition-all duration-300 group-hover:scale-125 ${
                            type === 'electoral' 
                                ? 'bg-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                                : 'bg-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                        }`} />
                        
                        {/* Card de Conteúdo do Evento */}
                        <div className="flex-1 bg-brand-primary/30 border border-brand-accent/30 rounded-lg p-3 hover:bg-brand-primary/60 hover:border-brand-accent/60 transition-all">
                             <div className="flex justify-between items-start mb-1">
                                <span className="text-brand-cyan font-bold text-sm font-mono bg-brand-secondary/50 px-2 py-0.5 rounded border border-brand-accent/20">
                                    {item.year}
                                </span>
                                
                                {/* Badge Condicional: Resultado Eleitoral */}
                                {'result' in item && (
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                        item.result === 'Eleito' 
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                            : 'bg-brand-accent/50 text-brand-light border-brand-accent/30'
                                    }`}>
                                        {item.result}
                                    </span>
                                )}

                                {/* Badge Condicional: Ação Partidária */}
                                {'action' in item && (
                                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                        item.action === 'Filiou-se'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        {item.action}
                                    </span>
                                )}
                             </div>

                             <div className="text-sm mt-2">
                                {/* Título Principal: Cargo ou Partido */}
                                {'position' in item ? (
                                    <p className="text-white font-semibold text-base mb-0.5 leading-tight">{item.position}</p>
                                ) : (
                                    // Para histórico partidário, o nome do partido é o destaque
                                    <p className="text-white font-semibold text-base mb-0.5 leading-tight">{'party' in item ? item.party : ''}</p>
                                )}
                                
                                <div className="flex items-center text-brand-light flex-wrap gap-y-1 text-xs mt-1">
                                    {/* Detalhes Eleitorais: Partido e Votos */}
                                    {'votes' in item && (
                                        <>
                                            {'party' in item && (
                                                <span className="font-semibold text-brand-text bg-brand-accent/20 px-1.5 rounded mr-1">
                                                    {item.party}
                                                </span>
                                            )}
                                            
                                            {item.votes > 0 && (
                                                <>
                                                    <span className="mx-1 opacity-50">•</span>
                                                    <span>{item.votes.toLocaleString('pt-BR')} votos</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryTimeline;