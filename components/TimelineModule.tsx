
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { TimelineEvent } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const NominationIcon = () => (
    <div className="bg-green-500 rounded-full h-8 w-8 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    </div>
);
const ContractIcon = () => (
    <div className="bg-blue-500 rounded-full h-8 w-8 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    </div>
);
const LawsuitIcon = () => (
    <div className="bg-red-500 rounded-full h-8 w-8 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" />
        </svg>
    </div>
);
const SocialIcon = () => (
     <div className="bg-cyan-500 rounded-full h-8 w-8 flex items-center justify-center">
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await dbService.getTimelineEvents();
            setEvents(data);
            setLoading(false);
        };
        fetchData();
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
            <h3 className="text-2xl font-semibold mb-6">Linha do Tempo de Eventos Críticos</h3>
            <p className="text-brand-light mb-6">Esta linha do tempo conecta eventos de todos os módulos para criar uma rede investigativa unificada. Clique em um evento para navegar ao detalhe.</p>
            
            <div className="relative border-l-2 border-brand-accent ml-4">
                {events.map((event, index) => (
                    <div key={event.id} className="mb-8 pl-10 relative group">
                        {/* Icon Container */}
                        <div className="absolute -left-4 top-0 z-10">
                            {iconMap[event.icon.toLowerCase()] || iconMap[event.category.toLowerCase()]}
                        </div>
                        
                        {/* Date Label */}
                        <p className="text-sm text-brand-light mb-1 font-mono">
                            {new Date(event.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        
                        {/* Interactive Card */}
                        <Link 
                            to={getModuleLink(event)} 
                            className="block bg-brand-secondary/30 p-5 rounded-lg border border-brand-accent/30 hover:bg-brand-secondary hover:border-brand-blue/50 transition-all duration-300 relative overflow-hidden"
                        >
                             {/* Hover Effect Overlay */}
                             <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                             
                             <div className="relative z-10">
                                 <h4 className="font-bold text-lg text-white group-hover:text-brand-cyan flex items-center transition-colors">
                                     {event.title}
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                 </h4>
                                 <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-brand-primary text-brand-light mb-2 border border-brand-accent/50 mt-1">
                                    {event.category === 'Nomination' ? 'Nomeação' : event.category === 'Contract' ? 'Contrato' : event.category === 'Lawsuit' ? 'Processo' : 'Rede Social'}
                                 </span>
                                 <p className="text-brand-text text-sm leading-relaxed">{event.description}</p>
                             </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineModule;
