
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { TimelineEvent } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const { Link } = ReactRouterDOM as any;

const NominationIcon = () => (
    <div className="bg-green-500 rounded-full h-8 w-8 flex items-center justify-center shadow-lg shadow-green-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    </div>
);
const ContractIcon = () => (
    <div className="bg-blue-500 rounded-full h-8 w-8 flex items-center justify-center shadow-lg shadow-blue-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    </div>
);
const LawsuitIcon = () => (
    <div className="bg-red-500 rounded-full h-8 w-8 flex items-center justify-center shadow-lg shadow-red-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" />
        </svg>
    </div>
);
const SocialIcon = () => (
     <div className="bg-cyan-500 rounded-full h-8 w-8 flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
    </div>
);

const iconMap: Record<string, React.ReactNode> = {
    nomination: <NominationIcon />,
    contract: <ContractIcon />,
    lawsuit: <LawsuitIcon />,
    'social media': <SocialIcon />,
};

const TimelineModule: React.FC = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Agrega eventos de todos os módulos para criar uma visão unificada
    useEffect(() => {
        const fetchAndAggregate = async () => {
            setLoading(true);
            
            // Busca dados de todas as fontes
            const [timelineData, contracts, lawsuits] = await Promise.all([
                dbService.getTimelineEvents(),
                dbService.getContracts(),
                dbService.getLawsuits()
            ]);

            // Normaliza contratos em eventos
            const contractEvents: TimelineEvent[] = contracts.map(c => ({
                id: Date.now() + Math.random(),
                date: c.startDate,
                title: `Contrato Assinado: ${c.companyName}`,
                description: `${c.object} - Valor: ${c.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
                category: 'Contract',
                icon: 'contract',
                relatedId: c.id,
                relatedModule: 'contracts'
            }));

            // Normaliza processos em eventos
            const lawsuitEvents: TimelineEvent[] = lawsuits.map(l => ({
                id: Date.now() + Math.random(),
                date: new Date().toISOString().split('T')[0], // Fallback se não houver data específica
                title: `Processo: ${l.id}`,
                description: `${l.court} - ${l.status}. Partes: ${l.parties}`,
                category: 'Lawsuit',
                icon: 'lawsuit',
                relatedId: l.id,
                relatedModule: 'judicial'
            }));

            // Une e ordena
            const allEvents = [...timelineData, ...contractEvents, ...lawsuitEvents];
            const sortedEvents = allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setEvents(sortedEvents);
            setLoading(false);
        };
        fetchAndAggregate();
    }, []);

    // Deep Linking Logic: Retorna a rota com query params para destacar o item
    const getModuleLink = (event: TimelineEvent) => {
        const cat = event.category.toLowerCase();
        const idParam = event.relatedId ? `?highlight=${encodeURIComponent(event.relatedId)}` : `?highlight=${encodeURIComponent(event.title)}`;

        switch(cat) {
            case 'contract': return `/contracts${idParam}`;
            case 'lawsuit': return `/judicial${idParam}`;
            case 'nomination': return `/employees${idParam}`;
            case 'social media': return `/social${idParam}`;
            default: return '#';
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="p-4 animate-fade-in-up">
            <h3 className="text-2xl font-bold text-white mb-2">Linha do Tempo Unificada</h3>
            <p className="text-brand-light mb-8">Visão cronológica consolidada de todos os eventos do sistema: movimentações políticas, contratos, processos e alertas sociais.</p>
            
            <div className="relative border-l-2 border-brand-accent ml-4">
                {events.map((event, index) => (
                    <div key={event.id} className="mb-8 pl-10 relative group">
                        {/* Icon Container */}
                        <div className="absolute -left-4 top-0 z-10 bg-brand-primary rounded-full border-4 border-brand-primary">
                            {iconMap[event.icon.toLowerCase()] || iconMap[event.category.toLowerCase()]}
                        </div>
                        
                        {/* Date Label */}
                        <div className="absolute -left-36 top-1 w-28 text-right hidden md:block">
                            <p className="text-sm font-bold text-white">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs text-brand-light">{new Date(event.date).getFullYear()}</p>
                        </div>
                        
                        {/* Interactive Card */}
                        <Link 
                            to={getModuleLink(event)} 
                            className="block bg-brand-secondary border border-brand-accent rounded-xl p-5 hover:border-brand-blue/50 hover:shadow-lg hover:shadow-brand-blue/10 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1"
                        >
                             <div className="md:hidden text-xs font-mono text-brand-light mb-2">
                                 {new Date(event.date).toLocaleDateString('pt-BR')}
                             </div>

                             <div className="relative z-10">
                                 <div className="flex justify-between items-start">
                                     <h4 className="font-bold text-lg text-white group-hover:text-brand-cyan transition-colors">
                                         {event.title}
                                     </h4>
                                     <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-brand-primary border border-brand-accent text-brand-light">
                                        {event.category === 'Nomination' ? 'Nomeação' : event.category === 'Contract' ? 'Contrato' : event.category === 'Lawsuit' ? 'Processo' : 'Rede Social'}
                                     </span>
                                 </div>
                                 
                                 <p className="text-gray-300 text-sm leading-relaxed mt-2">{event.description}</p>
                                 
                                 <div className="mt-3 flex items-center text-xs text-brand-blue font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                     Ver Detalhes 
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                 </div>
                             </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineModule;