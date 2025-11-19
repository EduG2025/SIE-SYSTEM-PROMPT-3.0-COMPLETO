
import React, { useState } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';

const SocialMediaSettings: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        keywords: 'Prefeitura, Prefeito, Hospital, Escola, Obra',
        sentimentSensitivity: 75,
    });

    const handleSave = () => {
        setIsSaving(true);
        console.log("Saving social media settings:", settings);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <ModuleSettingsLayout moduleName="Redes Sociais" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Monitoramento de Termos</h4>
                <p className="text-sm text-brand-light mb-4">Defina os termos que o sistema deve monitorar nas redes sociais.</p>
                 <div>
                    <label htmlFor="social-keywords" className="block text-sm font-medium mb-2">
                        Palavras-chave para Monitorar (separadas por vírgula)
                    </label>
                    <textarea
                        id="social-keywords"
                        rows={3}
                        value={settings.keywords}
                        onChange={(e) => setSettings(p => ({ ...p, keywords: e.target.value }))}
                        className="w-full bg-brand-secondary p-2 rounded border border-brand-accent"
                    />
                </div>
            </div>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Análise de Sentimento</h4>
                 <div>
                    <label htmlFor="sentiment-sensitivity" className="block text-sm font-medium mb-2">
                        Sensibilidade para Sentimento Negativo: <span className="font-bold text-white">{settings.sentimentSensitivity}%</span>
                    </label>
                    <input
                        id="sentiment-sensitivity"
                        type="range"
                        min="50"
                        max="100"
                        value={settings.sentimentSensitivity}
                        onChange={(e) => setSettings(p => ({ ...p, sentimentSensitivity: +e.target.value }))}
                        className="w-full h-2 bg-brand-accent rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default SocialMediaSettings;
