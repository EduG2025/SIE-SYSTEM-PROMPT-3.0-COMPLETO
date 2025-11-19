

import React, { useState, useEffect } from 'react';
import type { ApiKey, DbConfig, User } from '../../types';
import { dbService } from '../../services/dbService';
import Modal from '../common/Modal';
import ToggleSwitch from '../common/ToggleSwitch';
import ApiKeyFormModal from './system/ApiKeyFormModal';

const DbConfigForm: React.FC<{ config: DbConfig; onSave: (config: DbConfig) => void; onCancel: () => void; }> = ({ config, onSave, onCancel }) => {
    const [formData, setFormData] = useState(config);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm text-brand-light mb-1 block">Host</label>
                <input type="text" name="host" value={formData.host} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent"/>
            </div>
            <div>
                <label className="text-sm text-brand-light mb-1 block">Port</label>
                <input type="text" name="port" value={formData.port} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent"/>
            </div>
            <div>
                <label className="text-sm text-brand-light mb-1 block">User</label>
                <input type="text" name="user" value={formData.user} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent"/>
            </div>
            <div>
                <label className="text-sm text-brand-light mb-1 block">Password</label>
                <input type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder="Deixe em branco para não alterar" className="w-full bg-brand-primary p-2 rounded border border-brand-accent"/>
            </div>
             <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onCancel} className="bg-brand-accent text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
        </form>
    );
}

interface SystemSettingsProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    currentUser: User;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ showToast, currentUser }) => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
    const [isDbModalOpen, setIsDbModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');

    const fetchData = async () => {
        dbService.getSystemPrompt().then(setSystemPrompt);
        dbService.getApiKeys().then(setApiKeys);
        dbService.getDbConfig().then(setDbConfig);
    };

    useEffect(() => {
        fetchData();
        // Atualiza estatísticas de uso a cada 10 segundos
        const interval = setInterval(() => dbService.getApiKeys().then(setApiKeys), 10000);
        return () => clearInterval(interval);
    }, []);
    
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
    
    const handleSaveDbConfig = async (config: DbConfig) => {
        await dbService.saveDbConfig(config, currentUser.username);
        const updatedConfig = await dbService.getDbConfig();
        setDbConfig(updatedConfig);
        setIsDbModalOpen(false);
        showToast('Configuração do banco de dados salva com sucesso!', 'success');
    };

    const handleSavePrompt = async () => {
        await dbService.setSystemPrompt(systemPrompt, currentUser.username);
        showToast('System prompt da IA salvo com sucesso!', 'success');
    }

    if (!dbConfig) {
        return <div>Carregando configurações...</div>;
    }

    return (
        <div className="space-y-8">
             {isDbModalOpen && (
                <Modal title="Editar Conexão com Banco de Dados" onClose={() => setIsDbModalOpen(false)}>
                    <DbConfigForm config={dbConfig} onSave={handleSaveDbConfig} onCancel={() => setIsDbModalOpen(false)} />
                </Modal>
             )}
             {isApiKeyModalOpen && (
                <ApiKeyFormModal
                    onClose={() => setIsApiKeyModalOpen(false)}
                    onAddKey={handleSaveNewApiKey}
                />
             )}

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Configurações de Conexão e Inteligência</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg">Pool de Chaves Gemini (Load Balancing)</h4>
                            <span className="bg-brand-blue text-xs font-bold px-2 py-1 rounded text-white">Multitarefa Ativo</span>
                        </div>
                        <p className="text-xs text-brand-light mb-3">O sistema rotaciona automaticamente as chaves ativas para distribuir a carga de requisições.</p>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {apiKeys.map(key => (
                                <div key={key.id} className="text-sm p-3 bg-brand-primary rounded flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono text-brand-light font-bold">...{key.key.slice(-8)}</span>
                                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${key.type === 'System' ? 'border-brand-blue text-brand-blue' : 'border-brand-light text-brand-light'}`}>
                                            {key.type === 'System' ? 'Padrão' : 'Custom'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-brand-light">
                                         <span>Uso: <strong>{key.usageCount}</strong> reqs</span>
                                         <span>Último: {key.lastUsed ? new Date(key.lastUsed).toLocaleTimeString() : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-brand-accent mt-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-bold ${key.status === 'Ativa' ? 'text-brand-green' : 'text-brand-red'}`}>{key.status}</span>
                                            <ToggleSwitch checked={key.status === 'Ativa'} onChange={() => handleToggleApiKeyStatus(key.id)} />
                                        </div>
                                        {key.type !== 'System' && (
                                            <button onClick={() => handleRemoveApiKey(key.id)} className="text-brand-light hover:text-brand-red transition-colors" title="Remover chave">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setIsApiKeyModalOpen(true)} className="mt-4 text-sm bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                            + Adicionar Chave ao Pool
                        </button>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Conexão com Banco de Dados</h4>
                        <div className="space-y-2 text-sm bg-brand-primary p-4 rounded">
                            <p><strong>Host:</strong> {dbConfig.host}</p>
                            <p><strong>Port:</strong> {dbConfig.port}</p>
                            <p><strong>User:</strong> {dbConfig.user}</p>
                            <p><strong>Password:</strong> ********</p>
                            <p><strong>Status:</strong> <span className={dbConfig.status === 'Conectado' ? 'text-green-400' : 'text-red-400' }>{dbConfig.status}</span></p>
                        </div>
                        <button onClick={() => setIsDbModalOpen(true)} className="mt-4 text-sm bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                            Editar Conexão DB
                        </button>
                    </div>
                </div>
            </div>

             <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Configuração da IA (System Prompt)</h3>
                <p className="text-sm text-brand-light mb-4">Esta é a diretriz principal que a IA seguirá. Edite com cuidado.</p>
                <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-80 bg-brand-primary p-3 rounded border border-brand-accent font-mono text-sm leading-relaxed focus:ring-brand-blue focus:border-brand-blue"
                />
                 <button onClick={handleSavePrompt} className="mt-4 bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Salvar Regras da IA
                </button>
            </div>
        </div>
    );
};

export default SystemSettings;
