
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/dbService';
import type { UserPlan, Feature, User } from '../../../types';
import Spinner from '../../common/Spinner';
import { useNotification } from '../../../contexts/NotificationContext';

interface PlanDetails {
    plan: UserPlan;
    features: (Feature & { isActive: boolean })[];
}

const PlanCard: React.FC<{ 
    plan: UserPlan; 
    currentPlanId: string; 
    onSelect: (planId: string) => void; 
    isProcessing: boolean 
}> = ({ plan, currentPlanId, onSelect, isProcessing }) => {
    const isCurrent = plan.id === currentPlanId;
    const isEnterprise = plan.id === 'enterprise';
    
    // Colors based on plan type
    const borderColor = isCurrent ? 'border-brand-blue' : isEnterprise ? 'border-purple-500/30 hover:border-purple-500' : 'border-brand-accent hover:border-brand-light';
    const bgGradient = isCurrent ? 'bg-gradient-to-b from-brand-blue/10 to-brand-secondary' : 'bg-brand-secondary';
    const buttonStyle = isCurrent 
        ? 'bg-brand-blue/20 text-brand-blue cursor-default' 
        : isEnterprise 
            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20' 
            : 'bg-brand-accent hover:bg-brand-light text-white';

    return (
        <div className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${borderColor} ${bgGradient} ${isCurrent ? 'transform scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'}`}>
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    PLANO ATUAL
                </div>
            )}
            
            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold text-white mb-4">
                {plan.requestLimit === -1 ? 'Ilimitado' : plan.requestLimit} 
                <span className="text-sm font-normal text-brand-light ml-1">reqs/dia</span>
            </div>

            <div className="flex-grow space-y-3 mb-6">
                <p className="text-xs font-bold text-brand-light uppercase tracking-wider mb-2">Módulos Incluídos:</p>
                <div className="flex flex-wrap gap-2">
                    {plan.modules.map((mId) => (
                        <span key={mId} className="text-[10px] px-2 py-1 rounded bg-brand-primary border border-brand-accent text-brand-text truncate max-w-[120px]">
                            {mId.replace('mod-', '').toUpperCase()}
                        </span>
                    ))}
                </div>
                
                {plan.features.includes('own_api_key') && (
                    <div className="flex items-center text-xs text-green-400 mt-3">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Chave de API Própria (Sem limites)
                    </div>
                )}
            </div>

            <button
                onClick={() => !isCurrent && onSelect(plan.id)}
                disabled={isCurrent || isProcessing}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${buttonStyle} disabled:opacity-70`}
            >
                {isProcessing && !isCurrent ? 'Processando...' : isCurrent ? 'Selecionado' : 'Mudar para este Plano'}
            </button>
        </div>
    );
};

const PlanAndFeatures: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { notify } = useNotification();
    const [availablePlans, setAvailablePlans] = useState<UserPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const plans = await dbService.getPlans();
            setAvailablePlans(plans);
            setLoading(false);
        };
        loadData();
    }, []);

    const handlePlanChange = async (newPlanId: string) => {
        if (!currentUser) return;
        
        if (window.confirm(`Simular troca de plano para "${newPlanId.toUpperCase()}"? Isso atualizará seus módulos imediatamente.`)) {
            setProcessingId(newPlanId);
            try {
                // 1. Update DB
                await dbService.updateUserProfile(currentUser.id, { planId: newPlanId });
                
                // 2. Update Local Context to trigger App.tsx re-render of Sidebar/Routes
                // We need to fetch the full fresh user object or manually patch it perfectly
                const updatedUser = { ...currentUser, planId: newPlanId };
                setCurrentUser(updatedUser);
                
                // 3. Force module refresh via DB Service logic (which App.tsx listens to via effect)
                notify(`Plano atualizado com sucesso para ${newPlanId.toUpperCase()}!`, 'success');
            } catch (error) {
                notify('Erro ao alterar plano.', 'error');
            } finally {
                setProcessingId(null);
            }
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;
    if (!currentUser) return null;

    // Calculate Usage Percentage
    const currentPlan = availablePlans.find(p => p.id === currentUser.planId);
    const limit = currentPlan?.requestLimit || 100;
    const usage = currentUser.usage || 0;
    const usagePercent = limit === -1 ? 0 : Math.min(100, (usage / limit) * 100);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Usage Stats Header */}
            <div className="bg-brand-primary/40 p-6 rounded-xl border border-brand-accent">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-white">Consumo de Inteligência (IA)</h3>
                        <p className="text-sm text-brand-light">Sua cota de requisições diárias aos modelos Gemini.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-mono font-bold text-white">{usage}</span>
                        <span className="text-sm text-brand-light"> / {limit === -1 ? '∞' : limit}</span>
                    </div>
                </div>
                <div className="w-full h-3 bg-brand-secondary rounded-full overflow-hidden border border-brand-accent/50">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${limit === -1 ? 'bg-gradient-to-r from-purple-500 to-blue-500 w-full' : usagePercent > 90 ? 'bg-red-500' : 'bg-brand-blue'}`}
                        style={{ width: limit === -1 ? '100%' : `${usagePercent}%` }}
                    ></div>
                </div>
                {limit !== -1 && usagePercent > 80 && (
                    <p className="text-xs text-red-400 mt-2 font-bold">⚠ Você está próximo do limite diário. Considere um upgrade.</p>
                )}
            </div>

            {/* Plan Selection Grid */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Planos Disponíveis (Simulação Dinâmica)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {availablePlans.map(plan => (
                        <PlanCard 
                            key={plan.id} 
                            plan={plan} 
                            currentPlanId={currentUser.planId} 
                            onSelect={handlePlanChange}
                            isProcessing={!!processingId}
                        />
                    ))}
                </div>
                <p className="text-center text-xs text-brand-light mt-6 opacity-60">
                    * Em um ambiente de produção real, esta troca envolveria gateway de pagamento. Aqui é instantâneo para demonstrar a arquitetura modular.
                </p>
            </div>
        </div>
    );
};

export default PlanAndFeatures;
