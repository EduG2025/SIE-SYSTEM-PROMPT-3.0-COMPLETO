
import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';

const TimelineSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        showNominations: true,
        showContracts: true,
        showLawsuits: true,
        showSocialMedia: false,
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving timeline settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <ModuleSettingsLayout moduleName="Linha do Tempo" onSave={handleSave} isSaving={isSaving}>
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
