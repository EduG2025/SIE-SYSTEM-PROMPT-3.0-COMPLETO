
import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';

const CompaniesSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        valueWeight: 50,
        lawsuitWeight: 30,
        connectionWeight: 20,
        highValueThreshold: 1000000,
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving companies settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };
    
    const handleSliderChange = (key: 'valueWeight' | 'lawsuitWeight' | 'connectionWeight', value: number) => {
        setSettings(prev => ({...prev, [key]: value}));
    };

    return (
        <ModuleSettingsLayout moduleName="Empresas" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Cálculo de Risco de Empresas</h4>
                <p className="text-sm text-brand-light mb-4">Ajuste os pesos para o cálculo da pontuação de risco.</p>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Peso do Valor Contratado: <span className="font-bold text-white">{settings.valueWeight}%</span>
                        </label>
                        <input type="range" min="0" max="100" value={settings.valueWeight} onChange={(e) => handleSliderChange('valueWeight', +e.target.value)} className="w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">
                           Peso de Processos Judiciais: <span className="font-bold text-white">{settings.lawsuitWeight}%</span>
                        </label>
                        <input type="range" min="0" max="100" value={settings.lawsuitWeight} onChange={(e) => handleSliderChange('lawsuitWeight', +e.target.value)} className="w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">
                            Peso de Conexões Políticas: <span className="font-bold text-white">{settings.connectionWeight}%</span>
                        </label>
                        <input type="range" min="0" max="100" value={settings.connectionWeight} onChange={(e) => handleSliderChange('connectionWeight', +e.target.value)} className="w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">
                            Alerta de Contrato de Alto Valor (acima de)
                        </label>
                        <input 
                            type="number"
                            value={settings.highValueThreshold}
                            onChange={(e) => setSettings(p => ({...p, highValueThreshold: +e.target.value}))}
                            className="w-full max-w-sm bg-brand-secondary p-2 rounded border border-brand-accent"
                        />
                    </div>
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};
export default CompaniesSettings;
