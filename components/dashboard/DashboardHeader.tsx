
import React from 'react';
import type { DashboardStats } from '../../types';
import Spinner from '../common/Spinner';

interface DashboardHeaderProps {
    stats?: DashboardStats;
    isLoading?: boolean;
}

const StatCard: React.FC<{ value: number; label: string; icon: React.ReactNode; isLoading?: boolean }> = ({ value, label, icon, isLoading }) => (
    <div className="bg-brand-secondary p-4 rounded-lg flex items-center shadow-md flex-grow min-h-[88px]">
        {isLoading ? (
            <div className="w-full flex justify-center items-center">
                 <Spinner />
            </div>
        ) : (
            <>
                <div className="p-3 rounded-full bg-brand-accent mr-4 flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-brand-light">{label}</p>
                </div>
            </>
        )}
    </div>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ stats, isLoading }) => {
    const iconClass = "h-6 w-6 text-brand-cyan";
    
    // Create dummy stats if loading to allow rendering the structure
    const displayStats = stats || { facebook: 0, instagram: 0, twitter: 0, judicialProcesses: 0 };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard isLoading={isLoading} value={displayStats.facebook} label="Itens (Facebook)" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard isLoading={isLoading} value={displayStats.instagram} label="Itens (Instagram)" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard isLoading={isLoading} value={displayStats.twitter} label="Itens (Twitter)" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h3m3 3h6m-6 2h6m0 0V7m0 4a2 2 0 012 2v3m0 0V7" /></svg>} />
            <StatCard isLoading={isLoading} value={displayStats.judicialProcesses} label="Processos Judiciais" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" /></svg>} />
        </div>
    );
};

export default DashboardHeader;
