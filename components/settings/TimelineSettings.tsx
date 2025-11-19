
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';
import { dbService } from '../../services/dbService';

const TimelineSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        showNominations: true,
        showContracts: true,
        showLawsuits: true,
        showSocialMedia: false,
    });
    const [aiRules, setAiRules] = useState('');

    useEffect(() => {
        const loadRules = async () => {
             const mod = await dbService.getModule('timeline');
             if(mod) setAiRules(mod.rules || '');
        };
        loadRules();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveModuleRules('timeline', aiRules);
        setTimeout(() => setIsSaving(false), 1500);
    };

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <ModuleSettingsLayout moduleName="Linha do Tempo" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Regras da IA (System Prompt)</h4>
                <textarea 
                    value={aiRules}
                    onChange={(e) => setAiRules(e.target.value)}
                    className="w-full h-32 bg-brand-secondary border border-brand-accent rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue"
                    placeholder="Ex: Priorizar eventos com datas confirmadas em diário oficial..."
                />
            </div>

            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Visibilidade de Eventos</h4>
                <p className="text-sm text-brand-light mb-4">Escolha quais tipos de eventos devem ser exibidos por padrão na linha do tempo.</p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md">
                        <label className="font-medium">Exibir Nomeações</label>
                        <ToggleSwitch checked={settings.showNominations} onChange={() => handleToggle('showNominations')} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md">
                        <label className="font-medium">Exibir Contratos</label>
                        <ToggleSwitch checked={settings.showContracts} onChange={() => handleToggle('showContracts')} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md">
                        <label className="font-medium">Exibir Processos Judiciais</label>
                        <ToggleSwitch checked={settings.showLawsuits} onChange={() => handleToggle('showLawsuits')} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-brand-secondary rounded-md">
                        <label className="font-medium">Exibir Posts de Redes Sociais</label>
                        <ToggleSwitch checked={settings.showSocialMedia} onChange={() => handleToggle('showSocialMedia')} />
                    </div>
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default TimelineSettings;
