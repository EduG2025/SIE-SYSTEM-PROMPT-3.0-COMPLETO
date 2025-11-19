
import React, { useState, useEffect } from 'react';
import type { UserPlan, Feature, FeatureKey, Module } from '../../types';
import { dbService } from '../../services/dbService';
import Modal from '../common/Modal';

interface PlanFormProps {
    plan: UserPlan | null;
    availableFeatures: Feature[];
    availableModules: Module[];
    onSave: (plan: UserPlan) => void;
    onCancel: () => void;
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, availableFeatures, availableModules, onSave, onCancel }) => {
    const [formData, setFormData] = useState<UserPlan>(
        plan || { id: '', name: '', features: [], modules: [], requestLimit: 100 }
    );

    const isEditing = !!plan;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureToggle = (featureKey: FeatureKey) => {
        setFormData(prev => {
            const features = prev.features.includes(featureKey)
                ? prev.features.filter(f => f !== featureKey)
                : [...prev.features, featureKey];
            return { ...prev, features };
        });
    };
    
    const handleModuleToggle = (moduleId: string) => {
        setFormData(prev => {
            const modules = (prev.modules || []).includes(moduleId)
                ? prev.modules.filter(m => m !== moduleId)
                : [...(prev.modules || []), moduleId];
            return { ...prev, modules };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.id.trim() || !formData.name.trim()) return;
        
        const limit = Number(formData.requestLimit);
        if (isNaN(limit) || !Number.isInteger(limit)) {
             alert("O limite de requisições deve ser um número inteiro.");
             return;
        }

        if (limit < 0 && limit !== -1) {
             alert("O limite de requisições não pode ser negativo (exceto -1 para ilimitado).");
             return;
        }

        const planData = isEditing ? { ...formData, requestLimit: limit } : {
             ...formData, 
             id: formData.id.toLowerCase().replace(/\s+/g, '-'),
             requestLimit: limit
        };
        onSave(planData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Nome do Plano</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: Enterprise Gold"
                        className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue text-white"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">ID do Plano (Único)</label>
                    <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        placeholder="Ex: enterprise-gold"
                        className={`w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue text-white ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        required
                        readOnly={isEditing}
                    />
                    {!isEditing && <p className="text-xs text-brand-light mt-1">Será convertido para 'kebab-case'.</p>}
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Limite de Requisições Diárias</label>
                    <input
                        type="number"
                        name="requestLimit"
                        value={formData.requestLimit}
                        onChange={handleChange}
                        placeholder="-1 para ilimitado"
                        className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue text-white"
                        required
                    />
                    <p className="text-xs text-brand-light mt-1">Use -1 para acesso ilimitado.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna de Recursos */}
                <div>
                    <label className="text-sm text-brand-light mb-2 block font-bold">Recursos Técnicos</label>
                    <div className="grid grid-cols-1 gap-2 bg-brand-primary p-4 rounded border border-brand-accent max-h-60 overflow-y-auto">
                        {availableFeatures.map(feature => (
                            <div key={feature.key} className="flex items-start p-2 hover:bg-brand-secondary/50 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    id={`feature-${feature.key}`}
                                    checked={formData.features.includes(feature.key)}
                                    onChange={() => handleFeatureToggle(feature.key)}
                                    className="mt-1 rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor={`feature-${feature.key}`} className="ml-3 cursor-pointer">
                                    <p className="text-sm font-medium text-white">{feature.name}</p>
                                    <p className="text-xs text-brand-light">{feature.description}</p>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna de Módulos */}
                <div>
                    <label className="text-sm text-brand-light mb-2 block font-bold">Módulos Permitidos</label>
                    <div className="grid grid-cols-1 gap-2 bg-brand-primary p-4 rounded border border-brand-accent max-h-60 overflow-y-auto">
                        {availableModules.map(module => (
                            <div key={module.id} className="flex items-center p-2 hover:bg-brand-secondary/50 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    id={`module-${module.id}`}
                                    checked={(formData.modules || []).includes(module.id)}
                                    onChange={() => handleModuleToggle(module.id)}
                                    className="mt-1 rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor={`module-${module.id}`} className="ml-3 cursor-pointer flex items-center">
                                    <span className="text-sm font-medium text-white">{module.name}</span>
                                    {!module.active && <span className="ml-2 text-[10px] bg-brand-red text-white px-1 rounded">Inativo Global</span>}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-brand-accent">
                <button type="button" onClick={onCancel} className="bg-brand-accent hover:bg-brand-light/20 text-white px-4 py-2 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="bg-brand-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
            </div>
        </form>
    );
};

interface PlanManagementProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const PlanManagement: React.FC<PlanManagementProps> = ({ showToast }) => {
    const [plans, setPlans] = useState<UserPlan[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        const [plansData, featuresData, modulesData, usersData] = await Promise.all([
            dbService.getPlans(),
            dbService.getFeatures(),
            dbService.getModules(),
            dbService.getUsers()
        ]);
        setPlans(plansData);
        setFeatures(featuresData);
        setModules(modulesData);
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSavePlan = async (plan: UserPlan) => {
        try {
            await dbService.savePlan(plan);
            showToast(`Plano '${plan.name}' salvo com sucesso!`, 'success');
            setIsModalOpen(false);
            setEditingPlan(null);
            loadData();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Erro ao salvar plano.', 'error');
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este plano?')) {
            try {
                await dbService.deletePlan(planId);
                showToast('Plano excluído com sucesso.', 'success');
                loadData();
            } catch (error) {
                showToast(error instanceof Error ? error.message : 'Erro ao excluir plano.', 'error');
            }
        }
    };

    const openModal = (plan: UserPlan | null = null) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const getUserCount = (planId: string) => {
        return users.filter(u => u.planId === planId).length;
    }

    if (loading) {
        return <div className="p-8 text-center text-brand-light">Carregando planos...</div>;
    }

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            {isModalOpen && (
                <Modal title={editingPlan ? 'Editar Plano' : 'Criar Novo Plano'} onClose={() => setIsModalOpen(false)} size="2xl">
                    <PlanForm 
                        plan={editingPlan} 
                        availableFeatures={features} 
                        availableModules={modules}
                        onSave={handleSavePlan} 
                        onCancel={() => setIsModalOpen(false)} 
                    />
                </Modal>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Gerenciamento de Planos</h3>
                    <p className="text-sm text-brand-light">Defina os níveis de acesso, recursos e módulos disponíveis para os usuários.</p>
                </div>
                <button 
                    onClick={() => openModal()} 
                    className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Novo Plano
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-brand-accent">
                        <tr>
                            <th className="p-3">Nome do Plano</th>
                            <th className="p-3">Cota Diária</th>
                            <th className="p-3">Usuários</th>
                            <th className="p-3">Recursos Técnicos</th>
                            <th className="p-3">Módulos</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/30">
                        {plans.map(plan => {
                            const userCount = getUserCount(plan.id);
                            return (
                            <tr key={plan.id} className="hover:bg-brand-accent/10 transition-colors">
                                <td className="p-3">
                                    <div className="font-bold text-white">{plan.name}</div>
                                    <div className="text-brand-light font-mono text-xs">{plan.id}</div>
                                </td>
                                <td className="p-3">
                                    {plan.requestLimit === -1 
                                        ? <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold">Ilimitado</span> 
                                        : <span className="font-mono">{plan.requestLimit} reqs</span>
                                    }
                                </td>
                                <td className="p-3">
                                    <span className="bg-brand-primary px-2 py-1 rounded text-xs text-white font-bold">{userCount}</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {plan.features.slice(0, 3).map(fKey => {
                                            const feature = features.find(f => f.key === fKey);
                                            return (
                                                <span key={fKey} className="px-2 py-0.5 bg-brand-blue/20 border border-brand-blue/30 rounded text-xs text-brand-light" title={feature?.description}>
                                                    {feature?.name || fKey}
                                                </span>
                                            );
                                        })}
                                        {plan.features.length > 3 && <span className="text-xs text-brand-light self-center">+{plan.features.length - 3}</span>}
                                        {plan.features.length === 0 && <span className="text-brand-light/50 italic">Nenhum</span>}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-brand-cyan">{plan.modules ? plan.modules.length : 0}</span> 
                                        <div className="flex -space-x-1">
                                            {(plan.modules || []).slice(0, 4).map(mId => (
                                                <div key={mId} className="w-2 h-2 rounded-full bg-brand-cyan ring-1 ring-brand-secondary" title={mId}></div>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                    <button 
                                        onClick={() => openModal(plan)} 
                                        className="text-brand-blue hover:text-white hover:bg-brand-blue px-3 py-1 rounded transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePlan(plan.id)} 
                                        className={`px-3 py-1 rounded transition-colors ${userCount > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-brand-red hover:text-white hover:bg-brand-red'}`}
                                        disabled={userCount > 0}
                                        title={userCount > 0 ? "Não é possível excluir planos com usuários ativos" : "Excluir plano"}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlanManagement;
