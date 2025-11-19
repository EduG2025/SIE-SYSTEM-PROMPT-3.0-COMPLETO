
import React, { lazy, Suspense } from 'react';
import type { Politician } from '../../types';
import Section from './Section';
import RiskIndicator from './RiskIndicator';
import Spinner from '../common/Spinner';

const ReputationRadar = lazy(() => import('./ReputationRadar'));

interface ProfileCardProps {
    politician: Politician;
}

const UserGroupIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

const ProfileCard: React.FC<ProfileCardProps> = ({ politician }) => (
    <Section icon={<UserGroupIcon />} title="Perfil do Político">
        <div className="text-center">
            <img 
                src={politician.imageUrl} 
                alt={politician.name} 
                className="w-32 h-32 rounded-full mx-auto border-4 border-brand-accent object-cover shadow-md bg-brand-primary" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(politician.name)}&background=random&color=fff&size=128&font-size=0.4`;
                }}
            />
            <h2 className="text-2xl font-bold mt-4 text-white">{politician.name}</h2>
            <p className="text-brand-cyan font-semibold">{politician.position}</p>
            <p className="text-brand-light text-sm">{politician.party} - {politician.state}</p>
            
            {/* Salário e Redes Sociais - Destaque no Perfil */}
            <div className="flex justify-center gap-4 my-4 text-sm">
                {politician.salary && (
                    <div className="flex flex-col items-center bg-brand-primary/30 px-3 py-1 rounded border border-white/5">
                        <span className="text-brand-light text-[10px] uppercase tracking-wide">Salário Estimado</span>
                        <span className="font-bold text-green-400 font-mono">
                            {politician.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                )}
                {politician.socialMedia?.followers && (
                     <div className="flex flex-col items-center bg-brand-primary/30 px-3 py-1 rounded border border-white/5">
                        <span className="text-brand-light text-[10px] uppercase tracking-wide">Seguidores</span>
                        <span className="font-bold text-blue-400 font-mono">
                            {new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(politician.socialMedia.followers)}
                        </span>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-2 p-3 bg-black/20 rounded-md text-left leading-relaxed">
                {politician.bio || "Biografia não disponível. Clique em 'Investigar' para coletar dados."}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <RiskIndicator level={politician.risks.judicial} title="Judicial" />
                <RiskIndicator level={politician.risks.financial} title="Financeiro" />
                <RiskIndicator level={politician.risks.media} title="Mídia" />
            </div>
             <div className="mt-4 h-52">
                <Suspense fallback={<div className="h-full flex items-center justify-center"><Spinner /></div>}>
                    <ReputationRadar data={politician.reputation || []} />
                </Suspense>
            </div>
        </div>
    </Section>
);

export default ProfileCard;