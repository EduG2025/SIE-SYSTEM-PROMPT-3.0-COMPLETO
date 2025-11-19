
import React from 'react';
import { Link } from 'react-router-dom';
import type { Official } from '../../types';
import Spinner from '../common/Spinner';

interface MayorInfoCardProps {
    official?: Official;
    isLoading?: boolean;
}

const MayorInfoCard: React.FC<MayorInfoCardProps> = ({ official, isLoading }) => {
    if (isLoading || !official) {
        return (
             <div className="bg-brand-secondary p-4 rounded-lg shadow-lg flex items-center justify-center h-full min-h-[116px]">
                <Spinner />
            </div>
        );
    }

    const cardContent = (
        <div className="bg-brand-secondary p-4 rounded-lg shadow-lg flex items-center h-full">
            <img 
                src={official.avatarUrl} 
                alt={`Foto de ${official.name}`} 
                className="w-20 h-20 rounded-full object-cover border-2 border-brand-accent flex-shrink-0 bg-brand-primary"
                referrerPolicy="no-referrer"
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(official.name)}&background=random&color=fff&size=128&font-size=0.4`;
                }}
            />
            <div className="ml-4">
                <h3 className="font-bold text-lg text-white">{official.name}</h3>
                <p className="text-brand-blue font-semibold">{official.position}</p>
                <p className="text-sm text-brand-light">{official.party}</p>
                <p className="text-xs text-brand-light mt-1">
                    Mandato: {new Date(official.mandate.start).toLocaleDateString('pt-BR')} - {new Date(official.mandate.end).toLocaleDateString('pt-BR')}
                </p>
            </div>
        </div>
    );

    if (official.politicianId) {
        return (
            <Link to={`/political/${official.politicianId}`} className="block hover:scale-105 transition-transform duration-200 h-full" title={`Iniciar análise de ${official.name}`}>
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

export default MayorInfoCard;
