import React, { useState, useEffect } from 'react';
import type { Module } from '../../types';
import { dbService } from '../../services/dbService';
import Modal from '../common/Modal';
import ToggleSwitch from '../common/ToggleSwitch';

interface ModuleManagementProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const AVAILABLE_ICONS = ['dashboard', 'political', 'employees', 'companies', 'contracts', 'judicial', 'social', 'timeline', 'document-text'];

interface EditModuleModalProps {
    module: Module;
    onSave: (moduleId: string, updates: { name: string, icon: string, rules: string }) => Promise<void>;
    onClose: () => void;
}

const EditModuleModal: React.FC<EditModuleModalProps> = ({ module, onSave, onClose }) => {
    const [name, setName] = useState(module.name);
    const [icon, setIcon] = useState(module.icon);
    const [rules, setRules] = useState(module.rules || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(module.id, { name, icon, rules });
        setIsSaving(false);
    };

    return (
        <Modal title={`Editar Módulo: ${module.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-light mb-1">Nome do Módulo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-brand-light mb-1">Ícone</label>
                    <div className="grid grid-cols-5 gap-2 bg-brand-primary p-2 rounded-lg border border-brand-accent max-h-32 overflow-y-auto">
                        {AVAILABLE_ICONS.map(iconKey => (
                            <button
                                key={iconKey}
                                type="button"
                                onClick={() => setIcon(iconKey)}
                                className={`p-2 rounded flex items-center justify-center transition-colors ${icon === iconKey ? 'bg-brand-blue text-white' : 'text-brand-light hover:bg-brand-accent hover:text-white'}`}
                                title={iconKey}
                            >
                                <span className="text-xs">{iconKey.slice(0, 3)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-light mb-1">Regras Específicas da IA</label>
                    <p className="text-xs text-brand-light/70 mb-2">Instruções que a IA deve seguir ao processar dados deste módulo.</p>
                    <textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        className="w-full h-32 bg-brand-primary border border-brand-accent rounded-lg p-2 text-white font-mono text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none"
                        placeholder="Ex: Priorize a análise de contratos acima de R$ 1 milhão..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-accent">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-light/20 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ModuleInstaller: React.FC<{ onInstall: () => Promise<void>, showToast: (message: string, type: 'success' | 'error') => void; }> = ({ onInstall, showToast }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (selectedFile: File | null) => {
        if (selectedFile && selectedFile.name.endsWith('.zip')) {
            setFile(selectedFile);
        } else if (selectedFile) {
            showToast('Formato de arquivo inválido. Por favor, envie um arquivo .zip', 'error');
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleInstall = async () => {
        if (!file) return;
        setIsInstalling(true);
        await onInstall(); // The parent component handles the logic
        setIsInstalling(false);
        setFile(null);
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg h-full flex flex-col">
            <h4 className="font-bold text-lg mb-4">Instalar Novo Módulo</h4>
            <div
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors flex-grow flex flex-col justify-center items-center ${isDragging ? 'border-brand-blue bg-brand-accent' : 'border-brand-accent'}`}
            >
                 <input
                    type="file"
                    id="module-upload"
                    className="hidden"
                    accept=".zip"
                    onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />
                 <label htmlFor="module-upload" className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <p className="mt-2 text-brand-text">Arraste um arquivo .zip aqui</p>
                    <p className="text-xs text-brand-light">ou clique para selecionar</p>
                </label>
            </div>
            {file && (
                 <div className="mt-4 text-center">
                    <p className="text-sm text-brand-light">Arquivo selecionado: <span className="font-semibold text-brand-text">{file.name}</span></p>
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="mt-4 w-full bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed"
                    >
                         {isInstalling ? 'Instalando...' : 'Instalar Módulo'}
                    </button>
                 </div>
            )}
        </div>
    );
};


const ModuleManagement: React.FC<ModuleManagementProps> = ({ showToast }) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [editingModule, setEditingModule] = useState<Module | null>(null);

    const fetchModules = async () => {
        const data = await dbService.getModules();
        setModules(data);
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const handleToggleModule = async (moduleId: string, active: boolean) => {
        await dbService.updateModuleStatus(moduleId, active);
        showToast(`Status do módulo atualizado.`, 'success');
        fetchModules(); // Refresh list
    };

    const handleDeleteModule = async (moduleId: string) => {
        const moduleToDelete = modules.find(m => m.id === moduleId);
        if (!moduleToDelete) return;

        if (window.confirm(`Tem certeza que deseja remover o módulo '${moduleToDelete.name}'? Esta ação é irreversível.`)) {
            try {
                await dbService.deleteModule(moduleId);
                showToast(`Módulo '${moduleToDelete.name}' removido com sucesso.`, 'success');
                fetchModules(); // Refresh list
            } catch (error) {
                if (error instanceof Error) {
                    showToast(error.message, 'error');
                }
            }
        }
    };
    
    const handleUpdateModule = async (moduleId: string, updates: { name: string, icon: string, rules: string }) => {
        try {
             await dbService.saveModuleConfig(moduleId, updates);
             showToast('Módulo atualizado com sucesso!', 'success');
             setEditingModule(null);
             fetchModules();
        } catch (error) {
            showToast('Erro ao atualizar módulo.', 'error');
        }
    }
    
    const handleSimulateInstall = async () => {
        // Simulate waiting for installation
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const mockNewModule = {
                id: 'new-module-ocr',
                name: 'OCR Jurídico',
                view: 'ocr',
                icon: 'document-text',
                active: false,
                hasSettings: true,
            };

            await dbService.addModule(mockNewModule);
            showToast('Novo módulo "OCR Jurídico" instalado! Ative-o na lista para usar.', 'success');
            fetchModules();
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            {editingModule && (
                <EditModuleModal 
                    module={editingModule} 
                    onSave={handleUpdateModule} 
                    onClose={() => setEditingModule(null)} 
                />
            )}

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h4 className="font-bold text-lg mb-4">Módulos Instalados</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-brand-accent">
                            <tr>
                                <th className="p-3">Módulo</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(module => (
                                <tr key={module.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/30">
                                    <td className="p-3 font-medium">{module.name}</td>
                                    <td className="p-3 text-center">
                                        <ToggleSwitch 
                                            checked={module.active} 
                                            onChange={(checked) => handleToggleModule(module.id, checked)} 
                                        />
                                    </td>
                                    <td className="p-3 text-center space-x-2">
                                        <button 
                                            className="text-xs bg-brand-accent text-white py-1 px-3 rounded-full hover:bg-brand-blue disabled:bg-brand-accent/40 disabled:cursor-not-allowed"
                                            onClick={() => setEditingModule(module)}
                                        >
                                            Configurações
                                        </button>
                                        <button
                                            onClick={() => handleDeleteModule(module.id)}
                                            disabled={module.view === 'dashboard'}
                                            title={module.view === 'dashboard' ? 'O módulo Dashboard não pode ser removido' : 'Remover Módulo'}
                                            className="text-xs bg-brand-red text-white font-semibold py-1 px-3 rounded-full transition-colors hover:bg-red-600 disabled:bg-brand-accent/40 disabled:cursor-not-allowed"
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <ModuleInstaller onInstall={handleSimulateInstall} showToast={showToast} />
        </div>
    );
};

export default ModuleManagement;