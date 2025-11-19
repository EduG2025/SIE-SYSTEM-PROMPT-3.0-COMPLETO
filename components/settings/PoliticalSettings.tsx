
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';
import { dbService } from '../../services/dbService';
import type { PoliticalModuleRules } from '../../types';

const PoliticalSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Estado inicial padrão
    const [rules, setRules] = useState<PoliticalModuleRules>({
        priority_risk_areas: ['Judicial', 'Financeiro'],
        weight_judicial_risk: 5,
        network_depth_level: 2,
        min_connection_value: 1000,
        nepotism_window_months: 48,
        critical_positions: [],
        mandatory_cpf_cnpj_check: true,
        timeline_event_filter: [],
        timeline_max_years: 4
    });

    // Helper para inputs de texto separados por vírgula
    const [criticalPosText, setCriticalPosText] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const module = await dbService.getModule('political');
                if (module && module.rules) {
                    try {
                        const parsedRules = JSON.parse(module.rules);
                        setRules(parsedRules);
                        setCriticalPosText(parsedRules.critical_positions?.join(', ') || '');
                    } catch (e) {
                        console.error("Erro ao fazer parse das regras:", e);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar configurações:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Converte o texto de volta para array
            const updatedRules = {
                ...rules,
                critical_positions: criticalPosText.split(',').map(s => s.trim()).filter(s => s)
            };
            
            // Salva como string JSON no dbService
            await dbService.saveModuleRules('political', JSON.stringify(updatedRules));
            // Pequeno delay para feedback visual
            setTimeout(() => setIsSaving(false), 800);
        } catch (error) {
            console.error("Erro ao salvar:", error);
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

    const toggleTimelineFilter = (filter: string) => {
        setRules(prev => {
            const filters = prev.timeline_event_filter.includes(filter)
                ? prev.timeline_event_filter.filter(f => f !== filter)
                : [...prev.timeline_event_filter, filter];
            return { ...prev, timeline_event_filter: filters };
        });
    };

    if (loading) return <div className="p-8 text-center text-brand-light">Carregando configurações...</div>;

    return (
        <ModuleSettingsLayout moduleName="Político" onSave={handleSave} isSaving={isSaving}>
            
            {/* Seção A: Priorização de Risco */}
            <div className="bg-brand-primary p-5 rounded-lg border border-brand-accent/30">
                <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    A. Priorização de Risco e Redes
                </h4>
                <p className="text-sm text-brand-light mb-6">Defina como a IA deve ponderar os riscos e mapear conexões.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-3 text-gray-300">Áreas de Foco (Prioridade Alta)</label>
                        <div className="space-y-2">
                            {['Judicial', 'Financeiro', 'Mídia', 'Social'].map(area => (
                                <div key={area} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`risk-${area}`}
                                        checked={rules.priority_risk_areas.includes(area)}
                                        onChange={() => toggleRiskArea(area)}
                                        className="rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                                    />
                                    <label htmlFor={`risk-${area}`} className="ml-2 text-sm text-gray-400">{area}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Peso do Risco Judicial: <span className="text-brand-blue font-bold">{rules.weight_judicial_risk}</span>
                            </label>
                            <input
                                type="range"
                                min="1" max="10"
                                value={rules.weight_judicial_risk}
                                onChange={(e) => setRules({...rules, weight_judicial_risk: Number(e.target.value)})}
                                className="w-full h-2 bg-brand-secondary rounded-lg appearance-none cursor-pointer accent-brand-blue"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Baixo</span><span>Crítico</span></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Profundidade da Rede de Conexões: <span className="text-brand-blue font-bold">{rules.network_depth_level}</span>
                            </label>
                            <select 
                                value={rules.network_depth_level}
                                onChange={(e) => setRules({...rules, network_depth_level: Number(e.target.value)})}
                                className="w-full bg-brand-secondary border border-brand-accent rounded-md p-2 text-sm text-white focus:ring-brand-blue focus:border-brand-blue"
                            >
                                <option value={1}>Nível 1 (Apenas diretas)</option>
                                <option value={2}>Nível 2 (Conexões de conexões)</option>
                                <option value={3}>Nível 3 (Varredura profunda)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção B: Regras de Detecção */}
            <div className="bg-brand-primary p-5 rounded-lg border border-brand-accent/30">
                <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    B. Regras de Detecção (Compliance)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Janela de Nepotismo (Meses)</label>
                        <input
                            type="number"
                            value={rules.nepotism_window_months}
                            onChange={(e) => setRules({...rules, nepotism_window_months: Number(e.target.value)})}
                            className="w-full bg-brand-secondary border border-brand-accent rounded-md p-2 text-sm text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Período para cruzar nomeações com a posse.</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md border border-brand-accent/20 h-min mt-auto">
                        <label className="text-sm font-medium text-gray-300">Verificação Obrigatória de CPF/CNPJ</label>
                        <ToggleSwitch 
                            checked={rules.mandatory_cpf_cnpj_check} 
                            onChange={(c) => setRules({...rules, mandatory_cpf_cnpj_check: c})} 
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-300">Cargos Críticos (separados por vírgula)</label>
                        <textarea
                            rows={2}
                            value={criticalPosText}
                            onChange={(e) => setCriticalPosText(e.target.value)}
                            className="w-full bg-brand-secondary border border-brand-accent rounded-md p-2 text-sm text-white placeholder-gray-600"
                            placeholder="Ex: Secretário de Finanças, Chefe de Gabinete, Tesoureiro"
                        />
                    </div>
                </div>
            </div>

            {/* Seção C: Timeline */}
            <div className="bg-brand-primary p-5 rounded-lg border border-brand-accent/30">
                 <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    C. Configurações da Linha do Tempo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-3 text-gray-300">Filtros de Eventos (Excluir)</label>
                        <div className="flex flex-wrap gap-2">
                            {['Homenagens', 'Eventos Sociais', 'Administrativo', 'Judicial'].map(filter => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => toggleTimelineFilter(filter)}
                                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                        rules.timeline_event_filter.includes(filter)
                                            ? 'bg-red-500/20 border-red-500 text-red-300'
                                            : 'bg-brand-secondary border-brand-accent text-gray-400 hover:border-brand-light'
                                    }`}
                                >
                                    {rules.timeline_event_filter.includes(filter) ? 'Excluído' : filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-2 text-gray-300">Período Máximo (Anos)</label>
                        <input
                            type="number"
                            min="1" max="20"
                            value={rules.timeline_max_years}
                            onChange={(e) => setRules({...rules, timeline_max_years: Number(e.target.value)})}
                            className="w-full bg-brand-secondary border border-brand-accent rounded-md p-2 text-sm text-white"
                        />
                    </div>
                </div>
            </div>

        </ModuleSettingsLayout>
    );
};

export default PoliticalSettings;
