
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import { dbService } from '../../services/dbService';

const ContractsSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        highValueThreshold: 5000000,
    });
    const [aiRules, setAiRules] = useState('');

    useEffect(() => {
        const loadRules = async () => {
             const mod = await dbService.getModule('contracts');
             if(mod) setAiRules(mod.rules || '');
        };
        loadRules();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveModuleRules('contracts', aiRules);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Contratos e Licitações" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Regras da IA (System Prompt)</h4>
                <textarea 
                    value={aiRules}
                    onChange={(e) => setAiRules(e.target.value)}
                    className="w-full h-32 bg-brand-secondary border border-brand-accent rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue"
                    placeholder="Ex: Focar em aditivos contratuais acima de 25%..."
                />
            </div>

            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Alertas e Parâmetros</h4>
                <p className="text-sm text-brand-light mb-4">Defina os valores para alertas de contratos.</p>
                <div>
                    <label htmlFor="high-value-threshold" className="block text-sm font-medium mb-2">
                        Alerta de Contrato de Alto Valor (acima de)
                    </label>
                    <input
                        id="high-value-threshold"
                        type="number"
                        step="100000"
                        value={settings.highValueThreshold}
                        onChange={(e) => setSettings(p => ({ ...p, highValueThreshold: +e.target.value }))}
                        className="w-full max-w-sm bg-brand-secondary p-2 rounded border border-brand-accent"
                    />
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default ContractsSettings;
