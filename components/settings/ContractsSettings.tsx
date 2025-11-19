import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';

const ContractsSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        highValueThreshold: 5000000,
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving contracts settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Contratos e Licitações" onSave={handleSave} isSaving={isSaving}>
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
