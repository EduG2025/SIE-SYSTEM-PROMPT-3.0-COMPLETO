
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import { dbService } from '../../services/dbService';

const JudicialSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        courtFilter: 'Todos',
        keywordAlerts: 'Improbidade, Corrupção, Lavagem de Dinheiro',
    });
    const [aiRules, setAiRules] = useState('');

    useEffect(() => {
        const loadRules = async () => {
             const mod = await dbService.getModule('judicial');
             if(mod) setAiRules(mod.rules || '');
        };
        loadRules();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveModuleRules('judicial', aiRules);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Judicial" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Regras da IA (System Prompt)</h4>
                <textarea 
                    value={aiRules}
                    onChange={(e) => setAiRules(e.target.value)}
                    className="w-full h-32 bg-brand-secondary border border-brand-accent rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue"
                    placeholder="Ex: Buscar apenas processos transitados em julgado..."
                />
            </div>

            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Filtros e Monitoramento</h4>
                <p className="text-sm text-brand-light mb-4">Defina filtros padrão e palavras-chave para monitorar em processos.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="court-filter" className="block text-sm font-medium mb-2">
                            Filtrar por Tribunal
                        </label>
                        <select
                            id="court-filter"
                            value={settings.courtFilter}
                            onChange={(e) => setSettings(p => ({ ...p, courtFilter: e.target.value }))}
                            className="w-full max-w-sm bg-brand-secondary p-2 rounded border border-brand-accent"
                        >
                            <option>Todos</option>
                            <option>Tribunal Federal</option>
                            <option>Tribunal de Contas</option>
                            <option>Tribunal de Justiça Estadual</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="judicial-keywords" className="block text-sm font-medium mb-2">
                            Palavras-chave para Alertas (separadas por vírgula)
                        </label>
                        <textarea
                            id="judicial-keywords"
                            rows={3}
                            value={settings.keywordAlerts}
                            onChange={(e) => setSettings(p => ({ ...p, keywordAlerts: e.target.value }))}
                            className="w-full bg-brand-secondary p-2 rounded border border-brand-accent"
                        />
                    </div>
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default JudicialSettings;
