import React, { useState, useEffect } from 'react';
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

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-2xl font-semibold mb-6">Linha do Tempo de Eventos Críticos</h3>
            <div className="relative border-l-2 border-brand-accent ml-4">
                {events.map((event, index) => (
                    <div key={event.id} className="mb-8 pl-10 relative">
                        <div className="absolute -left-4 top-0">
                            {iconMap[event.icon.toLowerCase()] || iconMap[event.category.toLowerCase()]}
                        </div>
                        <p className="text-sm text-brand-light mb-1">{new Date(event.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <h4 className="font-bold text-lg text-white">{event.title}</h4>
                        <p className="text-brand-text">{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineModule;