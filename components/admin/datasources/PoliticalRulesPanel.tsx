
import React, { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';
import type { PoliticalModuleRules } from '../../../types';

interface PoliticalRulesPanelProps {
    onSave: () => void;
}

const PoliticalRulesPanel: React.FC<PoliticalRulesPanelProps> = ({ onSave }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [rules, setRules] = useState<PoliticalModuleRules>({
        priority_risk_areas: ['Judicial', 'Financeiro'],
        weight_judicial_risk: 8,
        network_depth_level: 2,
        min_connection_value: 5000,
        nepotism_window_months: 48,
        critical_positions: [],
        mandatory_cpf_cnpj_check: true,
        timeline_event_filter: [],
        timeline_max_years: 5
    });

    useEffect(() => {
        const loadRules = async () => {
            try {
                const module = await dbService.getModule('political');
                if (module && module.rules) {
                    const parsed = JSON.parse(module.rules);
                    setRules(prev => ({ ...prev, ...parsed }));
                }
            } catch (e) {
                console.error("Failed to load political rules", e);
            } finally {
                setLoading(false);
            }
        };
        loadRules();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await dbService.saveModuleRules('political', JSON.stringify(rules));
            onSave();
        } catch (e) {
            console.error("Failed to save rules", e);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRiskArea = (area: string) => {
        setRules(prev => {
            const areas = prev.priority_risk_areas.includes(area)
                ? prev.priority_risk_areas.filter(a => a !== area)
                : [...prev.priority_risk_areas, area];
            return { ...prev, priority_risk_areas: areas };
        });
    };

    if (loading) return <div className="p-6 bg-brand-secondary rounded-lg animate-pulse h-64"></div>;

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30">
            <div className="flex items-center mb-4">
                 <div className="p-2 bg-brand-primary rounded-lg mr-3 text-brand-cyan">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">Calibragem de Inteligência Política</h3>
                    <p className="text-sm text-brand-light">Defina como a IA deve priorizar e analisar os dados políticos coletados das fontes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Áreas de Risco */}
                <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/20">
                    <label className="block text-sm font-bold text-white mb-3">Áreas de Risco Prioritárias</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Judicial', 'Financeiro', 'Mídia', 'Social'].map(area => (
                            <label key={area} className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rules.priority_risk_areas.includes(area)}
                                    onChange={() => toggleRiskArea(area)}
                                    className="rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue h-4 w-4"
                                />
                                <span className={`text-sm transition-colors ${rules.priority_risk_areas.includes(area) ? 'text-white' : 'text-brand-light group-hover:text-brand-text'}`}>
                                    {area}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Pesos e Profundidade */}
                <div className="space-y-4">
                    <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/20">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-white">Peso do Risco Judicial</label>
                            <span className="text-xs font-mono bg-brand-secondary px-2 py-0.5 rounded text-brand-cyan">{rules.weight_judicial_risk}/10</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="10"
                            value={rules.weight_judicial_risk}
                            onChange={(e) => setRules({...rules, weight_judicial_risk: Number(e.target.value)})}
                            className="w-full h-2 bg-brand-secondary rounded-lg appearance-none cursor-pointer accent-brand-blue"
                        />
                        <div className="flex justify-between text-[10px] text-brand-light mt-1">
                            <span>Conservador</span>
                            <span>Agressivo</span>
                        </div>
                    </div>

                    <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/20">
                        <label className="block text-sm font-bold text-white mb-2">Profundidade de Análise de Redes</label>
                        <select
                            value={rules.network_depth_level}
                            onChange={(e) => setRules({...rules, network_depth_level: Number(e.target.value)})}
                            className="w-full bg-brand-secondary border border-brand-accent rounded-md p-2 text-sm text-white focus:ring-brand-blue focus:border-brand-blue outline-none"
                        >
                            <option value={1}>Nível 1 - Conexões Diretas (Rápido)</option>
                            <option value={2}>Nível 2 - Conexões Estendidas (Padrão)</option>
                            <option value={3}>Nível 3 - Varredura Profunda (Lento)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Regras da IA'}
                </button>
            </div>
        </div>
    );
};

export default PoliticalRulesPanel;
