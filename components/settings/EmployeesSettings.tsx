
import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';

const EmployeesSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        enableNepotismAlerts: true,
        keywordAlerts: 'Assessor Especial, Chefe de Gabinete',
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving employees settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Funcionários" onSave={handleSave} isSaving={isSaving}>
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
