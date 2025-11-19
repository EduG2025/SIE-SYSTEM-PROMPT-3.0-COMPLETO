
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/dbService';
import type { UserPlan, Feature } from '../../../types';
import Spinner from '../../common/Spinner';

interface PlanDetails {
    plan: UserPlan;
    features: (Feature & { isActive: boolean })[];
}

const PlanAndFeatures: React.FC = () => {
    const { currentUser } = useAuth();
    const [details, setDetails] = useState<PlanDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (currentUser) {
                const data = await dbService.getUserPlanDetails(currentUser);
                setDetails(data);
            }
            setLoading(false);
        };
        loadData();
    }, [currentUser]);

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;
    if (!details || !currentUser) return <div className="text-center p-10 text-brand-light">Informações de plano indisponíveis.</div>;

    const daysUntilExpiration = currentUser.planExpiration 
        ? Math.ceil((new Date(currentUser.planExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
        : 0;

    const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration < 30;
    const isExpired = daysUntilExpiration <= 0;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border-l-4 border-brand-blue">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{details.plan.name}</h3>
                        <p className="text-brand-light text-sm">Seu plano atual de assinatura.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-brand-light uppercase tracking-wider mb-1">Status da Assinatura</p>
                        {currentUser.planExpiration ? (
                            <div>
                                <p className={`text-lg font-bold ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {isExpired ? 'Expirado' : 'Ativo'}
                                </p>
                                <p className="text-xs text-brand-light">
                                    Expira em: {new Date(currentUser.planExpiration).toLocaleDateString('pt-BR')} ({daysUntilExpiration} dias)
                                </p>
                            </div>
                        ) : (
                            <p className="text-brand-light">Vitalício / Indefinido</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h4 className="text-lg font-semibold text-white mb-4">Recursos Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.features.map((feature) => (
                        <div 
                            key={feature.key} 
                            className={`p-4 rounded-lg border ${feature.isActive ? 'bg-brand-primary border-brand-accent' : 'bg-brand-primary/30 border-transparent opacity-60'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-bold ${feature.isActive ? 'text-white' : 'text-brand-light'}`}>{feature.name}</h5>
                                {feature.isActive ? (
                                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full font-bold">Ativo</span>
                                ) : (
                                    <span className="px-2 py-1 text-xs bg-brand-accent text-brand-light rounded-full">Não Incluído</span>
                                )}
                            </div>
                            <p className="text-xs text-brand-light">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlanAndFeatures;
