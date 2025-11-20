
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import type { ThemeConfig, HomepageConfig } from '../../types';
import ToggleSwitch from '../common/ToggleSwitch';

const ThemeManager: React.FC<{ showToast: (msg: string, type: 'success'|'error') => void }> = ({ showToast }) => {
    const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
    const [homepageConfig, setHomepageConfig] = useState<HomepageConfig | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        dbService.getTheme().then(setThemeConfig);
        dbService.getHomepageConfig().then(setHomepageConfig);
    }, []);

    const handleSaveTheme = async () => {
        if(themeConfig) {
            await dbService.saveTheme(themeConfig, 'admin');
            showToast('Tema visual atualizado com sucesso!', 'success');
        }
    }

    const handleSaveHomepage = async () => {
        if(homepageConfig) {
            await dbService.saveHomepageConfig(homepageConfig, 'admin');
            showToast('Configurações da Homepage atualizadas!', 'success');
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero') => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];
                const url = await dbService.uploadFile(file);
                
                if (target === 'logo' && homepageConfig) {
                    setHomepageConfig({ ...homepageConfig, logoUrl: url });
                    showToast('Logo enviado com sucesso!', 'success');
                } else if (target === 'hero' && homepageConfig) {
                    setHomepageConfig({ ...homepageConfig, heroImageUrl: url });
                    showToast('Imagem de capa enviada com sucesso!', 'success');
                }
            } catch (error) {
                showToast('Erro ao fazer upload da imagem.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    if (!themeConfig || !homepageConfig) return <div>Carregando...</div>;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border-l-4 border-brand-purple">
                <h2 className="text-2xl font-bold text-white mb-2">Personalização Visual</h2>
                <p className="text-brand-light">Defina a identidade visual do painel e do portal de acesso.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tema */}
                <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Cores do Sistema</h3>
                    <div className="space-y-4">
                        {Object.entries(themeConfig).map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-brand-light mb-1 capitalize">{key}</label>
                                <div className="flex gap-2">
                                    <input type="color" value={value} onChange={(e) => setThemeConfig({...themeConfig, [key]: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={value} onChange={(e) => setThemeConfig({...themeConfig, [key]: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                        ))}
                        <button onClick={handleSaveTheme} className="w-full mt-4 bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Salvar Cores
                        </button>
                    </div>
                </div>

                {/* Homepage */}
                <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Portal de Entrada</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-brand-primary p-4 rounded-lg border border-brand-accent">
                            <label className="font-bold text-white">Homepage Ativa</label>
                            <ToggleSwitch checked={homepageConfig.active} onChange={(c) => setHomepageConfig({...homepageConfig, active: c})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-brand-light mb-1">Título</label>
                            <input type="text" value={homepageConfig.title} onChange={(e) => setHomepageConfig({...homepageConfig, title: e.target.value})} className="w-full bg-brand-primary border border-brand-accent rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-brand-light mb-1">Logotipo</label>
                            <div className="flex gap-4 items-center">
                                {homepageConfig.logoUrl && <img src={homepageConfig.logoUrl} alt="Logo" className="h-10 w-10 object-contain bg-white/10 rounded p-1" />}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                    className="text-sm text-brand-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-600"
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveHomepage} disabled={isUploading} className="w-full mt-4 bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                            {isUploading ? 'Enviando...' : 'Salvar Homepage'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeManager;
