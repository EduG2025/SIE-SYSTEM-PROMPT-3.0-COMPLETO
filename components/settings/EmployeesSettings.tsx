
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';
import { dbService } from '../../services/dbService';

const EmployeesSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        enableNepotismAlerts: true,
        keywordAlerts: 'Assessor Especial, Chefe de Gabinete',
    });
    const [aiRules, setAiRules] = useState('');

    useEffect(() => {
        const loadRules = async () => {
             const mod = await dbService.getModule('employees');
             if(mod) setAiRules(mod.rules || '');
        };
        loadRules();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveModuleRules('employees', aiRules);
        // Here you would save other settings to DB as well if structured
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <ModuleSettingsLayout moduleName="Funcionários" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Regras da IA (System Prompt)</h4>
                <p className="text-sm text-brand-light mb-2">Defina instruções específicas que a IA deve seguir ao buscar e analisar funcionários.</p>
                <textarea 
                    value={aiRules}
                    onChange={(e) => setAiRules(e.target.value)}
                    className="w-full h-32 bg-brand-secondary border border-brand-accent rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue"
                    placeholder="Ex: Dê prioridade para cargos comissionados e parentes de políticos..."
                />
            </div>

            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Alertas Inteligentes</h4>
                <p className="text-sm text-brand-light mb-4">Configure alertas automáticos para detecção de anomalias.</p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md">
                        <label className="font-medium">Alerta de Risco de Nepotismo</label>
                        <ToggleSwitch 
                            checked={settings.enableNepotismAlerts} 
                            onChange={(checked) => setSettings(p => ({...p, enableNepotismAlerts: checked}))} 
                        />
                    </div>
                    <div>
                        <label htmlFor="keyword-alerts" className="block text-sm font-medium mb-2">
                            Alertas por Cargo (separado por vírgula)
                        </label>
                        <input
                            id="keyword-alerts"
                            type="text"
                            placeholder="Ex: Assessor Especial, Chefe de Gabinete"
                            value={settings.keywordAlerts}
                            onChange={(e) => setSettings(p => ({...p, keywordAlerts: e.target.value}))}
                            className="w-full bg-brand-secondary p-2 rounded border border-brand-accent"
                        />
                    </div>
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default EmployeesSettings;
