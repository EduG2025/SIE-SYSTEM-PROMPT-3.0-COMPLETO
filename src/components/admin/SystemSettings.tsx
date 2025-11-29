
import React, { useState, useEffect } from 'react';
import type { ApiKey, DbConfig, User, HomepageConfig, HomepageFeature, AiAutomationSettings } from '../../types';
import { dbService } from '../../services/dbService';
import { validateApiKey } from '../../services/geminiService';
import { useConfig } from '../../contexts/ConfigContext'; // Import Hook
import Modal from '../common/Modal';
import ToggleSwitch from '../common/ToggleSwitch';
import ApiKeyFormModal from './system/ApiKeyFormModal';
import SystemAutoUpdater from './system/SystemAutoUpdater';
import AIAutomationPanel from './datasources/AIAutomationPanel';

type SystemTab = 'infrastructure' | 'ai' | 'appearance' | 'homepage' | 'autoupdate';

// ... (O componente DbConfigForm permanece o mesmo e foi omitido para brevidade, ele não precisa de alterações)
const DbConfigForm: React.FC<{ config: DbConfig; onSave: (config: DbConfig) => void; onCancel: () => void; }> = ({ config, onSave, onCancel }) => {
    const [formData, setFormData] = useState(config);
    const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleTestConnection = async () => {
        setTestStatus({ type: 'loading', message: 'Verificando conectividade com a API e Banco de Dados...' });
        
        try {
            const result = await dbService.testConnection();
            
            if (result.status === 'Conectado') {
                setTestStatus({ type: 'success', message: result.details });
            } else {
                setTestStatus({ type: 'error', message: result.details });
            }
        } catch (e) {
            setTestStatus({ type: 'error', message: 'Erro fatal ao tentar comunicar com o servidor.' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-brand-accent pb-4 mb-4">
                <h4 className="text-md font-bold text-white mb-3">1. Conexão com Backend (API)</h4>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">URL da API (VPS/Servidor)</label>
                    <input 
                        type="text" 
                        name="apiUrl" 
                        value={formData.apiUrl || ''} 
                        onChange={handleChange} 
                        placeholder="Deixe vazio para usar conexão interna (Recomendado)"
                        className="w-full bg-brand-primary p-2 rounded border border-brand-accent"
                    />
                    <p className="text-xs text-brand-light mt-1">
                        Deixe em <strong>branco</strong> para usar a conexão interna segura via Nginx (Porta 3000).
                    </p>
                </div>
                <div className="mt-3">
                    <label className="text-sm text-brand-light mb-1 block">Token de Autenticação (Secret)</label>
                    <input 
                        type="password" 
                        name="apiToken" 
                        value={formData.apiToken || ''} 
                        onChange={handleChange} 
                        placeholder="Senha definida no servidor"
                        className="w-full bg-brand-primary p-2 rounded border border-brand-accent"
                        required
                    />
                     <p className="text-xs text-brand-light mt-1">Chave de segurança para permitir sincronização.</p>
                </div>
            </div>

            <div>
                <h4 className="text-md font-bold text-white mb-3">2. Configuração de Banco de Dados (MySQL)</h4>
                <p className="text-xs text-brand-light mb-3">Estas credenciais são usadas para gerar instaladores SQL ou para integrações futuras no backend.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="text-sm text-brand-light mb-1 block">Host</label>
                         <input type="text" name="host" value={formData.host || '127.0.0.1'} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" />
                    </div>
                    <div>
                         <label className="text-sm text-brand-light mb-1 block">Porta</label>
                         <input type="text" name="port" value={formData.port || '3306'} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" />
                    </div>
                    <div>
                         <label className="text-sm text-brand-light mb-1 block">Banco de Dados</label>
                         <input type="text" name="database" value={formData.database || 'sie301'} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" />
                    </div>
                    <div>
                         <label className="text-sm text-brand-light mb-1 block">Usuário</label>
                         <input type="text" name="user" value={formData.user || 'sie301'} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" />
                    </div>
                    <div className="col-span-2">
                         <label className="text-sm text-brand-light mb-1 block">Senha</label>
                         <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" placeholder="Senha do banco MySQL" />
                    </div>
                </div>
            </div>

            <div className="bg-brand-primary/50 p-3 rounded border border-brand-accent/50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Diagnóstico de Rede</span>
                    <button 
                        type="button" 
                        onClick={handleTestConnection}
                        disabled={testStatus.type === 'loading'}
                        className="text-xs bg-brand-accent hover:bg-brand-light text-white font-bold py-1.5 px-3 rounded transition-colors flex items-center disabled:opacity-50"
                    >
                        {testStatus.type === 'loading' ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Testando...
                            </>
                        ) : (
                            'Testar Conexão (Ping)'
                        )}
                    </button>
                </div>
                {testStatus.type !== 'idle' && (
                    <div className={`text-xs p-2 rounded ${
                        testStatus.type === 'success' ? 'bg-green-500/20 text-green-400' : 
                        testStatus.type === 'error' ? 'bg-red-500/20 text-red-400' : 'text-brand-light'
                    }`}>
                        {testStatus.message}
                    </div>
                )}
            </div>
            
             <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onCancel} className="bg-brand-accent text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg">Salvar Configurações</button>
            </div>
        </form>
    );
}

interface SystemSettingsProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    currentUser: User;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ showToast, currentUser }) => {
    const [activeTab, setActiveTab] = useState<SystemTab>('infrastructure');
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
    // USE CONFIG CONTEXT INSTEAD OF LOCAL STATE FOR THEME & HOMEPAGE
    const { theme, homepage, updateTheme, updateHomepage } = useConfig();
    
    // Local editable state for forms (initialized from context)
    const [localTheme, setLocalTheme] = useState(theme);
    const [localHomepage, setLocalHomepage] = useState(homepage);

    const [isDbModalOpen, setIsDbModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [automationSettings, setAutomationSettings] = useState<AiAutomationSettings | null>(null);
    const [isValidatingPool, setIsValidatingPool] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Sync local state when context updates (e.g. initial load)
    useEffect(() => {
        setLocalTheme(theme);
    }, [theme]);

    useEffect(() => {
        setLocalHomepage(homepage);
    }, [homepage]);

    const fetchData = async () => {
        dbService.getSystemPrompt().then(setSystemPrompt);
        dbService.getApiKeys().then(setApiKeys);
        dbService.getDbConfig().then(setDbConfig);
        dbService.getAiAutomationSettings().then(setAutomationSettings);
        // Themes and Homepage are now handled by Context
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
             dbService.getApiKeys().then(setApiKeys);
             dbService.getDbConfig().then(setDbConfig);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero') => {
        if (e.target.files && e.target.files[0] && localHomepage) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];
                const url = await dbService.uploadFile(file);
                
                const newConfig = { ...localHomepage };
                if (target === 'logo') newConfig.logoUrl = url;
                else if (target === 'hero') newConfig.heroImageUrl = url;
                
                setLocalHomepage(newConfig);
                showToast('Imagem enviada! Lembre-se de salvar.', 'success');
            } catch (error) {
                showToast('Erro ao fazer upload da imagem.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveNewApiKey = async (key: string) => {
        try {
            await dbService.addApiKey(key, currentUser.username);
            await fetchData();
            showToast('Chave de API adicionada com sucesso!', 'success');
            setIsApiKeyModalOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                 showToast(error.message, 'error');
            }
        }
    };

    const handleRemoveApiKey = async (id: number) => {
        try {
            if (window.confirm('Tem certeza que deseja remover esta chave?')) {
                await dbService.removeApiKey(id, currentUser.username);
                await fetchData();
                showToast('Chave de API removida com sucesso.', 'success');
            }
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            }
        }
    };

    const handleToggleApiKeyStatus = async (id: number) => {
        await dbService.toggleApiKeyStatus(id, currentUser.username);
        await fetchData();
        showToast('Status da chave de API atualizado!', 'success');
    };

    const handleValidatePool = async () => {
        setIsValidatingPool(true);
        showToast('Iniciando validação do pool de chaves...', 'success');
        
        let activeCount = 0;
        let invalidCount = 0;

        for (const key of apiKeys) {
            const isValid = await validateApiKey(key.key);
            const newStatus = isValid ? 'Ativa' : 'Inativa';
            
            if (key.status !== newStatus) {
                await dbService.setApiKeyStatus(key.id, newStatus);
            }
            
            if (isValid) activeCount++;
            else invalidCount++;
        }

        await fetchData();
        setIsValidatingPool(false);
        
        if (invalidCount > 0) {
            showToast(`Validação concluída: ${activeCount} ativas, ${invalidCount} desativadas por erro.`, 'error');
        } else {
            showToast(`Validação concluída: Todas as ${activeCount} chaves estão saudáveis.`, 'success');
        }
    };
    
    const handleSaveDbConfig = async (config: DbConfig) => {
        await dbService.saveDbConfig(config, currentUser.username);
        const updatedConfig = await dbService.getDbConfig();
        setDbConfig(updatedConfig);
        setIsDbModalOpen(false);
        showToast('Configuração salva! Backend notificado.', 'success');
    };

    const handleSavePrompt = async () => {
        await dbService.setSystemPrompt(systemPrompt, currentUser.username);
        showToast('System prompt da IA salvo com sucesso!', 'success');
    }

    const handleSaveTheme = async () => {
        if(localTheme) {
            await updateTheme(localTheme); // Updates Context + DOM + DB
            showToast('Tema visual atualizado e aplicado imediatamente!', 'success');
        }
    }

    const handleSaveHomepage = async () => {
        if(localHomepage) {
            await updateHomepage(localHomepage);
            showToast('Configurações da Homepage atualizadas!', 'success');
        }
    }

    // Feature Management for Homepage
    const handleUpdateFeature = (idx: number, field: keyof HomepageFeature, value: string) => {
        if (!localHomepage) return;
        const newFeatures = [...localHomepage.features];
        newFeatures[idx] = { ...newFeatures[idx], [field]: value };
        setLocalHomepage({ ...localHomepage, features: newFeatures });
    };

    const handleAddFeature = () => {
        if (!localHomepage) return;
        setLocalHomepage({
            ...localHomepage,
            features: [...localHomepage.features, { title: 'Novo Recurso', description: 'Descrição...', icon: 'chart' }]
        });
    };

    const handleRemoveFeature = (idx: number) => {
        if (!localHomepage) return;
        setLocalHomepage({
            ...localHomepage,
            features: localHomepage.features.filter((_, i) => i !== idx)
        });
    };

    if (!dbConfig || !localTheme || !localHomepage) {
        return <div>Carregando configurações...</div>;
    }

    return (
        <div className="space-y-6">
             {isDbModalOpen && (
                <Modal title="Configurações de Infraestrutura" onClose={() => setIsDbModalOpen(false)}>
                    <DbConfigForm config={dbConfig} onSave={handleSaveDbConfig} onCancel={() => setIsDbModalOpen(false)} />
                </Modal>
             )}
             {isApiKeyModalOpen && (
                <ApiKeyFormModal
                    onClose={() => setIsApiKeyModalOpen(false)}
                    onAddKey={handleSaveNewApiKey}
                />
             )}
            
            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-brand-accent pb-1 overflow-x-auto custom-scrollbar">
                {[
                    { id: 'infrastructure', label: 'Infraestrutura' },
                    { id: 'autoupdate', label: 'Auto-Updater (IA)' },
                    { id: 'ai', label: 'Inteligência Artificial' },
                    { id: 'appearance', label: 'Tema & Aparência' },
                    { id: 'homepage', label: 'Homepage & Portal' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SystemTab)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-secondary text-white border-t border-x border-brand-accent' : 'text-brand-light hover:text-white hover:bg-brand-secondary/50'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Infrastructure Tab */}
            {activeTab === 'infrastructure' && (
                <div className="bg-brand-secondary p-6 rounded-b-lg rounded-tr-lg shadow-lg animate-fade-in-up">
                    <h3 className="text-xl font-semibold mb-4">Conectividade e Servidor</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-lg mb-4">Pool de Chaves Gemini</h4>
                            <div className="flex gap-2 mb-3">
                                <button onClick={handleValidatePool} disabled={isValidatingPool} className="flex-1 bg-brand-accent hover:bg-brand-light text-white text-xs font-bold py-1.5 px-2 rounded transition-colors disabled:opacity-50">
                                    {isValidatingPool ? 'Validando...' : 'Validar Pool'}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {apiKeys.map(key => (
                                    <div key={key.id} className={`text-sm p-3 bg-brand-primary rounded flex flex-col gap-2 border-l-4 ${key.status === 'Ativa' ? 'border-brand-green' : 'border-brand-red'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-mono text-brand-light">...{key.key.slice(-8)}</span>
                                            <span className={`text-xs font-bold ${key.status === 'Ativa' ? 'text-brand-green' : 'text-brand-red'}`}>{key.status}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-brand-accent mt-1">
                                            <ToggleSwitch checked={key.status === 'Ativa'} onChange={() => handleToggleApiKeyStatus(key.id)} />
                                            {key.type !== 'System' && (
                                                <button onClick={() => handleRemoveApiKey(key.id)} className="text-brand-light hover:text-brand-red">Remover</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setIsApiKeyModalOpen(true)} className="mt-4 text-sm bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg w-full">
                                + Adicionar Chave
                            </button>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Status do Backend</h4>
                            <div className="space-y-3 text-sm bg-brand-primary p-4 rounded border border-brand-accent/30">
                                <p><strong>Status:</strong> {dbConfig.status}</p>
                                <p><strong>Endpoint:</strong> {dbConfig.apiUrl || '<Interno>'}</p>
                                <p><strong>Host DB:</strong> {dbConfig.host}</p>
                                <button onClick={() => setIsDbModalOpen(true)} className="mt-4 text-sm bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg w-full">
                                    Configurar Conexão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-Update Tab */}
            {activeTab === 'autoupdate' && (
                <div className="animate-fade-in-up">
                    <SystemAutoUpdater />
                </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
                <div className="bg-brand-secondary p-6 rounded-b-lg rounded-tr-lg shadow-lg animate-fade-in-up">
                    <h3 className="text-xl font-semibold mb-4">Configuração da IA (System Prompt)</h3>
                    <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-80 bg-brand-primary p-3 rounded border border-brand-accent font-mono text-sm leading-relaxed focus:ring-brand-blue focus:border-brand-blue"
                        placeholder="Defina as regras globais e a personalidade da IA..."
                    />
                     <button onClick={handleSavePrompt} className="mt-4 bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Salvar Regras da IA
                    </button>

                    {/* AI Automation Panel */}
                    {automationSettings && (
                        <div className="mt-8 pt-6 border-t border-brand-accent/30">
                             <AIAutomationPanel 
                                initialSettings={automationSettings}
                                onSave={async (settings) => {
                                    await dbService.saveAiAutomationSettings(settings);
                                    showToast('Configurações de automação salvas!', 'success');
                                    const newSettings = await dbService.getAiAutomationSettings();
                                    setAutomationSettings(newSettings);
                                }}
                             />
                        </div>
                    )}
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="bg-brand-secondary p-6 rounded-b-lg rounded-tr-lg shadow-lg animate-fade-in-up">
                    <h3 className="text-xl font-semibold mb-4">Personalização do Tema (Tempo Real)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-brand-light mb-1">Cor Primária (Fundo)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localTheme.primary} onChange={(e) => setLocalTheme({...localTheme, primary: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={localTheme.primary} onChange={(e) => setLocalTheme({...localTheme, primary: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-light mb-1">Cor Secundária (Cards/Nav)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localTheme.secondary} onChange={(e) => setLocalTheme({...localTheme, secondary: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={localTheme.secondary} onChange={(e) => setLocalTheme({...localTheme, secondary: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-light mb-1">Cor de Acento (Bordas)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localTheme.accent} onChange={(e) => setLocalTheme({...localTheme, accent: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={localTheme.accent} onChange={(e) => setLocalTheme({...localTheme, accent: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                        </div>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-brand-light mb-1">Cor de Texto Principal</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localTheme.text} onChange={(e) => setLocalTheme({...localTheme, text: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={localTheme.text} onChange={(e) => setLocalTheme({...localTheme, text: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-light mb-1">Cor de Destaque (Botões/Links)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localTheme.blue} onChange={(e) => setLocalTheme({...localTheme, blue: e.target.value})} className="h-10 w-16 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={localTheme.blue} onChange={(e) => setLocalTheme({...localTheme, blue: e.target.value})} className="flex-1 bg-brand-primary border border-brand-accent rounded px-3 font-mono text-white" />
                                </div>
                            </div>
                            <div className="pt-4">
                                 <button onClick={handleSaveTheme} className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full shadow-lg transform hover:scale-[1.02]">
                                    Aplicar e Salvar Tema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Homepage Tab */}
            {activeTab === 'homepage' && (
                <div className="bg-brand-secondary p-6 rounded-b-lg rounded-tr-lg shadow-lg animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Portal Público (Landing Page)</h3>
                        <button 
                            onClick={handleSaveHomepage} 
                            disabled={isUploading} 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {isUploading ? 'Enviando...' : 'Salvar e Publicar'}
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Seção 1: Estado Global e Tema */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-brand-primary p-4 rounded-lg border border-brand-accent">
                                    <label className="font-bold text-white">Página Ativa</label>
                                    <ToggleSwitch checked={localHomepage.active} onChange={(c) => setLocalHomepage({...localHomepage, active: c})} />
                                    <span className="text-xs text-brand-light ml-2">{localHomepage.active ? 'Público vê a Home' : 'Redireciona para Login'}</span>
                                </div>
                                
                                <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent">
                                    <label className="block text-sm font-bold text-brand-light mb-3">Tema Visual</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setLocalHomepage({...localHomepage, theme: 'modern'})}
                                            className={`p-3 rounded border text-sm font-bold transition-all ${localHomepage.theme === 'modern' ? 'bg-brand-blue border-brand-blue text-white' : 'bg-brand-secondary border-brand-accent text-brand-light hover:text-white'}`}
                                        >
                                            Modern (Dark)
                                        </button>
                                        <button 
                                            onClick={() => setLocalHomepage({...localHomepage, theme: 'corporate'})}
                                            className={`p-3 rounded border text-sm font-bold transition-all ${localHomepage.theme === 'corporate' ? 'bg-white text-gray-900 border-white' : 'bg-brand-secondary border-brand-accent text-brand-light hover:text-white'}`}
                                        >
                                            Corporate (Light)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent">
                                <label className="block text-sm font-bold text-brand-light mb-3">Paleta de Cores Personalizada</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-brand-light">Fundo (Bg)</span>
                                        <input type="color" value={localHomepage.customColors?.background || '#000000'} onChange={(e) => setLocalHomepage({...localHomepage, customColors: {...localHomepage.customColors, background: e.target.value}})} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-brand-light">Texto Principal</span>
                                        <input type="color" value={localHomepage.customColors?.text || '#ffffff'} onChange={(e) => setLocalHomepage({...localHomepage, customColors: {...localHomepage.customColors, text: e.target.value}})} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-brand-light">Destaque (Botões)</span>
                                        <input type="color" value={localHomepage.customColors?.primary || '#3B82F6'} onChange={(e) => setLocalHomepage({...localHomepage, customColors: {...localHomepage.customColors, primary: e.target.value}})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Conteúdo Principal */}
                        <div className="bg-brand-primary p-6 rounded-lg border border-brand-accent">
                            <h4 className="font-bold text-lg mb-4 text-brand-cyan">Conteúdo Hero (Topo)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-light mb-1">Título Principal</label>
                                        <input type="text" value={localHomepage.title} onChange={(e) => setLocalHomepage({...localHomepage, title: e.target.value})} className="w-full bg-brand-secondary border border-brand-accent rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-light mb-1">Slogan / Subtítulo</label>
                                        <textarea rows={3} value={localHomepage.subtitle} onChange={(e) => setLocalHomepage({...localHomepage, subtitle: e.target.value})} className="w-full bg-brand-secondary border border-brand-accent rounded p-2 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-light mb-1">URL do Logotipo</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={localHomepage.logoUrl} onChange={(e) => setLocalHomepage({...localHomepage, logoUrl: e.target.value})} className="flex-1 bg-brand-secondary border border-brand-accent rounded p-2 text-white text-xs" placeholder="https://..." />
                                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" id="logo-upload" />
                                            <label htmlFor="logo-upload" className="bg-brand-accent px-3 py-2 rounded cursor-pointer hover:bg-brand-light/20">Upload</label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-light mb-1">URL Imagem de Fundo</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={localHomepage.heroImageUrl} onChange={(e) => setLocalHomepage({...localHomepage, heroImageUrl: e.target.value})} className="flex-1 bg-brand-secondary border border-brand-accent rounded p-2 text-white text-xs" placeholder="https://..." />
                                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero')} className="hidden" id="hero-upload" />
                                            <label htmlFor="hero-upload" className="bg-brand-accent px-3 py-2 rounded cursor-pointer hover:bg-brand-light/20">Upload</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Features */}
                        <div className="bg-brand-primary p-6 rounded-lg border border-brand-accent">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-brand-cyan">Cards de Recursos</h4>
                                <button onClick={handleAddFeature} className="text-xs bg-brand-blue px-3 py-1 rounded hover:bg-blue-600 text-white">+ Adicionar Card</button>
                            </div>
                            <div className="space-y-4">
                                {localHomepage.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-4 items-start bg-brand-secondary p-3 rounded border border-brand-accent">
                                        <div className="flex-shrink-0 pt-2">
                                            <select 
                                                value={feature.icon} 
                                                onChange={(e) => handleUpdateFeature(idx, 'icon', e.target.value)}
                                                className="bg-brand-primary border border-brand-accent rounded text-xs p-1 text-white"
                                            >
                                                <option value="chart">Gráfico</option>
                                                <option value="search">Busca</option>
                                                <option value="shield">Escudo</option>
                                                <option value="ai">IA</option>
                                                <option value="database">Dados</option>
                                                <option value="lock">Cadeado</option>
                                            </select>
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <input 
                                                type="text" 
                                                value={feature.title} 
                                                onChange={(e) => handleUpdateFeature(idx, 'title', e.target.value)} 
                                                className="w-full bg-brand-primary border border-brand-accent rounded p-1 text-sm text-white font-bold" 
                                                placeholder="Título do Card"
                                            />
                                            <input 
                                                type="text" 
                                                value={feature.description} 
                                                onChange={(e) => handleUpdateFeature(idx, 'description', e.target.value)} 
                                                className="w-full bg-brand-primary border border-brand-accent rounded p-1 text-xs text-brand-light" 
                                                placeholder="Descrição curta..."
                                            />
                                        </div>
                                        <button onClick={() => handleRemoveFeature(idx)} className="text-red-400 hover:text-red-300 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
