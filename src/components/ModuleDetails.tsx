
import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { dbService } from '../services/dbService';
import type { Module } from '../types';
import Spinner from './common/Spinner';

const { useParams, useNavigate } = ReactRouterDOM as any;

const ModuleDetails: React.FC = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModule = async () => {
            if (!moduleId) return;
            try {
                // Tenta buscar o módulo pelo ID (ex: 'mod-poli') ou pela view (ex: 'political')
                const modules = await dbService.getModules();
                const found = modules.find(m => m.id === moduleId || m.view === moduleId);
                
                if (found) {
                    setModule(found);
                } else {
                    console.error("Módulo não encontrado");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchModule();
    }, [moduleId]);

    if (loading) {
        return <div className="flex justify-center p-10"><Spinner /></div>;
    }

    if (!module) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-xl font-bold text-brand-light">Módulo não encontrado</h3>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-blue hover:underline">
                    Voltar ao Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in-up">
            <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-brand-primary rounded-lg border border-brand-accent/50">
                        {/* Renderiza um ícone genérico baseado na string do ícone */}
                        <span className="text-2xl text-brand-cyan capitalize">{module.icon.substring(0, 2)}</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{module.name}</h1>
                        <p className="text-brand-light font-mono text-sm mt-1">ID: {module.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-primary/30 p-4 rounded-lg border border-brand-accent/30">
                        <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
                        <p className={`text-sm font-bold ${module.active ? 'text-green-400' : 'text-red-400'}`}>
                            {module.active ? 'ATIVO' : 'INATIVO'}
                        </p>
                    </div>
                    
                    <div className="bg-brand-primary/30 p-4 rounded-lg border border-brand-accent/30">
                        <h3 className="text-lg font-semibold text-white mb-2">Configuração</h3>
                        <p className="text-sm text-brand-light">
                            {module.hasSettings ? 'Possui painel de configurações.' : 'Sem configurações adicionais.'}
                        </p>
                        {module.hasSettings && (
                            <button 
                                onClick={() => navigate(`/${module.view}/settings`)}
                                className="mt-3 text-xs bg-brand-blue hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors"
                            >
                                Ir para Configurações
                            </button>
                        )}
                    </div>

                    <div className="md:col-span-2 bg-brand-primary/30 p-4 rounded-lg border border-brand-accent/30">
                        <h3 className="text-lg font-semibold text-white mb-2">Regras de IA</h3>
                        <pre className="text-xs text-brand-light whitespace-pre-wrap font-mono bg-black/20 p-3 rounded border border-brand-accent/10">
                            {module.rules || "Nenhuma regra específica definida para este módulo."}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleDetails;
