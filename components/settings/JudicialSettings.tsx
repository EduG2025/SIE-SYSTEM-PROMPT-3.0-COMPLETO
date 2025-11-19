
import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';

const JudicialSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        courtFilter: 'Todos',
        keywordAlerts: 'Improbidade, Corrupção, Lavagem de Dinheiro',
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving judicial settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Judicial" onSave={handleSave} isSaving={isSaving}>
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
